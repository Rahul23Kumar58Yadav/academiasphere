/**
 * services/ipfs.service.js
 * AcademySphere — IPFS / Pinata Service
 *
 * Responsibilities:
 *   - Pin JSON metadata (certificate NFT attributes)
 *   - Pin binary files (certificate PDFs, school logos, student documents)
 *   - Unpin content when no longer needed
 *   - Fetch pinned content back by CID
 *   - Health check against the pinning provider
 *
 * Provider strategy:
 *   PRIMARY   → Pinata (IPFS pinning SaaS, reliable for NFT metadata)
 *   FALLBACK  → Web3.Storage (if Pinata fails or is unconfigured)
 *   LOCAL DEV → Mock mode when neither key is set (returns fake CIDs)
 *
 * All public methods return { ipfsHash, ipfsUrl, gatewayUrl } so the
 * caller never needs to know which provider was used.
 */

'use strict';

const axios      = require('axios');
const FormData   = require('form-data');
const logger     = require('../config/logger');

// ─── Constants ────────────────────────────────────────────────────────────────

const PINATA_BASE        = 'https://api.pinata.cloud';
const PINATA_GATEWAY     = process.env.PINATA_GATEWAY_URL  || 'https://gateway.pinata.cloud/ipfs';
const PUBLIC_GATEWAY     = process.env.IPFS_PUBLIC_GATEWAY || 'https://ipfs.io/ipfs';
const PIN_TIMEOUT_MS     = 30_000;   // 30 s — pinning can be slow
const FETCH_TIMEOUT_MS   = 10_000;

// ─── Provider detection ───────────────────────────────────────────────────────

function getProvider() {
  if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) return 'pinata';
  if (process.env.WEB3_STORAGE_TOKEN)                                   return 'web3storage';
  return 'mock';
}

// ─── Pinata HTTP client ───────────────────────────────────────────────────────

