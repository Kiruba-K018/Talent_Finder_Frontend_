import React, { useState } from 'react';
import { resetPasswordApi } from '../services/authApi';
import './Authflow.css';

interface Props {
  email: string;
  otp: string;
  onSuccess: () => void;
  onBack: () => void;
  onLoginClick: () => void;
}

const ResetPasswordPage: React.FC<Props> = ({ email, otp, onSuccess, onBack, onLoginClick }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ new?: string; confirm?: string }>({});
  const [done, setDone] = useState(false);

  const getStrength = (p: string): { score: number; label: string; color: string } => {
    if (!p) return { score: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map = [
      { label: 'Too short', color: '#ef4444' },
      { label: 'Weak', color: '#f97316' },
      { label: 'Fair', color: '#eab308' },
      { label: 'Good', color: '#3b82f6' },
      { label: 'Strong', color: '#16a34a' },
    ];
    return { score, ...map[score] };
  };

  const strength = getStrength(newPassword);

  const validate = () => {
    const errs: { new?: string; confirm?: string } = {};
    if (!newPassword) errs.new = 'New password is required.';
    else if (newPassword.length < 8) errs.new = 'Must be at least 8 characters.';
    if (!confirmPassword) errs.confirm = 'Please confirm your password.';
    else if (newPassword !== confirmPassword) errs.confirm = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setError('');
    try {
      await resetPasswordApi({ email, otp, new_password: newPassword });
      setDone(true);
      setTimeout(() => onSuccess(), 2800);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="af-success-screen">
        <div className="af-success-card">
          <div className="af-success-ripple">
            <div className="af-success-icon">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <path d="M20 6 9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <h2>Password reset!</h2>
          <p>Your password has been updated successfully.<br />Redirecting you to sign in…</p>
          <div className="af-redirect-bar"><div className="af-redirect-fill" /></div>
          <button className="af-submit-btn" style={{ marginTop: '1.5rem' }} onClick={onLoginClick}>
            Go to sign in
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="af-root">
      <div className="af-panel-left">
        <div className="af-panel-left__inner">
          <div className="af-brand">
            <div className="af-brand__logo">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                <circle cx="19" cy="19" r="19" fill="white" fillOpacity="0.15" />
                <path d="M19 10C15.13 10 12 13.13 12 17C12 19.55 13.37 21.78 15.42 23.01L13 28H25L22.58 23.01C24.63 21.78 26 19.55 26 17C26 13.13 22.87 10 19 10Z" fill="white" />
                <circle cx="19" cy="17" r="3" fill="#1D4ED8" />
              </svg>
            </div>
            <span className="af-brand__name">TalentFinder</span>
          </div>
          <div className="af-panel-left__content">
            <h1>Almost<br />there.</h1>
            <p>Create a new strong password to secure your TalentFinder recruiter account.</p>
            <div className="af-steps">
              {[
                { n: '1', label: 'Request sent', done: true },
                { n: '2', label: 'Verify OTP', done: true },
                { n: '3', label: 'Reset password', done: false, active: true },
              ].map((s) => (
                <div className={`af-step ${s.done ? 'af-step--done' : ''} ${s.active ? 'af-step--active' : ''}`} key={s.n}>
                  <div className="af-step__dot">
                    {s.done ? (
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : s.n}
                  </div>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="af-panel-left__footer">Secure · Encrypted · Private</div>
        </div>
        <div className="af-deco af-deco--1" />
        <div className="af-deco af-deco--2" />
        <div className="af-deco af-deco--3" />
      </div>

      <div className="af-panel-right">
        <div className="af-form-wrapper">
          <button className="af-back-btn" onClick={onBack}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>

          <div className="af-form-header">
            <div className="af-step-badge">Step 3 of 3</div>
            <h2>Create new password</h2>
            <p>Choose a strong password for <strong>{email}</strong></p>
          </div>

          <form className="af-form" onSubmit={handleSubmit} noValidate>
            {/* New password */}
            <div className={`af-field ${fieldErrors.new ? 'af-field--error' : ''}`}>
              <label htmlFor="new-password">New password</label>
              <div className="af-input-wrap">
                <span className="af-input-icon">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setFieldErrors((f) => ({ ...f, new: '' })); }}
                  autoComplete="new-password"
                />
                <button type="button" className="af-eye-btn" onClick={() => setShowNew(!showNew)} tabIndex={-1}>
                  {showNew ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Strength meter */}
              {newPassword && (
                <div className="af-strength">
                  <div className="af-strength__bars">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className="af-strength__bar"
                        style={{ background: n <= strength.score ? strength.color : 'var(--gray-200)' }}
                      />
                    ))}
                  </div>
                  <span className="af-strength__label" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}

              {fieldErrors.new && <span className="af-error-msg">{fieldErrors.new}</span>}
            </div>

            {/* Confirm password */}
            <div className={`af-field ${fieldErrors.confirm ? 'af-field--error' : ''}`}>
              <label htmlFor="confirm-password">Confirm password</label>
              <div className="af-input-wrap">
                <span className="af-input-icon">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((f) => ({ ...f, confirm: '' })); }}
                  autoComplete="new-password"
                />
                <button type="button" className="af-eye-btn" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                  {showConfirm ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirm && <span className="af-error-msg">{fieldErrors.confirm}</span>}
            </div>

            {error && (
              <div className="af-alert af-alert--error">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="af-submit-btn" disabled={loading}>
              {loading ? <span className="af-spinner" /> : (
                <>
                  Reset password
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="af-login-row">
            Remembered your password?{' '}
            <button className="af-link-btn" onClick={onLoginClick}>Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;