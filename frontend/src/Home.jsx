// src/pages/Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Users, Star, ArrowRight, ChevronDown,
  BookOpen, BarChart2, Shield, Zap, Award, Globe,
  CheckCircle, X, Mail, Lock, Eye, EyeOff, User,
  Phone, School, Building2, GraduationCap, TrendingUp,
  Calendar, Bell, FileText, Menu, ChevronRight, Sparkles,
  Play, Plus, ChevronUp
} from 'lucide-react';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_SCHOOLS = [
  { id: 1, name: 'Delhi Public School', city: 'New Delhi', state: 'Delhi', type: 'CBSE', students: 4200, rating: 4.8, established: 1949, image: 'DPS', color: '#1a56db', fee: '₹85,000/yr', tags: ['CBSE', 'Co-ed', 'Day School'] },
  { id: 2, name: 'Ryan International', city: 'Mumbai', state: 'Maharashtra', type: 'ICSE', students: 3100, rating: 4.6, established: 1976, image: 'RI', color: '#0e9f6e', fee: '₹72,000/yr', tags: ['ICSE', 'Co-ed', 'Day School'] },
  { id: 3, name: 'The Doon School', city: 'Dehradun', state: 'Uttarakhand', type: 'CBSE', students: 510, rating: 4.9, established: 1935, image: 'DS', color: '#7e3af2', fee: '₹14,50,000/yr', tags: ['CBSE', 'Boys', 'Boarding'] },
  { id: 4, name: 'Kendriya Vidyalaya', city: 'Bengaluru', state: 'Karnataka', type: 'CBSE', students: 2800, rating: 4.5, established: 1963, image: 'KV', color: '#e3a008', fee: '₹12,000/yr', tags: ['CBSE', 'Co-ed', 'Day School'] },
  { id: 5, name: 'La Martiniere', city: 'Kolkata', state: 'West Bengal', type: 'ISC', students: 1200, rating: 4.7, established: 1836, image: 'LM', color: '#e02424', fee: '₹95,000/yr', tags: ['ISC', 'Boys', 'Day School'] },
  { id: 6, name: 'Sunbeam School', city: 'Varanasi', state: 'Uttar Pradesh', type: 'CBSE', students: 1900, rating: 4.4, established: 1974, image: 'SS', color: '#ff5a1f', fee: '₹48,000/yr', tags: ['CBSE', 'Co-ed', 'Day School'] },
];

const STATS = [
  { label: 'Schools Registered', value: '1,240+', icon: Building2, color: '#1a56db' },
  { label: 'Active Students', value: '4.8M+', icon: GraduationCap, color: '#0e9f6e' },
  { label: 'Teachers Onboard', value: '92,000+', icon: Users, color: '#7e3af2' },
  { label: 'Cities Covered', value: '340+', icon: Globe, color: '#e3a008' },
];

