// controllers/ai.controller.js
const Student    = require('../models/Student');
const Result     = require('../models/Result');
const Teacher    = require('../models/Teacher');
const AppError   = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');

// ════════════════════════════════════════════════════════════════
// PLATFORM INSIGHTS
// ════════════════════════════════════════════════════════════════

// GET /api/ai/insights
exports.getPlatformInsights = asyncHandler(async (req, res) => {
  const schoolId   = req.user.role === 'SUPER_ADMIN' && req.query.schoolId
    ? req.query.schoolId
    : req.user.schoolId;

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [
    studentGrowth,
    attendanceOverview,
    performanceSummary,
    feeOverview,
    teacherUtilisation,
  ] = await Promise.all([
    // Monthly enrolment trend (12 months)
    Student.aggregate([
      { $match: { schoolId } },
      { $group: {
        _id:   { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),

    // Attendance distribution
    Student.aggregate([
      { $match: { schoolId, status: 'active', 'attendanceSummary.total': { $gt: 0 } } },
      { $group: {
        _id:      null,
        avgPct:   { $avg: '$attendanceSummary.percentage' },
        below65:  { $sum: { $cond: [{ $lt: ['$attendanceSummary.percentage', 65] }, 1, 0] } },
        below75:  { $sum: { $cond: [{ $and: [{ $gte: ['$attendanceSummary.percentage', 65] }, { $lt: ['$attendanceSummary.percentage', 75] }] }, 1, 0] } },
        below85:  { $sum: { $cond: [{ $and: [{ $gte: ['$attendanceSummary.percentage', 75] }, { $lt: ['$attendanceSummary.percentage', 85] }] }, 1, 0] } },
        above85:  { $sum: { $cond: [{ $gte: ['$attendanceSummary.percentage', 85] }, 1, 0] } },
        total:    { $sum: 1 },
      }},
    ]),

    // Academic performance by exam type
    Result.aggregate([
      { $match: { schoolId, isPublished: true } },
      { $group: {
        _id:      '$examType',
        avgScore: { $avg: '$percentage' },
        passRate: { $avg: { $cond: ['$isPassed', 100, 0] } },
        count:    { $sum: 1 },
      }},
      { $sort: { count: -1 } },
    ]),

    // Fee collection (using Payment model)
    (async () => {
      try {
        const { Payment } = require('../models/Fee');
        return await Payment.aggregate([
          { $match: { schoolId } },
          { $group: {
            _id:    '$status',
            count:  { $sum: 1 },
            amount: { $sum: '$totalPaid' },
          }},
        ]);
      } catch { return []; }
    })(),

    // Teacher utilisation (classes assigned)
    Teacher.aggregate([
      { $match: { schoolId, status: 'active' } },
      { $project: {
        classCount: { $size: { $ifNull: ['$assignedClasses', []] } },
        subjects:   1,
      }},
      { $group: {
        _id:          null,
        avgClasses:   { $avg: '$classCount' },
        maxClasses:   { $max: '$classCount' },
        unassigned:   { $sum: { $cond: [{ $eq: ['$classCount', 0] }, 1, 0] } },
        total:        { $sum: 1 },
      }},
    ]),
  ]);

  const att = attendanceOverview[0] || {};
  const tu  = teacherUtilisation[0] || {};

  const paidFees    = feeOverview.find(f => f._id === 'paid')?.amount    || 0;
  const pendingFees = feeOverview.find(f => f._id === 'pending')?.amount || 0;
  const feeCollRate = (paidFees + pendingFees) > 0
    ? Math.round((paidFees / (paidFees + pendingFees)) * 100) : 0;

  res.json({
    success: true,
    data: {
      studentGrowth,
      attendance: {
        averagePercentage: att.avgPct ? Math.round(att.avgPct * 10) / 10 : 0,
        distribution: {
          critical: att.below65  || 0,
          high:     att.below75  || 0,
          medium:   att.below85  || 0,
          good:     att.above85  || 0,
        },
        totalStudentsTracked: att.total || 0,
        atRiskCount: (att.below65 || 0) + (att.below75 || 0),
        trend: att.avgPct >= 85 ? 'excellent' : att.avgPct >= 75 ? 'good' : 'needs_attention',
      },
      performance: performanceSummary,
      fees: {
        collectionRate: feeCollRate,
        collected:      paidFees,
        pending:        pendingFees,
        breakdown:      feeOverview,
      },
      teachers: {
        avgClassesPerTeacher: tu.avgClasses ? Math.round(tu.avgClasses * 10) / 10 : 0,
        maxClassesAssigned:   tu.maxClasses || 0,
        unassignedTeachers:   tu.unassigned || 0,
        total:                tu.total      || 0,
      },
    },
  });
});

// ════════════════════════════════════════════════════════════════
// PREDICTIONS
// ════════════════════════════════════════════════════════════════

// GET /api/ai/attendance-predictions
exports.getAttendancePredictions = asyncHandler(async (req, res) => {
  const { grade, section, threshold = 75 } = req.query;

  const students = await Student.find({
    schoolId: req.user.schoolId,
    status:   'active',
    ...(grade   && { grade }),
    ...(section && { section }),
    'attendanceSummary.total': { $gt: 5 },
  })
  .select('firstName lastName rollNo grade section attendanceSummary classTeacherId')
  .populate('classTeacherId', 'firstName lastName phone');

  const TOTAL_DAYS = 220;

  const predictions = students.map(s => {
    const { percentage, present, total } = s.attendanceSummary;
    const remaining = Math.max(0, TOTAL_DAYS - total);

    // Best case: attends all remaining
    const projectedBest  = remaining > 0
      ? Math.round(((present + remaining) / (total + remaining)) * 1000) / 10
      : percentage;

    // Worst case: misses all remaining
    const projectedWorst = remaining > 0
      ? Math.round((present / (total + remaining)) * 1000) / 10
      : percentage;

    const riskLevel =
      percentage < 60  ? 'critical' :
      percentage < 75  ? 'high'     :
      percentage < 85  ? 'medium'   : 'low';

    // Days needed to reach threshold
    const daysNeededFor75 = percentage < threshold
      ? Math.max(0, Math.ceil((threshold / 100) * (total + remaining) - present))
      : 0;

    return {
      studentId:        s._id,
      name:             `${s.firstName} ${s.lastName}`,
      rollNo:           s.rollNo,
      grade:            s.grade,
      section:          s.section,
      classTeacher:     s.classTeacherId
        ? `${s.classTeacherId.firstName} ${s.classTeacherId.lastName}`
        : null,
      classTeacherPhone:s.classTeacherId?.phone || null,
      currentPct:       percentage,
      projectedBest,
      projectedWorst,
      riskLevel,
      daysNeededFor75,
      recommendation:
        riskLevel === 'critical' ? 'Immediate parent meeting required. Consider counselling.'     :
        riskLevel === 'high'     ? 'Contact parents this week. Assign attendance monitoring.'     :
        riskLevel === 'medium'   ? 'Monitor for 2 more weeks. Send attendance reminder.'          :
                                   'Attendance is satisfactory. Continue monitoring.',
    };
  });

  const summary = {
    total:    predictions.length,
    critical: predictions.filter(p => p.riskLevel === 'critical').length,
    high:     predictions.filter(p => p.riskLevel === 'high').length,
    medium:   predictions.filter(p => p.riskLevel === 'medium').length,
    low:      predictions.filter(p => p.riskLevel === 'low').length,
  };

  res.json({
    success: true,
    data:    predictions.sort((a, b) => a.currentPct - b.currentPct),
    summary,
  });
});

// GET /api/ai/performance-predictions
exports.getPerformancePredictions = asyncHandler(async (req, res) => {
  const { grade, section, academicYear } = req.query;

  const results = await Result.find({
    schoolId:    req.user.schoolId,
    isPublished: true,
    ...(grade        && { grade }),
    ...(section      && { section }),
    ...(academicYear && { academicYear }),
  })
  .sort({ createdAt: 1 })
  .populate('studentId', 'firstName lastName rollNo');

  // Group results by student
  const byStudent = {};
  for (const r of results) {
    if (!r.studentId) continue;
    const sid = r.studentId._id.toString();
    if (!byStudent[sid]) {
      byStudent[sid] = { student: r.studentId, scores: [] };
    }
    byStudent[sid].scores.push({
      exam:    r.examName,
      examType:r.examType,
      pct:     r.percentage,
      rank:    r.rank,
      date:    r.examDate || r.createdAt,
    });
  }

  const predictions = Object.values(byStudent).map(({ student, scores }) => {
    if (!scores.length) return null;

    const avg    = scores.reduce((a, s) => a + s.pct, 0) / scores.length;
    const latest = scores[scores.length - 1].pct;
    const first  = scores[0].pct;

    // Linear projection
    const trendValue = scores.length > 1
      ? (latest - first) / (scores.length - 1)
      : 0;
    const predicted = Math.min(100, Math.max(0, Math.round(latest + trendValue)));

    const trendLabel = trendValue >  2 ? 'improving' :
                       trendValue < -2 ? 'declining'  : 'stable';

    const GRADE = (p) => p >= 91 ? 'A+' : p >= 81 ? 'A' : p >= 76 ? 'A-' : p >= 71 ? 'B+' : p >= 61 ? 'B' : p >= 51 ? 'C+' : p >= 41 ? 'C' : 'F';

    return {
      studentId:      student._id,
      name:           `${student.firstName} ${student.lastName}`,
      rollNo:         student.rollNo,
      scores,
      examsCount:     scores.length,
      currentScore:   latest,
      averageScore:   Math.round(avg * 10) / 10,
      trend:          trendLabel,
      trendValue:     Math.round(trendValue * 10) / 10,
      predicted,
      predictedGrade: GRADE(predicted),
      recommendation:
        trendLabel === 'improving' ? 'Excellent progress! Keep up the momentum.'      :
        trendLabel === 'declining' ? 'Performance declining. Schedule extra support.' :
                                     'Consistent performance. Push for improvement.',
    };
  }).filter(Boolean);

  const summary = {
    total:     predictions.length,
    improving: predictions.filter(p => p.trend === 'improving').length,
    stable:    predictions.filter(p => p.trend === 'stable').length,
    declining: predictions.filter(p => p.trend === 'declining').length,
  };

  res.json({
    success: true,
    data:    predictions.sort((a, b) => b.currentScore - a.currentScore),
    summary,
  });
});

// GET /api/ai/at-risk-students
exports.getAtRiskStudents = asyncHandler(async (req, res) => {
  const { grade, section } = req.query;

  const [students, recentResults] = await Promise.all([
    Student.find({
      schoolId: req.user.schoolId,
      status:   'active',
      ...(grade   && { grade }),
      ...(section && { section }),
    }).populate('classTeacherId', 'firstName lastName phone email'),

    Result.find({ schoolId: req.user.schoolId, isPublished: true })
      .sort({ createdAt: -1 })
      .select('studentId percentage isPassed examName examType'),
  ]);

  // Map latest result by studentId
  const latestResultMap = {};
  for (const r of recentResults) {
    const sid = r.studentId?.toString();
    if (sid && !latestResultMap[sid]) latestResultMap[sid] = r;
  }

  const atRisk = students.map(s => {
    const latestResult = latestResultMap[s._id.toString()];
    const attPct       = s.attendanceSummary?.percentage || 0;
    const hasBadAtt    = attPct > 0 && attPct < 75;
    const hasBadScore  = latestResult && latestResult.percentage < 50;
    const hasFailed    = latestResult && !latestResult.isPassed;

    const riskFactors = [
      ...(hasBadAtt   ? [`Low attendance (${attPct}%)`]                           : []),
      ...(hasBadScore ? [`Low score in ${latestResult.examName} (${latestResult.percentage}%)`] : []),
      ...(hasFailed   ? [`Failed ${latestResult.examName}`]                        : []),
    ];

    if (!riskFactors.length) return null;

    const riskScore =
      (hasBadAtt   ? (attPct < 65 ? 40 : 25) : 0) +
      (hasBadScore ? (latestResult.percentage < 35 ? 40 : 25) : 0) +
      (hasFailed   ? 20 : 0);

    return {
      studentId:    s._id,
      name:         `${s.firstName} ${s.lastName}`,
      rollNo:       s.rollNo,
      grade:        s.grade,
      section:      s.section,
      attendance:   attPct,
      latestScore:  latestResult?.percentage || null,
      latestExam:   latestResult?.examName   || null,
      isPassed:     latestResult?.isPassed ?? null,
      riskFactors,
      riskScore,
      riskLevel:    riskScore >= 60 ? 'critical' : riskScore >= 40 ? 'high' : 'medium',
      classTeacher: s.classTeacherId
        ? { name: `${s.classTeacherId.firstName} ${s.classTeacherId.lastName}`, phone: s.classTeacherId.phone }
        : null,
      recommendations: riskFactors.map(f =>
        f.includes('attendance')  ? 'Contact parents. Assign attendance tracking.'       :
        f.includes('Failed')      ? 'Enrol in remedial program immediately.'             :
        f.includes('Low score')   ? 'Schedule subject-specific tutoring sessions.'       : ''
      ).filter(Boolean),
    };
  }).filter(Boolean);

  res.json({
    success: true,
    data: atRisk.sort((a, b) => b.riskScore - a.riskScore),
    count: atRisk.length,
    summary: {
      critical: atRisk.filter(s => s.riskLevel === 'critical').length,
      high:     atRisk.filter(s => s.riskLevel === 'high').length,
      medium:   atRisk.filter(s => s.riskLevel === 'medium').length,
    },
  });
});

// GET /api/ai/recommendations/:studentId
exports.getStudentRecommendations = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id:      req.params.studentId,
    schoolId: req.user.schoolId,
  });
  if (!student) throw new AppError('Student not found', 404);

  const results = await Result.find({ studentId: student._id, isPublished: true })
    .sort({ createdAt: -1 })
    .limit(5);

  const recommendations = [];

  // Attendance recommendation
  const attPct = student.attendanceSummary?.percentage || 0;
  if (attPct > 0 && attPct < 85) {
    recommendations.push({
      area:     'Attendance',
      priority: attPct < 65 ? 'urgent' : attPct < 75 ? 'high' : 'medium',
      insight:  `Current attendance is ${attPct}%.${attPct < 75 ? ' Below the 75% minimum for exam eligibility.' : ''}`,
      action:   attPct < 65
        ? 'Immediate intervention needed. Parent meeting required.'
        : 'Attend all remaining classes. Avoid further absences.',
      icon:     '📋',
    });
  }

  if (results.length > 0) {
    const latest = results[0];

    // Per-subject weak areas
    const weakSubjects = latest.subjects
      .filter(s => s.maxMarks > 0 && (s.total / s.maxMarks) * 100 < 60)
      .sort((a, b) => (a.total / a.maxMarks) - (b.total / b.maxMarks));

    for (const sub of weakSubjects.slice(0, 3)) {
      const pct = Math.round((sub.total / sub.maxMarks) * 100);
      recommendations.push({
        area:     sub.subject,
        priority: pct < 40 ? 'high' : 'medium',
        insight:  `Scored ${pct}% in ${sub.subject}. Grade: ${sub.grade}.`,
        action:   `Dedicate extra study time to ${sub.subject}. Practice previous year questions.`,
        icon:     '📚',
      });
    }

    // Overall trend (last 2 exams)
    if (results.length >= 2) {
      const diff = results[0].percentage - results[1].percentage;
      if (diff < -5) {
        recommendations.push({
          area:     'Overall Performance',
          priority: 'high',
          insight:  `Score dropped ${Math.abs(Math.round(diff))}% since last exam (${results[1].examName} → ${results[0].examName}).`,
          action:   'Review all subjects. Create a structured daily study schedule.',
          icon:     '📉',
        });
      } else if (diff > 5) {
        recommendations.push({
          area:     'Overall Performance',
          priority: 'low',
          insight:  `Improved ${Math.round(diff)}% since last exam. Great progress! 🎉`,
          action:   'Maintain the momentum. Target top 5 in class next exam.',
          icon:     '📈',
        });
      }
    }
  }

  // If no recommendations — student is doing well
  if (!recommendations.length) {
    recommendations.push({
      area:     'Overall',
      priority: 'low',
      insight:  `${student.firstName} is performing well across all areas.`,
      action:   'Continue the excellent work. Consider participating in olympiads or competitions.',
      icon:     '🌟',
    });
  }

  res.json({
    success: true,
    data: {
      student: {
        name:       `${student.firstName} ${student.lastName}`,
        grade:      student.grade,
        section:    student.section,
        rollNo:     student.rollNo,
        attendance: attPct,
      },
      recommendations: recommendations.sort((a, b) => {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      }),
      latestResult: results[0] || null,
      totalExams:   results.length,
    },
  });
});

