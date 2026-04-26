'use strict';
 /**** Check Later
const { ethers }    = require('ethers');
const logger        = require('../config/logger');
 
// ─── Contract ABIs (import from compiled artifacts) ───────────────────────────
const CertificateABI = require('../contracts/abis/Certificate.json');
const AuditLogABI    = require('../contracts/abis/AuditLog.json');
 */
// ─── Provider & signer setup ──────────────────────────────────────────────────
 
let _provider = null;
let _signer   = null;
 
function getProvider() {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  }
  return _provider;
}
 
function getSigner() {
  if (!_signer) {
    // Platform hot wallet — funded with MATIC/ETH for gas
    _signer = new ethers.Wallet(process.env.PLATFORM_WALLET_PRIVATE_KEY, getProvider());
  }
  return _signer;
}
 
function getCertificateContract() {
  return new ethers.Contract(
    process.env.CERTIFICATE_CONTRACT_ADDRESS,
    CertificateABI,
    getSigner()
  );
}
 
// ─── 1. Mint certificate NFT ──────────────────────────────────────────────────
/**
 * @param {object} params
 * @param {string} params.recipientAddress  - Wallet to mint to (school wallet)
 * @param {string} params.tokenURI          - IPFS metadata URI
 * @param {object} params.metadata          - Indexed on-chain attributes
 * @returns {{ tokenId, transactionHash, blockNumber, contractAddress, gasUsed }}
 */
async function mintCertificate({ recipientAddress, tokenURI, metadata }) {
  const contract = getCertificateContract();
 
  logger.info('Minting certificate NFT', { recipientAddress, tokenURI });
 
  const tx = await contract.issueCertificate(
    recipientAddress,
    tokenURI,
    metadata.studentId,
    metadata.schoolId,
    metadata.certType,
    metadata.academicYear,
    {
      gasLimit: parseInt(process.env.GAS_LIMIT_MINT || '300000', 10),
    }
  );
 
  const receipt = await tx.wait();                       // wait for 1 confirmation
 
  // Parse tokenId from Transfer event emitted by the ERC-721 contract
  const transferEvent = receipt.logs
    .map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
    .find(e => e?.name === 'Transfer');
 
  const tokenId = transferEvent?.args?.tokenId?.toString() ?? null;
 
  return {
    tokenId,
    transactionHash: receipt.hash,
    blockNumber:     receipt.blockNumber,
    contractAddress: receipt.to,
    gasUsed:         receipt.gasUsed.toString(),
  };
}
 
// ─── 2. Verify certificate on-chain ───────────────────────────────────────────
/**
 * @param {string} hash  - txHash or ipfsHash (CID)
 * @param {string} mode  - 'tx' | 'ipfs'
 * @returns {{ exists, revoked, tokenId, tokenURI, contractAddress, blockNumber, mintedAt, ownerAddress }}
 */
async function verifyCertificate(hash, mode = 'tx') {
  const provider = getProvider();
  const contract = getCertificateContract();
 
  if (mode === 'tx') {
    // Look up the original mint transaction
    const tx = await provider.getTransaction(hash);
    if (!tx) return { exists: false };
 
    const receipt = await provider.getTransactionReceipt(hash);
    if (!receipt || receipt.status !== 1) return { exists: false };
 
    // Decode tokenId from receipt logs
    const transferEvent = receipt.logs
      .map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
      .find(e => e?.name === 'Transfer');
 
    if (!transferEvent) return { exists: false };
 
    const tokenId = transferEvent.args.tokenId;
    return _fetchTokenDetails(contract, tokenId, receipt);
  }
 
  // IPFS mode: call contract's lookupByURI view function (custom on Certificate.sol)
  const tokenId = await contract.tokenIdByURI(hash).catch(() => null);
  if (!tokenId) return { exists: false };
 
  const receipt = null;   // no receipt available in this path
  return _fetchTokenDetails(contract, tokenId, receipt);
}
 
