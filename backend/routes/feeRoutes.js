// routes/feeRoutes.js
const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const ctrl    = require('../controllers/fee.controller');

router.get ('/structures',          protect, ctrl.getFeeStructures);
router.post('/structures',          protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.createFeeStructure);
router.put ('/structures/:id',      protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.updateFeeStructure);
router.delete('/structures/:id',    protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.deleteFeeStructure);
router.get ('/dashboard',           protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.getFeeDashboard);
router.get ('/collections',         protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.getCollections);
router.get ('/pending',             protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.getPendingFees);
router.get ('/overdue',             protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.getOverdueFees);
router.get ('/receipt/:id',         protect, ctrl.downloadReceipt);
router.get ('/student/:studentId',  protect, ctrl.getStudentFees);
router.post('/record',              protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.recordPayment);
router.post('/generate-invoices',   protect, authorize('SCHOOL_ADMIN'), ctrl.generateInvoicesForClass);
router.patch('/:id/waive',          protect, authorize('SCHOOL_ADMIN'), ctrl.waiveFee);

module.exports = router;