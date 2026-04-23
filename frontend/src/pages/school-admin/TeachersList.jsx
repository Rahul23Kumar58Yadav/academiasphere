// src/pages/school-admin/teachers/TeachersList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Eye, Edit, Trash2, RefreshCw,
  CheckCircle, Briefcase, DollarSign, FileText, Award, X,
  AlertCircle, BookOpen, Calendar, Clock,
} from 'lucide-react';

import api from '../../config/axios.config';
import AddTeacher from './AddTeacher';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: '#eff6ff', c: '#1e40af' }, { bg: '#f0fdf4', c: '#166534' },
  { bg: '#fdf4ff', c: '#6b21a8' }, { bg: '#fff7ed', c: '#9a3412' },
  { bg: '#f0f9ff', c: '#0c4a6e' }, { bg: '#fef9c3', c: '#713f12' },
];
const colorFor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];
const initials  = (t) => `${t.firstName?.[0] ?? ''}${t.lastName?.[0] ?? ''}`.toUpperCase();
const fmtDate   = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtSalary = (n) => Number(n || 0).toLocaleString('en-IN');

// ✅ FIX: read from nested salary object (matches Teacher schema)
const netSalary = (t) => fmtSalary(
  (t.salary?.basicSalary ?? 0) +
  (t.salary?.allowances  ?? 0) -
  (t.salary?.deductions  ?? 0)
);

const DOC_LABELS = [
  { key: 'resume',                    label: 'Resume / CV' },
  { key: 'idProof',                   label: 'ID proof' },
  { key: 'addressProof',              label: 'Address proof' },
  { key: 'qualificationCertificates', label: 'Qualification certificates' },
  { key: 'experienceCertificates',    label: 'Experience certificates' },
  { key: 'policeVerification',        label: 'Police verification' },
  { key: 'medicalCertificate',        label: 'Medical certificate' },
];

const DEPARTMENTS = [
  'Mathematics', 'Science', 'English', 'History', 'Computer Science',
  'Physical Education', 'Arts', 'Music', 'Languages', 'Social Studies',
];

