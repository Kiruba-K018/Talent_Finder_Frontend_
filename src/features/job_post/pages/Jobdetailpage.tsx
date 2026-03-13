import React, { useEffect, useRef, useState, useCallback } from 'react';
import { JobPost } from '../slices/Jobpostslice';
import {
  getJobPostByIdApi,
  getShortlistApi,
  getCandidateScoreApi,
  closeJobPostApi,
  getJobVersionSnapshotApi,
  ShortlistEntry,
  ScoredCandidate,
  JobVersionSnapshot,
} from '../services/jobPostApi';
import { useAppSelector } from '../../../hooks/hooks';
import CandidateDrawer from '../../shortlist/pages/Candidatedrawer';
import { ProcessingProgress } from '../../../components/Processingprogress';
import EditJobModal from './Editjobmodal';
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

const AggScore: React.FC<{ score: number }> = ({ score }) => {
  const color  = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626';
  const bg     = score >= 70 ? '#f0fdf4' : score >= 40 ? '#fffbeb' : '#fef2f2';
  const border = score >= 70 ? '#bbf7d0' : score >= 40 ? '#fde68a' : '#fecaca';
  return (
    <div className="jd-agg-score" style={{ color, background: bg, borderColor: border }}>
      <span className="jd-agg-score__val">{Math.round(score)}</span>
      <span className="jd-agg-score__label">Score</span>
    </div>
  );
};

const normalizeSkills = (val: string | string[] | undefined): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : [val]; } catch { return [val]; }
};

const MIN_PROGRESS_MS  = 4000;
const POLL_INTERVAL_MS = 8000;

/* ── Per-version shortlist state ── */
interface VersionShortlist {
  entries:       ShortlistEntry[];
  scoredMap:     Record<string, ScoredCandidate>;
  notesMap:      Record<string, string>;
  total:         number;
  showProgress:  boolean;
  progressStart: number;
  loaded:        boolean;
}

const emptyVersionShortlist = (): VersionShortlist => ({
  entries: [], scoredMap: {}, notesMap: {}, total: 0,
  showProgress: true, progressStart: Date.now(), loaded: false,
});

