import React, { useEffect, useRef, useState } from 'react';
import { JobPost } from '../slices/Jobpostslice';
import {
  getJobPostByIdApi,
  getShortlistApi,
  getCandidateScoreApi,
  closeJobPostApi,
  ShortlistEntry,
  ScoredCandidate,
} from '../services/jobPostApi';
import CandidateDrawer from '../../shortlist/pages/Candidatedrawer';
import { ProcessingProgress } from '../../../components/Processingprogress';
import './Jobdetailpage.css';

interface Props {
  jobId: string;
  onBack: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  active:  { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  open:    { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  closed:  { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  draft:   { bg: '#f8fafc', color: '#64748b', dot: '#94a3b8' },
  paused:  { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
  default: { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
};
const getStatusStyle = (s: string) => STATUS_COLORS[s?.toLowerCase()] ?? STATUS_COLORS.default;

const SkillTag: React.FC<{ label: string; variant?: 'required' | 'preferred' }> = ({ label, variant = 'required' }) => (
  <span className={`jd-skill-tag jd-skill-tag--${variant}`}>{label}</span>
);

const InfoChip: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="jd-info-chip">
    <span className="jd-info-chip__icon">{icon}</span>
    <div>
      <p className="jd-info-chip__label">{label}</p>
      <p className="jd-info-chip__value">{value}</p>
    </div>
  </div>
);

const MiniScore: React.FC<{ score: number; label: string; color: string }> = ({ score, label, color }) => (
  <div className="jd-mini-score">
    <div className="jd-mini-score__ring" style={{ '--score-color': color } as any}>
      <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
        <circle
          cx="18" cy="18" r="14" fill="none"
          stroke={color} strokeWidth="3.5"
          strokeDasharray={`${(Math.min(score, 100) / 100) * 2 * Math.PI * 14} ${2 * Math.PI * 14}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="jd-mini-score__val" style={{ color }}>{Math.round(score)}</span>
    </div>
    <span className="jd-mini-score__label">{label}</span>
  </div>
);

const normalizeSkills = (val: string | string[] | undefined): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : [val]; } catch { return [val]; }
};

/* ── minimum time the progress bar stays visible (ms) ── */
const MIN_PROGRESS_MS = 4000;
/* ── polling interval when shortlist is empty (ms) ── */
const POLL_INTERVAL_MS = 8000;

const JobDetailPage: React.FC<Props> = ({ jobId, onBack }) => {
  const [job, setJob]               = useState<JobPost | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError]     = useState('');

  const [scoredMap, setScoredMap]               = useState<Record<string, ScoredCandidate>>({});
  const [shortlistEntries, setShortlistEntries] = useState<ShortlistEntry[]>([]);
  const [totalCandidates, setTotalCandidates]   = useState(0);

  /* showProgress stays true until BOTH the API responds AND MIN_PROGRESS_MS has elapsed */
  const [showProgress, setShowProgress]         = useState(true);
  const progressStartRef                         = useRef<number>(Date.now());
  const pollTimerRef                             = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedCandidate, setSelectedCandidate] = useState<ScoredCandidate | null>(null);
  const [showCloseConfirm, setShowCloseConfirm]   = useState(false);
  const [closing, setClosing]                     = useState(false);
  const [closeError, setCloseError]               = useState('');
  const [closed, setClosed]                       = useState(false);
  const [notesMap, setNotesMap]                   = useState<Record<string, string>>({});

  /* ── load job details once ── */
  useEffect(() => {
    setJobLoading(true);
    getJobPostByIdApi(jobId)
      .then(setJob)
      .catch(() => setJobError('Failed to load job details.'))
      .finally(() => setJobLoading(false));
  }, [jobId]);

  /* ── shortlist fetch + polling ── */
  const isFirstFetchRef = useRef<boolean>(true);
  const fetchShortlist = async () => {
    try {
      const res     = await getShortlistApi(jobId);
      const entries = res.shortlist ?? [];
      const total   = res.total_candidates ?? entries.length;

      setTotalCandidates(total);

      // If first fetch already has candidates, skip the progress bar entirely
      if (isFirstFetchRef.current && entries.length > 0) {
        isFirstFetchRef.current = false;
        setShowProgress(false);
      } else if (entries.length === 0) {
        isFirstFetchRef.current = false;
        // If job is closed and has no candidates, stop — no point polling
        const jobStatus = job?.status?.toLowerCase();
        if (jobStatus === 'closed') {
          setShowProgress(false);
          return;
        }
        /* still processing — poll again */
        pollTimerRef.current = setTimeout(fetchShortlist, POLL_INTERVAL_MS);
        return;
      }

      /* we have candidates — seed notes and fetch scores */
      const notes: Record<string, string> = {};
      entries.forEach((e) => { if (e.recruiter_notes) notes[e.candidate_id] = e.recruiter_notes; });
      setNotesMap(notes);

      const settled = await Promise.allSettled(
        entries.map((e) => getCandidateScoreApi(jobId, e.candidate_id))
      );
      const map: Record<string, ScoredCandidate> = {};
      settled.forEach((result) => {
        if (result.status === 'fulfilled') map[result.value.candidate_id] = result.value;
      });
      setScoredMap(map);

      // Sort by aggregate score descending; unscored candidates go to bottom
      const sorted = [...entries].sort((a, b) => {
        const scoreA = map[a.candidate_id]?.aggregation_score ?? -1;
        const scoreB = map[b.candidate_id]?.aggregation_score ?? -1;
        return scoreB - scoreA;
      });
      setShortlistEntries(sorted);

      /* respect minimum display time only if progress was shown */
      if (showProgress) {
        const elapsed = Date.now() - progressStartRef.current;
        const remaining = Math.max(0, MIN_PROGRESS_MS - elapsed);
        setTimeout(() => setShowProgress(false), remaining);
      }

    } catch {
      /* on error, retry */
      pollTimerRef.current = setTimeout(fetchShortlist, POLL_INTERVAL_MS);
    }
  };

  useEffect(() => {
    progressStartRef.current = Date.now();
    isFirstFetchRef.current = true;
    // Only show progress for active/open jobs, not closed ones
    const status = job?.status?.toLowerCase();
    const jobIsClosedAlready = status === 'closed';
    setShowProgress(!jobIsClosedAlready);
    fetchShortlist();

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [jobId, job?.status]);

  /* ── close job ── */
  const handleClose = async () => {
    setClosing(true); setCloseError('');
    try {
      await closeJobPostApi(jobId);
      setClosed(true);
      setJob((j) => j ? { ...j, status: 'closed' } : j);
      setShowCloseConfirm(false);
    } catch (err: any) {
      setCloseError(err.response?.data?.detail || 'Failed to close job. Please try again.');
    } finally {
      setClosing(false);
    }
  };

  const isClosed    = closed || job?.status?.toLowerCase() === 'closed';
  const statusStyle = job ? getStatusStyle(job.status) : STATUS_COLORS.default;

  if (jobLoading) return (
    <div className="jd-loading">
      <div className="jd-spinner" />
      <p>Loading job details…</p>
    </div>
  );

  if (jobError || !job) return (
    <div className="jd-error">
      <span>⚠️</span>
      <p>{jobError || 'Job not found.'}</p>
      <button className="jd-back-btn" onClick={onBack}>← Back to jobs</button>
    </div>
  );

  return (
    <div className="jd-root">
      {/* ── TOP BAR ── */}
      <div className="jd-topbar">
        <button className="jd-back-btn" onClick={onBack}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Jobs
        </button>
        <div className="jd-topbar__actions">
          {!isClosed && (
            <button className="jd-close-job-btn" onClick={() => setShowCloseConfirm(true)}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Close Job
            </button>
          )}
          {isClosed && (
            <span className="jd-closed-badge">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Job Closed
            </span>
          )}
        </div>
      </div>

      <div className="jd-layout">
        {/* ── LEFT ── */}
        <div className="jd-left">
          <div className="jd-header-card">
            <div className="jd-header-card__top">
              <div className="jd-job-icon">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="jd-header-card__title-block">
                <h1>{job.job_title}</h1>
                <div className="jd-header-card__sub">
                  <span className="jd-status-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                    <span className="jd-status-dot" style={{ background: statusStyle.dot }} />
                    {job.status}
                  </span>
                  <span className="jd-version">v{job.version}</span>
                </div>
              </div>
            </div>
            <div className="jd-chips-grid">
              <InfoChip icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>} label="Location" value={job.location_preference || '—'} />
              <InfoChip icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>} label="Job Type" value={job.job_type || '—'} />
              <InfoChip icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>} label="Experience" value={`${job.min_experience}–${job.max_experience} years`} />
              <InfoChip icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>} label="Openings" value={`${job.no_of_candidates_required} position${job.no_of_candidates_required !== 1 ? 's' : ''}`} />
            </div>
          </div>

          <div className="jd-card">
            <h3 className="jd-card__title">Job Description</h3>
            <p className="jd-description">{job.description}</p>
          </div>

          <div className="jd-card">
            <h3 className="jd-card__title">Skills</h3>
            {normalizeSkills(job.required_skills as any).length > 0 && (
              <div className="jd-skills-block">
                <p className="jd-skills-label">Required</p>
                <div className="jd-skills-wrap">
                  {normalizeSkills(job.required_skills as any).map((s) => <SkillTag key={s} label={s} variant="required" />)}
                </div>
              </div>
            )}
            {normalizeSkills(job.preferred_skills as any).length > 0 && (
              <div className="jd-skills-block" style={{ marginTop: '1rem' }}>
                <p className="jd-skills-label">Preferred</p>
                <div className="jd-skills-wrap">
                  {normalizeSkills(job.preferred_skills as any).map((s) => <SkillTag key={s} label={s} variant="preferred" />)}
                </div>
              </div>
            )}
          </div>

          {job.min_educational_qualifications && (
            <div className="jd-card">
              <h3 className="jd-card__title">Minimum Education</h3>
              <p className="jd-description">{job.min_educational_qualifications}</p>
            </div>
          )}
        </div>

        {/* ── RIGHT — SHORTLIST ── */}
        <div className="jd-right">
          <div className="jd-shortlist-card">
            <div className="jd-shortlist-header">
              <div>
                <h3>Shortlisted Candidates</h3>
                <p>
                  {showProgress
                    ? 'AI is evaluating applicants…'
                    : `${totalCandidates} candidate${totalCandidates !== 1 ? 's' : ''} shortlisted`}
                </p>
              </div>
              <div className="jd-shortlist-count">
                {showProgress ? (
                  <div className="jd-spinner jd-spinner--sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                ) : totalCandidates}
              </div>
            </div>

            {showProgress ? (
              <ProcessingProgress
                isVisible={showProgress}
                totalCandidates={totalCandidates > 0 ? totalCandidates : undefined}
              />
            ) : shortlistEntries.length === 0 ? (
              <div className="jd-shortlist-empty">
                <div className="jd-shortlist-empty__icon">👤</div>
                <p>No candidates shortlisted yet.</p>
                <span>Candidates will appear here once shortlisting runs.</span>
              </div>
            ) : (
              <div className="jd-candidate-list">
                {shortlistEntries.map((entry, i) => {
                  const scored = scoredMap[entry.candidate_id];
                  return (
                    <CandidateRow
                      key={entry.candidate_id}
                      entry={entry}
                      scored={scored}
                      note={notesMap[entry.candidate_id] ?? null}
                      index={i}
                      onClick={() => scored && setSelectedCandidate(scored)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedCandidate && (
        <CandidateDrawer
          candidate={selectedCandidate}
          jobId={jobId}
          recruiterNote={notesMap[selectedCandidate.candidate_id] ?? null}
          onClose={() => setSelectedCandidate(null)}
          onNoteSaved={(candidateId, note) => setNotesMap((prev) => ({ ...prev, [candidateId]: note }))}
        />
      )}

      {showCloseConfirm && (
        <div className="jd-dialog-overlay" onClick={() => !closing && setShowCloseConfirm(false)}>
          <div className="jd-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="jd-dialog__icon">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.8"/>
                <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Close this job?</h3>
            <p>Closing <strong>{job.job_title}</strong> will stop new candidates from being sourced. This action cannot be undone.</p>
            {closeError && <div className="jd-dialog__error">{closeError}</div>}
            <div className="jd-dialog__actions">
              <button className="jd-dialog__cancel" onClick={() => setShowCloseConfirm(false)} disabled={closing}>Cancel</button>
              <button className="jd-dialog__confirm" onClick={handleClose} disabled={closing}>
                {closing ? <span className="jd-btn-spinner" /> : 'Close Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CandidateRow: React.FC<{
  entry: ShortlistEntry;
  scored: ScoredCandidate | undefined;
  note: string | null;
  index: number;
  onClick: () => void;
}> = ({ entry, scored, note, index, onClick }) => {
  const name     = scored?.candidate_name ?? null;
  const title    = scored?.title ?? null;
  const initials = name
    ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '…';
  const aiScore  = scored?.ai_score ?? null;
  const aggScore = scored?.aggregation_score ?? null;
  const hasFlags = (scored?.flags?.length ?? 0) > 0;
  const scoreColor = (s: number) => s >= 70 ? '#16a34a' : s >= 40 ? '#d97706' : '#dc2626';

  return (
    <button
      className="jd-candidate-row"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
      disabled={!scored}
    >
      <div className={`jd-candidate-avatar ${!scored ? 'jd-candidate-avatar--loading' : ''}`}>{initials}</div>
      <div className="jd-candidate-info">
        {name ? (
          <>
            <p className="jd-candidate-name">{name}</p>
            <p className="jd-candidate-sub">{title ?? 'View profile'}</p>
          </>
        ) : (
          <>
            <div className="jd-skeleton jd-skeleton--name" />
            <div className="jd-skeleton jd-skeleton--sub" />
          </>
        )}
        {hasFlags && (
          <div className="jd-row-flags">
            {scored!.flags.map((f, fi) => <span key={fi} className="jd-row-flag">{f.flag}</span>)}
          </div>
        )}
        {note && (
          <div className="jd-row-note">
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span>{note.length > 38 ? note.slice(0, 38) + '…' : note}</span>
          </div>
        )}
      </div>
      {scored ? (
        <div className="jd-row-scores">
          {aiScore !== null && <MiniScore score={aiScore} label="AI" color={scoreColor(aiScore)} />}
          {aggScore !== null && <MiniScore score={aggScore} label="Score" color={scoreColor(aggScore)} />}
        </div>
      ) : (
        <div className="jd-spinner jd-spinner--xs" />
      )}
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" className="jd-candidate-arrow">
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
};

export default JobDetailPage;