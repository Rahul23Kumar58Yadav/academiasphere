'use strict';
 
const asyncHandler           = require('express-async-handler');
const blockchainService      = require('../services/blockchain.service');
const ipfsService            = require('../services/ipfs.service');
const Certificate            = require('../models/Certificate');
const BlockchainTransaction  = require('../models/BlockchainTransaction');
const Student                = require('../models/Student');
const ApiError               = require('../utils/ApiError');
const ApiResponse            = require('../utils/ApiResponse');
const logger                 = require('../config/logger');
 
// ─── Constants ────────────────────────────────────────────────────────────────
 
const CERT_STATUS  = Object.freeze({ ACTIVE: 'active', REVOKED: 'revoked', PENDING: 'pending' });
const TX_PAGE_SIZE = 20;
 
// ─── Helper — build certificate metadata (pinned to IPFS) ────────────────────
 
async function buildAndPinMetadata({ student, school, certType, issueDate, grade, extra = {} }) {
  const metadata = {
    name:        `${certType} — ${student.fullName}`,
    description: `Academic certificate issued by ${school.name} via AcademySphere`,
    image:       school.logoIpfsUrl || '',
    attributes: [
      { trait_type: 'Student Name',    value: student.fullName          },
      { trait_type: 'Student ID',      value: student._id.toString()    },
      { trait_type: 'Roll Number',     value: student.rollNumber        },
      { trait_type: 'School',          value: school.name               },
      { trait_type: 'School ID',       value: school._id.toString()     },
      { trait_type: 'Certificate Type',value: certType                  },
      { trait_type: 'Issue Date',      value: issueDate.toISOString()   },
      { trait_type: 'Academic Year',   value: extra.academicYear || ''  },
      { trait_type: 'Grade / Result',  value: grade || ''               },
      { trait_type: 'Platform',        value: 'AcademySphere'           },
    ],
    issuedAt: issueDate.toISOString(),
    ...extra,
  };
 
  const { ipfsHash, ipfsUrl } = await ipfsService.pinJSON(metadata, `cert-${student._id}-${Date.now()}`);
  return { metadata, ipfsHash, ipfsUrl };
}
 
// ─────────────────────────────────────────────────────────────────────────────
// 1. POST /blockchain/certificate/issue
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc   Mint an NFT certificate on-chain for a student.
 * @access SCHOOL_ADMIN | SUPER_ADMIN
 *
 * @body {
 *   studentId    : ObjectId   — target student
 *   certType     : string     — e.g. "Completion", "Achievement", "Transfer"
 *   grade        : string     — e.g. "A+", "First Class"
 *   academicYear : string     — e.g. "2024-25"
 *   remarks      : string?    — optional remarks
 * }
 */
