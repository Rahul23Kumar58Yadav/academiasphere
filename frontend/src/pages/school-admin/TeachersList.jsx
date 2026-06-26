// src/pages/school-admin/teachers/TeachersList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Eye, Edit, Trash2, RefreshCw,
  CheckCircle, Briefcase, DollarSign, FileText, Award, X,
  AlertCircle, BookOpen, Calendar, Clock, Mail, Phone,
  MapPin, GraduationCap, ChevronRight, Banknote, BadgeCheck,
  Link, Globe,
} from 'lucide-react';

import api from '../../config/axios.config';
import AddTeacher from './AddTeacher';

// ── Helpers ───────────────────────────────────────────────────────────────────
const PALETTE = [
  { bg: '#E8F4FD', ring: '#93C5FD', text: '#1E40AF' },
  { bg: '#ECFDF5', ring: '#6EE7B7', text: '#065F46' },
  { bg: '#F5F3FF', ring: '#C4B5FD', text: '#5B21B6' },
  { bg: '#FFF7ED', ring: '#FCD34D', text: '#92400E' },
  { bg: '#FDF2F8', ring: '#F9A8D4', text: '#9D174D' },
  { bg: '#F0FDF4', ring: '#86EFAC', text: '#166534' },
];
const colorFor  = (i) => PALETTE[i % PALETTE.length];
const initials  = (t) => `${t.firstName?.[0] ?? ''}${t.lastName?.[0] ?? ''}`.toUpperCase();
const fmtDate   = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtSalary = (n) => Number(n || 0).toLocaleString('en-IN');
const netSalary = (t) => fmtSalary(
  (t.salary?.basicSalary ?? 0) + (t.salary?.allowances ?? 0) - (t.salary?.deductions ?? 0)
);

const DOC_LABELS = [
  { key: 'resume',                    label: 'Resume / CV' },
  { key: 'idProof',                   label: 'ID Proof' },
  { key: 'addressProof',              label: 'Address Proof' },
  { key: 'qualificationCertificates', label: 'Qualification Certificates' },
  { key: 'experienceCertificates',    label: 'Experience Certificates' },
  { key: 'policeVerification',        label: 'Police Verification' },
  { key: 'medicalCertificate',        label: 'Medical Certificate' },
];

