import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  User, 
  MapPin, 
  Download, 
  Bell,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const MyTimetable = () => {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [viewMode, setViewMode] = useState('weekly'); // weekly or daily
  const [loading, setLoading] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Mock timetable data
  const timetable = {
    Monday: [
      { time: '08:00-08:45', subject: 'Mathematics', teacher: 'Ms. Priya Sharma', room: '201', type: 'Theory', status: 'completed' },
      { time: '08:45-09:30', subject: 'Science', teacher: 'Mr. Amit Verma', room: '305', type: 'Theory', status: 'completed' },
      { time: '09:30-10:15', subject: 'English', teacher: 'Mrs. Sarah Gupta', room: '102', type: 'Theory', status: 'ongoing' },
      { time: '10:15-10:30', subject: 'Break', teacher: '-', room: 'Cafeteria', type: 'Break', status: 'upcoming' },
      { time: '10:30-11:15', subject: 'Hindi', teacher: 'Mr. Rajesh Singh', room: '103', type: 'Theory', status: 'upcoming' },
      { time: '11:15-12:00', subject: 'Social Studies', teacher: 'Ms. Kavya Reddy', room: '204', type: 'Theory', status: 'upcoming' },
      { time: '12:00-12:45', subject: 'Computer Science', teacher: 'Mr. Vikram Patel', room: 'Lab-2', type: 'Practical', status: 'upcoming' }
    ],
    Tuesday: [
      { time: '08:00-08:45', subject: 'Science', teacher: 'Mr. Amit Verma', room: '305', type: 'Lab', status: 'upcoming' },
      { time: '08:45-09:30', subject: 'Mathematics', teacher: 'Ms. Priya Sharma', room: '201', type: 'Theory', status: 'upcoming' },
      { time: '09:30-10:15', subject: 'Physical Education', teacher: 'Coach Kumar', room: 'Ground', type: 'Practical', status: 'upcoming' },
      { time: '10:15-10:30', subject: 'Break', teacher: '-', room: 'Cafeteria', type: 'Break', status: 'upcoming' },
      { time: '10:30-11:15', subject: 'English', teacher: 'Mrs. Sarah Gupta', room: '102', type: 'Theory', status: 'upcoming' },
      { time: '11:15-12:00', subject: 'Hindi', teacher: 'Mr. Rajesh Singh', room: '103', type: 'Theory', status: 'upcoming' },
      { time: '12:00-12:45', subject: 'Art & Craft', teacher: 'Ms. Anjali Iyer', room: 'Art Room', type: 'Practical', status: 'upcoming' }
    ],
    Wednesday: [
      { time: '08:00-08:45', subject: 'Mathematics', teacher: 'Ms. Priya Sharma', room: '201', type: 'Theory', status: 'upcoming' },
      { time: '08:45-09:30', subject: 'English', teacher: 'Mrs. Sarah Gupta', room: '102', type: 'Theory', status: 'upcoming' },
      { time: '09:30-10:15', subject: 'Science', teacher: 'Mr. Amit Verma', room: '305', type: 'Theory', status: 'upcoming' },
      { time: '10:15-10:30', subject: 'Break', teacher: '-', room: 'Cafeteria', type: 'Break', status: 'upcoming' },
      { time: '10:30-11:15', subject: 'Social Studies', teacher: 'Ms. Kavya Reddy', room: '204', type: 'Theory', status: 'upcoming' },
      { time: '11:15-12:00', subject: 'Hindi', teacher: 'Mr. Rajesh Singh', room: '103', type: 'Theory', status: 'upcoming' },
      { time: '12:00-12:45', subject: 'Music', teacher: 'Mr. Ravi Shankar', room: 'Music Room', type: 'Practical', status: 'upcoming' }
    ],
    Thursday: [
      { time: '08:00-08:45', subject: 'Hindi', teacher: 'Mr. Rajesh Singh', room: '103', type: 'Theory', status: 'upcoming' },
      { time: '08:45-09:30', subject: 'Mathematics', teacher: 'Ms. Priya Sharma', room: '201', type: 'Theory', status: 'upcoming' },
      { time: '09:30-10:15', subject: 'Computer Science', teacher: 'Mr. Vikram Patel', room: 'Lab-2', type: 'Lab', status: 'upcoming' },
      { time: '10:15-10:30', subject: 'Break', teacher: '-', room: 'Cafeteria', type: 'Break', status: 'upcoming' },
      { time: '10:30-11:15', subject: 'English', teacher: 'Mrs. Sarah Gupta', room: '102', type: 'Theory', status: 'upcoming' },
      { time: '11:15-12:00', subject: 'Science', teacher: 'Mr. Amit Verma', room: '305', type: 'Theory', status: 'upcoming' },
      { time: '12:00-12:45', subject: 'Social Studies', teacher: 'Ms. Kavya Reddy', room: '204', type: 'Theory', status: 'upcoming' }
    ],
    Friday: [
      { time: '08:00-08:45', subject: 'English', teacher: 'Mrs. Sarah Gupta', room: '102', type: 'Theory', status: 'upcoming' },
      { time: '08:45-09:30', subject: 'Science', teacher: 'Mr. Amit Verma', room: '305', type: 'Lab', status: 'upcoming' },
      { time: '09:30-10:15', subject: 'Mathematics', teacher: 'Ms. Priya Sharma', room: '201', type: 'Theory', status: 'upcoming' },
      { time: '10:15-10:30', subject: 'Break', teacher: '-', room: 'Cafeteria', type: 'Break', status: 'upcoming' },
      { time: '10:30-11:15', subject: 'Hindi', teacher: 'Mr. Rajesh Singh', room: '103', type: 'Theory', status: 'upcoming' },
      { time: '11:15-12:00', subject: 'Physical Education', teacher: 'Coach Kumar', room: 'Ground', type: 'Practical', status: 'upcoming' },
      { time: '12:00-12:45', subject: 'Library', teacher: 'Ms. Meera', room: 'Library', type: 'Activity', status: 'upcoming' }
    ],
    Saturday: [
      { time: '08:00-08:45', subject: 'Social Studies', teacher: 'Ms. Kavya Reddy', room: '204', type: 'Theory', status: 'upcoming' },
      { time: '08:45-09:30', subject: 'Mathematics', teacher: 'Ms. Priya Sharma', room: '201', type: 'Theory', status: 'upcoming' },
      { time: '09:30-10:15', subject: 'English', teacher: 'Mrs. Sarah Gupta', room: '102', type: 'Theory', status: 'upcoming' },
      { time: '10:15-10:30', subject: 'Break', teacher: '-', room: 'Cafeteria', type: 'Break', status: 'upcoming' },
      { time: '10:30-11:15', subject: 'Science', teacher: 'Mr. Amit Verma', room: '305', type: 'Theory', status: 'upcoming' },
      { time: '11:15-12:00', subject: 'Activity Club', teacher: 'Various', room: 'Activity Hall', type: 'Activity', status: 'upcoming' }
    ]
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'Mathematics': 'from-blue-500 to-blue-600',
      'Science': 'from-green-500 to-green-600',
      'English': 'from-purple-500 to-purple-600',
      'Hindi': 'from-yellow-500 to-yellow-600',
      'Social Studies': 'from-pink-500 to-pink-600',
      'Computer Science': 'from-indigo-500 to-indigo-600',
      'Physical Education': 'from-orange-500 to-orange-600',
      'Break': 'from-gray-400 to-gray-500',
      'Art & Craft': 'from-red-500 to-red-600',
      'Music': 'from-teal-500 to-teal-600',
      'Library': 'from-cyan-500 to-cyan-600',
      'Activity Club': 'from-emerald-500 to-emerald-600'
    };
    return colors[subject] || 'from-gray-500 to-gray-600';
  };

  const getTypeIcon = (type) => {
    if (type === 'Theory') return '📚';
    if (type === 'Lab' || type === 'Practical') return '🔬';
    if (type === 'Break') return '☕';
    if (type === 'Activity') return '🎨';
    return '📖';
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      ongoing: 'bg-blue-100 text-blue-800 border-blue-200',
      upcoming: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.upcoming;
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle size={16} className="text-green-600" />;
    if (status === 'ongoing') return <PlayCircle size={16} className="text-blue-600" />;
    return <Clock size={16} className="text-gray-600" />;
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Timetable refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    toast.success('Downloading timetable...');
  };

  const getCurrentClass = () => {
    const todaySchedule = timetable[selectedDay] || [];
    return todaySchedule.find(period => {
      const [start, end] = period.time.split('-');
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      return currentTimeInMinutes >= startTime && currentTimeInMinutes < endTime;
    });
  };

  const currentClass = getCurrentClass();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Timetable</h1>
            <p className="text-gray-600 mt-1">View your weekly class schedule</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Download size={18} />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Current Class Alert */}
      {currentClass && currentClass.subject !== 'Break' && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-xl flex items-center justify-center text-2xl">
              🎯
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold mb-1 opacity-90">Current Class</h3>
              <h2 className="text-2xl font-bold mb-2">{currentClass.subject}</h2>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <User size={16} /> {currentClass.teacher}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={16} /> Room {currentClass.room}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={16} /> {currentClass.time}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-2">
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
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

      {/* Timetable Grid */}
      <div className="space-y-3">
        {timetable[selectedDay].map((period, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-all ${
              period.subject === 'Break'
                ? 'border-gray-200 bg-gray-50'
                : 'border-gray-100'
            }`}
          >
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Left Section */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Time Badge */}
                  <div className="flex flex-col items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
                    <Clock size={20} className="text-gray-600 mb-1" />
                    <div className="text-center">
                      <p className="text-xs text-gray-600 font-medium">Time</p>
                      <p className="text-sm font-bold text-gray-900">{period.time.split('-')[0]}</p>
                      <p className="text-xs text-gray-500">{period.time.split('-')[1]}</p>
                    </div>
                  </div>

                  {/* Subject Card */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`w-16 h-16 bg-gradient-to-br ${getSubjectColor(period.subject)} rounded-xl flex items-center justify-center text-3xl shadow-md`}>
                        {getTypeIcon(period.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{period.subject}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          {period.teacher !== '-' && (
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              {period.teacher}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {period.room}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            period.type === 'Theory' ? 'bg-blue-100 text-blue-700' :
                            period.type === 'Lab' || period.type === 'Practical' ? 'bg-green-100 text-green-700' :
                            period.type === 'Break' ? 'bg-gray-100 text-gray-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {period.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section - Status */}
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold border-2 ${getStatusColor(period.status)}`}>
                    {getStatusIcon(period.status)}
                    {period.status.charAt(0).toUpperCase() + period.status.slice(1)}
                  </span>
                  {period.subject !== 'Break' && (
                    <button className="text-sm text-indigo-600 font-semibold hover:underline">
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Time</th>
                {days.map(day => (
                  <th key={day} className="text-center p-3 text-sm font-semibold text-gray-700">{day.substring(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4, 5, 6].map(index => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium text-gray-600">
                    {timetable['Monday'][index]?.time.split('-')[0] || '-'}
                  </td>
                  {days.map(day => {
                    const period = timetable[day][index];
                    return (
                      <td key={day} className="p-2">
                        {period ? (
                          <div className={`text-center p-2 rounded-lg ${
                            period.subject === 'Break'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 cursor-pointer'
                          }`}>
                            <p className="text-xs font-semibold truncate">{period.subject}</p>
                            <p className="text-xs text-gray-600 truncate">{period.room}</p>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 text-xs">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subject Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Subject Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from(new Set(Object.values(timetable).flat().map(p => p.subject)))
            .filter(subject => subject !== 'Break')
            .map(subject => {
              const count = Object.values(timetable)
                .flat()
                .filter(p => p.subject === subject).length;
              return (
                <div key={subject} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getSubjectColor(subject)} rounded-lg flex items-center justify-center text-2xl mb-3 shadow-md`}>
                    {getTypeIcon(timetable['Monday'].find(p => p.subject === subject)?.type || 'Theory')}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{subject}</h3>
                  <p className="text-xs text-gray-600">{count} periods/week</p>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default MyTimetable;