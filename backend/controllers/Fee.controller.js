// controllers/fee.controller.js
const { FeeStructure, Payment } = require('../models/Fee');
const Student    = require('../models/Student');
const AppError   = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { sendEmail } = require('../utils/sendEmails');

// ════════════════════════════════════════════════════════════════
// FEE STRUCTURES
// ════════════════════════════════════════════════════════════════

// GET /api/fees/structures
exports.getFeeStructures = asyncHandler(async (req, res) => {
  const { academicYear, grade, isActive = 'true' } = req.query;

  const structures = await FeeStructure.find({
    schoolId: req.user.schoolId,
    ...(academicYear && { academicYear }),
    ...(grade        && { grade }),
    ...(isActive !== 'all' && { isActive: isActive === 'true' }),
  })
    .sort({ grade: 1, termNumber: 1 })
    .populate('createdBy', 'name');

  res.json({ success: true, data: structures, count: structures.length });
});

// POST /api/fees/structures
exports.createFeeStructure = asyncHandler(async (req, res) => {
  const { academicYear, grade, termName } = req.body;

  // Prevent exact duplicate
  const existing = await FeeStructure.findOne({
    schoolId: req.user.schoolId,
    academicYear, grade, termName,
  });
  if (existing)
    throw new AppError(`Fee structure for Grade ${grade} – ${termName} (${academicYear}) already exists.`, 409);

  const structure = await FeeStructure.create({
    ...req.body,
    schoolId:  req.user.schoolId,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Fee structure created.', data: structure });
});

// PUT /api/fees/structures/:id
exports.updateFeeStructure = asyncHandler(async (req, res) => {
  const FORBIDDEN = ['schoolId', 'createdBy'];
  FORBIDDEN.forEach(f => delete req.body[f]);

  const structure = await FeeStructure.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!structure) throw new AppError('Fee structure not found', 404);

  res.json({ success: true, message: 'Fee structure updated.', data: structure });
});

// DELETE /api/fees/structures/:id  (soft delete)
exports.deleteFeeStructure = asyncHandler(async (req, res) => {
  const structure = await FeeStructure.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { $set: { isActive: false } },
    { new: true }
  );
  if (!structure) throw new AppError('Fee structure not found', 404);

  res.json({ success: true, message: 'Fee structure deactivated.' });
});

// ════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════

