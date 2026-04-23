import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft, Smartphone, RefreshCw } from 'lucide-react';
import axios from 'axios';

const TwoFactorAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  const email = location.state?.email || '';
  const userId = location.state?.userId || '';

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newCode.every(digit => digit !== '') && index === 5) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split('');
    setCode([...newCode, ...Array(6 - newCode.length).fill('')]);
    
    if (newCode.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (verificationCode) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/verify-2fa', {
        userId,
        code: verificationCode
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Redirect based on role
        const role = response.data.user.role;
        const redirectMap = {
          SUPER_ADMIN: '/super-admin/dashboard',
          SCHOOL_ADMIN: '/school-admin/dashboard',
          TEACHER: '/teacher/dashboard',
          STUDENT: '/student/dashboard',
          PARENT: '/parent/dashboard',
          VENDOR: '/vendor/dashboard'
        };
        
        navigate(redirectMap[role] || '/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid verification code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      await axios.post('/api/auth/resend-2fa', { userId, email });
      setResendTimer(60);
      setCanResend(false);
      setError('');
    } catch (error) {
      setError('Failed to resend code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-gray-600">
            Enter the 6-digit code sent to
          </p>
          <p className="text-purple-600 font-semibold">{email}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Code Input */}
        <div className="mb-6">
          <div className="flex justify-center gap-2 mb-4">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition-colors"
                disabled={loading}
              />
            ))}
          </div>

          {/* Resend Code */}
          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-purple-600 hover:text-purple-700 font-semibold flex items-center justify-center mx-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Code
              </button>
            ) : (
              <p className="text-gray-500 text-sm">
                Resend code in {resendTimer}s
              </p>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Check your email or phone</p>
              <p>The verification code expires in 10 minutes.</p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/login')}
          className="w-full flex items-center justify-center text-gray-600 hover:text-gray-800 font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default TwoFactorAuth;