const FEATURES = [
  { icon: BarChart2, title: 'AI-Powered Analytics', desc: 'Real-time insights on attendance, performance, and learning gaps with predictive intelligence.', color: '#1a56db' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade encryption, role-based access, and full audit trails for every action.', color: '#7e3af2' },
  { icon: Zap, title: 'Instant Notifications', desc: 'Parents, teachers, and students stay connected via SMS, email, and in-app alerts.', color: '#e3a008' },
  { icon: FileText, title: 'Digital Records', desc: 'Paperless result sheets, certificates, and fee receipts generated in seconds.', color: '#0e9f6e' },
  { icon: Calendar, title: 'Smart Timetabling', desc: 'AI-generated schedules that avoid conflicts and optimize teacher workloads.', color: '#e02424' },
  { icon: Award, title: 'Accreditation Ready', desc: 'Built-in compliance reports for CBSE, ICSE, and State board requirements.', color: '#ff5a1f' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Principal, DPS Noida', text: 'EduSphere cut our administrative workload by 60%. The AI insights are genuinely transformative.', avatar: 'PS', color: '#1a56db' },
  { name: 'Rajiv Menon', role: 'Parent, Mumbai', text: 'I can track my daughter\'s progress, pay fees, and message teachers — all from one app.', avatar: 'RM', color: '#0e9f6e' },
  { name: 'Ananya Iyer', role: 'Teacher, Bengaluru', text: 'Lesson planning and attendance used to take hours. Now it takes minutes. Life-changing.', avatar: 'AI', color: '#7e3af2' },
];

// ─── Animated Counter ─────────────────────────────────────────────────────────
const useCountUp = (target, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const numeric = parseInt(target.replace(/[^0-9]/g, ''));
    const step = numeric / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= numeric) { setCount(numeric); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [start, target, duration]);
  return count;
};

// ─── Auth Modal ───────────────────────────────────────────────────────────────
const AuthModal = ({ school, onClose, onSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'student' });
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onClose();
    navigate('/login');
  };

  return (
    <div className="edusphere-modal-overlay" onClick={onClose}>
      <div className="edusphere-modal" onClick={e => e.stopPropagation()}>
        {/* School badge */}
        {school && (
          <div className="edusphere-modal-school-badge" style={{ '--badge-color': school.color }}>
            <div className="badge-avatar">{school.image}</div>
            <div>
              <p className="badge-name">{school.name}</p>
              <p className="badge-loc"><MapPin size={12} /> {school.city}, {school.state}</p>
            </div>
          </div>
        )}

        <button className="edusphere-modal-close" onClick={onClose}><X size={20} /></button>

        {/* Tabs */}
        <div className="edusphere-modal-tabs">
          <button className={`modal-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
          <button className={`modal-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Register</button>
        </div>

        <h2 className="modal-title">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="modal-subtitle">{mode === 'login' ? 'Sign in to access your school portal' : 'Join your school on EduSphere'}</p>

        <form onSubmit={handleSubmit} className="modal-form">
          {mode === 'register' && (
            <>
              <div className="modal-input-wrap">
                <User size={16} className="modal-input-icon" />
                <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="modal-input-wrap">
                <Phone size={16} className="modal-input-icon" />
                <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
              </div>
              <div className="modal-role-select">
                {['student', 'teacher', 'parent'].map(r => (
                  <button key={r} type="button" className={`role-chip ${form.role === r ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, role: r }))}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="modal-input-wrap">
            <Mail size={16} className="modal-input-icon" />
            <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} required />
          </div>
          <div className="modal-input-wrap">
            <Lock size={16} className="modal-input-icon" />
            <input name="password" type={showPw ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={handleChange} required />
            <button type="button" className="modal-pw-toggle" onClick={() => setShowPw(p => !p)}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {mode === 'login' && (
            <div className="modal-forgot"><Link to="/forgot-password" onClick={onClose}>Forgot password?</Link></div>
          )}
          <button type="submit" className="modal-submit" disabled={loading}>
            {loading ? <span className="modal-spinner" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="modal-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

// ─── School Registration Modal ────────────────────────────────────────────────
const SchoolRegModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ schoolName: '', city: '', state: '', type: 'CBSE', adminName: '', adminEmail: '', adminPhone: '', website: '' });
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    onClose();
    navigate('/login');
  };

  return (
    <div className="edusphere-modal-overlay" onClick={onClose}>
      <div className="edusphere-modal edusphere-modal--wide" onClick={e => e.stopPropagation()}>
        <button className="edusphere-modal-close" onClick={onClose}><X size={20} /></button>

        <div className="reg-header">
          <div className="reg-icon"><Building2 size={28} /></div>
          <h2 className="modal-title">Register Your School</h2>
          <p className="modal-subtitle">Join 1,240+ schools already on EduSphere</p>
        </div>

        {/* Step indicator */}
        <div className="reg-steps">
          {['School Info', 'Admin Details'].map((s, i) => (
            <div key={s} className={`reg-step ${step > i ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
              <div className="step-circle">{step > i + 1 ? <CheckCircle size={16} /> : i + 1}</div>
              <span>{s}</span>
              {i < 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {step === 1 ? (
            <>
              <div className="modal-input-wrap">
                <Building2 size={16} className="modal-input-icon" />
                <input name="schoolName" placeholder="School Name" value={form.schoolName} onChange={handleChange} required />
              </div>
              <div className="modal-row">
                <div className="modal-input-wrap">
                  <MapPin size={16} className="modal-input-icon" />
                  <input name="city" placeholder="City" value={form.city} onChange={handleChange} required />
                </div>
                <div className="modal-input-wrap">
                  <MapPin size={16} className="modal-input-icon" />
                  <input name="state" placeholder="State" value={form.state} onChange={handleChange} required />
                </div>
              </div>
              <div className="modal-select-wrap">
                <select name="type" value={form.type} onChange={handleChange}>
                  {['CBSE', 'ICSE', 'ISC', 'State Board', 'IB', 'IGCSE'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="modal-input-wrap">
                <Globe size={16} className="modal-input-icon" />
                <input name="website" placeholder="School Website (optional)" value={form.website} onChange={handleChange} />
              </div>
            </>
          ) : (
            <>
              <div className="modal-input-wrap">
                <User size={16} className="modal-input-icon" />
                <input name="adminName" placeholder="Administrator Name" value={form.adminName} onChange={handleChange} required />
              </div>
              <div className="modal-input-wrap">
                <Mail size={16} className="modal-input-icon" />
                <input name="adminEmail" type="email" placeholder="Admin Email" value={form.adminEmail} onChange={handleChange} required />
              </div>
              <div className="modal-input-wrap">
                <Phone size={16} className="modal-input-icon" />
                <input name="adminPhone" placeholder="Admin Phone" value={form.adminPhone} onChange={handleChange} required />
              </div>
              <div className="reg-terms">
                <input type="checkbox" id="terms" required />
                <label htmlFor="terms">I agree to the <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a> and <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a></label>
              </div>
            </>
          )}
          <div className="modal-row modal-row--btns">
            {step === 2 && <button type="button" className="modal-back" onClick={() => setStep(1)}>Back</button>}
            <button type="submit" className="modal-submit" disabled={loading} style={{ flex: 1 }}>
              {loading ? <span className="modal-spinner" /> : step === 1 ? 'Continue' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── School Card ──────────────────────────────────────────────────────────────
const SchoolCard = ({ school, onClick }) => (
  <div className="school-card" onClick={() => onClick(school)}>
    <div className="school-card-header" style={{ '--card-color': school.color }}>
      <div className="school-card-avatar">{school.image}</div>
      <div className="school-card-rating"><Star size={12} fill="#f59e0b" stroke="none" /> {school.rating}</div>
    </div>
    <div className="school-card-body">
      <h3>{school.name}</h3>
      <p className="school-card-loc"><MapPin size={13} /> {school.city}, {school.state}</p>
      <div className="school-card-tags">
        {school.tags.map(t => <span key={t} className="tag">{t}</span>)}
      </div>
      <div className="school-card-meta">
        <span><Users size={13} /> {school.students.toLocaleString()} students</span>
        <span><Calendar size={13} /> Est. {school.established}</span>
      </div>
      <div className="school-card-footer">
        <span className="school-card-fee">{school.fee}</span>
        <button className="school-card-btn">View School <ChevronRight size={14} /></button>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Home = () => {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState(MOCK_SCHOOLS);
  const [authModal, setAuthModal] = useState(null);
  const [regModal, setRegModal] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeFilter, setActiveFilter] = useState('All');
  const statsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const lower = query.toLowerCase();
    let results = MOCK_SCHOOLS.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      s.city.toLowerCase().includes(lower) ||
      s.state.toLowerCase().includes(lower) ||
      s.type.toLowerCase().includes(lower)
    );
    if (activeFilter !== 'All') results = results.filter(s => s.type === activeFilter || s.tags.includes(activeFilter));
    setFiltered(results);
  }, [query, activeFilter]);

  const FILTERS = ['All', 'CBSE', 'ICSE', 'ISC', 'Boarding'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy: #0a0f2e;
          --navy-80: rgba(10,15,46,0.8);
          --indigo: #1a56db;
          --indigo-light: #3b82f6;
          --gold: #f59e0b;
          --emerald: #10b981;
          --surface: #f8faff;
          --card-bg: #ffffff;
          --border: rgba(26,86,219,0.12);
          --text-primary: #0a0f2e;
          --text-muted: #64748b;
          --shadow-sm: 0 2px 8px rgba(10,15,46,0.08);
          --shadow-md: 0 8px 32px rgba(10,15,46,0.12);
          --shadow-lg: 0 20px 60px rgba(10,15,46,0.18);
          --radius: 16px;
          --font: 'Sora', sans-serif;
        }

        .es-home { font-family: var(--font); background: var(--surface); color: var(--text-primary); overflow-x: hidden; }

        /* ── NAVBAR ── */
        .es-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          padding: 0 5%; height: 72px;
          display: flex; align-items: center; justify-content: space-between;
          transition: all 0.3s ease;
        }
        .es-nav.scrolled {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }
        .es-nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .es-nav-logo-icon {
          width: 40px; height: 40px; background: var(--indigo);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          color: white;
        }
        .es-nav-logo-text { font-size: 1.25rem; font-weight: 800; color: var(--navy); letter-spacing: -0.5px; }
        .es-nav-logo-text span { color: var(--indigo); }
        .es-nav-links { display: flex; align-items: center; gap: 8px; }
        .es-nav-links a {
          padding: 8px 16px; border-radius: 8px; font-size: 0.875rem; font-weight: 500;
          color: var(--text-muted); text-decoration: none; transition: all 0.2s;
        }
        .es-nav-links a:hover { color: var(--indigo); background: rgba(26,86,219,0.06); }
        .es-nav-actions { display: flex; align-items: center; gap: 10px; }
        .btn-ghost {
          padding: 9px 20px; border-radius: 10px; font-size: 0.875rem; font-weight: 600;
          color: var(--indigo); border: 1.5px solid var(--indigo); background: transparent;
          cursor: pointer; transition: all 0.2s; font-family: var(--font);
          text-decoration: none; display: inline-flex; align-items: center;
        }
        .btn-ghost:hover { background: rgba(26,86,219,0.06); }
        .btn-primary {
          padding: 9px 20px; border-radius: 10px; font-size: 0.875rem; font-weight: 600;
          color: white; background: var(--indigo); border: none; cursor: pointer;
          transition: all 0.2s; font-family: var(--font); text-decoration: none;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-primary:hover { background: #1447c0; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(26,86,219,0.35); }

        /* ── HERO ── */
        .es-hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 100px 5% 60px;
          background: linear-gradient(135deg, #0a0f2e 0%, #0f1a4a 40%, #1a2060 100%);
          position: relative; overflow: hidden;
        }
        .es-hero::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(26,86,219,0.25) 0%, transparent 70%),
                      radial-gradient(ellipse 40% 40% at 80% 80%, rgba(245,158,11,0.1) 0%, transparent 60%);
        }
        .es-hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .es-hero-content { position: relative; z-index: 1; text-align: center; max-width: 780px; }
        .es-hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 18px; border-radius: 100px;
          background: rgba(26,86,219,0.2); border: 1px solid rgba(26,86,219,0.4);
          color: #93c5fd; font-size: 0.8rem; font-weight: 600; margin-bottom: 28px;
          animation: fadeSlideDown 0.6s ease both;
        }
        .badge-dot { width: 6px; height: 6px; background: #60a5fa; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes fadeSlideDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        .es-hero h1 {
          font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 800; color: white;
          line-height: 1.1; letter-spacing: -2px; margin-bottom: 24px;
          animation: fadeSlideUp 0.7s 0.1s ease both;
        }
        .es-hero h1 em { font-style: normal; color: var(--gold); font-family: 'Lora', serif; }
        .es-hero-sub {
          font-size: 1.1rem; color: rgba(255,255,255,0.65); line-height: 1.7;
          margin-bottom: 48px; animation: fadeSlideUp 0.7s 0.2s ease both;
        }

        .es-search-box {
          background: white; border-radius: 16px; padding: 8px 8px 8px 20px;
          display: flex; align-items: center; gap: 12px; max-width: 640px;
          margin: 0 auto 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: fadeSlideUp 0.7s 0.3s ease both;
          border: 1.5px solid rgba(26,86,219,0.15);
        }
        .es-search-box input {
          flex: 1; border: none; outline: none; font-size: 1rem;
          font-family: var(--font); color: var(--text-primary);
          background: transparent;
        }
        .es-search-box input::placeholder { color: #94a3b8; }
        .es-search-btn {
          padding: 12px 24px; background: var(--indigo); color: white; border: none;
          border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer;
          display: flex; align-items: center; gap: 8px; font-family: var(--font);
          transition: all 0.2s; white-space: nowrap;
        }
        .es-search-btn:hover { background: #1447c0; }
        .es-hero-quick {
          display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;
          animation: fadeSlideUp 0.7s 0.4s ease both;
        }
        .quick-chip {
          padding: 6px 16px; border-radius: 100px; background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.75);
          font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
          font-family: var(--font);
        }
        .quick-chip:hover { background: rgba(255,255,255,0.18); color: white; }
        .es-hero-scroll {
          position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          color: rgba(255,255,255,0.4); font-size: 0.75rem; animation: fadeIn 1s 1s ease both;
        }
        .scroll-arrow { animation: bounce 2s infinite; }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }

        /* ── STATS ── */
        .es-stats {
          padding: 60px 5%; background: white;
          border-bottom: 1px solid var(--border);
        }
        .es-stats-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
        .stat-item { text-align: center; padding: 32px 24px; position: relative; }
        .stat-item:not(:last-child)::after {
          content: ''; position: absolute; right: 0; top: 25%; bottom: 25%;
          width: 1px; background: var(--border);
        }
        .stat-icon {
          width: 52px; height: 52px; border-radius: 14px; margin: 0 auto 16px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 1.2rem;
        }
        .stat-value { font-size: 2.5rem; font-weight: 800; letter-spacing: -1px; line-height: 1; margin-bottom: 8px; }
        .stat-label { font-size: 0.875rem; color: var(--text-muted); font-weight: 500; }

        /* ── SCHOOLS SECTION ── */
        .es-schools { padding: 80px 5%; max-width: 1280px; margin: 0 auto; }
        .section-label {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 0.8rem; font-weight: 700; color: var(--indigo);
          text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px;
        }
        .section-label::before { content: ''; width: 20px; height: 2px; background: var(--indigo); }
        .section-title {
          font-size: clamp(1.8rem, 3.5vw, 2.8rem); font-weight: 800;
          color: var(--navy); letter-spacing: -1px; line-height: 1.2; margin-bottom: 12px;
        }
        .section-sub { color: var(--text-muted); font-size: 1.05rem; line-height: 1.6; max-width: 540px; }
        .es-schools-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 40px; flex-wrap: wrap; gap: 24px; }
        .es-filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 40px; }
        .filter-btn {
          padding: 8px 18px; border-radius: 100px; font-size: 0.85rem; font-weight: 600;
          border: 1.5px solid var(--border); background: white; color: var(--text-muted);
          cursor: pointer; transition: all 0.2s; font-family: var(--font);
        }
        .filter-btn.active { background: var(--indigo); border-color: var(--indigo); color: white; }
        .filter-btn:hover:not(.active) { border-color: var(--indigo); color: var(--indigo); }
        .es-schools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
        .es-schools-empty {
          grid-column: 1/-1; text-align: center; padding: 80px 20px;
          color: var(--text-muted);
        }
        .es-schools-empty-icon { font-size: 3rem; margin-bottom: 16px; }

        /* ── SCHOOL CARD ── */
        .school-card {
          background: white; border-radius: var(--radius); overflow: hidden;
          border: 1px solid var(--border); cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: var(--shadow-sm);
        }
        .school-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); border-color: rgba(26,86,219,0.2); }
        .school-card-header {
          height: 80px; background: var(--card-color, #1a56db);
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, var(--card-color), color-mix(in srgb, var(--card-color) 70%, black));
        }
        .school-card-header::before {
          content: ''; position: absolute; top: -30%; right: -10%;
          width: 120px; height: 120px; border-radius: 50%;
          background: rgba(255,255,255,0.1);
        }
        .school-card-avatar {
          position: absolute; bottom: -20px; left: 20px;
          width: 56px; height: 56px; border-radius: 14px;
          background: white; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; font-weight: 800; color: var(--card-color, #1a56db);
        }
        .school-card-rating {
          position: absolute; top: 12px; right: 12px;
          background: rgba(255,255,255,0.9); border-radius: 100px;
          padding: 4px 10px; font-size: 0.8rem; font-weight: 700;
          display: flex; align-items: center; gap: 4px; color: #92400e;
        }
        .school-card-body { padding: 32px 20px 20px; }
        .school-card-body h3 { font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; }
        .school-card-loc {
          display: flex; align-items: center; gap: 4px;
          font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;
        }
        .school-card-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
        .tag {
          padding: 3px 10px; border-radius: 100px; font-size: 0.72rem; font-weight: 600;
          background: rgba(26,86,219,0.08); color: var(--indigo); border: 1px solid rgba(26,86,219,0.15);
        }
        .school-card-meta {
          display: flex; gap: 16px; font-size: 0.78rem; color: var(--text-muted);
          margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
        }
        .school-card-meta span { display: flex; align-items: center; gap: 5px; }
        .school-card-footer { display: flex; align-items: center; justify-content: space-between; }
        .school-card-fee { font-size: 0.85rem; font-weight: 700; color: var(--emerald); }
        .school-card-btn {
          display: flex; align-items: center; gap: 4px;
          font-size: 0.8rem; font-weight: 600; color: var(--indigo);
          background: rgba(26,86,219,0.08); border: none; border-radius: 8px;
          padding: 7px 14px; cursor: pointer; transition: all 0.2s; font-family: var(--font);
        }
        .school-card-btn:hover { background: var(--indigo); color: white; }

        /* ── FEATURES ── */
        .es-features { padding: 100px 5%; background: var(--navy); position: relative; overflow: hidden; }
        .es-features::before {
          content: ''; position: absolute; top: -50%; left: 50%; transform: translateX(-50%);
          width: 800px; height: 600px;
          background: radial-gradient(ellipse, rgba(26,86,219,0.15) 0%, transparent 70%);
        }
        .es-features-inner { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }
        .es-features-header { text-align: center; margin-bottom: 64px; }
        .es-features-header .section-title { color: white; }
        .es-features-header .section-sub { color: rgba(255,255,255,0.55); max-width: 520px; margin: 0 auto; }
        .es-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .feature-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: var(--radius); padding: 32px; transition: all 0.3s;
        }
        .feature-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.15); transform: translateY(-4px); }
        .feature-icon {
          width: 52px; height: 52px; border-radius: 14px; margin-bottom: 20px;
          display: flex; align-items: center; justify-content: center; color: white;
        }
        .feature-card h3 { font-size: 1.05rem; font-weight: 700; color: white; margin-bottom: 10px; }
        .feature-card p { font-size: 0.88rem; color: rgba(255,255,255,0.55); line-height: 1.65; }

        /* ── TESTIMONIALS ── */
        .es-testimonials { padding: 100px 5%; background: white; }
        .es-testimonials-inner { max-width: 1100px; margin: 0 auto; }
        .es-testimonials-header { text-align: center; margin-bottom: 64px; }
        .es-testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .testimonial-card {
          background: var(--surface); border-radius: var(--radius); padding: 32px;
          border: 1px solid var(--border); position: relative;
          transition: all 0.3s;
        }
        .testimonial-card:hover { box-shadow: var(--shadow-md); transform: translateY(-4px); }
        .testimonial-card::before {
          content: '"'; position: absolute; top: 16px; right: 24px;
          font-size: 5rem; color: rgba(26,86,219,0.08); font-family: 'Lora', serif;
          line-height: 1;
        }
        .testimonial-text { font-size: 0.95rem; color: var(--text-primary); line-height: 1.7; margin-bottom: 24px; font-style: italic; font-family: 'Lora', serif; }
        .testimonial-author { display: flex; align-items: center; gap: 12px; }
        .testimonial-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem; color: white; flex-shrink: 0;
        }
        .testimonial-name { font-size: 0.9rem; font-weight: 700; }
        .testimonial-role { font-size: 0.78rem; color: var(--text-muted); }

        /* ── SCHOOL REGISTRATION CTA ── */
        .es-register-cta { padding: 100px 5%; background: var(--surface); }
        .es-register-cta-inner {
          max-width: 1100px; margin: 0 auto;
          background: linear-gradient(135deg, var(--navy) 0%, #1a2a6c 100%);
          border-radius: 24px; padding: 64px; position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: space-between; gap: 40px;
        }
        .es-register-cta-inner::before {
          content: ''; position: absolute; right: -80px; top: -80px;
          width: 360px; height: 360px; border-radius: 50%;
          background: rgba(26,86,219,0.2);
        }
        .es-register-cta-inner::after {
          content: ''; position: absolute; right: 60px; bottom: -60px;
          width: 200px; height: 200px; border-radius: 50%;
          background: rgba(245,158,11,0.12);
        }
        .cta-content { position: relative; z-index: 1; }
        .cta-content h2 { font-size: 2.2rem; font-weight: 800; color: white; letter-spacing: -1px; margin-bottom: 12px; }
        .cta-content p { color: rgba(255,255,255,0.65); font-size: 1rem; line-height: 1.65; max-width: 480px; margin-bottom: 28px; }
        .cta-checks { display: flex; flex-direction: column; gap: 10px; margin-bottom: 32px; }
        .cta-check { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.8); font-size: 0.9rem; }
        .cta-btns { display: flex; gap: 12px; flex-wrap: wrap; position: relative; z-index: 1; }
        .btn-gold {
          padding: 14px 28px; border-radius: 12px; font-size: 0.95rem; font-weight: 700;
          color: var(--navy); background: var(--gold); border: none; cursor: pointer;
          transition: all 0.2s; font-family: var(--font); display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-gold:hover { background: #d97706; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(245,158,11,0.4); }
        .btn-outline-white {
          padding: 14px 28px; border-radius: 12px; font-size: 0.95rem; font-weight: 600;
          color: white; background: transparent; border: 1.5px solid rgba(255,255,255,0.3);
          cursor: pointer; transition: all 0.2s; font-family: var(--font);
          display: inline-flex; align-items: center; gap: 8px; text-decoration: none;
        }
        .btn-outline-white:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.5); }

        /* ── FOOTER ── */
        .es-footer { background: var(--navy); padding: 64px 5% 32px; }
        .es-footer-inner { max-width: 1200px; margin: 0 auto; }
        .es-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
        .footer-brand p { font-size: 0.88rem; color: rgba(255,255,255,0.45); line-height: 1.7; margin-top: 16px; max-width: 280px; }
        .footer-col h4 { font-size: 0.85rem; font-weight: 700; color: white; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; }
        .footer-col a { display: block; font-size: 0.85rem; color: rgba(255,255,255,0.45); text-decoration: none; margin-bottom: 12px; transition: color 0.2s; }
        .footer-col a:hover { color: rgba(255,255,255,0.8); }
        .es-footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.08); padding-top: 32px;
          display: flex; align-items: center; justify-content: space-between;
          font-size: 0.82rem; color: rgba(255,255,255,0.3);
        }

        /* ── MODALS ── */
        .edusphere-modal-overlay {
          position: fixed; inset: 0; background: rgba(10,15,46,0.7);
          backdrop-filter: blur(8px); z-index: 9999;
          display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        .edusphere-modal {
          background: white; border-radius: 20px; padding: 36px;
          width: 100%; max-width: 440px; position: relative;
          box-shadow: 0 32px 80px rgba(10,15,46,0.3);
          animation: modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
          max-height: 90vh; overflow-y: auto;
        }
        .edusphere-modal--wide { max-width: 520px; }
        @keyframes modalIn { from{opacity:0;transform:translateY(32px) scale(0.95)} to{opacity:1;transform:none} }

        .edusphere-modal-school-badge {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; background: var(--surface); border-radius: 12px;
          border: 1px solid var(--border); margin-bottom: 24px;
        }
        .badge-avatar {
          width: 40px; height: 40px; border-radius: 10px;
          background: var(--badge-color, var(--indigo)); color: white;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.85rem; flex-shrink: 0;
        }
        .badge-name { font-size: 0.9rem; font-weight: 700; }
        .badge-loc { display: flex; align-items: center; gap: 3px; font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
        .edusphere-modal-close {
          position: absolute; top: 16px; right: 16px; width: 36px; height: 36px;
          border-radius: 50%; border: none; background: var(--surface); cursor: pointer;
          display: flex; align-items: center; justify-content: center; color: var(--text-muted);
          transition: all 0.2s;
        }
        .edusphere-modal-close:hover { background: #fee2e2; color: #ef4444; }
        .edusphere-modal-tabs {
          display: flex; background: var(--surface); border-radius: 10px; padding: 4px;
          margin-bottom: 24px;
        }
        .modal-tab {
          flex: 1; padding: 9px; border-radius: 8px; border: none; background: transparent;
          font-family: var(--font); font-size: 0.88rem; font-weight: 600;
          color: var(--text-muted); cursor: pointer; transition: all 0.2s;
        }
        .modal-tab.active { background: white; color: var(--indigo); box-shadow: var(--shadow-sm); }
        .modal-title { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
        .modal-subtitle { font-size: 0.88rem; color: var(--text-muted); margin-bottom: 28px; }
        .modal-form { display: flex; flex-direction: column; gap: 14px; }
        .modal-input-wrap {
          position: relative; display: flex; align-items: center;
          border: 1.5px solid var(--border); border-radius: 10px;
          overflow: hidden; transition: border-color 0.2s; background: white;
        }
        .modal-input-wrap:focus-within { border-color: var(--indigo); }
        .modal-input-icon { position: absolute; left: 14px; color: #94a3b8; flex-shrink: 0; }
        .modal-input-wrap input, .modal-input-wrap select {
          width: 100%; padding: 13px 14px 13px 40px; border: none; outline: none;
          font-family: var(--font); font-size: 0.9rem; background: transparent;
          color: var(--text-primary);
        }
        .modal-select-wrap {
          position: relative; border: 1.5px solid var(--border); border-radius: 10px; overflow: hidden;
        }
        .modal-select-wrap select {
          width: 100%; padding: 13px 14px; border: none; outline: none;
          font-family: var(--font); font-size: 0.9rem; background: white;
          color: var(--text-primary); cursor: pointer; appearance: none;
        }
        .modal-pw-toggle {
          position: absolute; right: 12px; background: none; border: none;
          cursor: pointer; color: #94a3b8; display: flex; align-items: center;
        }
        .modal-forgot { text-align: right; }
        .modal-forgot a { font-size: 0.82rem; color: var(--indigo); text-decoration: none; font-weight: 600; }
        .modal-role-select { display: flex; gap: 8px; }
        .role-chip {
          flex: 1; padding: 9px; border-radius: 8px; border: 1.5px solid var(--border);
          font-family: var(--font); font-size: 0.82rem; font-weight: 600;
          color: var(--text-muted); cursor: pointer; transition: all 0.2s; background: white;
        }
        .role-chip.active { border-color: var(--indigo); background: rgba(26,86,219,0.06); color: var(--indigo); }
        .modal-submit {
          width: 100%; padding: 14px; border-radius: 10px; border: none;
          background: var(--indigo); color: white; font-family: var(--font);
          font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .modal-submit:hover:not(:disabled) { background: #1447c0; }
        .modal-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        .modal-spinner {
          width: 20px; height: 20px; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to{transform:rotate(360deg)} }
        .modal-switch { text-align: center; margin-top: 20px; font-size: 0.85rem; color: var(--text-muted); }
        .modal-switch button { background: none; border: none; color: var(--indigo); font-weight: 700; cursor: pointer; font-family: var(--font); font-size: 0.85rem; }
        .modal-back {
          padding: 14px 20px; border-radius: 10px; border: 1.5px solid var(--border);
          background: white; font-family: var(--font); font-size: 0.88rem; font-weight: 600;
          color: var(--text-muted); cursor: pointer; transition: all 0.2s;
        }
        .modal-back:hover { border-color: var(--text-muted); color: var(--text-primary); }
        .modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .modal-row--btns { display: flex; gap: 12px; }
        .reg-header { text-align: center; margin-bottom: 28px; }
        .reg-icon {
          width: 60px; height: 60px; border-radius: 16px; background: rgba(26,86,219,0.1);
          display: flex; align-items: center; justify-content: center; color: var(--indigo);
          margin: 0 auto 16px;
        }
        .reg-steps { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 28px; }
        .reg-step { display: flex; align-items: center; gap: 8px; }
        .step-circle {
          width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 700; color: var(--text-muted);
          transition: all 0.3s; flex-shrink: 0;
        }
        .reg-step.active .step-circle { border-color: var(--indigo); background: var(--indigo); color: white; }
        .reg-step.done .step-circle { border-color: var(--emerald); background: var(--emerald); color: white; }
        .reg-step span { font-size: 0.82rem; font-weight: 600; color: var(--text-muted); }
        .reg-step.active span { color: var(--indigo); }
        .step-line { width: 48px; height: 2px; background: var(--border); margin: 0 8px; flex-shrink: 0; }
        .reg-terms { display: flex; align-items: flex-start; gap: 10px; font-size: 0.82rem; color: var(--text-muted); }
        .reg-terms input { margin-top: 3px; accent-color: var(--indigo); }
        .reg-terms a { color: var(--indigo); text-decoration: none; font-weight: 600; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .es-features-grid { grid-template-columns: repeat(2, 1fr); }
          .es-testimonials-grid { grid-template-columns: repeat(2, 1fr); }
          .es-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
          .es-register-cta-inner { flex-direction: column; }
          .cta-btns { flex-direction: column; }
        }
        @media (max-width: 768px) {
          .es-stats-inner { grid-template-columns: repeat(2, 1fr); }
          .stat-item:nth-child(2)::after { display: none; }
          .stat-item::after { display: none; }
          .es-features-grid { grid-template-columns: 1fr; }
          .es-testimonials-grid { grid-template-columns: 1fr; }
          .es-nav-links { display: none; }
          .modal-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="es-home">
        {/* ── NAVBAR ── */}
        <nav className={`es-nav ${scrollY > 20 ? 'scrolled' : ''}`}>
          <Link to="/" className="es-nav-logo">
            <div className="es-nav-logo-icon"><BookOpen size={22} /></div>
            <span className="es-nav-logo-text">Edu<span>Sphere</span></span>
          </Link>
          <div className="es-nav-links">
            <a href="#schools">Find Schools</a>
            <a href="#features">Features</a>
            <a href="#testimonials">Reviews</a>
            <a href="#register-school">For Schools</a>
          </div>
          <div className="es-nav-actions">
            <Link to="/login" className="btn-ghost">Sign In</Link>
            <Link to="/register" className="btn-primary"><Plus size={16} /> Register</Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="es-hero">
          <div className="es-hero-grid" />
          <div className="es-hero-content">
            <div className="es-hero-badge">
              <div className="badge-dot" />
              <Sparkles size={13} /> India's #1 School Management Platform
            </div>
            <h1>
              Find & Connect with<br /><em>Your School</em> in Seconds
            </h1>
            <p className="es-hero-sub">
              Search from 1,240+ registered schools across India. Track attendance, results, fees, and more — all in one intelligent platform.
            </p>

            <div className="es-search-box">
              <Search size={20} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search by school name, city, or board..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => document.getElementById('schools')?.scrollIntoView({ behavior: 'smooth' })}
              />
              <button className="es-search-btn"><Search size={16} /> Search</button>
            </div>

            <div className="es-hero-quick">
              {['Delhi', 'Mumbai', 'CBSE', 'Boarding Schools', 'Bengaluru'].map(q => (
                <button key={q} className="quick-chip" onClick={() => { setQuery(q); document.getElementById('schools')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className="es-hero-scroll">
            <span>Scroll to explore</span>
            <ChevronDown size={18} className="scroll-arrow" />
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="es-stats" ref={statsRef}>
          <div className="es-stats-inner">
            {STATS.map(s => (
              <div key={s.label} className="stat-item">
                <div className="stat-icon" style={{ background: s.color }}><s.icon size={22} /></div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SCHOOLS ── */}
        <section className="es-schools" id="schools">
          <div className="es-schools-header">
            <div>
              <div className="section-label"><School size={14} /> Registered Schools</div>
              <h2 className="section-title">Find Your School</h2>
              <p className="section-sub">Click any school card to sign in or register for instant access to your school portal.</p>
            </div>
            <button className="btn-primary" onClick={() => setRegModal(true)}>
              <Building2 size={16} /> Register a School
            </button>
          </div>

          <div className="es-filter-row">
            {FILTERS.map(f => (
              <button key={f} className={`filter-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
            ))}
          </div>

          <div className="es-schools-grid">
            {filtered.length > 0 ? filtered.map(school => (
              <SchoolCard key={school.id} school={school} onClick={s => setAuthModal(s)} />
            )) : (
              <div className="es-schools-empty">
                <div className="es-schools-empty-icon">🔍</div>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>No schools found</p>
                <p>Try a different search term or filter</p>
              </div>
            )}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="es-features" id="features">
          <div className="es-features-inner">
            <div className="es-features-header">
              <div className="section-label" style={{ color: '#93c5fd', marginBottom: 16 }}><Zap size={14} /> Platform Features</div>
              <h2 className="section-title">Everything Your School Needs</h2>
              <p className="section-sub">From AI-powered analytics to digital fee management — EduSphere covers every corner of school operations.</p>
            </div>
            <div className="es-features-grid">
              {FEATURES.map(f => (
                <div key={f.title} className="feature-card">
                  <div className="feature-icon" style={{ background: f.color }}><f.icon size={24} /></div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="es-testimonials" id="testimonials">
          <div className="es-testimonials-inner">
            <div className="es-testimonials-header">
              <div className="section-label"><Star size={14} /> Testimonials</div>
              <h2 className="section-title">Loved by Schools Across India</h2>
            </div>
            <div className="es-testimonials-grid">
              {TESTIMONIALS.map(t => (
                <div key={t.name} className="testimonial-card">
                  <p className="testimonial-text">{t.text}</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar" style={{ background: t.color }}>{t.avatar}</div>
                    <div>
                      <div className="testimonial-name">{t.name}</div>
                      <div className="testimonial-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SCHOOL REGISTRATION CTA ── */}
        <section className="es-register-cta" id="register-school">
          <div className="es-register-cta-inner">
            <div className="cta-content">
              <h2>Ready to Digitise Your School?</h2>
              <p>Join over 1,240 schools who've transformed their operations with EduSphere. Setup takes less than 10 minutes.</p>
              <div className="cta-checks">
                {['Free 30-day trial, no credit card required', 'Dedicated onboarding support team', 'CBSE, ICSE & State Board compatible', 'Data migrated from your existing system'].map(c => (
                  <div key={c} className="cta-check"><CheckCircle size={17} color="#10b981" /> {c}</div>
                ))}
              </div>
            </div>
            <div className="cta-btns">
              <button className="btn-gold" onClick={() => setRegModal(true)}>
                <Building2 size={18} /> Register Your School
              </button>
              <Link to="/login" className="btn-outline-white">
                <Play size={16} /> Watch Demo
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="es-footer">
          <div className="es-footer-inner">
            <div className="es-footer-grid">
              <div className="footer-brand">
                <Link to="/" className="es-nav-logo" style={{ marginBottom: 0 }}>
                  <div className="es-nav-logo-icon"><BookOpen size={20} /></div>
                  <span className="es-nav-logo-text">Edu<span>Sphere</span></span>
                </Link>
                <p>India's most trusted school management platform. Empowering educators, students, and parents since 2020.</p>
              </div>
              <div className="footer-col">
                <h4>Platform</h4>
                <a href="#features">Features</a>
                <a href="#schools">Find Schools</a>
                <a href="#register-school">For Schools</a>
                <a href="#">Pricing</a>
              </div>
              <div className="footer-col">
                <h4>Portals</h4>
                <Link to="/login">Student Portal</Link>
                <Link to="/login">Teacher Portal</Link>
                <Link to="/login">Parent Portal</Link>
                <Link to="/login">Admin Portal</Link>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <a href="#">About Us</a>
                <a href="#">Careers</a>
                <a href="#">Blog</a>
                <a href="#">Contact</a>
              </div>
            </div>
            <div className="es-footer-bottom">
              <span>© 2024 EduSphere. All rights reserved.</span>
              <div style={{ display: 'flex', gap: 24 }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Privacy Policy</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>

        {/* ── MODALS ── */}
        {authModal && <AuthModal school={authModal} onClose={() => setAuthModal(null)} />}
        {regModal && <SchoolRegModal onClose={() => setRegModal(false)} />}
      </div>
    </>
  );
};

export default Home;