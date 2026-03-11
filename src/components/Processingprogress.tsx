import React, { useEffect, useState, useRef } from 'react';

interface ProcessingProgressProps {
  isVisible: boolean;
  totalCandidates?: number;
}

const STAGES = [
  { id: 0, label: 'Scanning resumes',     detail: 'Fetching stored candidate profiles',    duration: 10000 },
  { id: 1, label: 'Matching skills',       detail: 'Comparing required & preferred skills against each applicant…', duration: 25000 },
  { id: 2, label: 'Running AI scoring',    detail: 'Evaluating experience depth and role alignment…',               duration: 48000 },
  { id: 3, label: 'Ranking candidates',    detail: 'Sorting shortlist by aggregate score and flags…',               duration: 22000 },
  { id: 4, label: 'Finalising shortlist',  detail: 'Preparing candidate profiles for review…',                     duration: 15000 },
];

const TOTAL_DURATION = STAGES.reduce((s, st) => s + st.duration, 0);

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({ isVisible, totalCandidates }) => {
  const [elapsed, setElapsed] = useState(0);
  const [dots, setDots]       = useState('');
  const startRef              = useRef<number>(Date.now());
  const rafRef                = useRef<number>(0);
  const dotRef                = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    startRef.current = Date.now();
    setElapsed(0);

    const tick = () => {
      const now = Date.now() - startRef.current;
      setElapsed(Math.min(now, TOTAL_DURATION));
      if (now < TOTAL_DURATION) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    dotRef.current = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (dotRef.current) clearInterval(dotRef.current);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const globalPct = Math.min((elapsed / TOTAL_DURATION) * 100, 99);

  let stageIndex   = 0;
  let stageElapsed = elapsed;
  for (let i = 0; i < STAGES.length; i++) {
    if (stageElapsed <= STAGES[i].duration) { stageIndex = i; break; }
    stageElapsed -= STAGES[i].duration;
    stageIndex = i + 1;
  }
  stageIndex = Math.min(stageIndex, STAGES.length - 1);
  const stagePct     = Math.min((stageElapsed / STAGES[stageIndex].duration) * 100, 100);
  const currentStage = STAGES[stageIndex];
  const secsLeft     = Math.max(0, Math.round((TOTAL_DURATION - elapsed) / 1000));
  const minsLeft     = Math.floor(secsLeft / 60);
  const sLeft        = secsLeft % 60;
  const etaStr       = minsLeft > 0 ? `~${minsLeft}m ${sLeft}s left` : `~${sLeft}s left`;

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '1.4rem',
      display: 'flex', flexDirection: 'column', gap: '1rem',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ flexShrink: 0, position: 'relative', width: 44, height: 44 }}>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="#dbeafe" strokeWidth="3.5" />
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke="#2563eb" strokeWidth="3.5"
              strokeDasharray={`${(globalPct / 100) * 2 * Math.PI * 18} ${2 * Math.PI * 18}`}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '22px 22px', transition: 'stroke-dasharray 0.8s ease' }}
            />
          </svg>
          <span style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', fontWeight: 800, color: '#1d4ed8',
            fontFamily: 'Sora, sans-serif',
          }}>
            {Math.round(globalPct)}%
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.15rem' }}>
            Processing candidates{dots}
          </p>
          <p style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
            {totalCandidates != null && totalCandidates > 0
              ? `${totalCandidates} applicant${totalCandidates !== 1 ? 's' : ''} found · ${etaStr}`
              : `AI scoring in progress · ${etaStr}`}
          </p>
        </div>
      </div>

      {/* Global bar */}
      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${globalPct}%`,
          background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
          borderRadius: 999, transition: 'width 0.8s ease',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
            animation: 'jd-shimmer 1.6s ease-in-out infinite',
          }} />
        </div>
      </div>

      {/* Stages */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {STAGES.map((stage, i) => {
          const isDone   = i < stageIndex;
          const isActive = i === stageIndex;
          return (
            <div key={stage.id} style={{ display: 'flex', gap: '0.65rem', position: 'relative', paddingBottom: '0.75rem' }}>
              {i < STAGES.length - 1 && (
                <div style={{
                  position: 'absolute', left: 11, top: 24, width: 2,
                  height: 'calc(100% - 14px)',
                  background: isDone ? '#bfdbfe' : '#f1f5f9',
                  borderRadius: 2, transition: 'background 0.4s',
                }} />
              )}
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDone ? '#dbeafe' : isActive ? '#eff6ff' : '#f8fafc',
                border: `2px solid ${isDone ? '#93c5fd' : isActive ? '#2563eb' : '#e2e8f0'}`,
                boxShadow: isActive ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
                transition: 'all 0.3s',
              }}>
                {isDone ? (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : isActive ? (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', animation: 'jd-pulse 1.2s ease-in-out infinite' }} />
                ) : (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e2e8f0' }} />
                )}
              </div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 700 : isDone ? 500 : 400,
                    color: isDone ? '#1d4ed8' : isActive ? '#0f172a' : '#94a3b8',
                    transition: 'color 0.3s',
                  }}>{stage.label}</span>
                  {isDone && (
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 999, padding: '1px 6px' }}>done</span>
                  )}
                  {isActive && (
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 999, padding: '1px 6px' }}>running</span>
                  )}
                </div>
                {isActive && (
                  <>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3, marginBottom: 5, lineHeight: 1.5 }}>{stage.detail}</p>
                    <div style={{ height: 3, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${stagePct}%`, background: 'linear-gradient(90deg, #1d4ed8, #60a5fa)', borderRadius: 999, transition: 'width 0.5s ease' }} />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '0.72rem', color: '#cbd5e1', textAlign: 'center', fontStyle: 'italic', marginTop: 'auto', paddingTop: '0.5rem' }}>
        AI scoring takes a moment — grab a coffee ☕
      </p>

      <style>{`
        @keyframes jd-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
      `}</style>
    </div>
  );
};

export default ProcessingProgress;