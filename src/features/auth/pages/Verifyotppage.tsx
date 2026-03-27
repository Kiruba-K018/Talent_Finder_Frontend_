import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { verifyOtpApi, forgotPasswordApi } from '../services/authApi';
import './Authflow.css';

interface Props {
  email: string;
  onVerified: (otp: string) => void;
  onBack: () => void;
}

const RESEND_SECONDS = 60;

const VerifyOtpPage: React.FC<Props> = ({ email, onVerified, onBack }) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const otp = digits.join('');
  const isComplete = otp.length === 6 && digits.every((d) => d !== '');

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];

    if (value.length > 1) {
      // Handle paste into a cell
      const pasted = value.replace(/\D/g, '').slice(0, 6 - index);
      pasted.split('').forEach((ch, i) => {
        next[index + i] = ch;
      });
      setDigits(next);
      const focusIdx = Math.min(index + pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    next[index] = value;
    setDigits(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('');
    pasted.split('').forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) {
      setError('Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOtpApi({ email, otp });
      onVerified(otp);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.detail || 'Invalid OTP. Please try again.'
        : 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg('');
    setError('');
    try {
      await forgotPasswordApi(email);
      setResendMsg('A new OTP has been sent to your email.');
      setResendTimer(RESEND_SECONDS);
      setDigits(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.detail || 'Failed to resend OTP.'
        : 'An unexpected error occurred';
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  const maskedEmail = email.replace(
    /(.{2})(.*)(@.*)/,
    (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 3)) + c
  );

  return (
    <div className="af-root">
      <div className="af-panel-left">
        <div className="af-panel-left__inner">
          <div className="af-brand">
            <div className="af-brand__logo">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                <circle cx="19" cy="19" r="19" fill="white" fillOpacity="0.15" />
                <path
                  d="M19 10C15.13 10 12 13.13 12 17C12 19.55 13.37 21.78 15.42 23.01L13 28H25L22.58 23.01C24.63 21.78 26 19.55 26 17C26 13.13 22.87 10 19 10Z"
                  fill="white"
                />
                <circle cx="19" cy="17" r="3" fill="#1D4ED8" />
              </svg>
            </div>
            <span className="af-brand__name">TalentFinder</span>
          </div>
          <div className="af-panel-left__content">
            <h1>
              Check your
              <br />
              inbox.
            </h1>
            <p>
              We've sent a one-time verification code to confirm your identity before resetting your
              password.
            </p>
            <div className="af-steps">
              {[
                { n: '1', label: 'Request sent', done: true },
                { n: '2', label: 'Verify OTP', done: false, active: true },
                { n: '3', label: 'Reset password', done: false },
              ].map((s) => (
                <div
                  className={`af-step ${s.done ? 'af-step--done' : ''} ${s.active ? 'af-step--active' : ''}`}
                  key={s.n}
                >
                  <div className="af-step__dot">
                    {s.done ? (
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M20 6 9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      s.n
                    )}
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
              <path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>

          <div className="af-form-header">
            <div className="af-step-badge">Step 2 of 3</div>
            <h2>Enter verification code</h2>
            <p>
              We sent a 6-digit code to
              <br />
              <strong>{maskedEmail}</strong>
            </p>
          </div>

          <form className="af-form" onSubmit={handleSubmit} noValidate>
            <div className="af-otp-group" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  className={`af-otp-cell ${error && !d ? 'af-otp-cell--error' : ''} ${d ? 'af-otp-cell--filled' : ''}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {error && (
              <div className="af-alert af-alert--error">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
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

            {resendMsg && (
              <div className="af-alert af-alert--success">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {resendMsg}
              </div>
            )}

            <button type="submit" className="af-submit-btn" disabled={loading || !isComplete}>
              {loading ? (
                <span className="af-spinner" />
              ) : (
                <>
                  Verify code
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
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

          <div className="af-resend-row">
            <span className="af-resend-label">Didn't receive the code?</span>
            {resendTimer > 0 ? (
              <span className="af-resend-timer">Resend in {resendTimer}s</span>
            ) : (
              <button className="af-link-btn" onClick={handleResend} disabled={resendLoading}>
                {resendLoading ? 'Sending…' : 'Resend OTP'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