async function _fetchTokenDetails(contract, tokenId, receipt) {
  const [ownerAddress, tokenURI, isRevoked] = await Promise.all([
    contract.ownerOf(tokenId).catch(() => null),
    contract.tokenURI(tokenId).catch(() => null),
    contract.isRevoked(tokenId).catch(() => false),
  ]);
 
  const block = receipt
    ? await getProvider().getBlock(receipt.blockNumber)
    : null;
 
  return {
    exists:          true,
    revoked:         isRevoked,
    tokenId:         tokenId.toString(),
    tokenURI,
    contractAddress: process.env.CERTIFICATE_CONTRACT_ADDRESS,
    blockNumber:     receipt?.blockNumber ?? null,
    mintedAt:        block ? new Date(block.timestamp * 1000).toISOString() : null,
    ownerAddress,
  };
}
 
// ─── 3. Revoke certificate on-chain ───────────────────────────────────────────
/**
 * @param {{ tokenId, contractAddress, reason }}
 * @returns {{ transactionHash, blockNumber, gasUsed }}
 */
async function revokeCertificate({ tokenId, reason }) {
  const contract = getCertificateContract();
 
  logger.warn('Revoking certificate on-chain', { tokenId, reason });
 
  const tx      = await contract.revokeCertificate(tokenId, reason, {
    gasLimit: parseInt(process.env.GAS_LIMIT_REVOKE || '150000', 10),
  });
  const receipt = await tx.wait();
 
  return {
    transactionHash: receipt.hash,
    blockNumber:     receipt.blockNumber,
    gasUsed:         receipt.gasUsed.toString(),
  };
}
 
// ─── 4. Node / network info ───────────────────────────────────────────────────
async function getNodeInfo() {
  const provider = getProvider();
  const [network, blockNumber] = await Promise.all([
    provider.getNetwork(),
    provider.getBlockNumber(),
  ]);
 
  return {
    status:      'healthy',
    chainId:     network.chainId.toString(),
    networkName: network.name,
    latestBlock: blockNumber,
    rpcUrl:      process.env.BLOCKCHAIN_RPC_URL?.replace(/\/\/.*@/, '//***@'),  // mask credentials
  };
}
 
// ─── 5. Contract deployment statuses ─────────────────────────────────────────
async function getContractStatus() {
  const provider = getProvider();
  const addresses = {
    Certificate: process.env.CERTIFICATE_CONTRACT_ADDRESS,
    AuditLog:    process.env.AUDIT_CONTRACT_ADDRESS,
    FeePayment:  process.env.FEE_CONTRACT_ADDRESS,
  };
 
  const results = await Promise.allSettled(
    Object.entries(addresses).map(async ([name, address]) => {
      const code = await provider.getCode(address);
      return { name, address, deployed: code !== '0x' };
    })
  );
 
  const contracts = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { name: Object.keys(addresses)[i], deployed: false, error: r.reason?.message }
  );
 
  const allDeployed = contracts.every(c => c.deployed);
 
  return {
    status:    allDeployed ? 'healthy' : 'degraded',
    contracts,
  };
}
 
// ─── 6. Gas price ─────────────────────────────────────────────────────────────
async function getGasPrice() {
  const feeData = await getProvider().getFeeData();
  const gweiDivisor = 1_000_000_000n;
 
  return {
    wei:  feeData.gasPrice?.toString()         ?? null,
    gwei: feeData.gasPrice
      ? (feeData.gasPrice / gweiDivisor).toString()
      : null,
    fast: feeData.maxFeePerGas
      ? (feeData.maxFeePerGas / gweiDivisor).toString()
      : null,
  };
}
 
// ─── 7. Mempool pending tx count ──────────────────────────────────────────────
async function getPendingTxCount() {
  const signer = getSigner();
  return getProvider().getTransactionCount(await signer.getAddress(), 'pending');
}
 
// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  mintCertificate,
  verifyCertificate,
  revokeCertificate,
  getNodeInfo,
  getContractStatus,
  getGasPrice,
  getPendingTxCount,
};
 