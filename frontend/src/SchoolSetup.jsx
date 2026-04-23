// src/pages/SchoolSetup.jsx
// Linked from the approval email: /school-setup/:token
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, BookOpen, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SchoolSetup = () => {
  const { token } = useParams();
  const navigate  = useNavigate();

  const [form, setForm]         = useState({ password: '', confirm: '' });
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const rules = [
    { test: form.password.length >= 8,                label: 'At least 8 characters' },
    { test: /[A-Z]/.test(form.password),              label: 'One uppercase letter' },
    { test: /[a-z]/.test(form.password),              label: 'One lowercase letter' },
    { test: /\d/.test(form.password),                 label: 'One number' },
    { test: form.password === form.confirm && !!form.confirm, label: 'Passwords match' }
  ];

  const handleSubmit = async e => {
    e.preventDefault();
    if (!rules.every(r => r.test)) { setError('Please meet all password requirements.'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/schools/setup/${token}`, { password: form.password });
      setAdminEmail(data.email);
      setDone(true);
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0f2e,#1a2060)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Sora', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');`}</style>
      <div style={{ background: 'white', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 440, boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: '#1a56db', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookOpen size={26} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0a0f2e', marginBottom: 6 }}>
            {done ? 'All Set!' : 'Set Your Password'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            {done ? `Redirecting you to login...` : 'Create a secure password for your school admin account'}
          </p>
        </div>

        {/* Success state */}
        {done ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 72, height: 72, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={36} color="#10b981" />
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0a0f2e', marginBottom: 8 }}>Account Ready!</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 24 }}>
              Log in with <strong>{adminEmail}</strong> and your new password.
            </p>
            <Link to="/login" style={{ display: 'inline-block', padding: '12px 28px', background: '#1a56db', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
              Go to Login →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: 20, color: '#dc2626', fontSize: '0.85rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            {/* Password */}
            {[
              { label: 'New Password', key: 'password', show: showPw, toggle: () => setShowPw(p => !p) },
              { label: 'Confirm Password', key: 'confirm', show: showCf, toggle: () => setShowCf(p => !p) }
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>{f.label}</label>
                <div style={{ position: 'relative', border: '1.5px solid #e2e8f0', borderRadius: 10, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, color: '#94a3b8' }} />
                  <input
                    type={f.show ? 'text' : 'password'}
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '13px 40px 13px 40px', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '0.9rem' }}
                  />
                  <button type="button" onClick={f.toggle} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                    {f.show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            {/* Rules checklist */}
            <div style={{ background: '#f8faff', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              {rules.map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '0.82rem', color: r.test ? '#10b981' : '#94a3b8' }}>
                  <CheckCircle size={14} fill={r.test ? '#10b981' : 'none'} stroke={r.test ? '#10b981' : '#94a3b8'} />
                  {r.label}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !rules.every(r => r.test)}
              style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: loading || !rules.every(r => r.test) ? '#93c5fd' : '#1a56db', color: 'white', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? <span style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : 'Activate My Account'}
            </button>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </form>
        )}
      </div>
    </div>
  );
};

export default SchoolSetup;