const issueCertificate = asyncHandler(async (req, res) => {
  const { studentId, certType, grade, academicYear, remarks } = req.body;
  const issuedBy = req.user._id;
  const school   = req.user.school;          // populated by tenantResolver middleware
 
  // ── 1. Validate inputs ────────────────────────────────────────────────────
  if (!studentId || !certType || !grade || !academicYear) {
    throw new ApiError(400, 'studentId, certType, grade and academicYear are required');
  }
 
  const ALLOWED_TYPES = ['Completion', 'Achievement', 'Transfer', 'Merit', 'Participation', 'Graduation'];
  if (!ALLOWED_TYPES.includes(certType)) {
    throw new ApiError(400, `certType must be one of: ${ALLOWED_TYPES.join(', ')}`);
  }
 
  // ── 2. Verify student belongs to this school ──────────────────────────────
  const student = await Student.findOne({ _id: studentId, school: school._id })
    .select('fullName rollNumber _id school')
    .lean();
 
  if (!student) {
    throw new ApiError(404, 'Student not found in your school');
  }
 
  // ── 3. Prevent duplicate active certificates ─────────────────────────────
  const duplicate = await Certificate.findOne({
    student:      studentId,
    certType,
    academicYear,
    school:       school._id,
    status:       CERT_STATUS.ACTIVE,
  });
 
  if (duplicate) {
    throw new ApiError(409, `An active ${certType} certificate already exists for this student in ${academicYear}`);
  }
 
  // ── 4. Build + pin metadata to IPFS ──────────────────────────────────────
  const issueDate = new Date();
  const { metadata, ipfsHash, ipfsUrl } = await buildAndPinMetadata({
    student,
    school,
    certType,
    issueDate,
    grade,
    extra: { academicYear, remarks },
  });
 
  // ── 5. Save pending cert record (pre-mint) ────────────────────────────────
  let certRecord = await Certificate.create({
    student:      studentId,
    school:       school._id,
    issuedBy,
    certType,
    grade,
    academicYear,
    remarks,
    ipfsHash,
    ipfsUrl,
    status:       CERT_STATUS.PENDING,
    issuedAt:     issueDate,
  });
 
  // ── 6. Mint NFT on-chain ──────────────────────────────────────────────────
  let mintResult;
  try {
    mintResult = await blockchainService.mintCertificate({
      recipientAddress: school.walletAddress,   // school's on-chain wallet
      tokenURI:         ipfsUrl,
      metadata: {
        studentId:   student._id.toString(),
        schoolId:    school._id.toString(),
        certType,
        academicYear,
      },
    });
  } catch (chainErr) {
    // Roll back — mark cert as failed but keep DB record for retry
    await Certificate.findByIdAndUpdate(certRecord._id, { status: 'failed', failureReason: chainErr.message });
    logger.error('Certificate mint failed', { certId: certRecord._id, error: chainErr.message });
    throw new ApiError(502, `Blockchain minting failed: ${chainErr.message}`);
  }
 
  // ── 7. Update cert record with on-chain data ──────────────────────────────
  certRecord = await Certificate.findByIdAndUpdate(
    certRecord._id,
    {
      status:      CERT_STATUS.ACTIVE,
      tokenId:     mintResult.tokenId,
      txHash:      mintResult.transactionHash,
      blockNumber: mintResult.blockNumber,
      contractAddress: mintResult.contractAddress,
    },
    { new: true }
  ).populate('student', 'fullName rollNumber')
   .populate('issuedBy', 'firstName lastName email');
 
  // ── 8. Mirror transaction in local DB ────────────────────────────────────
  await BlockchainTransaction.create({
    school:       school._id,
    type:         'CERTIFICATE_MINT',
    entityId:     certRecord._id,
    entityModel:  'Certificate',
    txHash:       mintResult.transactionHash,
    blockNumber:  mintResult.blockNumber,
    gasUsed:      mintResult.gasUsed,
    initiatedBy:  issuedBy,
  });
 
  logger.info('Certificate issued', {
    certId:   certRecord._id,
    tokenId:  mintResult.tokenId,
    txHash:   mintResult.transactionHash,
    student:  student._id,
    school:   school._id,
  });
 
  return res.status(201).json(
    new ApiResponse(201, {
      certificate: certRecord,
      blockchain: {
        tokenId:         mintResult.tokenId,
        transactionHash: mintResult.transactionHash,
        blockNumber:     mintResult.blockNumber,
        contractAddress: mintResult.contractAddress,
        gasUsed:         mintResult.gasUsed,
        ipfsUrl,
        ipfsHash,
      },
    }, 'Certificate minted and issued successfully')
  );
});
 
// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /blockchain/certificate/verify/:hash
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc   Publicly verify a certificate by its transaction hash or IPFS hash.
 *         No authentication required — intended for third-party institutions.
 * @access PUBLIC
 *
 * @param  hash — either the blockchain txHash or ipfsHash
 */
