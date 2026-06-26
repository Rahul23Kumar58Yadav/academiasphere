// src/pages/school-admin/StudentDetails.jsx
import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Download, Edit, Trash2, Send,
  Award, Activity, DollarSign, FileText, Clock, CheckCircle, XCircle,
  AlertCircle, TrendingUp, BookOpen, Users, Heart, Printer, Share2,
  MessageSquare, Bell, Ban, CheckSquare, CreditCard, History, Target,
  GraduationCap, Zap, Shield, Camera, Upload, Eye, BarChart3, Lock, Unlock,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StudentDetails = ({ studentId, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [actionHistory, setActionHistory] = useState([]);

  // Mock Data - Replace with API
  useEffect(() => {
    loadStudentData();
    loadActionHistory();
  }, [studentId]);

  const loadStudentData = () => {
    setTimeout(() => {
      setStudent({
        id: studentId || 1,
        studentId: 'STU2024001',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Michael Doe',
        photo: null,
        email: 'john.doe@school.com',
        phone: '+1 (555) 123-4567',
        dob: '2008-05-15',
        age: 15,
        gender: 'Male',
        bloodGroup: 'O+',
        nationality: 'American',
        religion: 'Christian',
        address: '123 Main Street, Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        
        // Academic
        class: 'Grade 10',
        section: 'A',
        rollNo: '101',
        admissionNo: 'ADM2023001',
        admissionDate: '2023-04-01',
        academicYear: '2023-2024',
        currentGPA: 3.85,
        overallGrade: 'A',
        rank: 5,
        totalStudents: 120,
        attendance: 95.5,
        behaviour: 'Excellent',
        
        // Parents
        fatherName: 'Robert Doe',
        fatherPhone: '+1 (555) 123-4568',
        fatherEmail: 'robert.doe@email.com',
        fatherOccupation: 'Software Engineer',
        motherName: 'Mary Doe',
        motherPhone: '+1 (555) 123-4569',
        motherEmail: 'mary.doe@email.com',
        motherOccupation: 'Teacher',
        guardianName: 'Robert Doe',
        emergencyContact: '+1 (555) 123-4568',
        
        // Status & Actions
        status: 'Active',
        accountStatus: 'Active',
        lastLogin: '2024-03-20 10:30 AM',
        enrollmentStatus: 'Regular',
        
        // Subjects
        subjects: [
          { id: 1, name: 'Mathematics', teacher: 'Mr. Smith', grade: 'A', score: 92, attendance: 98, assignments: 15, completed: 14 },
          { id: 2, name: 'Physics', teacher: 'Mrs. Johnson', grade: 'A-', score: 88, attendance: 95, assignments: 12, completed: 11 },
          { id: 3, name: 'Chemistry', teacher: 'Dr. Williams', grade: 'A', score: 90, attendance: 97, assignments: 14, completed: 14 },
          { id: 4, name: 'English', teacher: 'Ms. Brown', grade: 'A', score: 91, attendance: 100, assignments: 10, completed: 10 },
          { id: 5, name: 'History', teacher: 'Mr. Davis', grade: 'B+', score: 85, attendance: 92, assignments: 8, completed: 7 },
          { id: 6, name: 'Computer Science', teacher: 'Mr. Wilson', grade: 'A+', score: 95, attendance: 99, assignments: 16, completed: 16 },
        ],
        
        // Attendance
        attendanceData: [
          { month: 'Sep', present: 20, absent: 2, late: 1, excused: 1 },
          { month: 'Oct', present: 22, absent: 0, late: 1, excused: 0 },
          { month: 'Nov', present: 19, absent: 1, late: 2, excused: 1 },
          { month: 'Dec', present: 15, absent: 0, late: 0, excused: 0 },
          { month: 'Jan', present: 21, absent: 1, late: 1, excused: 0 },
          { month: 'Feb', present: 20, absent: 2, late: 0, excused: 1 },
        ],
        
        // Performance
        performanceTrend: [
          { exam: 'Q1', math: 88, physics: 85, chemistry: 87, english: 89, avg: 87.25 },
          { exam: 'Q2', math: 90, physics: 87, chemistry: 89, english: 90, avg: 89 },
          { exam: 'Mid', math: 91, physics: 88, chemistry: 90, english: 91, avg: 90 },
          { exam: 'Q3', math: 92, physics: 88, chemistry: 90, english: 91, avg: 90.25 },
        ],
        
        // Skills
        skillsAssessment: [
          { skill: 'Academic', score: 90, maxScore: 100 },
          { skill: 'Leadership', score: 75, maxScore: 100 },
          { skill: 'Teamwork', score: 85, maxScore: 100 },
          { skill: 'Communication', score: 80, maxScore: 100 },
          { skill: 'Creativity', score: 88, maxScore: 100 },
          { skill: 'Sports', score: 70, maxScore: 100 },
        ],
        
        // Fees
        totalFees: 15000,
        paidFees: 10000,
        pendingFees: 5000,
        discountApplied: 1000,
        nextDueDate: '2024-04-01',
        paymentPlan: 'Quarterly',
        feeHistory: [
          { id: 1, date: '2024-01-15', amount: 5000, method: 'Bank Transfer', transactionId: 'TXN001', status: 'Completed', receipt: true },
          { id: 2, date: '2024-02-15', amount: 3000, method: 'Credit Card', transactionId: 'TXN002', status: 'Completed', receipt: true },
          { id: 3, date: '2024-03-15', amount: 2000, method: 'Cash', transactionId: 'TXN003', status: 'Completed', receipt: true },
        ],
        
        // Achievements
        achievements: [
          { id: 1, title: 'Science Fair Winner', date: '2024-02-20', category: 'Academic', description: 'First place in annual science fair', points: 100 },
          { id: 2, title: 'Math Olympiad Bronze', date: '2024-01-15', category: 'Academic', description: 'Bronze medal in regional competition', points: 75 },
          { id: 3, title: 'Perfect Attendance Q2', date: '2023-12-20', category: 'Attendance', description: '100% attendance in Q2', points: 50 },
          { id: 4, title: 'Debate Champion', date: '2023-11-10', category: 'Extracurricular', description: 'School debate competition winner', points: 80 },
        ],
        
        // Activities
        activities: [
          { id: 1, name: 'Chess Club', role: 'Member', since: '2023-04-01', attendance: '85%', achievements: 2 },
          { id: 2, name: 'Debate Team', role: 'Captain', since: '2023-04-01', attendance: '95%', achievements: 3 },
          { id: 3, name: 'Basketball Team', role: 'Player', since: '2023-04-01', attendance: '90%', achievements: 1 },
        ],
        
        // Behavior & Discipline
        behaviorScore: 95,
        disciplinaryRecords: [
          { id: 1, date: '2023-10-15', type: 'Warning', reason: 'Late submission', action: 'Verbal warning', severity: 'Low' },
        ],
        
        // Medical
        medicalConditions: 'None',
        allergies: 'Peanuts, Shellfish',
        medications: 'None',
        vaccinations: 'Up to date',
        lastCheckup: '2024-01-10',
        doctorName: 'Dr. Emily Johnson',
        doctorPhone: '+1 (555) 987-6543',
        
        // Documents
        documents: [
          { id: 1, name: 'Birth Certificate', type: 'PDF', uploadDate: '2023-04-01', size: '2.3 MB', verified: true },
          { id: 2, name: 'Previous School Certificate', type: 'PDF', uploadDate: '2023-04-01', size: '1.8 MB', verified: true },
          { id: 3, name: 'Medical Records', type: 'PDF', uploadDate: '2023-04-01', size: '3.1 MB', verified: true },
          { id: 4, name: 'Parent ID Proof', type: 'PDF', uploadDate: '2023-04-01', size: '1.2 MB', verified: true },
          { id: 5, name: 'Address Proof', type: 'PDF', uploadDate: '2023-04-01', size: '1.5 MB', verified: true },
        ],
        
        // Communication Log
        communications: [
          { id: 1, date: '2024-03-20', type: 'Email', subject: 'Parent-Teacher Meeting', from: 'School Admin', status: 'Sent' },
          { id: 2, date: '2024-03-15', type: 'SMS', subject: 'Fee Reminder', from: 'System', status: 'Delivered' },
          { id: 3, date: '2024-03-10', type: 'Email', subject: 'Exam Schedule', from: 'Academic Dept', status: 'Read' },
        ],
      });
      setLoading(false);
    }, 500);
  };

  const loadActionHistory = () => {
    setActionHistory([
      { id: 1, action: 'Profile Updated', user: 'Admin', date: '2024-03-20 10:30 AM', details: 'Contact information updated' },
      { id: 2, action: 'Fee Payment', user: 'Finance Dept', date: '2024-03-15 02:15 PM', details: 'Payment of $2000 received' },
      { id: 3, action: 'Document Uploaded', user: 'Student', date: '2024-03-10 09:00 AM', details: 'Medical certificate uploaded' },
      { id: 4, action: 'Grade Updated', user: 'Mr. Smith', date: '2024-03-05 11:45 AM', details: 'Mathematics Q3 grade published' },
    ]);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'academic', name: 'Academic Performance', icon: BookOpen },
    { id: 'attendance', name: 'Attendance', icon: Calendar },
    { id: 'fees', name: 'Fee Management', icon: DollarSign },
    { id: 'behavior', name: 'Behavior & Discipline', icon: Shield },
    { id: 'activities', name: 'Activities', icon: Award },
    { id: 'medical', name: 'Medical Records', icon: Heart },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'communication', name: 'Communication', icon: MessageSquare },
    { id: 'history', name: 'Action History', icon: History },
  ];

  const handleAction = (action) => {
    switch(action) {
      case 'edit':
        setShowEditModal(true);
        break;
      case 'message':
        setShowMessageModal(true);
        break;
      case 'print':
        window.print();
        break;
      case 'download':
        alert('Downloading student report...');
        break;
      case 'suspend':
        setShowSuspendModal(true);
        break;
      case 'fees':
        setShowFeeModal(true);
        break;
      default:
        break;
    }
  };

  const handleStatusChange = (newStatus) => {
    if(confirm(`Are you sure you want to change student status to ${newStatus}?`)) {
      setStudent({...student, status: newStatus});
      alert(`Student status changed to ${newStatus}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold shadow-lg">
                  {student.photo ? (
                    <img src={student.photo} alt={student.fullName} className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <span>{student.firstName.charAt(0)}{student.lastName.charAt(0)}</span>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full hover:bg-blue-700">
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                  student.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                }`} title={student.status} />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{student.fullName}</h1>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1 bg-white/20 px-3 py-1 rounded-full">
                    <GraduationCap className="w-4 h-4" />
                    <span>{student.class} - {student.section}</span>
                  </span>
                  <span className="flex items-center space-x-1 bg-white/20 px-3 py-1 rounded-full">
                    <User className="w-4 h-4" />
                    <span>Roll: {student.rollNo}</span>
                  </span>
                  <span className="flex items-center space-x-1 bg-white/20 px-3 py-1 rounded-full">
                    <Calendar className="w-4 h-4" />
                    <span>{student.studentId}</span>
                  </span>
                  <span className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
                    student.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {student.status === 'Active' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{student.status}</span>
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleAction('message')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
                <span className="hidden md:inline">Message</span>
              </button>
              <button
                onClick={() => handleAction('edit')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
                title="Edit Profile"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden md:inline">Edit</span>
              </button>
              <button
                onClick={() => handleAction('print')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
                title="Print"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden md:inline">Print</span>
              </button>
              <button
                onClick={() => handleAction('download')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
                title="Download Report"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Download</span>
              </button>
              <div className="relative group">
                <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <span className="text-lg">⋮</span>
                </button>
                <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-10">
                  <button
                    onClick={() => handleAction('suspend')}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-t-lg"
                  >
                    <Ban className="w-4 h-4 inline mr-2" />
                    Suspend Student
                  </button>
                  <button
                    onClick={() => handleStatusChange('Inactive')}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                  >
                    <Lock className="w-4 h-4 inline mr-2" />
                    Mark Inactive
                  </button>
                  <button
                    onClick={() => alert('Transfer functionality')}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-b-lg"
                  >
                    <Users className="w-4 h-4 inline mr-2" />
                    Transfer Student
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={Target} label="GPA" value={student.currentGPA} subtext={`Grade: ${student.overallGrade}`} />
            <StatCard icon={TrendingUp} label="Rank" value={`#${student.rank}`} subtext={`of ${student.totalStudents}`} />
            <StatCard icon={Activity} label="Attendance" value={`${student.attendance}%`} subtext="Excellent" />
            <StatCard icon={DollarSign} label="Fees" value={`$${student.paidFees}`} subtext={`$${student.pendingFees} pending`} color="yellow" />
            <StatCard icon={Award} label="Behavior" value={student.behaviorScore} subtext="Excellent conduct" color="green" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Info */}
            <div className="lg:col-span-2 space-y-6">
              <InfoCard title="Personal Information" icon={User}>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Full Name" value={student.fullName} />
                  <InfoField label="Student ID" value={student.studentId} />
                  <InfoField label="Email" value={student.email} icon={Mail} />
                  <InfoField label="Phone" value={student.phone} icon={Phone} />
                  <InfoField label="Date of Birth" value={student.dob} />
                  <InfoField label="Age" value={`${student.age} years`} />
                  <InfoField label="Gender" value={student.gender} />
                  <InfoField label="Blood Group" value={student.bloodGroup} icon={Heart} />
                  <InfoField label="Nationality" value={student.nationality} />
                  <InfoField label="Religion" value={student.religion} />
                </div>
              </InfoCard>

              <InfoCard title="Address Information" icon={MapPin}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <InfoField label="Address" value={student.address} />
                  </div>
                  <InfoField label="City" value={student.city} />
                  <InfoField label="State" value={student.state} />
                  <InfoField label="ZIP Code" value={student.zipCode} />
                  <InfoField label="Country" value={student.country} />
                </div>
              </InfoCard>

              <InfoCard title="Parent/Guardian Information" icon={Users}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 text-sm">Father's Details</h4>
                    <InfoField label="Name" value={student.fatherName} />
                    <InfoField label="Phone" value={student.fatherPhone} />
                    <InfoField label="Email" value={student.fatherEmail} />
                    <InfoField label="Occupation" value={student.fatherOccupation} />
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 text-sm">Mother's Details</h4>
                    <InfoField label="Name" value={student.motherName} />
                    <InfoField label="Phone" value={student.motherPhone} />
                    <InfoField label="Email" value={student.motherEmail} />
                    <InfoField label="Occupation" value={student.motherOccupation} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <InfoField label="Emergency Contact" value={student.emergencyContact} icon={Phone} />
                </div>
              </InfoCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Skills Radar */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Assessment</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={student.skillsAssessment}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280' }} />
                    <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <ActionButton icon={Send} label="Send Message" onClick={() => handleAction('message')} />
                  <ActionButton icon={Bell} label="Send Notification" onClick={() => alert('Send notification')} />
                  <ActionButton icon={DollarSign} label="Record Payment" onClick={() => handleAction('fees')} color="green" />
                  <ActionButton icon={FileText} label="Generate Report" onClick={() => handleAction('download')} />
                  <ActionButton icon={Edit} label="Update Profile" onClick={() => handleAction('edit')} />
                  <ActionButton icon={Ban} label="Suspend Student" onClick={() => handleAction('suspend')} color="red" />
                </div>
              </div>

              {/* Recent Achievements */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
                <div className="space-y-3">
                  {student.achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                      <Award className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{achievement.title}</p>
                        <p className="text-xs text-gray-600">{achievement.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACADEMIC PERFORMANCE TAB */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Current GPA</span>
                  <Target className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{student.currentGPA}</p>
                <p className="text-xs opacity-75 mt-1">Grade: {student.overallGrade}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Class Rank</span>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">#{student.rank}</p>
                <p className="text-xs opacity-75 mt-1">of {student.totalStudents} students</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Subjects</span>
                  <BookOpen className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{student.subjects.length}</p>
                <p className="text-xs opacity-75 mt-1">All passing</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Avg Score</span>
                  <BarChart3 className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{(student.subjects.reduce((acc, sub) => acc + sub.score, 0) / student.subjects.length).toFixed(1)}%</p>
                <p className="text-xs opacity-75 mt-1">Overall average</p>
              </div>
            </div>

            {/* Performance Trend Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={student.performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="exam" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="math" stroke="#3b82f6" strokeWidth={2} name="Math" />
                  <Line type="monotone" dataKey="physics" stroke="#8b5cf6" strokeWidth={2} name="Physics" />
                  <Line type="monotone" dataKey="chemistry" stroke="#10b981" strokeWidth={2} name="Chemistry" />
                  <Line type="monotone" dataKey="english" stroke="#f59e0b" strokeWidth={2} name="English" />
                  <Line type="monotone" dataKey="avg" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Average" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Subject Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject-wise Performance</h3>
              <div className="space-y-4">
                {student.subjects.map((subject) => (
                  <div key={subject.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{subject.name}</h4>
                        <p className="text-sm text-gray-600">{subject.teacher}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getGradeColor(subject.grade)}`}>{subject.grade}</div>
                        <div className="text-sm text-gray-600">{subject.score}%</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Attendance:</span>
                        <span className="ml-2 font-semibold">{subject.attendance}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Assignments:</span>
                        <span className="ml-2 font-semibold">{subject.completed}/{subject.assignments}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Completion:</span>
                        <span className="ml-2 font-semibold">{Math.round((subject.completed / subject.assignments) * 100)}%</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${subject.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Attendance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Overall Attendance</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{student.attendance}%</p>
                <p className="text-xs text-gray-500 mt-1">Excellent record</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Present Days</span>
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {student.attendanceData.reduce((sum, item) => sum + item.present, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Out of {student.attendanceData.reduce((sum, item) => sum + item.present + item.absent, 0)} days</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Absent Days</span>
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {student.attendanceData.reduce((sum, item) => sum + item.absent, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Very low</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Late Arrivals</span>
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {student.attendanceData.reduce((sum, item) => sum + item.late, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Needs improvement</p>
              </div>
            </div>

            {/* Attendance Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Attendance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={student.attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#10b981" name="Present" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                  <Bar dataKey="late" fill="#f59e0b" name="Late" />
                  <Bar dataKey="excused" fill="#6b7280" name="Excused" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Attendance Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Month</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Present</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Absent</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Late</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Excused</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.attendanceData.map((item, index) => {
                      const total = item.present + item.absent;
                      const percentage = ((item.present / total) * 100).toFixed(1);
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{item.month}</td>
                          <td className="py-3 px-4 text-center text-green-600 font-semibold">{item.present}</td>
                          <td className="py-3 px-4 text-center text-red-600 font-semibold">{item.absent}</td>
                          <td className="py-3 px-4 text-center text-yellow-600 font-semibold">{item.late}</td>
                          <td className="py-3 px-4 text-center text-gray-600 font-semibold">{item.excused}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              percentage >= 95 ? 'bg-green-100 text-green-700' :
                              percentage >= 85 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {percentage}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FEES TAB */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            {/* Fee Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Fees</span>
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">${student.totalFees.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Academic year 2023-24</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Paid Amount</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">${student.paidFees.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{((student.paidFees / student.totalFees) * 100).toFixed(0)}% paid</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Pending Amount</span>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600">${student.pendingFees.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Due by {student.nextDueDate}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Discount</span>
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-purple-600">${student.discountApplied.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Applied discount</p>
              </div>
            </div>

            {/* Fee Breakdown Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Paid', value: student.paidFees },
                        { name: 'Pending', value: student.pendingFees },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Plan</h3>
                <div className="space-y-4">
                  <InfoField label="Payment Plan" value={student.paymentPlan} />
                  <InfoField label="Next Due Date" value={student.nextDueDate} icon={Calendar} />
                  <InfoField label="Total Amount" value={`$${student.totalFees.toLocaleString()}`} />
                  <InfoField label="Amount Paid" value={`$${student.paidFees.toLocaleString()}`} />
                  <InfoField label="Balance Due" value={`$${student.pendingFees.toLocaleString()}`} />
                  <div className="pt-4">
                    <button
                      onClick={() => handleAction('fees')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 inline mr-2" />
                      Record Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Method</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Transaction ID</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.feeHistory.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{payment.date}</td>
                        <td className="py-3 px-4 font-semibold">${payment.amount.toLocaleString()}</td>
                        <td className="py-3 px-4">{payment.method}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{payment.transactionId}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {payment.receipt && (
                            <button className="text-blue-600 hover:text-blue-700">
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BEHAVIOR & DISCIPLINE TAB */}
        {activeTab === 'behavior' && (
          <div className="space-y-6">
            {/* Behavior Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Behavior Score</span>
                  <Shield className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{student.behaviorScore}</p>
                <p className="text-xs opacity-75 mt-1">{student.behaviour} conduct</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Disciplinary Records</span>
                  <FileText className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{student.disciplinaryRecords.length}</p>
                <p className="text-xs opacity-75 mt-1">Total incidents</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Status</span>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold">Clean Record</p>
                <p className="text-xs opacity-75 mt-1">No major violations</p>
              </div>
            </div>

            {/* Behavior Progress */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Behavior Assessment</h3>
              <div className="space-y-4">
                {[
                  { label: 'Classroom Conduct', score: 95 },
                  { label: 'Respect for Others', score: 98 },
                  { label: 'Following Rules', score: 92 },
                  { label: 'Cooperation', score: 94 },
                  { label: 'Responsibility', score: 96 },
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{item.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disciplinary Records */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Disciplinary Records</h3>
              {student.disciplinaryRecords.length > 0 ? (
                <div className="space-y-4">
                  {student.disciplinaryRecords.map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{record.type}</h4>
                          <p className="text-sm text-gray-600">{record.date}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          record.severity === 'Low' ? 'bg-yellow-100 text-yellow-700' :
                          record.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {record.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2"><strong>Reason:</strong> {record.reason}</p>
                      <p className="text-sm text-gray-700"><strong>Action Taken:</strong> {record.action}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No disciplinary records found</p>
                  <p className="text-sm mt-1">Excellent behavior history</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTIVITIES TAB */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            {/* Activities Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Total Activities</span>
                  <Award className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{student.activities.length}</p>
                <p className="text-xs opacity-75 mt-1">Currently enrolled</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Total Achievements</span>
                  <Trophy className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{student.achievements.length}</p>
                <p className="text-xs opacity-75 mt-1">Awards earned</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Points Earned</span>
                  <Zap className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">
                  {student.achievements.reduce((sum, a) => sum + a.points, 0)}
                </p>
                <p className="text-xs opacity-75 mt-1">Total points</p>
              </div>
            </div>

            {/* Current Activities */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Activities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.activities.map((activity) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{activity.name}</h4>
                        <p className="text-sm text-gray-600">{activity.role}</p>
                      </div>
                      <Award className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Since:</span>
                        <span className="ml-2 font-semibold">{activity.since}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Attendance:</span>
                        <span className="ml-2 font-semibold">{activity.attendance}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Achievements:</span>
                        <span className="ml-2 font-semibold">{activity.achievements} awards</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements & Awards</h3>
              <div className="space-y-4">
                {student.achievements.map((achievement) => (
                  <div key={achievement.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Award className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                          <p className="text-sm text-gray-600">{achievement.date}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {achievement.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{achievement.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-gray-600">Points Earned:</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        +{achievement.points}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MEDICAL TAB */}
        {activeTab === 'medical' && (
          <div className="space-y-6">
            {/* Medical Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-600" />
                  Basic Health Information
                </h3>
                <div className="space-y-3">
                  <InfoField label="Blood Group" value={student.bloodGroup} />
                  <InfoField label="Medical Conditions" value={student.medicalConditions} />
                  <InfoField label="Allergies" value={student.allergies} />
                  <InfoField label="Current Medications" value={student.medications} />
                  <InfoField label="Vaccination Status" value={student.vaccinations} />
                  <InfoField label="Last Checkup" value={student.lastCheckup} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Healthcare Provider
                </h3>
                <div className="space-y-3">
                  <InfoField label="Doctor's Name" value={student.doctorName} />
                  <InfoField label="Doctor's Phone" value={student.doctorPhone} icon={Phone} />
                  <div className="pt-4 space-y-2">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Upload className="w-4 h-4 inline mr-2" />
                      Upload Medical Records
                    </button>
                    <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                      <Eye className="w-4 h-4 inline mr-2" />
                      View Full Medical History
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Information */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Emergency Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Emergency Contact" value={student.emergencyContact} />
                <InfoField label="Guardian Name" value={student.guardianName} />
                <div className="col-span-2">
                  <p className="text-sm text-red-800">
                    <strong>Important:</strong> In case of medical emergency, contact {student.guardianName} at {student.emergencyContact}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload New</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{doc.name}</h4>
                        <p className="text-sm text-gray-600">{doc.type} • {doc.size}</p>
                      </div>
                    </div>
                    {doc.verified && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Uploaded: {doc.uploadDate}</span>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-700">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-700">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMMUNICATION TAB */}
        {activeTab === 'communication' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Communication Log</h3>
              <button
                onClick={() => handleAction('message')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>New Message</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="space-y-4">
                {student.communications.map((comm) => (
                  <div key={comm.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          comm.type === 'Email' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {comm.type === 'Email' ? (
                            <Mail className={`w-5 h-5 ${comm.type === 'Email' ? 'text-blue-600' : 'text-green-600'}`} />
                          ) : (
                            <MessageSquare className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{comm.subject}</h4>
                          <p className="text-sm text-gray-600">{comm.date} • {comm.from}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        comm.status === 'Read' ? 'bg-green-100 text-green-700' :
                        comm.status === 'Delivered' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {comm.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Action History</h3>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="space-y-4">
                {actionHistory.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <History className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.action}</h4>
                          <p className="text-sm text-gray-600">{item.details}</p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{item.date}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">By: {item.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <Modal title="Edit Student Profile" onClose={() => setShowEditModal(false)}>
          <p className="text-gray-600">Edit student profile form would go here...</p>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {showMessageModal && (
        <Modal title="Send Message" onClose={() => setShowMessageModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option>Student</option>
                <option>Parent</option>
                <option>Both</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="4"
                placeholder="Enter your message"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowMessageModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Send className="w-4 h-4 inline mr-2" />
                Send Message
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showFeeModal && (
        <Modal title="Record Payment" onClose={() => setShowFeeModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Credit Card</option>
                <option>Debit Card</option>
                <option>Check</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter transaction ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Additional notes (optional)"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowFeeModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <CreditCard className="w-4 h-4 inline mr-2" />
                Record Payment
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showSuspendModal && (
        <Modal title="Suspend Student" onClose={() => setShowSuspendModal(false)}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> Suspending a student will temporarily restrict their access to all school resources.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Suspension</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Enter reason for suspension"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                <Ban className="w-4 h-4 inline mr-2" />
                Confirm Suspension
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({ icon: Icon, label, value, subtext, color = 'white' }) => (
  <div className={`bg-white/20 backdrop-blur-sm rounded-xl p-4 ${color === 'yellow' ? 'border-2 border-yellow-300' : color === 'green' ? 'border-2 border-green-300' : ''}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm opacity-90">{label}</span>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-2xl font-bold">{value}</p>
    {subtext && <p className="text-xs opacity-75 mt-1">{subtext}</p>}
  </div>
);

const InfoCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      {Icon && <Icon className="w-5 h-5 mr-2 text-blue-600" />}
      {title}
    </h3>
    {children}
  </div>
);

const InfoField = ({ label, value, icon: Icon }) => (
  <div>
    <label className="text-xs text-gray-600 block mb-1">{label}</label>
    <div className="flex items-center space-x-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, onClick, color = 'blue' }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      color === 'red' ? 'bg-red-50 hover:bg-red-100 text-red-700' :
      color === 'green' ? 'bg-green-50 hover:bg-green-100 text-green-700' :
      'bg-blue-50 hover:bg-blue-100 text-blue-700'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </button>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);

const Trophy = Award; // Alias for consistency

const getGradeColor = (grade) => {
  if (grade.includes('A')) return 'text-green-600';
  if (grade.includes('B')) return 'text-blue-600';
  if (grade.includes('C')) return 'text-yellow-600';
  return 'text-red-600';
};

export default StudentDetails;