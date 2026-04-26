// routes/blockchainRoutes.js
const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const ctrl    = require('../controllers/blockchain.controller');

router.post('/certificate/issue',            protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.issueCertificate);
router.get ('/certificate/verify/:hash',     ctrl.verifyCertificate);   // public — no auth
router.get ('/certificates/student/:studentId', protect, ctrl.getStudentCertificates);
router.get ('/certificates',                 protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.getAllCertificates);
router.post('/certificate/revoke/:id',       protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.revokeCertificate);
router.get ('/transactions',                 protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.getTransactions);
router.get ('/health',                       protect, authorize('SUPER_ADMIN'), ctrl.getBlockchainHealth);

module.exports = router;