const verifyCertificate = asyncHandler(async (req, res) => {
  const { hash } = req.params;
 
  if (!hash || hash.length < 10) {
    throw new ApiError(400, 'A valid certificate hash is required');
  }
 
  // ── 1. Look up in local DB first (fast path) ──────────────────────────────
  const isIpfsHash = hash.startsWith('Qm') || hash.startsWith('bafy');   // IPFS CID patterns
  const query      = isIpfsHash ? { ipfsHash: hash } : { txHash: hash };
 
  const certRecord = await Certificate.findOne(query)
    .populate('student',  'fullName rollNumber')
    .populate('school',   'name city state')
    .populate('issuedBy', 'firstName lastName')
    .lean();
 
  // ── 2. Verify on-chain regardless (source of truth) ───────────────────────
  let onChainData;
  try {
    onChainData = await blockchainService.verifyCertificate(hash, isIpfsHash ? 'ipfs' : 'tx');
  } catch (chainErr) {
    logger.warn('On-chain verification call failed', { hash, error: chainErr.message });
    // If DB record exists, we can still return with a degraded warning
    if (!certRecord) {
      throw new ApiError(404, 'Certificate not found on-chain or in the registry');
    }
    return res.status(200).json(
      new ApiResponse(200, {
        verified:    false,
        warning:     'On-chain verification temporarily unavailable. Showing registry data.',
        certificate: sanitiseCertRecord(certRecord),
        onChain:     null,
      }, 'Certificate found in registry (on-chain check degraded)')
    );
  }
 
  // ── 3. Cross-check on-chain vs DB ─────────────────────────────────────────
  const isRevoked  = onChainData.revoked === true;
  const isVerified = onChainData.exists  === true && !isRevoked;
 
  if (!onChainData.exists) {
    throw new ApiError(404, 'Certificate not found on the blockchain');
  }
 
  logger.info('Certificate verified', { hash, isVerified, isRevoked });
 
  return res.status(200).json(
    new ApiResponse(200, {
      verified:  isVerified,
      revoked:   isRevoked,
      certificate: certRecord ? sanitiseCertRecord(certRecord) : null,
      onChain: {
        tokenId:         onChainData.tokenId,
        contractAddress: onChainData.contractAddress,
        blockNumber:     onChainData.blockNumber,
        mintedAt:        onChainData.mintedAt,
        ownerAddress:    onChainData.ownerAddress,
        ipfsUri:         onChainData.tokenURI,
      },
    }, isRevoked ? 'Certificate has been revoked' : 'Certificate verified successfully')
  );
});
 
// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /blockchain/certificates/student/:studentId
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc   Fetch all certificates for a specific student.
 *         Students can only fetch their own. Admins can fetch any within school.
 * @access Authenticated (own student | SCHOOL_ADMIN | SUPER_ADMIN)
 */
const getStudentCertificates = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { status }    = req.query;    // optional filter: active | revoked | pending
  const requestingUser = req.user;
 
  // ── Role-based access gate ────────────────────────────────────────────────
  const isAdmin = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(requestingUser.role);
  const isOwnStudent = requestingUser.role === 'STUDENT' &&
                       requestingUser.studentProfile?.toString() === studentId;
 
  if (!isAdmin && !isOwnStudent) {
    throw new ApiError(403, 'You are not authorised to view certificates for this student');
  }
 
  // ── Build query ───────────────────────────────────────────────────────────
  const filter = { student: studentId };
 
  // School admins are scoped to their school
  if (requestingUser.role === 'SCHOOL_ADMIN') {
    filter.school = requestingUser.school;
  }
 
  if (status && Object.values(CERT_STATUS).includes(status)) {
    filter.status = status;
  }
 
  const certificates = await Certificate.find(filter)
    .populate('school',   'name city state')
    .populate('issuedBy', 'firstName lastName')
    .sort({ issuedAt: -1 })
    .lean();
 
  // Attach a shareable public verification URL to each cert
  const enriched = certificates.map(c => ({
    ...c,
    verificationUrl: `${process.env.PUBLIC_APP_URL}/verify/${c.txHash || c.ipfsHash}`,
  }));
 
  return res.status(200).json(
    new ApiResponse(200, {
      count:        enriched.length,
      certificates: enriched,
    }, 'Student certificates fetched successfully')
  );
});
 
// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /blockchain/certificates
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc   Paginated list of all certificates, scoped by school or platform-wide.
 * @access SCHOOL_ADMIN | SUPER_ADMIN
 *
 * @query  page, limit, status, certType, academicYear, search, sortBy, sortOrder
 */
const getAllCertificates = asyncHandler(async (req, res) => {
  const {
    page         = 1,
    limit        = TX_PAGE_SIZE,
    status,
    certType,
    academicYear,
    search,
    sortBy       = 'issuedAt',
    sortOrder    = 'desc',
  } = req.query;
 
  const pageNum   = Math.max(1, parseInt(page, 10));
  const limitNum  = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip      = (pageNum - 1) * limitNum;
 
  // ── Build filter ──────────────────────────────────────────────────────────
  const filter = {};
 
  // Super admin sees all; school admin is scoped to their school
  if (req.user.role === 'SCHOOL_ADMIN') {
    filter.school = req.user.school;
  }
 
  if (status       && Object.values(CERT_STATUS).includes(status)) filter.status       = status;
  if (certType)    filter.certType    = certType;
  if (academicYear) filter.academicYear = academicYear;
 
  // Full-text style search on student name or roll number via populated join
  // We do a two-step lookup when search is present
  let studentIds;
  if (search) {
    const matchingStudents = await Student.find({
      $or: [
        { fullName:   { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ],
    }).select('_id').lean();
 
    studentIds = matchingStudents.map(s => s._id);
    filter.student = { $in: studentIds };
  }
 
  // ── Execute with count ────────────────────────────────────────────────────
  const ALLOWED_SORT = ['issuedAt', 'certType', 'academicYear', 'status'];
  const sortField    = ALLOWED_SORT.includes(sortBy) ? sortBy : 'issuedAt';
  const sortDir      = sortOrder === 'asc' ? 1 : -1;
 
  const [certificates, total] = await Promise.all([
    Certificate.find(filter)
      .populate('student',  'fullName rollNumber')
      .populate('school',   'name')
      .populate('issuedBy', 'firstName lastName')
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Certificate.countDocuments(filter),
  ]);
 
  const enriched = certificates.map(c => ({
    ...c,
    verificationUrl: `${process.env.PUBLIC_APP_URL}/verify/${c.txHash || c.ipfsHash}`,
  }));
 
  return res.status(200).json(
    new ApiResponse(200, {
      certificates: enriched,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext:    pageNum * limitNum < total,
        hasPrev:    pageNum > 1,
      },
    }, 'Certificates fetched successfully')
  );
});
 
// ─────────────────────────────────────────────────────────────────────────────
// 5. POST /blockchain/certificate/revoke/:id
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc   Revoke an issued certificate on-chain and update the DB record.
 * @access SCHOOL_ADMIN | SUPER_ADMIN
 *
 * @body   { reason: string }   — mandatory revocation reason
 */
const revokeCertificate = asyncHandler(async (req, res) => {
  const { id }     = req.params;
  const { reason } = req.body;
  const revokedBy  = req.user._id;
 
  if (!reason || reason.trim().length < 5) {
    throw new ApiError(400, 'A revocation reason of at least 5 characters is required');
  }
 
  // ── 1. Fetch certificate ──────────────────────────────────────────────────
  const cert = await Certificate.findById(id)
    .populate('student', 'fullName rollNumber')
    .populate('school',  '_id name walletAddress');
 
  if (!cert) {
    throw new ApiError(404, 'Certificate not found');
  }
 
  // ── 2. School-scoped access check ────────────────────────────────────────
  if (
    req.user.role === 'SCHOOL_ADMIN' &&
    cert.school._id.toString() !== req.user.school.toString()
  ) {
    throw new ApiError(403, 'You can only revoke certificates issued by your school');
  }
 
  // ── 3. Guard: can only revoke active certs ────────────────────────────────
  if (cert.status !== CERT_STATUS.ACTIVE) {
    throw new ApiError(409, `Certificate is already ${cert.status} — cannot revoke`);
  }
 
  if (!cert.tokenId) {
    throw new ApiError(422, 'Certificate has no on-chain token ID — cannot revoke');
  }
 
  // ── 4. Revoke on-chain ────────────────────────────────────────────────────
  let revokeResult;
  try {
    revokeResult = await blockchainService.revokeCertificate({
      tokenId:         cert.tokenId,
      contractAddress: cert.contractAddress,
      reason:          reason.trim(),
    });
  } catch (chainErr) {
    logger.error('Certificate revocation failed on-chain', { certId: id, error: chainErr.message });
    throw new ApiError(502, `On-chain revocation failed: ${chainErr.message}`);
  }
 
  // ── 5. Update DB record ───────────────────────────────────────────────────
  cert.status            = CERT_STATUS.REVOKED;
  cert.revokedAt         = new Date();
  cert.revokedBy         = revokedBy;
  cert.revocationReason  = reason.trim();
  cert.revocationTxHash  = revokeResult.transactionHash;
  await cert.save();
 
  // ── 6. Mirror revocation tx ───────────────────────────────────────────────
  await BlockchainTransaction.create({
    school:      cert.school._id,
    type:        'CERTIFICATE_REVOKE',
    entityId:    cert._id,
    entityModel: 'Certificate',
    txHash:      revokeResult.transactionHash,
    blockNumber: revokeResult.blockNumber,
    gasUsed:     revokeResult.gasUsed,
    initiatedBy: revokedBy,
    meta:        { reason: reason.trim() },
  });
 
  logger.warn('Certificate revoked', {
    certId:   cert._id,
    tokenId:  cert.tokenId,
    revokedBy,
    reason:   reason.trim(),
    txHash:   revokeResult.transactionHash,
  });
 
  return res.status(200).json(
    new ApiResponse(200, {
      certificate: {
        _id:                cert._id,
        status:             cert.status,
        revokedAt:          cert.revokedAt,
        revocationReason:   cert.revocationReason,
        revocationTxHash:   cert.revocationTxHash,
        student:            cert.student,
      },
      blockchain: {
        transactionHash: revokeResult.transactionHash,
        blockNumber:     revokeResult.blockNumber,
        gasUsed:         revokeResult.gasUsed,
      },
    }, 'Certificate revoked successfully')
  );
});
 
// ─────────────────────────────────────────────────────────────────────────────
// 6. GET /blockchain/transactions
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc   Paginated transaction ledger. School admins see their school's txs only.
 * @access SCHOOL_ADMIN | SUPER_ADMIN
 *
 * @query  page, limit, type, dateFrom, dateTo, sortOrder
 */
const getTransactions = asyncHandler(async (req, res) => {
  const {
    page      = 1,
    limit     = TX_PAGE_SIZE,
    type,
    dateFrom,
    dateTo,
    sortOrder = 'desc',
  } = req.query;
 
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip     = (pageNum - 1) * limitNum;
 
  // ── Build filter ──────────────────────────────────────────────────────────
  const filter = {};
 
  if (req.user.role === 'SCHOOL_ADMIN') {
    filter.school = req.user.school;
  }
 
  const ALLOWED_TX_TYPES = [
    'CERTIFICATE_MINT',
    'CERTIFICATE_REVOKE',
    'FEE_PAYMENT',
    'AUDIT_LOG',
  ];
  if (type && ALLOWED_TX_TYPES.includes(type)) {
    filter.type = type;
  }
 
  // Date range filter
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
  }
 
  const sortDir = sortOrder === 'asc' ? 1 : -1;
 
  const [transactions, total] = await Promise.all([
    BlockchainTransaction.find(filter)
      .populate('school',      'name')
      .populate('initiatedBy', 'firstName lastName role')
      .sort({ createdAt: sortDir })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    BlockchainTransaction.countDocuments(filter),
  ]);
 
  // ── Aggregate summary for the filtered set ────────────────────────────────
  const summary = await BlockchainTransaction.aggregate([
    { $match: filter },
    {
      $group: {
        _id:          '$type',
        count:        { $sum: 1 },
        totalGasUsed: { $sum: '$gasUsed' },
      },
    },
  ]);
 
  const summaryMap = summary.reduce((acc, s) => {
    acc[s._id] = { count: s.count, totalGasUsed: s.totalGasUsed };
    return acc;
  }, {});
 
  return res.status(200).json(
    new ApiResponse(200, {
      transactions,
      summary: summaryMap,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext:    pageNum * limitNum < total,
        hasPrev:    pageNum > 1,
      },
    }, 'Transactions fetched successfully')
  );
});
 
