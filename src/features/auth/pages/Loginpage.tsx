import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import { loginThunk, forgotPasswordThunk } from '../slices/authThunks';
import { clearError } from '../slices/authSlice';
import { registerApi } from '../services/authApi';
import './Loginpage.css';

type Mode = 'login' | 'forgot';

interface LoginPageProps {
  onForgotPasswordRequested?: (email: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onForgotPasswordRequested }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    dispatch(clearError());
  }, [mode]);

  const validateEmail = (val: string) => {
    if (!val) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required';
    if (val.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    await dispatch(loginThunk({ email, password }) as any);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(forgotEmail);
    if (eErr) {
      setForgotStatus({ type: 'error', msg: eErr });
      return;
    }
    setForgotLoading(true);
    setForgotStatus(null);
    const result = await dispatch(forgotPasswordThunk(forgotEmail) as any);
    setForgotLoading(false);
    if (result.success) {
      // Navigate to OTP verification page
      if (onForgotPasswordRequested) {
        onForgotPasswordRequested(forgotEmail);
      } else {
        setForgotStatus({ type: 'success', msg: result.message || 'OTP sent! Check your inbox.' });
      }
    } else {
      setForgotStatus({ type: 'error', msg: result.error });
    }
  };

  return (
    <div className="tf-root">
      <div className="tf-panel-left">
        <div className="tf-panel-left__inner">
          <div className="tf-brand">
            <div className="tf-brand__logo">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                <circle cx="19" cy="19" r="19" fill="white" fillOpacity="0.15" />
                <path
                  d="M19 10C15.13 10 12 13.13 12 17C12 19.55 13.37 21.78 15.42 23.01L13 28H25L22.58 23.01C24.63 21.78 26 19.55 26 17C26 13.13 22.87 10 19 10Z"
                  fill="white"
                />
                <circle cx="19" cy="17" r="3" fill="#1D4ED8" />
              </svg>
            </div>
            <span className="tf-brand__name">TalentFinder</span>
          </div>

          <div className="tf-panel-left__content">
            <h1>
              Hire smarter.
              <br />
              Move faster.
            </h1>
            <p>
              The intelligent resume sourcing & shortlisting platform built for modern recruiters.
            </p>

            <div className="tf-features">
              {[
                { icon: '🤖', text: 'AI-powered candidate matching' },
                { icon: '📋', text: 'Smart resume shortlisting' },
                { icon: '📊', text: 'Pipeline analytics & insights' },
              ].map((f) => (
                <div className="tf-feature" key={f.text}>
                  <span className="tf-feature__icon">{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="tf-panel-left__footer">Trusted by 2,400+ recruiting teams worldwide</div>
        </div>

        {/* Decorative circles */}
        <div className="tf-deco tf-deco--1" />
        <div className="tf-deco tf-deco--2" />
        <div className="tf-deco tf-deco--3" />
      </div>
      <div className="tf-panel-right">
        <div className="tf-form-wrapper">
          {mode === 'login' ? (
            <>
              <div className="tf-form-header">
                <h2>Welcome back</h2>
                <p>Sign in to your recruiter account</p>
              </div>

              <form className="tf-form" onSubmit={handleLogin} noValidate aria-label="Sign in form">
                <div className={`tf-field ${emailError ? 'tf-field--error' : ''}`}>
                  <label htmlFor="email">Email address</label>
                  <div className="tf-input-wrap">
                    <span className="tf-input-icon" aria-hidden="true">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="m22 6-10 7L2 6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                      }}
                      autoComplete="email"
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? 'email-error' : undefined}
                    />
                  </div>
                  {emailError && (
                    <span id="email-error" className="tf-error-msg" role="alert">
                      {emailError}
                    </span>
                  )}
                </div>

                <div className={`tf-field ${passwordError ? 'tf-field--error' : ''}`}>
                  <label htmlFor="password">Password</label>
                  <div className="tf-input-wrap">
                    <span className="tf-input-icon" aria-hidden="true">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M7 11V7a5 5 0 0 1 10 0v4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      autoComplete="current-password"
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? 'password-error' : undefined}
                    />
                    <button
                      type="button"
                      className="tf-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M1 1l22 22"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <span id="password-error" className="tf-error-msg" role="alert">
                      {passwordError}
                    </span>
                  )}
                </div>

                <div className="tf-form-actions">
                  <button
                    type="button"
                    className="tf-link-btn"
                    onClick={() => setMode('forgot')}
                    aria-label="Go to forgot password page"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="tf-alert tf-alert--error" role="alert">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M12 8v4M12 16h.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="tf-submit-btn"
                  disabled={loading}
                  aria-busy={loading}
                  aria-label={loading ? 'Signing in...' : 'Sign in'}
                >
                  {loading ? (
                    <span className="tf-spinner" aria-hidden="true" />
                  ) : (
                    <>
                      Sign in
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 12h14M12 5l7 7-7 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                className="tf-back-btn"
                onClick={() => {
                  setMode('login');
                  setForgotStatus(null);
                  setForgotEmail('');
                }}
                aria-label="Back to sign in page"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M19 12H5M12 19l-7-7 7-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back to sign in
              </button>

              <div className="tf-form-header">
                <div className="tf-forgot-icon">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                      stroke="#2563EB"
                      strokeWidth="1.8"
                    />
                    <path
                      d="m22 6-10 7L2 6"
                      stroke="#2563EB"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h2>Reset your password</h2>
                <p>Enter your registered email and we'll send you a reset link.</p>
              </div>

              <form
                className="tf-form"
                onSubmit={handleForgotPassword}
                noValidate
                aria-label="Forgot password form"
              >
                <div
                  className={`tf-field ${forgotStatus?.type === 'error' ? 'tf-field--error' : ''}`}
                >
                  <label htmlFor="forgot-email">Email address</label>
                  <div className="tf-input-wrap">
                    <span className="tf-input-icon" aria-hidden="true">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="m22 6-10 7L2 6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="you@company.com"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        setForgotStatus(null);
                      }}
                      autoComplete="email"
                      aria-invalid={forgotStatus?.type === 'error'}
                      aria-describedby={
                        forgotStatus?.type === 'error' ? 'forgot-status' : undefined
                      }
                    />
                  </div>
                </div>

                {forgotStatus && (
                  <div
                    id="forgot-status"
                    className={`tf-alert tf-alert--${forgotStatus.type}`}
                    role={forgotStatus.type === 'error' ? 'alert' : 'status'}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      {forgotStatus.type === 'success' ? (
                        <path
                          d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ) : (
                        <>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                          <path
                            d="M12 8v4M12 16h.01"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </>
                      )}
                    </svg>
                    {forgotStatus.msg}
                  </div>
                )}

                <button
                  type="submit"
                  className="tf-submit-btn"
                  disabled={forgotLoading}
                  aria-busy={forgotLoading}
                  aria-label={forgotLoading ? 'Sending reset link...' : 'Send reset link'}
                >
                  {forgotLoading ? (
                    <span className="tf-spinner" aria-hidden="true" />
                  ) : (
                    <>
                      Send reset link
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M22 2 11 13M22 2 15 22 11 13 2 9l20-7z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
