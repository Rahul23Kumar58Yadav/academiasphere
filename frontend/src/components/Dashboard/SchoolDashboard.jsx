import React, { useState } from 'react';

const SchoolAdminDashboard = () => {
  const [stats] = useState({
    totalStudents: 1248,
    totalTeachers: 87,
    totalClasses: 42,
    attendanceRate: 94.5,
    feeCollection: {
      collected: 2850000,
      pending: 450000,
      total: 3300000
    }
  });

  const [recentActivities] = useState([
    {
      id: '1',
      type: 'enrollment',
      message: 'New student enrolled in Grade 10-A',
      timestamp: '2 hours ago',
      user: 'Admin User'
    },
    {
      id: '2',
      type: 'payment',
      message: 'Fee payment received - ₹25,000',
      timestamp: '3 hours ago',
      user: 'Parent: Rajesh Kumar'
    },
    {
      id: '3',
      type: 'attendance',
      message: 'Attendance marked for Grade 8-B',
      timestamp: '5 hours ago',
      user: 'Teacher: Priya Sharma'
    },
    {
      id: '4',
      type: 'result',
      message: 'Mid-term results published for Grade 12',
      timestamp: '1 day ago',
      user: 'Admin User'
    }
  ]);

  const [upcomingEvents] = useState([
    { id: '1', title: 'Final Exams - Grade 10', date: '2025-12-28', type: 'exam' },
    { id: '2', title: 'Winter Break', date: '2025-12-25', type: 'holiday' },
    { id: '3', title: 'Parent-Teacher Meeting', date: '2025-12-22', type: 'meeting' },
    { id: '4', title: 'Annual Sports Day', date: '2026-01-05', type: 'event' }
  ]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (type) => {
    const icons = {
      enrollment: '👤',
      payment: '💳',
      attendance: '✓',
      result: '📊'
    };
    return icons[type] || '•';
  };

  const getEventIcon = (type) => {
    const icons = {
      exam: '📝',
      holiday: '🎉',
      meeting: '👥',
      event: '🎪'
    };
    return icons[type] || '📅';
  };

  const getActivityBgColor = (type) => {
    const colors = {
      enrollment: 'bg-blue-100',
      payment: 'bg-yellow-100',
      attendance: 'bg-green-100',
      result: 'bg-indigo-100'
    };
    return colors[type] || 'bg-gray-100';
  };

  const getEventBgColor = (type) => {
    const colors = {
      exam: 'bg-red-100',
      holiday: 'bg-yellow-100',
      meeting: 'bg-blue-100',
      event: 'bg-pink-100'
    };
    return colors[type] || 'bg-gray-100';
  };

  const getEventBadgeColor = (type) => {
    const colors = {
      exam: 'bg-red-100 text-red-800',
      holiday: 'bg-yellow-100 text-yellow-800',
      meeting: 'bg-blue-100 text-blue-800',
      event: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const collectionPercentage = (stats.feeCollection.collected / stats.feeCollection.total) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 border border-gray-200 rounded-lg font-semibold text-sm hover:bg-gray-50 hover:border-indigo-600 transition-all">
            <span>📊</span> Generate Report
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 hover:shadow-lg transition-all">
            <span>➕</span> Quick Actions
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            👨‍🎓
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600">Total Students</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents.toLocaleString()}</p>
            <span className="text-xs text-green-600 font-medium">+12 this month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex gap-4">
          <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            👨‍🏫
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600">Total Teachers</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalTeachers}</p>
            <span className="text-xs text-gray-600 font-medium">Active staff</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex gap-4">
          <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            🏫
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600">Total Classes</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalClasses}</p>
            <span className="text-xs text-gray-600 font-medium">Across all grades</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex gap-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            ✓
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600">Attendance Rate</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.attendanceRate}%</p>
            <span className="text-xs text-green-600 font-medium">+2.3% from last month</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Fee Collection Overview</h2>
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm cursor-pointer bg-white">
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="space-y-6">
            <div className="flex gap-8">
              <div>
                <span className="text-xs text-gray-600 font-medium block mb-1">Total Fees</span>
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(stats.feeCollection.total)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-600 font-medium block mb-1">Collected</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(stats.feeCollection.collected)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-600 font-medium block mb-1">Pending</span>
                <span className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.feeCollection.pending)}</span>
              </div>
            </div>
            <div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                  style={{ width: `${collectionPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 text-right mt-2">
                {collectionPercentage.toFixed(1)}% collected
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Activities</h2>
            <button className="text-sm text-indigo-600 font-semibold hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {recentActivities.map(activity => (
              <div key={activity.id} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 ${getActivityBgColor(activity.type)} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <div className="flex gap-3 text-xs text-gray-600 mt-1">
                    <span>{activity.user}</span>
                    <span>•</span>
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
            <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
              + Add Event
            </button>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <div key={event.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-600 hover:shadow-sm transition-all">
                <div className={`w-10 h-10 ${getEventBgColor(event.type)} rounded-lg flex items-center justify-center text-xl flex-shrink-0`}>
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(event.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getEventBadgeColor(event.type)}`}>
                  {event.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Quick Links</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-white hover:border-indigo-600 hover:shadow-sm transition-all">
              <span className="text-2xl">📝</span>
              <span>Student Enrollment</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-white hover:border-indigo-600 hover:shadow-sm transition-all">
              <span className="text-2xl">📊</span>
              <span>Attendance</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-white hover:border-indigo-600 hover:shadow-sm transition-all">
              <span className="text-2xl">💰</span>
              <span>Fee Management</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-white hover:border-indigo-600 hover:shadow-sm transition-all">
              <span className="text-2xl">📚</span>
              <span>Curriculum</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-white hover:border-indigo-600 hover:shadow-sm transition-all">
              <span className="text-2xl">🎓</span>
              <span>Results</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-white hover:border-indigo-600 hover:shadow-sm transition-all">
              <span className="text-2xl">👥</span>
              <span>Staff Management</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolAdminDashboard;