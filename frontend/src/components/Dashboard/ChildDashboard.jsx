import React, { useState } from 'react';

const ChildDashboard = () => {
  const [studentData] = useState({
    name: 'Aarav Kumar',
    class: 'Grade 10-A',
    rollNumber: '2024-10A-025',
    profileImage: '👦',
    school: 'Delhi Public School',
    section: 'A',
    admissionNumber: 'DPS2024025'
  });

  const [attendance] = useState({
    present: 168,
    absent: 8,
    leave: 4,
    total: 180,
    percentage: 93.3,
    monthlyData: [
      { month: 'Aug', percentage: 95 },
      { month: 'Sep', percentage: 92 },
      { month: 'Oct', percentage: 94 },
      { month: 'Nov', percentage: 91 },
      { month: 'Dec', percentage: 93 }
    ]
  });

  const [academicPerformance] = useState({
    overallGrade: 'A',
    percentage: 87.5,
    rank: 5,
    totalStudents: 45,
    subjects: [
      { name: 'Mathematics', marks: 92, grade: 'A+', teacher: 'Mr. Sharma', color: 'bg-blue-500' },
      { name: 'Science', marks: 88, grade: 'A', teacher: 'Ms. Verma', color: 'bg-green-500' },
      { name: 'English', marks: 85, grade: 'A', teacher: 'Mrs. Gupta', color: 'bg-purple-500' },
      { name: 'Hindi', marks: 90, grade: 'A+', teacher: 'Mr. Singh', color: 'bg-yellow-500' },
      { name: 'Social Studies', marks: 86, grade: 'A', teacher: 'Ms. Reddy', color: 'bg-pink-500' },
      { name: 'Computer Science', marks: 94, grade: 'A+', teacher: 'Mr. Patel', color: 'bg-indigo-500' }
    ]
  });

  const [assignments] = useState([
    {
      id: 1,
      subject: 'Mathematics',
      title: 'Quadratic Equations - Chapter 4',
      dueDate: '2025-12-22',
      status: 'pending',
      priority: 'high',
      marks: 20
    },
    {
      id: 2,
      subject: 'Science',
      title: 'Chemical Reactions Lab Report',
      dueDate: '2025-12-24',
      status: 'pending',
      priority: 'medium',
      marks: 15
    },
    {
      id: 3,
      subject: 'English',
      title: 'Essay on Climate Change',
      dueDate: '2025-12-20',
      status: 'submitted',
      priority: 'high',
      marks: 25,
      submittedDate: '2025-12-19'
    },
    {
      id: 4,
      subject: 'Computer Science',
      title: 'Python Programming Project',
      dueDate: '2025-12-26',
      status: 'in-progress',
      priority: 'high',
      marks: 30
    }
  ]);

  const [examSchedule] = useState([
    { id: 1, subject: 'Mathematics', date: '2025-12-28', time: '09:00 AM - 12:00 PM', type: 'Final Exam', syllabus: 'Chapters 1-10' },
    { id: 2, subject: 'Science', date: '2025-12-30', time: '09:00 AM - 12:00 PM', type: 'Final Exam', syllabus: 'Full Syllabus' },
    { id: 3, subject: 'English', date: '2026-01-02', time: '09:00 AM - 12:00 PM', type: 'Final Exam', syllabus: 'Literature & Grammar' },
    { id: 4, subject: 'Hindi', date: '2026-01-04', time: '09:00 AM - 12:00 PM', type: 'Final Exam', syllabus: 'Full Syllabus' }
  ]);

  const [timeTable] = useState({
    Monday: [
      { time: '08:00-08:45', subject: 'Mathematics', teacher: 'Mr. Sharma', room: '201' },
      { time: '08:45-09:30', subject: 'Science', teacher: 'Ms. Verma', room: '305' },
      { time: '09:30-10:15', subject: 'English', teacher: 'Mrs. Gupta', room: '102' },
      { time: '10:15-10:30', subject: 'Break', teacher: '-', room: '-' },
      { time: '10:30-11:15', subject: 'Hindi', teacher: 'Mr. Singh', room: '103' },
      { time: '11:15-12:00', subject: 'Social Studies', teacher: 'Ms. Reddy', room: '204' },
      { time: '12:00-12:45', subject: 'Computer Science', teacher: 'Mr. Patel', room: 'Lab-2' }
    ],
    Tuesday: [
      { time: '08:00-08:45', subject: 'Science', teacher: 'Ms. Verma', room: '305' },
      { time: '08:45-09:30', subject: 'Mathematics', teacher: 'Mr. Sharma', room: '201' },
      { time: '09:30-10:15', subject: 'Physical Education', teacher: 'Coach Kumar', room: 'Ground' },
      { time: '10:15-10:30', subject: 'Break', teacher: '-', room: '-' },
      { time: '10:30-11:15', subject: 'English', teacher: 'Mrs. Gupta', room: '102' },
      { time: '11:15-12:00', subject: 'Hindi', teacher: 'Mr. Singh', room: '103' },
      { time: '12:00-12:45', subject: 'Art & Craft', teacher: 'Ms. Iyer', room: 'Art Room' }
    ],
    Wednesday: [
      { time: '08:00-08:45', subject: 'Mathematics', teacher: 'Mr. Sharma', room: '201' },
      { time: '08:45-09:30', subject: 'Hindi', teacher: 'Mr. Singh', room: '103' },
      { time: '09:30-10:15', subject: 'Science', teacher: 'Ms. Verma', room: '305' },
      { time: '10:15-10:30', subject: 'Break', teacher: '-', room: '-' },
      { time: '10:30-11:15', subject: 'Social Studies', teacher: 'Ms. Reddy', room: '204' },
      { time: '11:15-12:00', subject: 'Computer Science', teacher: 'Mr. Patel', room: 'Lab-2' },
      { time: '12:00-12:45', subject: 'English', teacher: 'Mrs. Gupta', room: '102' }
    ],
    Thursday: [
      { time: '08:00-08:45', subject: 'English', teacher: 'Mrs. Gupta', room: '102' },
      { time: '08:45-09:30', subject: 'Mathematics', teacher: 'Mr. Sharma', room: '201' },
      { time: '09:30-10:15', subject: 'Computer Science', teacher: 'Mr. Patel', room: 'Lab-2' },
      { time: '10:15-10:30', subject: 'Break', teacher: '-', room: '-' },
      { time: '10:30-11:15', subject: 'Science', teacher: 'Ms. Verma', room: '305' },
      { time: '11:15-12:00', subject: 'Social Studies', teacher: 'Ms. Reddy', room: '204' },
      { time: '12:00-12:45', subject: 'Hindi', teacher: 'Mr. Singh', room: '103' }
    ],
    Friday: [
      { time: '08:00-08:45', subject: 'Hindi', teacher: 'Mr. Singh', room: '103' },
      { time: '08:45-09:30', subject: 'Science', teacher: 'Ms. Verma', room: '305' },
      { time: '09:30-10:15', subject: 'Mathematics', teacher: 'Mr. Sharma', room: '201' },
      { time: '10:15-10:30', subject: 'Break', teacher: '-', room: '-' },
      { time: '10:30-11:15', subject: 'English', teacher: 'Mrs. Gupta', room: '102' },
      { time: '11:15-12:00', subject: 'Physical Education', teacher: 'Coach Kumar', room: 'Ground' },
      { time: '12:00-12:45', subject: 'Social Studies', teacher: 'Ms. Reddy', room: '204' }
    ],
    Saturday: [
      { time: '08:00-08:45', subject: 'Computer Science', teacher: 'Mr. Patel', room: 'Lab-2' },
      { time: '08:45-09:30', subject: 'Mathematics', teacher: 'Mr. Sharma', room: '201' },
      { time: '09:30-10:15', subject: 'Science', teacher: 'Ms. Verma', room: '305' },
      { time: '10:15-10:30', subject: 'Break', teacher: '-', room: '-' },
      { time: '10:30-11:15', subject: 'Activity Period', teacher: 'Various', room: '-' }
    ]
  });

  const [feeDetails] = useState({
    totalFees: 85000,
    paid: 60000,
    pending: 25000,
    dueDate: '2026-01-15',
    installments: [
      { id: 1, amount: 25000, dueDate: '2025-07-15', status: 'paid', paidDate: '2025-07-12' },
      { id: 2, amount: 25000, dueDate: '2025-10-15', status: 'paid', paidDate: '2025-10-10' },
      { id: 3, amount: 10000, dueDate: '2025-12-15', status: 'paid', paidDate: '2025-12-14' },
      { id: 4, amount: 25000, dueDate: '2026-01-15', status: 'pending', paidDate: null }
    ]
  });

  const [achievements] = useState([
    { id: 1, title: 'First Prize - Science Exhibition', date: '2025-11-15', icon: '🥇', category: 'Academic' },
    { id: 2, title: 'Best Coder Award', date: '2025-10-20', icon: '💻', category: 'Technical' },
    { id: 3, title: 'School Cricket Team Captain', date: '2025-09-05', icon: '🏏', category: 'Sports' },
    { id: 4, title: 'Perfect Attendance - Term 1', date: '2025-08-30', icon: '✓', category: 'Discipline' }
  ]);

  const [libraryBooks] = useState([
    { id: 1, title: 'The Theory of Everything', author: 'Stephen Hawking', issueDate: '2025-12-10', dueDate: '2025-12-24', status: 'issued' },
    { id: 2, title: 'Wings of Fire', author: 'APJ Abdul Kalam', issueDate: '2025-12-05', dueDate: '2025-12-19', status: 'overdue' },
    { id: 3, title: 'Harry Potter Series', author: 'J.K. Rowling', returnDate: '2025-11-28', status: 'returned' }
  ]);

  const [activities] = useState([
    { id: 1, activity: 'Cricket Practice', day: 'Mon, Wed, Fri', time: '04:00 PM - 05:30 PM', instructor: 'Coach Kumar' },
    { id: 2, activity: 'Coding Club', day: 'Tuesday', time: '03:30 PM - 05:00 PM', instructor: 'Mr. Patel' },
    { id: 3, activity: 'Music Class', day: 'Thursday', time: '04:00 PM - 05:00 PM', instructor: 'Ms. Nair' }
  ]);

  const [selectedDay, setSelectedDay] = useState('Monday');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      submitted: 'bg-green-100 text-green-800 border-green-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      issued: 'bg-blue-100 text-blue-800 border-blue-200',
      returned: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return badges[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const feePaidPercentage = (feeDetails.paid / feeDetails.totalFees) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Header with Student Profile */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-indigo-100">
        <div className="flex flex-wrap justify-between items-start gap-6">
          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
              {studentData.profileImage}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{studentData.name}</h1>
              <p className="text-indigo-600 font-semibold text-lg">{studentData.class} • Roll No: {studentData.rollNumber}</p>
              <p className="text-gray-600 text-sm mt-1">{studentData.school}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              📚 Study Materials
            </button>
            <button className="px-5 py-2.5 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all">
              📧 Messages
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-xl flex items-center justify-center text-2xl">
              ✓
            </div>
            <span className="text-sm font-semibold bg-white bg-opacity-30 px-3 py-1 rounded-full">Today</span>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Attendance</h3>
          <p className="text-3xl font-bold">{attendance.percentage}%</p>
          <p className="text-xs mt-2 opacity-90">{attendance.present} Present • {attendance.absent} Absent</p>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-xl flex items-center justify-center text-2xl">
              📊
            </div>
            <span className="text-sm font-semibold bg-white bg-opacity-30 px-3 py-1 rounded-full">Overall</span>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Academic Grade</h3>
          <p className="text-3xl font-bold">{academicPerformance.overallGrade} Grade</p>
          <p className="text-xs mt-2 opacity-90">{academicPerformance.percentage}% • Rank {academicPerformance.rank}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-xl flex items-center justify-center text-2xl">
              📝
            </div>
            <span className="text-sm font-semibold bg-white bg-opacity-30 px-3 py-1 rounded-full">Pending</span>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Assignments</h3>
          <p className="text-3xl font-bold">{assignments.filter(a => a.status === 'pending').length}</p>
          <p className="text-xs mt-2 opacity-90">Total: {assignments.length} assignments</p>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-xl flex items-center justify-center text-2xl">
              💰
            </div>
            <span className="text-sm font-semibold bg-white bg-opacity-30 px-3 py-1 rounded-full">Due Soon</span>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Pending Fees</h3>
          <p className="text-3xl font-bold">{formatCurrency(feeDetails.pending)}</p>
          <p className="text-xs mt-2 opacity-90">Due: {new Date(feeDetails.dueDate).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject Performance */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📚 Subject Performance
              </h2>
              <button className="text-sm text-indigo-600 font-semibold hover:underline">View Details</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {academicPerformance.subjects.map((subject, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{subject.teacher}</p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-bold">
                      {subject.grade}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Marks</span>
                      <span className="font-bold text-gray-900">{subject.marks}/100</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${subject.color} transition-all duration-500`}
                        style={{ width: `${subject.marks}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📝 Assignments & Homework
              </h2>
              <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                <option>All</option>
                <option>Pending</option>
                <option>Submitted</option>
              </select>
            </div>
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className={`border-2 rounded-xl p-4 hover:shadow-md transition-all ${getStatusColor(assignment.status)}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPriorityBadge(assignment.priority)}`}>
                          {assignment.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{assignment.subject}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(assignment.status)}`}>
                      {assignment.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-3">
                    <span className="text-gray-600">
                      📅 Due: {new Date(assignment.dueDate).toLocaleDateString('en-IN')}
                    </span>
                    <span className="font-semibold text-gray-900">Max Marks: {assignment.marks}</span>
                  </div>
                  {assignment.status === 'submitted' && (
                    <div className="mt-2 text-xs text-green-700 bg-green-50 px-3 py-1 rounded-lg inline-block">
                      ✓ Submitted on {new Date(assignment.submittedDate).toLocaleDateString('en-IN')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Time Table */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                🕐 Class Schedule
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                      selectedDay === day
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {(timeTable[selectedDay] || []).map((period, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-3 rounded-xl border-2 ${
                    period.subject === 'Break'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200 hover:shadow-md transition-all'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-700 w-28">{period.time}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{period.subject}</div>
                    <div className="text-xs text-gray-600">{period.teacher} {period.room !== '-' && `• Room ${period.room}`}</div>
                  </div>
                  {period.subject !== 'Break' && (
                    <button className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">
                      View
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Exam Schedule */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📝 Upcoming Exams
            </h2>
            <div className="space-y-3">
              {examSchedule.map((exam) => (
                <div key={exam.id} className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900">{exam.subject}</h3>
                  <p className="text-sm text-gray-700 mt-1">{exam.type}</p>
                  <div className="text-xs text-gray-600 mt-2 space-y-1">
                    <div>📅 {new Date(exam.date).toLocaleDateString('en-IN')}</div>
                    <div>🕐 {exam.time}</div>
                    <div>📚 {exam.syllabus}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fee Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              💰 Fee Details
            </h2>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700">Total Fees</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(feeDetails.totalFees)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-green-700">Paid</span>
                  <span className="text-lg font-bold text-green-700">{formatCurrency(feeDetails.paid)}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                    style={{ width: `${feePaidPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-700 font-semibold">Pending</span>
                  <span className="text-lg font-bold text-orange-700">{formatCurrency(feeDetails.pending)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 text-sm">Installment History</h3>
                {feeDetails.installments.map((installment) => (
                  <div key={installment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{formatCurrency(installment.amount)}</div>
                      <div className="text-xs text-gray-600">Due: {new Date(installment.dueDate).toLocaleDateString('en-IN')}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(installment.status)}`}>
                      {installment.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🏆 Achievements
            </h2>
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                  <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{achievement.title}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-600">{new Date(achievement.date).toLocaleDateString('en-IN')}</span>
                      <span className="text-xs px-2 py-1 bg-yellow-200 text-yellow-900 rounded font-semibold">
                        {achievement.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Library Books */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📚 Library Books
            </h2>
            <div className="space-y-3">
              {libraryBooks.map((book) => (
                <div key={book.id} className={`p-4 rounded-xl border-2 ${getStatusColor(book.status)}`}>
                  <h3 className="font-semibold text-gray-900 text-sm">{book.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">by {book.author}</p>
                  <div className="flex justify-between items-center mt-2">
                    {book.status === 'returned' ? (
                      <span className="text-xs text-gray-600">Returned: {new Date(book.returnDate).toLocaleDateString('en-IN')}</span>
                    ) : (
                      <span className="text-xs text-gray-600">Due: {new Date(book.dueDate).toLocaleDateString('en-IN')}</span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(book.status)}`}>
                      {book.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🎯 Activities & Clubs
            </h2>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                  <h3 className="font-semibold text-gray-900">{activity.activity}</h3>
                  <div className="text-xs text-gray-600 mt-2 space-y-1">
                    <div>📅 {activity.day}</div>
                    <div>🕐 {activity.time}</div>
                    <div>👤 {activity.instructor}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildDashboard;