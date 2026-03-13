import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import { fetchJobsThunk, logoutThunk, fetchUserProfileThunk } from '../../job_post/slices/Jobpostthunks';
import { JobPost } from '../../job_post/slices/Jobpostslice';
import CreateJobModal from '../../../components/Createjobmodal';
import EditJobModal from '../../job_post/pages/Editjobmodal';
import './Recruiterdashboard.css';

const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  active:  { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  open:    { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  closed:  { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  draft:   { bg: '#f8fafc', color: '#64748b', dot: '#94a3b8' },
  paused:  { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
  default: { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
};

const getStatusStyle = (s: string) => STATUS_COLORS[s?.toLowerCase()] ?? STATUS_COLORS.default;

const getInitials = (name: string) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'R';

/* ─── JobCard ────────────────────────────────────────────────────────────── */
const JobCard: React.FC<{
  job: JobPost;
  index: number;
  isOwner: boolean;
  onSelect: () => void;
  onEdit: () => void;
}> = ({ job, index, isOwner, onSelect, onEdit }) => {
  const statusStyle = getStatusStyle(job.status);
  const isClosed    = job.status?.toLowerCase() === 'closed';
  const version     = job.version ?? 1;

  return (
    <div className="rd-job-card" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="rd-job-card__top">
        <div className="rd-job-card__icon">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="rd-job-card__title-wrap">
          <div className="rd-job-card__title-row">
            <h3 className="rd-job-card__title">{job.job_title}</h3>
            {version > 1 && <span className="rd-version-badge">v{version}</span>}
          </div>
          <span className="rd-job-card__type">{job.job_type}</span>
        </div>
        <div className="rd-job-card__badges">
          <span
            className="rd-status-badge"
            style={{ background: statusStyle.bg, color: statusStyle.color }}
          >
            <span className="rd-status-dot" style={{ background: statusStyle.dot }} />
            {job.status}
          </span>
          {/* Edit icon — owner only, not closed */}
          {isOwner && !isClosed && (
            <button
              className="rd-edit-icon-btn"
              title="Edit job post"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className="rd-job-card__desc">{job.description}</p>

      <div className="rd-job-card__meta">
        <span className="rd-meta-item">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
          {job.location_preference || '—'}
        </span>
        <span className="rd-meta-item">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          {job.min_experience}–{job.max_experience} yrs
        </span>
        <span className="rd-meta-item">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          {job.no_of_candidates_required} candidates
        </span>
      </div>

      {(job.required_skills as any)?.length > 0 && (
        <div className="rd-job-card__skills">
          {(job.required_skills as any[]).slice(0, 5).map((s) => (
            <span key={s} className="rd-skill-tag">{s}</span>
          ))}
          {(job.required_skills as any[]).length > 5 && (
            <span className="rd-skill-tag rd-skill-tag--more">+{(job.required_skills as any[]).length - 5}</span>
          )}
        </div>
      )}

      <div className="rd-job-card__footer">
        <button className="rd-view-btn" onClick={onSelect}>
          View Details
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

/* ─── EmptyState ─────────────────────────────────────────────────────────── */
const EmptyState: React.FC<{ onNew: () => void }> = ({ onNew }) => (
  <div className="rd-empty">
    <div className="rd-empty__illustration">
      <svg width="64" height="64" fill="none" viewBox="0 0 64 64">
        <rect x="8" y="18" width="48" height="34" rx="6" fill="#dbeafe"/>
        <rect x="20" y="10" width="24" height="12" rx="4" fill="#93c5fd"/>
        <path d="M24 38h16M24 44h10" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="48" cy="48" r="10" fill="#1d4ed8"/>
        <path d="M48 44v8M44 48h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
    <h3>No job posts yet</h3>
    <p>Create your first job opening to start sourcing candidates.</p>
    <button className="rd-new-btn" onClick={onNew}>
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      Create Job Post
    </button>
  </div>
);

/* ─── RecruiterDashboard ─────────────────────────────────────────────────── */
type FilterTab = 'all' | 'open' | 'mine';

const RecruiterDashboard: React.FC<{ onJobSelect?: (id: string) => void }> = ({ onJobSelect }) => {
  const dispatch    = useAppDispatch();
  const { user }   = useAppSelector((s) => s.auth);
  const { jobs: storeJobs, loading, error } = useAppSelector((s) => s.jobPost);

  // Local copy so we can patch optimistically after edits
  const [jobs,         setJobs]         = useState<JobPost[]>([]);
  const [showModal,    setShowModal]    = useState(false);
  const [editingJob,   setEditingJob]   = useState<JobPost | null>(null);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTab,    setFilterTab]    = useState<FilterTab>('open');
  const [profileOpen,  setProfileOpen]  = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => { dispatch(fetchUserProfileThunk() as any); dispatch(fetchJobsThunk() as any); }, []);
  useEffect(() => { setJobs(storeJobs); }, [storeJobs]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => dispatch(logoutThunk() as any);

  const currentUserId = (user as any)?.user_id ?? (user as any)?.id;

  // After a successful edit, patch the card in-place
  const handleJobUpdated = (updated: JobPost) => {
    setJobs((prev) => prev.map((j) => j.job_id === updated.job_id ? updated : j));
    setEditingJob(null);
  };

  // Pre-filter by tab (open / mine / all) then by search + status dropdown
  const tabFiltered = jobs.filter((j) => {
    if (filterTab === 'open') return ['open','active'].includes(j.status?.toLowerCase());
    if (filterTab === 'mine') return j.created_by === currentUserId;
    return true;
  });

  const filtered = tabFiltered.filter((j) => {
    const matchSearch =
      j.job_title?.toLowerCase().includes(search.toLowerCase()) ||
      j.location_preference?.toLowerCase().includes(search.toLowerCase()) ||
      j.job_type?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || j.status?.toLowerCase() === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = tabFiltered.reduce<Record<string, number>>((acc, j) => {
    const s = j.status?.toLowerCase() || 'unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const statuses = ['all', ...Array.from(new Set(tabFiltered.map((j) => j.status?.toLowerCase()).filter(Boolean)))];

  const mineCount = jobs.filter((j) => j.created_by === currentUserId).length;

  return (
    <div className="rd-root">
      {/* ─── HEADER ─── */}
      <header className="rd-header">
        <div className="rd-header__left">
          <div className="rd-brand">
            <div className="rd-brand__logo">
              <svg width="28" height="28" viewBox="0 0 38 38" fill="none">
                <circle cx="19" cy="19" r="19" fill="white" fillOpacity="0.15"/>
                <path d="M19 10C15.13 10 12 13.13 12 17C12 19.55 13.37 21.78 15.42 23.01L13 28H25L22.58 23.01C24.63 21.78 26 19.55 26 17C26 13.13 22.87 10 19 10Z" fill="white"/>
                <circle cx="19" cy="17" r="3" fill="#1D4ED8"/>
              </svg>
            </div>
            <span className="rd-brand__name">TalentFinder</span>
          </div>
          <nav className="rd-nav">
            <span className="rd-nav__item rd-nav__item--active">Jobs</span>
          </nav>
        </div>

        <div className="rd-header__right">
          <div className="rd-profile-wrap" ref={profileRef}>
            <button className="rd-profile-btn" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}>
              <div className="rd-avatar">{getInitials(user?.full_name || 'Recruiter')}</div>
              <div className="rd-profile-info">
                <span className="rd-profile-name">{user?.full_name || 'Recruiter'}</span>
                <span className="rd-profile-role">{user?.role || 'Recruiter'}</span>
              </div>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: 'rgba(255,255,255,0.6)' }}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {profileOpen && (
              <div className="rd-profile-dropdown">
                <div className="rd-dropdown-user">
                  <div className="rd-avatar rd-avatar--lg">{getInitials(user?.full_name || 'R')}</div>
                  <div>
                    <div className="rd-dropdown-name">{user?.full_name || 'Recruiter'}</div>
                    <div className="rd-dropdown-email">{user?.email || ''}</div>
                  </div>
                </div>
                <div className="rd-dropdown-divider" />
                <button className="rd-dropdown-item rd-dropdown-item--danger" onClick={handleLogout}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main className="rd-main">
        {/* Page title bar */}
        <div className="rd-page-bar">
          <div>
            <h1 className="rd-page-title">Job Posts</h1>
            <p className="rd-page-subtitle">
              {jobs.length > 0
                ? `${jobs.length} job post${jobs.length !== 1 ? 's' : ''} · ${jobs.filter(j => ['active','open'].includes(j.status?.toLowerCase())).length} active`
                : 'Manage and track your open positions'}
            </p>
          </div>
          <button className="rd-new-btn" onClick={() => setShowModal(true)}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Job Post
          </button>
        </div>

        {/* Stats bar */}
        {jobs.length > 0 && (
          <div className="rd-stats-bar">
            {[
              { label: 'Total Posts', value: jobs.length, icon: '📋' },
              { label: 'Active',      value: jobs.filter(j => ['active','open'].includes(j.status?.toLowerCase())).length, icon: '✅' },
              { label: 'My Posts',    value: mineCount, icon: '👤' },
              { label: 'Locations',   value: new Set(jobs.map(j => j.location_preference).filter(Boolean)).size, icon: '📍' },
            ].map((stat) => (
              <div key={stat.label} className="rd-stat-card">
                <span className="rd-stat-icon">{stat.icon}</span>
                <div>
                  <div className="rd-stat-value">{stat.value}</div>
                  <div className="rd-stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Controls bar */}
        {jobs.length > 0 && (
          <div className="rd-controls">
            {/* Search */}
            <div className="rd-search-wrap">
              <svg className="rd-search-icon" width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                className="rd-search"
                placeholder="Search by title, location, type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <button className="rd-search-clear" onClick={() => setSearch('')}>×</button>}
            </div>

            {/* Primary tabs: Open / My Posts / All */}
            <div className="rd-tab-group">
              {([
                { key: 'open', label: 'Open' },
                { key: 'mine', label: 'My Posts' },
                { key: 'all',  label: 'All' },
              ] as { key: FilterTab; label: string; count?: number }[]).map(({ key, label, count }) => (
                <button
                  key={key}
                  className={`rd-tab ${filterTab === key ? 'rd-tab--active' : ''}`}
                  onClick={() => { setFilterTab(key); setFilterStatus('all'); }}
                >
                  {label}
                  {count !== undefined && count > 0 && (
                    <span className="rd-tab-count">{count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Secondary status filter */}
            {/* <div className="rd-filter-tabs">
              {statuses.map((s) => (
                <button
                  key={s}
                  className={`rd-filter-tab ${filterStatus === s ? 'rd-filter-tab--active' : ''}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  <span className="rd-filter-count">
                    {s === 'all' ? tabFiltered.length : statusCounts[s] || 0}
                  </span>
                </button>
              ))}
            </div> */}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="rd-loading">
            <div className="rd-loading__spinner" />
            <p>Loading job posts…</p>
          </div>
        ) : error ? (
          <div className="rd-error-state">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.8"/>
              <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h3>Failed to load jobs</h3>
            <p>{error}</p>
            <button className="rd-new-btn" onClick={() => dispatch(fetchJobsThunk() as any)}>Try Again</button>
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState onNew={() => setShowModal(true)} />
        ) : filtered.length === 0 ? (
          <div className="rd-no-results">
            <p>No jobs match your search.</p>
            <button className="rd-link-btn" onClick={() => { setSearch(''); setFilterStatus('all'); setFilterTab('all'); }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="rd-grid">
            {filtered.map((job, i) => (
              <JobCard
                key={job.job_id}
                job={job}
                index={i}
                isOwner={job.created_by === currentUserId}
                onSelect={() => onJobSelect?.(job.job_id)}
                onEdit={() => setEditingJob(job)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      {showModal && (
        <CreateJobModal
          onClose={() => setShowModal(false)}
          onCreated={() => dispatch(fetchJobsThunk() as any)}
        />
      )}

      {/* Edit modal — only for job owner */}
      {editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onUpdated={handleJobUpdated}
        />
      )}
    </div>
  );
};

export default RecruiterDashboard;