function pinataClient(extraHeaders = {}) {
  return axios.create({
    baseURL: PINATA_BASE,
    timeout: PIN_TIMEOUT_MS,
    headers: {
      pinata_api_key:        process.env.PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      ...extraHeaders,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Pin JSON metadata
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Pin a plain JS object as JSON to IPFS.
 * Used for NFT certificate metadata (ERC-721 tokenURI standard).
 *
 * @param  {object} jsonObject   — The metadata payload
 * @param  {string} [pinName]    — Human-readable label shown in Pinata dashboard
 * @returns {{ ipfsHash, ipfsUrl, gatewayUrl, provider }}
 *
 * @example
 *   const { ipfsHash, ipfsUrl } = await ipfsService.pinJSON(metadata, `cert-${studentId}`);
 */
async function pinJSON(jsonObject, pinName = 'academysphere-metadata') {
  const provider = getProvider();

  logger.debug('Pinning JSON to IPFS', { provider, pinName, keys: Object.keys(jsonObject) });

  if (provider === 'mock') {
    return _mockPin(pinName, 'json');
  }

  if (provider === 'pinata') {
    return _pinataJSON(jsonObject, pinName);
  }

  return _web3StorageJSON(jsonObject, pinName);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Pin a file buffer (PDF, image, etc.)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Pin a binary buffer or readable stream to IPFS.
 *
 * @param  {Buffer|ReadableStream} fileBuffer   — File content
 * @param  {string}                fileName     — Original filename (used as pin name)
 * @param  {string}                [mimeType]   — MIME type, e.g. 'application/pdf'
 * @returns {{ ipfsHash, ipfsUrl, gatewayUrl, provider }}
 *
 * @example
 *   const pdfBuffer = await generateCertificatePdf(certData);
 *   const { ipfsHash } = await ipfsService.pinFile(pdfBuffer, `cert-${certId}.pdf`, 'application/pdf');
 */
async function pinFile(fileBuffer, fileName, mimeType = 'application/octet-stream') {
  const provider = getProvider();

  logger.debug('Pinning file to IPFS', { provider, fileName, mimeType });

  if (provider === 'mock') {
    return _mockPin(fileName, 'file');
  }

  if (provider === 'pinata') {
    return _pinataFile(fileBuffer, fileName, mimeType);
  }

  return _web3StorageFile(fileBuffer, fileName, mimeType);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Fetch / retrieve pinned content by CID
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Fetch the raw content of a pinned CID.
 * Tries the private Pinata gateway first, falls back to public gateway.
 *
 * @param  {string} ipfsHash   — IPFS CID (e.g. QmXxx... or bafy...)
 * @returns {{ data, contentType }}
 */
async function fetchByCID(ipfsHash) {
  if (!ipfsHash) throw new Error('ipfsHash is required');

  const urls = [
    `${PINATA_GATEWAY}/${ipfsHash}`,
    `${PUBLIC_GATEWAY}/${ipfsHash}`,
    `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
  ];

  let lastError;

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        timeout:      FETCH_TIMEOUT_MS,
        responseType: 'arraybuffer',
      });

      logger.debug('IPFS content fetched', { ipfsHash, url });

      return {
        data:        response.data,
        contentType: response.headers['content-type'] || 'application/octet-stream',
      };
    } catch (err) {
      lastError = err;
      logger.warn('IPFS gateway failed, trying next', { url, error: err.message });
    }
  }

  throw new Error(`Unable to fetch CID ${ipfsHash} from any gateway: ${lastError?.message}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Unpin content (remove from pinning queue)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Remove a pin from Pinata. Content may still be accessible via IPFS
 * until it's garbage-collected by the network.
 * Typically called when a certificate is revoked.
 *
 * @param  {string} ipfsHash   — CID to unpin
 * @returns {{ success: boolean }}
 */
async function unpin(ipfsHash) {
  const provider = getProvider();

  if (provider === 'mock') {
    logger.debug('Mock unpin', { ipfsHash });
    return { success: true };
  }

  if (provider !== 'pinata') {
    logger.warn('Unpin not supported for provider', { provider });
    return { success: false };
  }

  try {
    await pinataClient().delete(`/pinning/unpin/${ipfsHash}`);
    logger.info('IPFS content unpinned', { ipfsHash });
    return { success: true };
  } catch (err) {
    // 404 means it was already unpinned — treat as success
    if (err.response?.status === 404) return { success: true };

    logger.error('Failed to unpin IPFS content', { ipfsHash, error: err.message });
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. List pinned files (admin / audit use)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Retrieve a paginated list of all pins on the Pinata account.
 *
 * @param  {{ pageLimit, pageOffset, nameFilter }} options
 * @returns {{ pins: Array, total: number }}
 */
async function listPins({ pageLimit = 20, pageOffset = 0, nameFilter = '' } = {}) {
  const provider = getProvider();

  if (provider === 'mock') {
    return { pins: [], total: 0 };
  }

  if (provider !== 'pinata') {
    return { pins: [], total: 0, warning: 'listPins only supported for Pinata' };
  }

  const params = {
    status:           'pinned',
    pageLimit:        Math.min(pageLimit, 1000),
    pageOffset,
    ...(nameFilter ? { metadata: JSON.stringify({ name: nameFilter }) } : {}),
  };

  try {
    const { data } = await pinataClient().get('/data/pinList', { params });
    return {
      pins:  data.rows,
      total: data.count,
    };
  } catch (err) {
    logger.error('Failed to list Pinata pins', { error: err.message });
    throw new Error(`Pinata listPins failed: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Health check
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Test connectivity to the configured IPFS pinning provider.
 * Called by the blockchain health endpoint.
 *
 * @returns {{ status: 'healthy'|'degraded'|'unavailable', provider, detail }}
 */
async function healthCheck() {
  const provider = getProvider();

  if (provider === 'mock') {
    return { status: 'healthy', provider: 'mock', detail: 'Running in mock/dev mode' };
  }

  if (provider === 'pinata') {
    try {
      const { data } = await pinataClient().get('/data/testAuthentication', { timeout: 5000 });
      return {
        status:   'healthy',
        provider: 'pinata',
        detail:   data.message || 'Authenticated',
      };
    } catch (err) {
      return {
        status:   'degraded',
        provider: 'pinata',
        detail:   err.message,
      };
    }
  }

  return { status: 'unavailable', provider, detail: 'Provider not implemented' };
}

// ─── Private — Pinata implementations ────────────────────────────────────────

async function _pinataJSON(jsonObject, pinName) {
  const payload = {
    pinataOptions:  { cidVersion: 1 },
    pinataMetadata: { name: pinName },
    pinataContent:  jsonObject,
  };

  try {
    const { data } = await pinataClient().post('/pinning/pinJSONToIPFS', payload);
    const ipfsHash = data.IpfsHash;

    return _buildResult(ipfsHash, 'pinata');
  } catch (err) {
    _throwPinataError(err, 'pinJSON');
  }
}

async function _pinataFile(fileBuffer, fileName, mimeType) {
  const form = new FormData();

  form.append('file', fileBuffer, {
    filename:    fileName,
    contentType: mimeType,
  });

  form.append(
    'pinataMetadata',
    JSON.stringify({ name: fileName }),
    { contentType: 'application/json' }
  );

  form.append(
    'pinataOptions',
    JSON.stringify({ cidVersion: 1 }),
    { contentType: 'application/json' }
  );

  try {
    const { data } = await pinataClient(form.getHeaders()).post(
      '/pinning/pinFileToIPFS',
      form,
      { maxBodyLength: Infinity }   // needed for large PDFs
    );

    return _buildResult(data.IpfsHash, 'pinata');
  } catch (err) {
    _throwPinataError(err, 'pinFile');
  }
}

// ─── Private — Web3.Storage fallback ─────────────────────────────────────────

async function _web3StorageJSON(jsonObject, pinName) {
  // Web3.Storage uses the files API — wrap JSON as a file blob
  const jsonString = JSON.stringify(jsonObject, null, 2);
  const blob       = Buffer.from(jsonString, 'utf-8');
  return _web3StorageFile(blob, `${pinName}.json`, 'application/json');
}

async function _web3StorageFile(fileBuffer, fileName, mimeType) {
  const form = new FormData();
  form.append('file', fileBuffer, { filename: fileName, contentType: mimeType });

  try {
    const { data } = await axios.post(
      'https://api.web3.storage/upload',
      form,
      {
        timeout: PIN_TIMEOUT_MS,
        headers: {
          Authorization: `Bearer ${process.env.WEB3_STORAGE_TOKEN}`,
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
      }
    );

    return _buildResult(data.cid, 'web3storage');
  } catch (err) {
    throw new Error(`Web3.Storage pin failed: ${err.response?.data?.message || err.message}`);
  }
}

// ─── Private — Mock (local dev, no IPFS keys) ────────────────────────────────

function _mockPin(name, type) {
  // Deterministic fake CID so repeated calls with the same name return the same hash
  const fakeHash = `QmMOCK${Buffer.from(name).toString('hex').slice(0, 40).toUpperCase()}`;

  logger.debug('Mock IPFS pin — no real pinning performed', { name, type, fakeHash });

  return _buildResult(fakeHash, 'mock');
}

// ─── Private — Shared helpers ─────────────────────────────────────────────────

function _buildResult(ipfsHash, provider) {
  return {
    ipfsHash,
    ipfsUrl:    `ipfs://${ipfsHash}`,
    gatewayUrl: `${PINATA_GATEWAY}/${ipfsHash}`,
    provider,
  };
}

function _throwPinataError(err, context) {
  const status  = err.response?.status;
  const message = err.response?.data?.error?.details
                || err.response?.data?.error
                || err.message;

  if (status === 401) throw new Error(`Pinata authentication failed — check PINATA_API_KEY`);
  if (status === 413) throw new Error(`File too large for Pinata — consider chunking`);

  throw new Error(`Pinata ${context} failed (${status ?? 'network'}): ${message}`);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  pinJSON,
  pinFile,
  fetchByCID,
  unpin,
  listPins,
  healthCheck,
};