// ═══════════════════════════════════════════════════════════════════════════════
const TeachersList = () => {
  const [teachers,        setTeachers]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [search,          setSearch]          = useState('');
  const [deptFilter,      setDeptFilter]      = useState('');
  const [typeFilter,      setTypeFilter]      = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [activeTab,       setActiveTab]       = useState('personal');
  const [showAddForm,     setShowAddForm]     = useState(false);
  const [editTeacher,     setEditTeacher]     = useState(null);
  const [stats,           setStats]           = useState({ total: 0, active: 0, departments: 0, fullTime: 0 });
  const [pagination,      setPagination]      = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchTeachers = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search)     params.set('search',         search);
      if (deptFilter) params.set('department',     deptFilter);
      if (typeFilter) params.set('employmentType', typeFilter);

      const { data } = await api.get(`/teachers?${params}`);

      const list = data.data ?? [];
      setTeachers(list);
      setPagination(data.pagination ?? { page: 1, totalPages: 1, total: list.length });

      // ✅ FIX: use server stats for total; derive others from list using correct nested paths
      setStats({
        total:       data.stats?.totalActive ?? list.length,
        active:      data.stats?.totalActive ?? list.length, // server already filters isActive:true
        departments: new Set(list.map(t => t.employment?.department).filter(Boolean)).size,
        fullTime:    list.filter(t => t.employment?.employmentType === 'Full-time').length,
      });
    } catch (err) {
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message ?? 'Failed to load teachers. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, typeFilter]);

  useEffect(() => { fetchTeachers(1); }, [fetchTeachers]);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this teacher?')) return;
    try {
      await api.delete(`/teachers/${id}`);
      setTeachers(prev => prev.filter(t => t._id !== id)); // remove from list
      if (selectedTeacher?._id === id) setSelectedTeacher(null);
      // Refresh stats
      fetchTeachers(pagination.page);
    } catch (err) {
      if (err.response?.status !== 401) {
        alert(err.response?.data?.message ?? 'Failed to deactivate teacher.');
      }
    }
  };

  const handleTeacherSaved = () => {
    setShowAddForm(false);
    setEditTeacher(null);
    fetchTeachers(1);
  };

  if (showAddForm || editTeacher) {
    return (
      <AddTeacher
        initialData={editTeacher ?? undefined}
        onClose={() => { setShowAddForm(false); setEditTeacher(null); }}
        onSubmit={handleTeacherSaved}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Teachers</h1>
            <p className="text-base text-gray-500 mt-0.5">Manage all teachers registered in your school</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-base">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total teachers', value: stats.total,       icon: Users },
            { label: 'Active',         value: stats.active,      icon: CheckCircle },
            { label: 'Departments',    value: stats.departments, icon: BookOpen },
            { label: 'Full-time',      value: stats.fullTime,    icon: Briefcase },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
              <Icon className="w-5 h-5 text-gray-400 mb-2" />
              <div className="text-3xl font-medium text-gray-900">{value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text" placeholder="Search by name, ID, department…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="text-base border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All departments</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-base border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All types</option>
            {['Full-time', 'Part-time', 'Contract', 'Temporary'].map(t => <option key={t}>{t}</option>)}
          </select>
          <button onClick={() => fetchTeachers(1)} className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-48" />)}
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-base">No teachers found. Add your first teacher to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher, idx) => (
              <TeacherCard
                key={teacher._id}
                teacher={teacher}
                colorIndex={idx}
                onView={() => { setSelectedTeacher(teacher); setActiveTab('personal'); }}
                onEdit={() => setEditTeacher(teacher)}
                onDeactivate={() => handleDeactivate(teacher._id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button key={i} onClick={() => fetchTeachers(i + 1)}
                className={`w-9 h-9 rounded-lg text-base font-medium transition-colors ${pagination.page === i + 1 ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedTeacher && (
        <TeacherProfileModal
          teacher={selectedTeacher}
          colorIndex={teachers.indexOf(selectedTeacher)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setSelectedTeacher(null)}
          onEdit={() => { setSelectedTeacher(null); setEditTeacher(selectedTeacher); }}
          onDeactivate={() => handleDeactivate(selectedTeacher._id)}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TeacherCard
// ═══════════════════════════════════════════════════════════════════════════════
const TeacherCard = ({ teacher: t, colorIndex, onView, onEdit, onDeactivate }) => {
  const col = colorFor(colorIndex);

  // ✅ FIX: all data paths now match the nested Teacher schema
  const dept        = t.employment?.department        ?? '—';
  const designation = t.employment?.designation       ?? '—';
  const joinDate    = t.employment?.joinDate;
  const empType     = t.employment?.employmentType    ?? '—';
  const experience  = t.qualifications?.teachingExperience ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="rounded-full flex items-center justify-center text-base font-medium flex-shrink-0 overflow-hidden"
          style={{ background: t.photo ? 'transparent' : col.bg, color: col.c, width: '3.25rem', height: '3.25rem' }}
        >
          {t.photo
            ? <img src={t.photo} alt={t.firstName} className="w-full h-full object-cover rounded-full" />
            : initials(t)
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-base truncate">{t.firstName} {t.lastName}</p>
          <p className="text-sm text-gray-400">{t.teacherId}</p>
        </div>
        <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${t.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {t.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <span className="inline-block text-sm px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium mb-2">
        {dept}
      </span>

      <div className="space-y-1.5 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 flex-shrink-0" /><span>{designation}</span></div>
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 flex-shrink-0" /><span>Joined {fmtDate(joinDate)}</span></div>
        <div className="flex items-center gap-2"><Clock className="w-4 h-4 flex-shrink-0" /><span>{experience} yrs experience</span></div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-sm text-gray-400">{empType}</span>
        <span className="text-base font-medium text-gray-900">₹{netSalary(t)}/yr</span>
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={onView} className="flex-1 flex items-center justify-center gap-1.5 text-sm border border-gray-200 rounded-lg py-2 text-gray-600 hover:bg-gray-50">
          <Eye className="w-4 h-4" /> View
        </button>
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 text-sm border border-blue-200 rounded-lg py-2 text-blue-600 hover:bg-blue-50">
          <Edit className="w-4 h-4" /> Edit
        </button>
        {t.isActive && (
          <button onClick={onDeactivate} className="flex items-center justify-center gap-1.5 text-sm border border-red-200 rounded-lg py-2 px-2 text-red-500 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Profile Modal
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { key: 'personal',   label: 'Personal info', icon: Users },
  { key: 'employment', label: 'Employment',     icon: Briefcase },
  { key: 'salary',     label: 'Salary',         icon: DollarSign },
  { key: 'documents',  label: 'Documents',      icon: FileText },
  { key: 'skills',     label: 'Skills & more',  icon: Award },
];

const TeacherProfileModal = ({ teacher: t, colorIndex, activeTab, setActiveTab, onClose, onEdit, onDeactivate }) => {
  const col = colorFor(colorIndex);
  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-start justify-center p-4 pt-10 z-50 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-gray-100 mb-10">

        {/* Modal header */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-100">
          {/* ✅ FIX: overflow-hidden + conditional style so photo fills avatar correctly */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium flex-shrink-0 overflow-hidden"
            style={t.photo ? {} : { background: col.bg, color: col.c }}
          >
            {t.photo
              ? <img src={t.photo} alt={t.firstName} className="w-full h-full object-cover" />
              : initials(t)
            }
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t.firstName} {t.lastName}</h2>
            <p className="text-base text-gray-400 mt-0.5">
              {t.employment?.designation} · {t.employment?.department} · {t.teacherId}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6 space-y-5">
          {activeTab === 'personal'   && <PersonalTab t={t} />}
          {activeTab === 'employment' && <EmploymentTab t={t} />}
          {activeTab === 'salary'     && <SalaryTab t={t} />}
          {activeTab === 'documents'  && <DocumentsTab t={t} />}
          {activeTab === 'skills'     && <SkillsTab t={t} />}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 p-6 border-t border-gray-100 justify-end">
          {t.isActive && (
            <button onClick={onDeactivate} className="text-sm border border-red-200 rounded-lg px-4 py-2 text-red-500 hover:bg-red-50">
              Deactivate
            </button>
          )}
          <button onClick={onClose} className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50">
            Close
          </button>
          <button onClick={onEdit} className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
            Edit teacher
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Tab panels ────────────────────────────────────────────────────────────────

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-base font-medium text-gray-900">{value || '—'}</span>
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{children}</p>
);

const PersonalTab = ({ t }) => (
  <>
    <SectionLabel>Basic details</SectionLabel>
    <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
      <InfoRow label="Full name"   value={`${t.firstName} ${t.middleName ?? ''} ${t.lastName}`.trim()} />
      <InfoRow label="Teacher ID"  value={t.teacherId} />
      <InfoRow label="Gender"      value={t.gender} />
      <InfoRow label="Blood group" value={t.bloodGroup} />
      <InfoRow label="Email"       value={t.email} />
      <InfoRow label="Phone"       value={t.phone} />
      {/* ✅ FIX: null-safe guard on t.address to prevent crash */}
      <InfoRow label="City / State" value={
        t.address
          ? [t.address.city, t.address.state].filter(Boolean).join(', ') || '—'
          : '—'
      } />
      <InfoRow label="Status" value={t.isActive ? 'Active' : 'Inactive'} />
    </div>
    <SectionLabel>Qualification</SectionLabel>
    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
      <InfoRow label="Highest qualification" value={t.qualifications?.highestQualification} />
      <InfoRow label="University"            value={t.qualifications?.university} />
      <InfoRow label="Specialization"        value={t.qualifications?.specialization} />
      <InfoRow label="Experience"            value={`${t.qualifications?.teachingExperience ?? 0} years`} />
    </div>
  </>
);

const EmploymentTab = ({ t }) => (
  <>
    <SectionLabel>Role</SectionLabel>
    <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
      <InfoRow label="Department"      value={t.employment?.department} />
      <InfoRow label="Designation"     value={t.employment?.designation} />
      <InfoRow label="Employment type" value={t.employment?.employmentType} />
      <InfoRow label="Join date"       value={fmtDate(t.employment?.joinDate)} />
      <InfoRow label="Working hrs/wk"  value={t.employment?.workingHours ? `${t.employment.workingHours} hrs` : '—'} />
      <InfoRow label="Probation"       value={t.employment?.probationPeriod ? `${t.employment.probationPeriod} months` : '—'} />
    </div>
    <SectionLabel>Subjects</SectionLabel>
    <div className="flex flex-wrap gap-2">
      {(t.employment?.subjects ?? []).length > 0
        ? (t.employment.subjects).map(s => (
            <span key={s} className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700">{s}</span>
          ))
        : <span className="text-base text-gray-400">No subjects assigned</span>
      }
    </div>
  </>
);

const SalaryTab = ({ t }) => {
  const basic  = t.salary?.basicSalary ?? 0;
  const allow  = t.salary?.allowances  ?? 0;
  const deduct = t.salary?.deductions  ?? 0;
  return (
    <>
      <SectionLabel>Salary breakdown</SectionLabel>
      <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4 mb-4">
        <div><p className="text-sm text-gray-400">Basic salary</p><p className="text-lg font-medium">₹{fmtSalary(basic)}</p></div>
        <div><p className="text-sm text-gray-400">Allowances</p><p className="text-lg font-medium text-green-600">+₹{fmtSalary(allow)}</p></div>
        <div><p className="text-sm text-gray-400">Deductions</p><p className="text-lg font-medium text-red-500">-₹{fmtSalary(deduct)}</p></div>
      </div>
      <div className="flex justify-between items-center bg-blue-50 rounded-xl p-4 mb-4">
        <span className="text-base text-blue-700">Net salary (annual)</span>
        <span className="text-2xl font-semibold text-blue-700">₹{fmtSalary(basic + allow - deduct)}</span>
      </div>
      <SectionLabel>Bank details</SectionLabel>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <InfoRow label="Payment mode"   value={t.salary?.paymentMode} />
        {/* ✅ FIX: bankDetails is nested inside salary */}
        <InfoRow label="Account number" value={t.salary?.bankDetails?.accountNumber} />
        <InfoRow label="Bank name"      value={t.salary?.bankDetails?.bankName} />
        <InfoRow label="IFSC code"      value={t.salary?.bankDetails?.ifscCode} />
      </div>
    </>
  );
};

const DocumentsTab = ({ t }) => (
  <>
    <SectionLabel>Uploaded documents</SectionLabel>
    {/* ✅ FIX: controller's getTeachers no longer strips documents,
        so t.documents will now be present */}
    {!t.documents ? (
      <p className="text-base text-gray-400">Document information not available.</p>
    ) : (
      <div className="space-y-2">
        {DOC_LABELS.map(({ key, label }) => {
          const url      = t.documents?.[key];
          const uploaded = !!url;
          return (
            <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
              <span className="text-base text-gray-700">{label}</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${uploaded ? 'text-green-600' : 'text-gray-400'}`}>
                  {uploaded ? 'Uploaded' : 'Missing'}
                </span>
                {uploaded && url.startsWith('http') && (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">
                    View
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </>
);

const SkillsTab = ({ t }) => (
  <>
    <SectionLabel>Skills</SectionLabel>
    <div className="flex flex-wrap gap-2 mb-5">
      {(t.additional?.skills ?? []).length > 0
        ? t.additional.skills.map(s => (
            <span key={s} className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700">{s}</span>
          ))
        : <span className="text-base text-gray-400">No skills listed</span>
      }
    </div>
    <SectionLabel>Languages</SectionLabel>
    <div className="flex flex-wrap gap-2 mb-5">
      {(t.additional?.languages ?? []).length > 0
        ? t.additional.languages.map(l => (
            <span key={l} className="text-sm px-3 py-1 rounded-full bg-green-50 text-green-700">{l}</span>
          ))
        : <span className="text-base text-gray-400">No languages listed</span>
      }
    </div>
    {t.additional?.achievements && (
      <>
        <SectionLabel>Achievements</SectionLabel>
        <p className="text-base text-gray-700 whitespace-pre-line">{t.additional.achievements}</p>
      </>
    )}
    {t.additional?.socialMedia && (
      Object.values(t.additional.socialMedia).some(Boolean) && (
        <>
          <SectionLabel>Social media</SectionLabel>
          <div className="space-y-1">
            {t.additional.socialMedia.linkedin && (
              <a href={t.additional.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 underline">LinkedIn</a>
            )}
            {t.additional.socialMedia.twitter && (
              <a href={t.additional.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 underline">Twitter</a>
            )}
            {t.additional.socialMedia.website && (
              <a href={t.additional.socialMedia.website} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 underline">Website</a>
            )}
          </div>
        </>
      )
    )}
  </>
);

export default TeachersList;