// ════════════════════════════════════════════════════════════════
// CHATBOT
// ════════════════════════════════════════════════════════════════

// POST /api/ai/chatbot
exports.chatbot = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) throw new AppError('Message is required.', 400);

  const msg = message.toLowerCase().trim();

  // ── Intent matching + live DB lookup ─────────────────────────
  let response = '';

  if (/\battendance\b/.test(msg)) {
    const stats = await Student.aggregate([
      { $match: { schoolId: req.user.schoolId, status: 'active', 'attendanceSummary.total': { $gt: 0 } } },
      { $group: {
        _id:      null,
        avg:      { $avg: '$attendanceSummary.percentage' },
        below75:  { $sum: { $cond: [{ $lt: ['$attendanceSummary.percentage', 75] }, 1, 0] } },
        total:    { $sum: 1 },
      }},
    ]);
    const s = stats[0] || {};
    response = `📋 Current attendance: average **${Math.round(s.avg || 0)}%** across ${s.total || 0} active students. **${s.below75 || 0}** students are below the 75% threshold.`;

  } else if (/\bfee|payment|due\b/.test(msg)) {
    try {
      const { Payment } = require('../models/Fee');
      const [pending, paid] = await Promise.all([
        Payment.aggregate([{ $match: { schoolId: req.user.schoolId, status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
        Payment.aggregate([{ $match: { schoolId: req.user.schoolId, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalPaid' }, count: { $sum: 1 } } }]),
      ]);
      response = `💳 Fee summary: **₹${(paid[0]?.total || 0).toLocaleString()}** collected (${paid[0]?.count || 0} payments). **₹${(pending[0]?.total || 0).toLocaleString()}** pending (${pending[0]?.count || 0} invoices).`;
    } catch {
      response = 'Fee data is not available at the moment.';
    }

  } else if (/\bstudent.*(count|how many|total)\b|\bhow many.*student/.test(msg)) {
    const [active, total] = await Promise.all([
      Student.countDocuments({ schoolId: req.user.schoolId, status: 'active' }),
      Student.countDocuments({ schoolId: req.user.schoolId }),
    ]);
    response = `👨‍🎓 There are **${active} active students** enrolled (${total} total including inactive/transferred).`;

  } else if (/\bteacher.*(count|how many|total)\b|\bhow many.*teacher/.test(msg)) {
    const count = await Teacher.countDocuments({ schoolId: req.user.schoolId, status: 'active' });
    response = `👩‍🏫 There are **${count} active teachers** currently on staff.`;

  } else if (/\bresult|performance|score|mark|grade\b/.test(msg)) {
    const latest = await Result.findOne({ schoolId: req.user.schoolId, isPublished: true })
      .sort({ publishedAt: -1 })
      .select('examName grade section percentage examType publishedAt');
    response = latest
      ? `📊 Latest published result: **${latest.examName}** for Grade **${latest.grade}-${latest.section}**. Class average: **${latest.percentage}%**.`
      : 'No results have been published yet.';

  } else if (/\bat.?risk|risk\b/.test(msg)) {
    const atRisk = await Student.countDocuments({
      schoolId: req.user.schoolId,
      status:   'active',
      'attendanceSummary.percentage': { $lt: 75, $gt: 0 },
    });
    response = `⚠️ **${atRisk} students** are currently at risk due to attendance below 75%.`;

  } else if (/\bhello|hi|hey|good (morning|afternoon|evening)\b/.test(msg)) {
    const hour = new Date().getHours();
    const greet= hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    response = `${greet}! 👋 I'm AcademyBot. I can help with attendance stats, fee summaries, student counts, performance data, and at-risk reports. What would you like to know?`;

  } else if (/\bhelp|what can you do|capability/.test(msg)) {
    response = `I can help you with:\n- 📋 **Attendance** – averages and at-risk counts\n- 💳 **Fees** – collection and pending amounts\n- 👨‍🎓 **Students** – total enrolment counts\n- 📊 **Results** – latest published exam data\n- ⚠️ **At-Risk** – students below thresholds`;

  } else {
    response = `I'm not sure about that specific query. Try asking about **attendance**, **fees**, **students**, **teachers**, **results**, or **at-risk students**. I'm here to help! 😊`;
  }

  res.json({
    success: true,
    data: {
      message:   response,
      role:      'assistant',
      timestamp: new Date(),
    },
  });
});

// ════════════════════════════════════════════════════════════════
// MODEL HEALTH
// ════════════════════════════════════════════════════════════════

// GET /api/ai/model-health
exports.getModelHealth = asyncHandler(async (req, res) => {
  // Wire to actual ML pipeline metrics; returning realistic mock until connected
  const now = Date.now();

  res.json({
    success: true,
    data: [
      {
        name:        'Attendance Risk Predictor',
        version:     'v2.1.3',
        accuracy:    91.4,
        f1Score:     0.893,
        lastTrained: new Date(now - 2 * 86400000),
        status:      'healthy',
        predictions: 4820,
        endpoint:    '/models/attendance-risk',
      },
      {
        name:        'Performance Forecaster',
        version:     'v1.8.0',
        accuracy:    88.7,
        f1Score:     0.871,
        lastTrained: new Date(now - 5 * 86400000),
        status:      'healthy',
        predictions: 3210,
        endpoint:    '/models/performance',
      },
      {
        name:        'At-Risk Student Classifier',
        version:     'v3.0.1',
        accuracy:    94.2,
        f1Score:     0.938,
        lastTrained: new Date(now - 1 * 86400000),
        status:      'healthy',
        predictions: 1540,
        endpoint:    '/models/at-risk',
      },
      {
        name:        'Fee Default Predictor',
        version:     'v1.2.4',
        accuracy:    85.3,
        f1Score:     0.841,
        lastTrained: new Date(now - 7 * 86400000),
        status:      'retraining',
        predictions: 870,
        endpoint:    '/models/fee-default',
      },
    ],
  });
});