const JobDetailPage: React.FC<Props> = ({ jobId, onBack }) => {
  const currentUser = useAppSelector((s) => s.auth.user);
  const isAdmin = currentUser?.role_id === 1 || currentUser?.role === 'admin';

  /* ── job state ── */
  const [job,        setJob]        = useState<JobPost | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError,   setJobError]   = useState('');

  /* ── version history: map version number → shortlist state ── */
  const [versions,       setVersions]       = useState<number[]>([]);
  const [activeVersion,  setActiveVersion]  = useState<number>(1);
  const [versionData,    setVersionData]    = useState<Record<number, VersionShortlist>>({});

  /* ── version snapshots: map version number → job details at that version ── */
  const [versionSnapshots, setVersionSnapshots] = useState<Record<number, JobVersionSnapshot | null>>({});

  /* ── UI state ── */
  const [selectedCandidate, setSelectedCandidate] = useState<ScoredCandidate | null>(null);
  const [showCloseConfirm,  setShowCloseConfirm]  = useState(false);
  const [closing,           setClosing]           = useState(false);
  const [closeError,        setCloseError]        = useState('');
  const [closed,            setClosed]            = useState(false);
  const [showEditModal,     setShowEditModal]      = useState(false);

  const pollTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const isFirstFetch = useRef<Record<number, boolean>>({});

  /* ── Load job ── */
  useEffect(() => {
    setJobLoading(true);
    getJobPostByIdApi(jobId)
      .then((j) => {
        setJob(j);
        // Build version list 1..current
        const ver = j.version ?? 1;
        const allVersions = Array.from({ length: ver }, (_, i) => i + 1);
        setVersions(allVersions);
        setActiveVersion(ver); // start on latest
      })
      .catch(() => setJobError('Failed to load job details.'))
      .finally(() => setJobLoading(false));
  }, [jobId]);

  /* ── Fetch shortlist for a given version ── */
  const fetchVersionShortlist = useCallback(async (version: number, jobStatus?: string) => {
    // Init entry if missing
    setVersionData((prev) => {
      if (prev[version]) return prev;
      return { ...prev, [version]: emptyVersionShortlist() };
    });

    isFirstFetch.current[version] = isFirstFetch.current[version] ?? true;

    try {
      // Pass version as query param — backend filters shortlist by version
      const res     = await getShortlistApi(jobId, version);
      const entries = res.shortlist ?? [];
      const total   = res.total_candidates ?? entries.length;

      const firstFetch = isFirstFetch.current[version];
      isFirstFetch.current[version] = false;

      // If first fetch already has data → skip progress
      if (firstFetch && entries.length > 0) {
        setVersionData((prev) => ({ ...prev, [version]: { ...prev[version], total, showProgress: false } }));
      } else if (entries.length === 0) {
        if (jobStatus === 'closed' || (job?.status?.toLowerCase() === 'closed')) {
          setVersionData((prev) => ({ ...prev, [version]: { ...prev[version], total: 0, showProgress: false } }));
          return;
        }
        // Still processing — poll again
        pollTimers.current[version] = setTimeout(() => fetchVersionShortlist(version), POLL_INTERVAL_MS);
        return;
      }

      // Build notes map
      const notesMap: Record<string, string> = {};
      entries.forEach((e) => { if (e.recruiter_notes) notesMap[e.candidate_id] = e.recruiter_notes; });

      // Fetch scores
      const settled = await Promise.allSettled(
        entries.map((e) => getCandidateScoreApi(jobId, e.candidate_id))
      );
      const scoredMap: Record<string, ScoredCandidate> = {};
      settled.forEach((r) => { if (r.status === 'fulfilled') scoredMap[r.value.candidate_id] = r.value; });

      // Sort by aggregation_score desc
      const sorted = [...entries].sort((a, b) =>
        (scoredMap[b.candidate_id]?.aggregation_score ?? -1) -
        (scoredMap[a.candidate_id]?.aggregation_score ?? -1)
      );

      setVersionData((prev) => {
        const cur = prev[version] ?? emptyVersionShortlist();
        const elapsed   = Date.now() - cur.progressStart;
        const remaining = cur.showProgress ? Math.max(0, MIN_PROGRESS_MS - elapsed) : 0;

        if (remaining > 0) {
          setTimeout(() => {
            setVersionData((p) => ({ ...p, [version]: { ...p[version], showProgress: false } }));
          }, remaining);
        }

        return {
          ...prev,
          [version]: {
            entries: sorted, scoredMap, notesMap, total,
            showProgress: remaining > 0,
            progressStart: cur.progressStart,
            loaded: true,
          },
        };
      });
    } catch {
      pollTimers.current[version] = setTimeout(() => fetchVersionShortlist(version), POLL_INTERVAL_MS);
    }
  }, [jobId, job?.status]);

  /* ── Trigger fetch when active version changes ── */
  useEffect(() => {
    if (!job) return;
    const cur = versionData[activeVersion];
    if (!cur?.loaded) {
      fetchVersionShortlist(activeVersion, job.status?.toLowerCase());
    }
    // Fetch versioned job snapshot for non-latest versions
    const latestVer = job.version ?? 1;
    if (activeVersion < latestVer && !(activeVersion in versionSnapshots)) {
      setVersionSnapshots((prev) => ({ ...prev, [activeVersion]: null })); // sentinel
      getJobVersionSnapshotApi(jobId, activeVersion).then((snap) => {
        setVersionSnapshots((prev) => ({ ...prev, [activeVersion]: snap }));
      });
    }
  }, [activeVersion, job]);

  /* ── Cleanup poll timers on unmount ── */
  useEffect(() => {
    return () => { Object.values(pollTimers.current).forEach(clearTimeout); };
  }, []);

  /* ── Close job ── */
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

  /* ── Handle job updated (new version) ── */
  const handleJobUpdated = (updated: JobPost) => {
    setJob(updated);
    const newVer = updated.version ?? 1;
    setVersions((prev) => (prev.includes(newVer) ? prev : [...prev, newVer]));
    setActiveVersion(newVer);
    // Clear cached data for new version so it fetches fresh
    setVersionData((prev) => ({ ...prev, [newVer]: { ...emptyVersionShortlist(), progressStart: Date.now() } }));
    isFirstFetch.current[newVer] = true;
  };

  /* ── Ownership ── */
  const isOwner = currentUser && job && (
    (currentUser as any).user_id === job.created_by ||
    (currentUser as any).id      === job.created_by
  );

  const isClosed    = closed || job?.status?.toLowerCase() === 'closed';
  const statusStyle = job ? getStatusStyle(job.status) : STATUS_COLORS.default;

  /* ── Active version's shortlist data ── */
  const vd = versionData[activeVersion];

  /* ── Note update helper ── */
  const handleNoteSaved = (candidateId: string, note: string) => {
    setVersionData((prev) => ({
      ...prev,
      [activeVersion]: {
        ...prev[activeVersion],
        notesMap: { ...prev[activeVersion].notesMap, [candidateId]: note },
      },
    }));
  };

  if (jobLoading) return (
    <div className="jd-loading"><div className="jd-spinner" /><p>Loading job details…</p></div>
  );
  if (jobError || !job) return (
    <div className="jd-error">
      <span>⚠️</span><p>{jobError || 'Job not found.'}</p>
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
              <InfoChip icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>} label="Shortlist" value={`${job.no_of_candidates_required} candidate${job.no_of_candidates_required !== 1 ? 's' : ''}`} />
            </div>
          </div>

          {(() => {
            // For non-latest versions, show snapshotted job details if available
            const latestVer = job.version ?? 1;
            const isLatest  = activeVersion === latestVer;
            const snap      = !isLatest ? versionSnapshots[activeVersion] : null;
            const desc         = snap ? snap.description        : job.description;
            const reqSkills    = snap ? snap.required_skills    : job.required_skills;
            const prefSkills   = snap ? snap.preferred_skills   : job.preferred_skills;
            const edu          = snap ? snap.min_educational_qualifications : job.min_educational_qualifications;
            return (
              <>
                <div className="jd-card">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.5rem' }}>
                    <h3 className="jd-card__title" style={{ margin:0 }}>Job Description</h3>
                    {!isLatest && (
                      <span className="jd-version-snapshot-badge">v{activeVersion} snapshot</span>
                    )}
                  </div>
                  <p className="jd-description">{desc}</p>
                </div>

                <div className="jd-card">
                  <h3 className="jd-card__title">Skills</h3>
                  {normalizeSkills(reqSkills as any).length > 0 && (
                    <div className="jd-skills-block">
                      <p className="jd-skills-label">Required</p>
                      <div className="jd-skills-wrap">
                        {normalizeSkills(reqSkills as any).map((s) => <SkillTag key={s} label={s} variant="required" />)}
                      </div>
                    </div>
                  )}
                  {normalizeSkills(prefSkills as any).length > 0 && (
                    <div className="jd-skills-block" style={{ marginTop: '1rem' }}>
                      <p className="jd-skills-label">Preferred</p>
                      <div className="jd-skills-wrap">
                        {normalizeSkills(prefSkills as any).map((s) => <SkillTag key={s} label={s} variant="preferred" />)}
                      </div>
                    </div>
                  )}
                </div>

                {edu && (
                  <div className="jd-card">
                    <h3 className="jd-card__title">Minimum Education</h3>
                    <p className="jd-description">{Array.isArray(edu) ? edu.join(', ') : edu}</p>
                  </div>
                )}
              </>
            );
          })()}

          {/* Owner-only actions */}
          {isOwner && (
            <div className="jd-owner-actions">
              {!isClosed && (
                <button className="jd-edit-btn" onClick={() => setShowEditModal(true)}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit Job
                </button>
              )}
              {!isClosed && (
                <button className="jd-close-job-btn" onClick={() => setShowCloseConfirm(true)}>
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
          )}
        </div>

        {/* ── RIGHT — SHORTLIST ── */}
        <div className="jd-right">
          <div className="jd-shortlist-card">

            {/* Header */}
            <div className="jd-shortlist-header">
              <div>
                <h3>Shortlisted Candidates</h3>
                <p>
                  {vd?.showProgress
                    ? 'AI is evaluating applicants…'
                    : `${vd?.total ?? 0} candidate${(vd?.total ?? 0) !== 1 ? 's' : ''} shortlisted`}
                </p>
              </div>
              <div className="jd-shortlist-count">
                {vd?.showProgress
                  ? <div className="jd-spinner jd-spinner--sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                  : (vd?.total ?? 0)}
              </div>
            </div>

            {/* Version tabs — only show if more than 1 version */}
            {versions.length > 1 && (
              <div className="jd-version-tabs">
                {versions.map((v) => (
                  <button
                    key={v}
                    className={`jd-version-tab ${activeVersion === v ? 'jd-version-tab--active' : ''}`}
                    onClick={() => setActiveVersion(v)}
                  >
                    v{v}
                    {v === Math.max(...versions) && (
                      <span className="jd-version-tab__latest">latest</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            {!vd || (vd.showProgress && !isAdmin) ? (
              <ProcessingProgress isVisible={true} totalCandidates={vd?.total > 0 ? vd.total : undefined} />
            ) : vd.entries.length === 0 ? (
              <div className="jd-shortlist-empty">
                <div className="jd-shortlist-empty__icon">👤</div>
                <p>No candidates shortlisted yet.</p>
                <span>Candidates will appear here once shortlisting runs.</span>
              </div>
            ) : (
              <div className="jd-candidate-list">
                {vd.entries.map((entry, i) => {
                  const scored = vd.scoredMap[entry.candidate_id];
                  return (
                    <CandidateRow
                      key={entry.candidate_id}
                      entry={entry}
                      scored={scored}
                      note={vd.notesMap[entry.candidate_id] ?? null}
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

      {/* ── Candidate drawer ── */}
      {selectedCandidate && (
        <CandidateDrawer
          candidate={selectedCandidate}
          jobId={jobId}
          recruiterNote={vd?.notesMap[selectedCandidate.candidate_id] ?? null}
          onClose={() => setSelectedCandidate(null)}
          onNoteSaved={handleNoteSaved}
        />
      )}

      {/* ── Edit modal (owner only) ── */}
      {showEditModal && isOwner && (
        <EditJobModal
          job={job}
          onClose={() => setShowEditModal(false)}
          onUpdated={handleJobUpdated}
        />
      )}

      {/* ── Close confirm dialog ── */}
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

/* ── CandidateRow ── */
const CandidateRow: React.FC<{
  entry: ShortlistEntry;
  scored: ScoredCandidate | undefined;
  note: string | null;
  index: number;
  onClick: () => void;
}> = ({ entry, scored, note, index, onClick }) => {
  const name     = scored?.candidate_name ?? null;
  const title    = scored?.title ?? null;
  const initials = name ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '…';
  const aggScore = scored?.aggregation_score ?? null;
  const hasFlags = (scored?.flags?.length ?? 0) > 0;

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
      {scored ? (aggScore !== null ? <AggScore score={aggScore} /> : null) : <div className="jd-spinner jd-spinner--xs" />}
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" className="jd-candidate-arrow">
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
};

export default JobDetailPage;