// ─────────────────────────────────────────────────────────────────────────────
// 7. GET /blockchain/health
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc   Comprehensive blockchain node + contract health status.
 * @access SUPER_ADMIN only
 */
const getBlockchainHealth = asyncHandler(async (req, res) => {
  const checks = await Promise.allSettled([
    blockchainService.getNodeInfo(),            // RPC node connectivity
    blockchainService.getContractStatus(),      // All deployed contract states
    blockchainService.getPendingTxCount(),      // Mempool backlog
    blockchainService.getGasPrice(),            // Current gas price
  ]);
 
  const [nodeResult, contractsResult, pendingTxResult, gasResult] = checks;
 
  // ── 1. Node info ──────────────────────────────────────────────────────────
  const nodeInfo = nodeResult.status === 'fulfilled'
    ? { status: 'healthy', ...nodeResult.value }
    : { status: 'degraded', error: nodeResult.reason?.message };
 
  // ── 2. Contract statuses ──────────────────────────────────────────────────
  const contracts = contractsResult.status === 'fulfilled'
    ? contractsResult.value
    : { status: 'unknown', error: contractsResult.reason?.message };
 
  // ── 3. Gas + mempool ──────────────────────────────────────────────────────
  const gasPrice  = gasResult.status  === 'fulfilled' ? gasResult.value  : null;
  const pendingTx = pendingTxResult.status === 'fulfilled' ? pendingTxResult.value : null;
 
  // ── 4. DB-side stats ──────────────────────────────────────────────────────
  const [totalTx, totalCerts, failedCerts, last24hTx] = await Promise.all([
    BlockchainTransaction.countDocuments(),
    Certificate.countDocuments({ status: CERT_STATUS.ACTIVE }),
    Certificate.countDocuments({ status: 'failed' }),
    BlockchainTransaction.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
  ]);
 
  // ── 5. Derive overall system status ──────────────────────────────────────
  const overallStatus =
    nodeInfo.status  === 'healthy' &&
    contracts.status === 'healthy'
      ? 'operational'
      : nodeInfo.status === 'degraded' || contracts.status === 'degraded'
        ? 'degraded'
        : 'outage';
 
  const payload = {
    status:    overallStatus,
    timestamp: new Date().toISOString(),
    node: nodeInfo,
    contracts,
    mempool: {
      pendingTransactions: pendingTx,
    },
    gas: gasPrice
      ? {
          wei:  gasPrice.wei,
          gwei: gasPrice.gwei,
          fast: gasPrice.fast,
        }
      : null,
    stats: {
      totalTransactions:      totalTx,
      activeCertificates:     totalCerts,
      failedCertificates:     failedCerts,
      transactionsLast24h:    last24hTx,
    },
  };
 
  logger.info('Blockchain health check', { status: overallStatus, requestedBy: req.user._id });
 
  // Return 200 even for degraded — let the consumer decide how to handle
  return res.status(200).json(
    new ApiResponse(200, payload, `Blockchain status: ${overallStatus}`)
  );
});
 
// ─── Private helpers ──────────────────────────────────────────────────────────
 
/**
 * Strip sensitive on-chain fields before returning in public verify endpoint.
 */
function sanitiseCertRecord(cert) {
  const { __v, updatedAt, revocationReason, revokedBy, ...safe } = cert;
  return safe;
}
 
// ─── Exports ──────────────────────────────────────────────────────────────────
 
module.exports = {
  issueCertificate,
  verifyCertificate,
  getStudentCertificates,
  getAllCertificates,
  revokeCertificate,
  getTransactions,
  getBlockchainHealth,
};