// GET /api/fees/dashboard
exports.getFeeDashboard = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;
  const base = {
    schoolId: req.user.schoolId,
    ...(academicYear && { academicYear }),
  };

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    collected,
    pending,
    monthlyTrend,
    gradeWise,
    methodBreakdown,
    recentPayments,
  ] = await Promise.all([
    // Total collected
    Payment.aggregate([
      { $match: { ...base, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPaid' }, count: { $sum: 1 } } },
    ]),

    // Total pending
    Payment.aggregate([
      { $match: { ...base, status: { $in: ['pending','overdue'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),

    // Monthly trend (last 6 months)
    Payment.aggregate([
      { $match: { ...base, status: 'paid', paidAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id:    { month: { $month: '$paidAt' }, year: { $year: '$paidAt' } },
        amount: { $sum: '$totalPaid' },
        count:  { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    // Grade-wise collection
    Payment.aggregate([
      { $match: { ...base, status: 'paid' } },
      { $lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'st' } },
      { $unwind: { path: '$st', preserveNullAndEmptyArrays: true } },
      { $group: {
        _id:    '$st.grade',
        amount: { $sum: '$totalPaid' },
        count:  { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]),

    // Payment method breakdown
    Payment.aggregate([
      { $match: { ...base, status: 'paid' } },
      { $group: {
        _id:    '$method',
        amount: { $sum: '$totalPaid' },
        count:  { $sum: 1 },
      }},
      { $sort: { count: -1 } },
    ]),

    // Recent 10 payments
    Payment.find({ ...base, status: 'paid' })
      .sort({ paidAt: -1 })
      .limit(10)
      .populate('studentId', 'firstName lastName rollNo grade section'),
  ]);

  const totalCollected  = collected[0]?.total || 0;
  const totalPending    = pending[0]?.total   || 0;
  const collectionRate  = (totalCollected + totalPending) > 0
    ? Math.round((totalCollected / (totalCollected + totalPending)) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      totalCollected,
      collectedCount:  collected[0]?.count || 0,
      totalPending,
      pendingCount:    pending[0]?.count   || 0,
      collectionRate,
      monthlyTrend,
      gradeWise,
      methodBreakdown,
      recentPayments,
    },
  });
});

// ════════════════════════════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════════════════════════════

// GET /api/fees/collections
exports.getCollections = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20,
    month, year, grade,
    status, academicYear, method,
    search,
  } = req.query;

  const filter = {
    schoolId: req.user.schoolId,
    ...(academicYear && { academicYear }),
    ...(status       && { status }),
    ...(method       && { method }),
  };

  if (month && year) {
    filter.paidAt = {
      $gte: new Date(Number(year), Number(month) - 1, 1),
      $lte: new Date(Number(year), Number(month),     0, 23, 59, 59),
    };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [docs, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('studentId', 'firstName lastName rollNo grade section')
      .populate('paidBy',    'name'),
    Payment.countDocuments(filter),
  ]);

  // Status summary
  const summary = await Payment.aggregate([
    { $match: filter },
    { $group: {
      _id:    '$status',
      count:  { $sum: 1 },
      amount: { $sum: '$totalPaid' },
    }},
  ]);

  res.json({
    success: true,
    data: docs,
    summary,
    pagination: {
      total,
      page:  Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// GET /api/fees/pending
exports.getPendingFees = asyncHandler(async (req, res) => {
  const { grade, academicYear, term } = req.query;

  const payments = await Payment.find({
    schoolId: req.user.schoolId,
    status:   { $in: ['pending','overdue'] },
    ...(academicYear && { academicYear }),
    ...(term         && { term }),
  }).populate({
    path:  'studentId',
    match: grade ? { grade } : {},
    select:'firstName lastName rollNo grade section guardians phone',
  }).sort({ createdAt: 1 });

  const filtered     = payments.filter(p => p.studentId !== null);
  const totalPending = filtered.reduce((a, p) => a + p.amount, 0);

  res.json({
    success: true,
    data: filtered,
    totalPending,
    count: filtered.length,
  });
});

// GET /api/fees/overdue
exports.getOverdueFees = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;

  // Auto-mark as overdue if past due date
  const structures = await FeeStructure.find({
    schoolId: req.user.schoolId,
    dueDate:  { $lt: new Date() },
    isActive: true,
  });

  for (const s of structures) {
    await Payment.updateMany(
      {
        schoolId:       req.user.schoolId,
        feeStructureId: s._id,
        status:         'pending',
      },
      { $set: { status: 'overdue' } }
    );
  }

  const overdue = await Payment.find({
    schoolId: req.user.schoolId,
    status:   'overdue',
    ...(academicYear && { academicYear }),
  })
  .populate('studentId', 'firstName lastName rollNo grade section guardians')
  .sort({ createdAt: 1 });

  res.json({
    success: true,
    data: overdue,
    totalOverdue: overdue.reduce((a, p) => a + p.amount, 0),
    count: overdue.length,
  });
});

// GET /api/fees/student/:studentId
exports.getStudentFees = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;

  const [payments, structures] = await Promise.all([
    Payment.find({
      schoolId:  req.user.schoolId,
      studentId: req.params.studentId,
      ...(academicYear && { academicYear }),
    }).sort({ createdAt: -1 }),
    FeeStructure.find({
      schoolId: req.user.schoolId,
      ...(academicYear && { academicYear }),
    }).sort({ termNumber: 1 }),
  ]);

  const totalPaid    = payments.filter(p => p.status === 'paid')
    .reduce((a, p) => a + p.totalPaid, 0);
  const totalPending = payments.filter(p => ['pending','overdue'].includes(p.status))
    .reduce((a, p) => a + p.amount,    0);

  res.json({
    success: true,
    data: { payments, structures },
    summary: { totalPaid, totalPending },
  });
});

// POST /api/fees/record
exports.recordPayment = asyncHandler(async (req, res) => {
  const {
    studentId, feeStructureId, academicYear, term,
    amount, method, txnRef, discount = 0, notes,
  } = req.body;

  if (!studentId || !amount || !term)
    throw new AppError('studentId, amount, and term are required.', 400);

  const totalPaid = amount - discount;

  const payment = await Payment.create({
    schoolId: req.user.schoolId,
    studentId, feeStructureId, academicYear, term,
    amount, method, txnRef, discount, totalPaid,
    notes,
    status:  'paid',
    paidAt:  new Date(),
    paidBy:  req.user._id,
  });

  // Close any pending entries for the same student + term
  await Payment.updateMany(
    {
      schoolId:    req.user.schoolId,
      studentId,
      term,
      academicYear,
      status:      'pending',
      _id:         { $ne: payment._id },
    },
    { $set: { status: 'paid' } }
  );

  // Email receipt to parent
  const student = await Student.findById(studentId).select('firstName guardians');
  const parentEmail = student?.guardians?.find(g => g.isPrimary || g.isEmergency)?.email
    || student?.guardians?.[0]?.email;

  if (parentEmail) {
    await sendEmail({
      to:      parentEmail,
      subject: `Fee Receipt – ${term} (${academicYear}) – ${payment.invoiceNo}`,
      html: `
        <h3>Fee Payment Confirmation</h3>
        <p>Dear Parent,</p>
        <p>A payment of <strong>₹${totalPaid.toLocaleString()}</strong> has been received for
        <strong>${student.firstName}</strong> towards <strong>${term}</strong>.</p>
        <table>
          <tr><td>Invoice No:</td><td>${payment.invoiceNo}</td></tr>
          <tr><td>Amount:</td><td>₹${totalPaid.toLocaleString()}</td></tr>
          <tr><td>Method:</td><td>${method}</td></tr>
          <tr><td>Ref:</td><td>${txnRef || '—'}</td></tr>
          <tr><td>Date:</td><td>${new Date().toLocaleDateString('en-IN')}</td></tr>
        </table>
        <p>Thank you.</p>`,
    }).catch(() => {});
  }

  res.status(201).json({ success: true, message: 'Payment recorded.', data: payment });
});

// PATCH /api/fees/:id/waive
exports.waiveFee = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const payment = await Payment.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { $set: { status: 'waived', notes: reason, paidAt: new Date() } },
    { new: true }
  );
  if (!payment) throw new AppError('Payment record not found', 404);

  res.json({ success: true, message: 'Fee waived.', data: payment });
});

// GET /api/fees/receipt/:id
exports.downloadReceipt = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, schoolId: req.user.schoolId })
    .populate('studentId', 'firstName lastName rollNo grade section admissionNo')
    .populate('feeStructureId', 'termName grade components')
    .populate('paidBy', 'name');

  if (!payment) throw new AppError('Payment not found', 404);

  res.json({ success: true, data: payment });
});

// POST /api/fees/generate-invoices
exports.generateInvoicesForClass = asyncHandler(async (req, res) => {
  const { grade, academicYear, feeStructureId } = req.body;

  const structure = await FeeStructure.findOne({
    _id: feeStructureId, schoolId: req.user.schoolId,
  });
  if (!structure) throw new AppError('Fee structure not found', 404);

  const students = await Student.find({
    schoolId: req.user.schoolId,
    grade,
    status: 'active',
  }).select('_id');

  let created = 0, skipped = 0;

  await Promise.all(students.map(async (student) => {
    const exists = await Payment.findOne({
      schoolId:    req.user.schoolId,
      studentId:   student._id,
      academicYear,
      term:        structure.termName,
    });

    if (exists) { skipped++; return; }

    await Payment.create({
      schoolId:       req.user.schoolId,
      studentId:      student._id,
      feeStructureId: structure._id,
      academicYear,
      term:           structure.termName,
      amount:         structure.totalAmount,
      totalPaid:      0,
      status:         'pending',
    });
    created++;
  }));

  res.status(201).json({
    success: true,
    message: `Generated ${created} invoices. ${skipped} already existed.`,
    data: { created, skipped },
  });
});