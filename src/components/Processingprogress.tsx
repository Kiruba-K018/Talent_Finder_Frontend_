import React, { useEffect, useState, useRef } from 'react';

interface ProcessingProgressProps {
  isVisible: boolean;
  totalCandidates?: number;
}

const STAGES = [
  { id: 0, label: 'Scanning resumes',     detail: 'Fetching stored candidate profiles',    duration: 15000 },
  { id: 1, label: 'Matching skills',       detail: 'Comparing required & preferred skills against each applicant…', duration: 30000 },
  { id: 2, label: 'Running AI scoring',    detail: 'Evaluating experience depth and role alignment…',               duration: 50000 },
  { id: 3, label: 'Ranking candidates',    detail: 'Sorting shortlist by aggregate score and flags…',               duration: 22000 },
  { id: 4, label: 'Finalising shortlist',  detail: 'Preparing candidate profiles for review…',                     duration: 15000 },
];

const STAGE_WEIGHT_SUM = STAGES.reduce((s, st) => s + st.duration, 0);
const BASELINE_CANDIDATES = 3;
const BASELINE_TOTAL_DURATION_MS = 3 * 60 * 1000; // 3 candidates => 3 minutes

const getStageDurations = (candidateCount: number) => {
  const safeCount = Math.max(1, candidateCount || 1);
  const totalDuration = Math.round((safeCount / BASELINE_CANDIDATES) * BASELINE_TOTAL_DURATION_MS);
  const stageDurations = STAGES.map((stage, index) => {
    // Keep stage timing proportional to the original design.
    if (index === STAGES.length - 1) {
      const used = STAGES
        .slice(0, -1)
        .reduce((sum, s, i) => sum + Math.round((s.duration / STAGE_WEIGHT_SUM) * totalDuration), 0);
      return Math.max(totalDuration - used, 1);
    }
    return Math.max(Math.round((stage.duration / STAGE_WEIGHT_SUM) * totalDuration), 1);
  });

  return { totalDuration, stageDurations };
};

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({ isVisible, totalCandidates }) => {
  const [elapsed, setElapsed] = useState(0);
  const [dots, setDots]       = useState('');
  const startRef              = useRef<number>(Date.now());
  const rafRef                = useRef<number>(0);
  const dotRef                = useRef<ReturnType<typeof setInterval> | null>(null);
  const candidateCount        = Math.max(1, totalCandidates ?? BASELINE_CANDIDATES);
  const { totalDuration, stageDurations } = getStageDurations(candidateCount);

  useEffect(() => {
    if (!isVisible) return;
    startRef.current = Date.now();
    setElapsed(0);

    const tick = () => {
      const now = Date.now() - startRef.current;
      setElapsed(Math.min(now, totalDuration));
      if (now < totalDuration) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    dotRef.current = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (dotRef.current) clearInterval(dotRef.current);
    };
  }, [isVisible, totalDuration]);

  if (!isVisible) return null;

  const globalPct = Math.min((elapsed / totalDuration) * 100, 100);

  let stageIndex   = 0;
  let stageElapsed = elapsed;
  for (let i = 0; i < STAGES.length; i++) {
    if (stageElapsed <= stageDurations[i]) { stageIndex = i; break; }
    stageElapsed -= stageDurations[i];
    stageIndex = i + 1;
  }
  stageIndex = Math.min(stageIndex, STAGES.length - 1);
  const stagePct     = Math.min((stageElapsed / stageDurations[stageIndex]) * 100, 100);
  const currentStage = STAGES[stageIndex];
  const secsLeft     = Math.max(0, Math.round((totalDuration - elapsed) / 1000));
  const minsLeft     = Math.floor(secsLeft / 60);
  const sLeft        = secsLeft % 60;
  const etaStr       = minsLeft > 0 ? `~${minsLeft}m ${sLeft}s left` : `~${sLeft}s left`;

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (globalPct / 100) * circumference;

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '2rem',
      display: 'flex', flexDirection: 'column', gap: '2rem',
      justifyContent: 'center', alignItems: 'center',
    }}>
      {/* Large Circular Progress */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }}>
            {/* Background circle */}
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="5" />
            {/* Animated progress circle */}
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="#2563eb" strokeWidth="5"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '60px 60px',
                willChange: 'stroke-dashoffset',
              }}
            />
          </svg>
          {/* Progress percentage in center */}
          <span style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, color: '#1d4ed8',
            fontFamily: 'Sora, sans-serif',
          }}>
            {Math.round(globalPct)}%
          </span>
        </div>

        {/* Title and Status */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{
            fontSize: '1.25rem', fontWeight: 700, color: '#0f172a',
            margin: '0 0 0.5rem 0', fontFamily: 'Sora, sans-serif'
          }}>
            Processing candidates{dots}
          </h3>
          <p style={{
            fontSize: '0.9rem', color: '#64748b', margin: 0,
            fontFamily: 'Sora, sans-serif'
          }}>
            {totalCandidates != null && totalCandidates > 0
              ? `${totalCandidates} applicant${totalCandidates !== 1 ? 's' : ''} found · ${etaStr}`
              : `AI scoring in progress · ${etaStr}`}
          </p>
        </div>
      </div>

      {/* Large Global Progress Bar */}
      <div style={{ width: '100%', maxWidth: '320px' }}>
        <div style={{ height: 12, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{
            height: '100%', width: `${globalPct}%`,
            background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
            borderRadius: 999,
            position: 'relative', overflow: 'hidden',
            willChange: 'width',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
              animation: 'jd-shimmer 1.6s ease-in-out infinite',
            }} />
          </div>
        </div>
      </div>

      {/* Stages */}
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column' }}>
        {STAGES.map((stage, i) => {
          const isDone   = i < stageIndex;
          const isActive = i === stageIndex;
          return (
            <div key={stage.id} style={{ display: 'flex', gap: '0.75rem', position: 'relative', paddingBottom: '1rem' }}>
              {i < STAGES.length - 1 && (
                <div style={{
                  position: 'absolute', left: 15, top: 32, width: 2,
                  height: 'calc(100% - 16px)',
                  background: isDone ? '#bfdbfe' : '#f1f5f9',
                  borderRadius: 2, transition: 'background 0.3s',
                }} />
              )}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDone ? '#dbeafe' : isActive ? '#eff6ff' : '#f8fafc',
                border: `2px solid ${isDone ? '#93c5fd' : isActive ? '#2563eb' : '#e2e8f0'}`,
                boxShadow: isActive ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
                transition: 'all 0.3s',
              }}>
                {isDone ? (
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : isActive ? (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb', animation: 'jd-pulse 1.2s ease-in-out infinite' }} />
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e2e8f0' }} />
                )}
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: isActive ? '0.5rem' : 0 }}>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 700 : isDone ? 600 : 500,
                    color: isDone ? '#1d4ed8' : isActive ? '#0f172a' : '#94a3b8',
                    transition: 'color 0.3s',
                  }}>{stage.label}</span>
                  {isDone && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 999, padding: '2px 7px' }}>done</span>
                  )}
                  {isActive && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 999, padding: '2px 7px' }}>running</span>
                  )}
                </div>
                {isActive && (
                  <>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>{stage.detail}</p>
                    <div style={{ height: 4, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${stagePct}%`, background: 'linear-gradient(90deg, #1d4ed8, #60a5fa)', borderRadius: 999, willChange: 'width' }} />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes jd-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
        @keyframes jd-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};

export default ProcessingProgress;