const DEPARTMENTS = [
  'Mathematics','Science','English','History','Computer Science',
  'Physical Education','Arts','Music','Languages','Social Studies',
];

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  .tl-wrap *  { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }

  .tl-wrap {
    background: #F4F6FB;
    min-height: 100vh;
    padding: 32px 28px;
  }

  /* ── Stats ── */
  .tl-stat {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #E8ECF4;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: box-shadow 0.2s;
  }
  .tl-stat:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
  .tl-stat-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
  .tl-stat-val  { font-size: 28px; font-weight: 700; color: #0F172A; letter-spacing: -0.5px; }
  .tl-stat-lbl  { font-size: 13px; color: #64748B; font-weight: 500; }

  /* ── Toolbar ── */
  .tl-toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .tl-search  {
    position: relative; flex: 1; min-width: 220px;
  }
  .tl-search input {
    width: 100%; padding: 10px 14px 10px 40px;
    border: 1.5px solid #E2E8F0; border-radius: 10px;
    background: #fff; color: #0F172A; font-size: 14px;
    outline: none; transition: border 0.15s, box-shadow 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .tl-search input:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .tl-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; }

  .tl-select {
    padding: 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 10px;
    background: #fff; color: #374151; font-size: 14px;
    font-family: 'DM Sans', sans-serif; outline: none; cursor: pointer;
    transition: border 0.15s;
  }
  .tl-select:focus { border-color: #6366F1; }

  .tl-btn-icon {
    width: 42px; height: 42px; border: 1.5px solid #E2E8F0; border-radius: 10px;
    background: #fff; color: #64748B; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s;
  }
  .tl-btn-icon:hover { border-color: #6366F1; color: #6366F1; }

  /* ── Cards ── */
  .tl-card {
    background: #fff;
    border-radius: 16px;
    border: 1.5px solid #E8ECF4;
    padding: 20px;
    display: flex; flex-direction: column; gap: 0;
    transition: box-shadow 0.2s, border-color 0.2s, transform 0.15s;
    cursor: default;
  }
  .tl-card:hover { box-shadow: 0 8px 32px rgba(15,23,42,0.09); border-color: #C7D2FE; transform: translateY(-1px); }

  .tl-avatar {
    width: 52px; height: 52px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; font-weight: 700; flex-shrink: 0; overflow: hidden;
    border: 2px solid transparent;
  }

  .tl-badge {
    display: inline-flex; align-items: center;
    font-size: 11px; font-weight: 600; padding: 3px 10px;
    border-radius: 20px; letter-spacing: 0.02em;
  }
  .tl-badge-active   { background: #DCFCE7; color: #166534; }
  .tl-badge-inactive { background: #FEE2E2; color: #991B1B; }
  .tl-badge-dept     { background: #EEF2FF; color: #4338CA; }
  .tl-badge-type     { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }

  .tl-divider { height: 1px; background: #F1F5F9; margin: 14px 0; }

  .tl-info-row { display: flex; align-items: center; gap: 8px; }
  .tl-info-row svg { color: #94A3B8; flex-shrink: 0; }
  .tl-info-row span { font-size: 13px; color: #475569; }

  .tl-action-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 0; border-radius: 8px; border: 1.5px solid;
    font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .tl-action-view { border-color: #E2E8F0; color: #475569; background: transparent; }
  .tl-action-view:hover { background: #F8FAFC; border-color: #CBD5E1; }
  .tl-action-edit { border-color: #C7D2FE; color: #4F46E5; background: #EEF2FF; }
  .tl-action-edit:hover { background: #E0E7FF; }
  .tl-action-del  { border-color: #FECACA; color: #DC2626; background: transparent; padding: 8px 10px; flex: unset; border-radius: 8px; }
  .tl-action-del:hover { background: #FEF2F2; }

  /* ── Modal ── */
  .tl-modal-bg {
    position: fixed; inset: 0; background: rgba(15,23,42,0.45);
    backdrop-filter: blur(3px); z-index: 50;
    display: flex; align-items: flex-start; justify-content: center;
    padding: 24px 16px; overflow-y: auto;
  }
  .tl-modal {
    background: #fff; border-radius: 20px;
    width: 100%; max-width: 680px;
    border: 1.5px solid #E8ECF4;
    box-shadow: 0 24px 64px rgba(15,23,42,0.18);
    margin: auto; overflow: hidden;
    animation: tl-slide-up 0.22s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes tl-slide-up {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .tl-modal-header {
    background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
    padding: 28px 28px 24px;
    position: relative;
  }

  .tl-modal-avatar {
    width: 72px; height: 72px; border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 700; overflow: hidden;
    border: 3px solid rgba(255,255,255,0.3);
    flex-shrink: 0;
  }

  .tl-tabs { display: flex; border-bottom: 1.5px solid #F1F5F9; padding: 0 4px; overflow-x: auto; }
  .tl-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 14px 16px; font-size: 13.5px; font-weight: 500;
    border-bottom: 2.5px solid transparent; white-space: nowrap;
    cursor: pointer; color: #64748B; background: none; border-left: none;
    border-right: none; border-top: none; transition: color 0.15s;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: -1.5px;
  }
  .tl-tab:hover { color: #4F46E5; }
  .tl-tab.active { color: #4F46E5; border-bottom-color: #6366F1; }

  /* ── Tab panel ── */
  .tl-tab-body { padding: 24px 28px 8px; }

  .tl-section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: #94A3B8; margin-bottom: 14px;
    display: flex; align-items: center; gap: 8px;
  }
  .tl-section-label::after { content: ''; flex: 1; height: 1px; background: #F1F5F9; }

  .tl-field { display: flex; flex-direction: column; gap: 3px; }
  .tl-field-lbl { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.07em; }
  .tl-field-val { font-size: 14.5px; font-weight: 500; color: #0F172A; }
  .tl-field-val.empty { color: #CBD5E1; font-style: italic; font-weight: 400; }

  .tl-pill { display: inline-flex; align-items: center; font-size: 12.5px; font-weight: 500; padding: 5px 12px; border-radius: 20px; }
  .tl-pill-blue  { background: #EEF2FF; color: #4338CA; }
  .tl-pill-green { background: #DCFCE7; color: #166534; }

  /* ── Salary card ── */
  .tl-sal-box { background: #F8FAFC; border: 1.5px solid #E8ECF4; border-radius: 12px; padding: 16px 20px; }
  .tl-sal-net { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); border-radius: 12px; padding: 16px 20px; }

  /* ── Doc row ── */
  .tl-doc-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; border-radius: 10px; border: 1.5px solid #F1F5F9;
    background: #FAFAFA; margin-bottom: 8px; transition: border-color 0.15s;
  }
  .tl-doc-row.uploaded { border-color: #BBF7D0; background: #F0FDF4; }

  /* ── Empty / loading ── */
  .tl-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 72px 24px; }
  .tl-shimmer { background: linear-gradient(90deg, #F1F5F9 25%, #E8ECF4 50%, #F1F5F9 75%); background-size: 400px 100%; animation: tl-shimmer 1.4s infinite; border-radius: 16px; border: none; }
  @keyframes tl-shimmer { from { background-position: -400px 0; } to { background-position: 400px 0; } }

  /* ── Add btn ── */
  .tl-add-btn {
    display: flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    color: #fff; padding: 10px 20px; border-radius: 11px;
    font-size: 14px; font-weight: 600; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: opacity 0.15s, transform 0.15s;
    box-shadow: 0 4px 14px rgba(99,102,241,0.35);
  }
  .tl-add-btn:hover { opacity: 0.92; transform: translateY(-1px); }

  /* ── Modal footer ── */
  .tl-modal-footer { display: flex; gap: 8px; justify-content: flex-end; padding: 16px 28px 20px; border-top: 1.5px solid #F1F5F9; }
  .tl-footer-btn {
    padding: 9px 18px; border-radius: 9px; font-size: 13.5px; font-weight: 600;
    cursor: pointer; border: 1.5px solid; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .tl-footer-deact { border-color: #FECACA; color: #DC2626; background: #FEF2F2; }
  .tl-footer-deact:hover { background: #FEE2E2; }
  .tl-footer-close { border-color: #E2E8F0; color: #475569; background: #fff; }
  .tl-footer-close:hover { background: #F8FAFC; }
  .tl-footer-edit  { border-color: transparent; color: #fff; background: linear-gradient(135deg, #6366F1, #8B5CF6); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
  .tl-footer-edit:hover { opacity: 0.9; }

  @media (max-width: 640px) {
    .tl-wrap { padding: 16px 12px; }
    .tl-modal { border-radius: 16px; }
  }
`;

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
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search)     params.set('search',         search);
      if (deptFilter) params.set('department',     deptFilter);
      if (typeFilter) params.set('employmentType', typeFilter);
      const { data } = await api.get(`/teachers?${params}`);
      const list = data.data ?? [];
      setTeachers(list);
      setPagination(data.pagination ?? { page: 1, totalPages: 1, total: list.length });
      setStats({
        total:       data.stats?.totalActive ?? list.length,
        active:      data.stats?.totalActive ?? list.length,
        departments: new Set(list.map(t => t.employment?.department).filter(Boolean)).size,
        fullTime:    list.filter(t => t.employment?.employmentType === 'Full-time').length,
      });
    } catch (err) {
      if (err.response?.status !== 401)
        setError(err.response?.data?.message ?? 'Failed to load teachers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, typeFilter]);

  useEffect(() => { fetchTeachers(1); }, [fetchTeachers]);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this teacher?')) return;
    try {
      await api.delete(`/teachers/${id}`);
      setTeachers(prev => prev.filter(t => t._id !== id));
      if (selectedTeacher?._id === id) setSelectedTeacher(null);
      fetchTeachers(pagination.page);
    } catch (err) {
      if (err.response?.status !== 401)
        alert(err.response?.data?.message ?? 'Failed to deactivate teacher.');
    }
  };

  const handleTeacherSaved = () => { setShowAddForm(false); setEditTeacher(null); fetchTeachers(1); };

  if (showAddForm || editTeacher) {
    return (
      <AddTeacher
        initialData={editTeacher ?? undefined}
        onClose={() => { setShowAddForm(false); setEditTeacher(null); }}
        onSubmit={handleTeacherSaved}
      />
    );
  }

  const STAT_CARDS = [
    { label: 'Total Teachers', value: stats.total,       icon: Users,        iconBg: '#EEF2FF', iconColor: '#6366F1' },
    { label: 'Active',         value: stats.active,      icon: CheckCircle,  iconBg: '#DCFCE7', iconColor: '#16A34A' },
    { label: 'Departments',    value: stats.departments, icon: BookOpen,     iconBg: '#FFF7ED', iconColor: '#EA580C' },
    { label: 'Full-time',      value: stats.fullTime,    icon: Briefcase,    iconBg: '#F5F3FF', iconColor: '#7C3AED' },
  ];

  return (
    <div className="tl-wrap">
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.5px' }}>Teachers</h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 2 }}>Manage all teachers registered in your school</p>
        </div>
        <button className="tl-add-btn" onClick={() => setShowAddForm(true)}>
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 22 }}>
        {STAT_CARDS.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="tl-stat">
            <div className="tl-stat-icon" style={{ background: iconBg }}>
              <Icon size={18} color={iconColor} />
            </div>
            <div className="tl-stat-val">{value}</div>
            <div className="tl-stat-lbl">{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="tl-toolbar" style={{ marginBottom: 20 }}>
        <div className="tl-search">
          <Search size={15} />
          <input placeholder="Search by name, ID, department…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="tl-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="tl-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {['Full-time', 'Part-time', 'Contract', 'Temporary'].map(t => <option key={t}>{t}</option>)}
        </select>
        <button className="tl-btn-icon" onClick={() => fetchTeachers(1)} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="tl-shimmer" style={{ height: 260 }} />)}
        </div>
      ) : teachers.length === 0 ? (
        <div className="tl-empty" style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E8ECF4' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Users size={28} color="#6366F1" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>No teachers found</p>
          <p style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center' }}>Try adjusting your filters or add your first teacher.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {teachers.map((teacher, idx) => (
            <TeacherCard
              key={teacher._id} teacher={teacher} colorIndex={idx}
              onView={() => { setSelectedTeacher(teacher); setActiveTab('personal'); }}
              onEdit={() => setEditTeacher(teacher)}
              onDeactivate={() => handleDeactivate(teacher._id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28 }}>
          {[...Array(pagination.totalPages)].map((_, i) => (
            <button key={i} onClick={() => fetchTeachers(i + 1)} style={{
              width: 36, height: 36, borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              border: pagination.page === i + 1 ? 'none' : '1.5px solid #E2E8F0',
              background: pagination.page === i + 1 ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#fff',
              color: pagination.page === i + 1 ? '#fff' : '#475569',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {selectedTeacher && (
        <TeacherProfileModal
          teacher={selectedTeacher}
          colorIndex={teachers.indexOf(selectedTeacher)}
          activeTab={activeTab} setActiveTab={setActiveTab}
          onClose={() => setSelectedTeacher(null)}
          onEdit={() => { setSelectedTeacher(null); setEditTeacher(selectedTeacher); }}
          onDeactivate={() => handleDeactivate(selectedTeacher._id)}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
const TeacherCard = ({ teacher: t, colorIndex, onView, onEdit, onDeactivate }) => {
  const col = colorFor(colorIndex);
  const dept        = t.employment?.department     ?? '—';
  const designation = t.employment?.designation    ?? '—';
  const joinDate    = t.employment?.joinDate;
  const empType     = t.employment?.employmentType ?? '—';
  const experience  = t.qualifications?.teachingExperience ?? 0;

  return (
    <div className="tl-card">
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div className="tl-avatar" style={{ background: t.photo ? 'transparent' : col.bg, color: col.text, border: `2.5px solid ${col.ring}` }}>
          {t.photo ? <img src={t.photo} alt={t.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(t)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{t.firstName} {t.lastName}</span>
            <span className={`tl-badge ${t.isActive ? 'tl-badge-active' : 'tl-badge-inactive'}`}>
              {t.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>{t.teacherId}</p>
          <p style={{ fontSize: 13, color: '#475569', marginTop: 3, fontWeight: 500 }}>{designation}</p>
        </div>
      </div>

      {/* Dept badge */}
      <div style={{ marginBottom: 14 }}>
        <span className="tl-badge tl-badge-dept">{dept}</span>
      </div>

      {/* Info rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <div className="tl-info-row">
          <Calendar size={13} />
          <span>Joined {fmtDate(joinDate)}</span>
        </div>
        <div className="tl-info-row">
          <GraduationCap size={13} />
          <span>{experience} yr{experience !== 1 ? 's' : ''} experience</span>
        </div>
        <div className="tl-info-row">
          <Mail size={13} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{t.email || '—'}</span>
        </div>
      </div>

      <div className="tl-divider" />

      {/* Salary + type */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="tl-badge tl-badge-type">{empType}</span>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Salary</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>₹{netSalary(t)}<span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>/yr</span></p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="tl-action-btn tl-action-view" onClick={onView}><Eye size={14} /> View</button>
        <button className="tl-action-btn tl-action-edit" onClick={onEdit}><Edit size={14} /> Edit</button>
        {t.isActive && (
          <button className="tl-action-del" onClick={onDeactivate}><Trash2 size={14} /></button>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { key: 'personal',   label: 'Personal',   icon: Users },
  { key: 'employment', label: 'Employment', icon: Briefcase },
  { key: 'salary',     label: 'Salary',     icon: DollarSign },
  { key: 'documents',  label: 'Documents',  icon: FileText },
  { key: 'skills',     label: 'Skills',     icon: Award },
];

const TeacherProfileModal = ({ teacher: t, colorIndex, activeTab, setActiveTab, onClose, onEdit, onDeactivate }) => {
  const col = colorFor(colorIndex);
  return (
    <div className="tl-modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tl-modal">

        {/* Gradient header */}
        <div className="tl-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="tl-modal-avatar" style={t.photo ? {} : { background: col.bg, color: col.text }}>
              {t.photo ? <img src={t.photo} alt={t.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(t)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{t.firstName} {t.lastName}</h2>
                <span className={`tl-badge ${t.isActive ? 'tl-badge-active' : 'tl-badge-inactive'}`}>{t.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                {t.employment?.designation || '—'} · {t.employment?.department || '—'}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3, fontFamily: 'DM Mono, monospace' }}>{t.teacherId}</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 9, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>

          {/* Quick contact chips */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            {t.email && (
              <a href={`mailto:${t.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 12px', fontSize: 12.5, color: '#fff', textDecoration: 'none' }}>
                <Mail size={12} /> {t.email}
              </a>
            )}
            {t.phone && (
              <a href={`tel:${t.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 12px', fontSize: 12.5, color: '#fff', textDecoration: 'none' }}>
                <Phone size={12} /> {t.phone}
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tl-tabs">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`tl-tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="tl-tab-body">
          {activeTab === 'personal'   && <PersonalTab t={t} />}
          {activeTab === 'employment' && <EmploymentTab t={t} />}
          {activeTab === 'salary'     && <SalaryTab t={t} />}
          {activeTab === 'documents'  && <DocumentsTab t={t} />}
          {activeTab === 'skills'     && <SkillsTab t={t} />}
        </div>

        {/* Footer */}
        <div className="tl-modal-footer">
          {t.isActive && <button className="tl-footer-btn tl-footer-deact" onClick={onDeactivate}>Deactivate</button>}
          <button className="tl-footer-btn tl-footer-close" onClick={onClose}>Close</button>
          <button className="tl-footer-btn tl-footer-edit"  onClick={onEdit}>Edit Teacher</button>
        </div>
      </div>
    </div>
  );
};

// ── Shared primitives ─────────────────────────────────────────────────────────
const SL = ({ children }) => <p className="tl-section-label">{children}</p>;

const Field = ({ label, value }) => (
  <div className="tl-field">
    <span className="tl-field-lbl">{label}</span>
    <span className={`tl-field-val ${!value || value === '—' ? 'empty' : ''}`}>{value || '—'}</span>
  </div>
);

const Grid = ({ children, cols = 2 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '18px 32px', marginBottom: 24 }}>
    {children}
  </div>
);

// ── Tab panels ────────────────────────────────────────────────────────────────
const PersonalTab = ({ t }) => (
  <>
    <SL>Basic Details</SL>
    <Grid>
      <Field label="Full Name"    value={`${t.firstName} ${t.middleName ?? ''} ${t.lastName}`.trim()} />
      <Field label="Teacher ID"   value={t.teacherId} />
      <Field label="Gender"       value={t.gender} />
      <Field label="Blood Group"  value={t.bloodGroup} />
      <Field label="Email"        value={t.email} />
      <Field label="Phone"        value={t.phone} />
      <Field label="City / State" value={t.address ? [t.address.city, t.address.state].filter(Boolean).join(', ') || '—' : '—'} />
      <Field label="Status"       value={t.isActive ? 'Active' : 'Inactive'} />
    </Grid>
    <SL>Qualifications</SL>
    <Grid>
      <Field label="Highest Qualification" value={t.qualifications?.highestQualification} />
      <Field label="University"            value={t.qualifications?.university} />
      <Field label="Specialization"        value={t.qualifications?.specialization} />
      <Field label="Teaching Experience"   value={`${t.qualifications?.teachingExperience ?? 0} years`} />
    </Grid>
  </>
);

const EmploymentTab = ({ t }) => (
  <>
    <SL>Role & Contract</SL>
    <Grid>
      <Field label="Department"       value={t.employment?.department} />
      <Field label="Designation"      value={t.employment?.designation} />
      <Field label="Employment Type"  value={t.employment?.employmentType} />
      <Field label="Join Date"        value={fmtDate(t.employment?.joinDate)} />
      <Field label="Working Hrs/Week" value={t.employment?.workingHours ? `${t.employment.workingHours} hrs` : '—'} />
      <Field label="Probation Period" value={t.employment?.probationPeriod ? `${t.employment.probationPeriod} months` : '—'} />
    </Grid>
    <SL>Subjects Assigned</SL>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
      {(t.employment?.subjects ?? []).length > 0
        ? t.employment.subjects.map(s => <span key={s} className="tl-pill tl-pill-blue">{s}</span>)
        : <span style={{ fontSize: 14, color: '#CBD5E1', fontStyle: 'italic' }}>No subjects assigned</span>
      }
    </div>
  </>
);

const SalaryTab = ({ t }) => {
  const basic  = t.salary?.basicSalary ?? 0;
  const allow  = t.salary?.allowances  ?? 0;
  const deduct = t.salary?.deductions  ?? 0;
  const net    = basic + allow - deduct;
  return (
    <>
      <SL>Salary Breakdown</SL>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'Basic Salary', val: basic,  color: '#0F172A', prefix: '' },
          { label: 'Allowances',   val: allow,  color: '#16A34A', prefix: '+' },
          { label: 'Deductions',   val: deduct, color: '#DC2626', prefix: '-' },
        ].map(({ label, val, color, prefix }) => (
          <div key={label} className="tl-sal-box">
            <p style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 19, fontWeight: 700, color }}>{prefix}₹{fmtSalary(val)}</p>
          </div>
        ))}
      </div>
      <div className="tl-sal-net" style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Net Annual Salary</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>₹{fmtSalary(net)}</p>
      </div>
      <SL>Bank Details</SL>
      <Grid>
        <Field label="Payment Mode"    value={t.salary?.paymentMode} />
        <Field label="Account Number"  value={t.salary?.bankDetails?.accountNumber} />
        <Field label="Bank Name"       value={t.salary?.bankDetails?.bankName} />
        <Field label="IFSC Code"       value={t.salary?.bankDetails?.ifscCode} />
      </Grid>
    </>
  );
};

const DocumentsTab = ({ t }) => (
  <>
    <SL>Uploaded Documents</SL>
    {!t.documents ? (
      <p style={{ fontSize: 14, color: '#CBD5E1', fontStyle: 'italic' }}>Document information not available.</p>
    ) : (
      <div style={{ marginBottom: 16 }}>
        {DOC_LABELS.map(({ key, label }) => {
          const url = t.documents?.[key];
          const ok  = !!url;
          return (
            <div key={key} className={`tl-doc-row ${ok ? 'uploaded' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: ok ? '#DCFCE7' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={14} color={ok ? '#16A34A' : '#94A3B8'} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>{label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: ok ? '#16A34A' : '#CBD5E1' }}>
                  {ok ? '✓ Uploaded' : 'Missing'}
                </span>
                {ok && url.startsWith('http') && (
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12.5, fontWeight: 600, color: '#6366F1', textDecoration: 'none', padding: '3px 10px', background: '#EEF2FF', borderRadius: 6 }}>
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
    <SL>Skills</SL>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
      {(t.additional?.skills ?? []).length > 0
        ? t.additional.skills.map(s => <span key={s} className="tl-pill tl-pill-blue">{s}</span>)
        : <span style={{ fontSize: 14, color: '#CBD5E1', fontStyle: 'italic' }}>No skills listed</span>
      }
    </div>
    <SL>Languages</SL>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
      {(t.additional?.languages ?? []).length > 0
        ? t.additional.languages.map(l => <span key={l} className="tl-pill tl-pill-green">{l}</span>)
        : <span style={{ fontSize: 14, color: '#CBD5E1', fontStyle: 'italic' }}>No languages listed</span>
      }
    </div>
    {t.additional?.achievements && (
      <>
        <SL>Achievements</SL>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 24 }}>{t.additional.achievements}</p>
      </>
    )}
    {t.additional?.socialMedia && Object.values(t.additional.socialMedia).some(Boolean) && (
      <>
        <SL>Social Media</SL>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {t.additional.socialMedia.linkedin && (
            <a href={t.additional.socialMedia.linkedin} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: '#0A66C2', textDecoration: 'none', fontWeight: 500 }}>
              <Link size={14} /> LinkedIn
            </a>
          )}
          {t.additional.socialMedia.twitter && (
            <a href={t.additional.socialMedia.twitter} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: '#1DA1F2', textDecoration: 'none', fontWeight: 500 }}>
              <Link size={14} /> Twitter / X
            </a>
          )}
          {t.additional.socialMedia.website && (
            <a href={t.additional.socialMedia.website} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: '#6366F1', textDecoration: 'none', fontWeight: 500 }}>
              <Globe size={14} /> Website
            </a>
          )}
        </div>
      </>
    )}
  </>
);

export default TeachersList;