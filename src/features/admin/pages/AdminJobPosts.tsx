import React, { useEffect, useState } from 'react';
import { getAllJobPostsApi, getAllSourcedCandidatesApi, deleteSourcedCandidateApi } from '../services/adminApi';
import { ScoredCandidate } from '../../job_post/services/jobPostApi';
import { JobPost } from '../../job_post/slices/Jobpostslice';
import JobDetailPage from '../../job_post/pages/Jobdetailpage';
import CandidateDrawer from '../../shortlist/pages/Candidatedrawer';

type ViewTab = 'jobs' | 'candidates';

const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  active: { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  open: { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  closed: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  draft: { bg: '#f8fafc', color: '#64748b', dot: '#94a3b8' },
  paused: { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
  default: { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
};

const getStatusStyle = (s: string) => STATUS_COLORS[s?.toLowerCase()] ?? STATUS_COLORS.default;

const getInitials = (name: string) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'C';

const AdminJobPosts: React.FC = () => {
  const [viewTab, setViewTab] = useState<ViewTab>('jobs');
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [candidates, setCandidates] = useState<ScoredCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<ScoredCandidate | null>(null);

  useEffect(() => {
    fetchData();
  }, [viewTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (viewTab === 'jobs') {
        const data = await getAllJobPostsApi();
        setJobPosts(data);
      } else if (viewTab === 'candidates') {
        const data = await getAllSourcedCandidatesApi();
        setCandidates(data);
      }
    } catch (err) {
      setError(`Failed to load ${viewTab}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Show job details
  if (selectedJobId) {
    return (
      <JobDetailPage
        jobId={selectedJobId}
        onBack={() => setSelectedJobId(null)}
        isNewlyCreated={false}
      />
    );
  }

  // Show candidate profile
  if (selectedCandidate) {
    return (
      <div style={{ position: 'relative' }}>
        <CandidateDrawer
          candidate={selectedCandidate}
          jobId={selectedJobId || ''}
          recruiterNote={null}
          onClose={() => setSelectedCandidate(null)}
          onNoteSaved={() => {}}
          isAdmin={true}
        />
        <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <AdminJobPostsContent
            viewTab={viewTab}
            setViewTab={setViewTab}
            loading={loading}
            error={error}
            jobPosts={jobPosts}
            candidates={candidates}
            onSelectJob={setSelectedJobId}
            onSelectCandidate={setSelectedCandidate}
            onRefetchCandidates={fetchData}
          />
        </div>
      </div>
    );
  }

  return (
    <AdminJobPostsContent
      viewTab={viewTab}
      setViewTab={setViewTab}
      loading={loading}
      error={error}
      jobPosts={jobPosts}
      candidates={candidates}
      onSelectJob={setSelectedJobId}
      onSelectCandidate={setSelectedCandidate}
      onRefetchCandidates={fetchData}
    />
  );
};

interface AdminJobPostsContentProps {
  viewTab: ViewTab;
  setViewTab: (tab: ViewTab) => void;
  loading: boolean;
  error: string | null;
  jobPosts: JobPost[];
  candidates: ScoredCandidate[];
  onSelectJob: (id: string) => void;
  onSelectCandidate: (candidate: ScoredCandidate) => void;
  onRefetchCandidates?: () => Promise<void>;
}

const AdminJobPostsContent: React.FC<AdminJobPostsContentProps> = ({
  viewTab,
  setViewTab,
  loading,
  error,
  jobPosts,
  candidates,
  onSelectJob,
  onSelectCandidate,
  onRefetchCandidates,
}) => {
  const [candidateSearch, setCandidateSearch] = React.useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = React.useState<{ isOpen: boolean; candidateId: string | null; candidateName: string | null }>({
    isOpen: false,
    candidateId: null,
    candidateName: null,
  });
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Filter candidates based on search term
  const filteredCandidates = React.useMemo(() => {
    if (!candidateSearch.trim()) return candidates;

    const searchLower = candidateSearch.toLowerCase();
    return candidates.filter((candidate) => {
      const matchName = candidate.candidate_name?.toLowerCase().includes(searchLower);
      const matchEmail = candidate.candidate_email?.toLowerCase().includes(searchLower);
      const matchTitle = candidate.title?.toLowerCase().includes(searchLower);
      const matchLocation = candidate.location?.toLowerCase().includes(searchLower);
      const matchSkills = candidate.hard_skills?.some((skill) =>
        skill.toLowerCase().includes(searchLower)
      );
      return matchName || matchEmail || matchTitle || matchLocation || matchSkills;
    });
  }, [candidates, candidateSearch]);

  const handleDeleteCandidate = async () => {
    if (!deleteConfirmModal.candidateId) return;

    try {
      setDeletingId(deleteConfirmModal.candidateId);
      setDeleteError(null);
      await deleteSourcedCandidateApi(deleteConfirmModal.candidateId);
      
      // Refresh candidates list after deletion
      if (onRefetchCandidates) {
        await onRefetchCandidates();
      }
      
      setDeleteConfirmModal({ isOpen: false, candidateId: null, candidateName: null });
    } catch (err) {
      setDeleteError('Failed to delete candidate. Please try again.');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-job-posts">
      <h2 className="admin-section__title">All Posts & Candidates</h2>

      {/* ── VIEW TABS ── */}
      <div className="view-tabs">
        <button
          className={`view-tab ${viewTab === 'jobs' ? 'view-tab--active' : ''}`}
          onClick={() => setViewTab('jobs')}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Job Posts ({jobPosts.length})
        </button>
        <button
          className={`view-tab ${viewTab === 'candidates' ? 'view-tab--active' : ''}`}
          onClick={() => setViewTab('candidates')}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
          Sourced Candidates ({candidates.length})
        </button>
      </div>

      {error && (
        <div className="admin-error-banner">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── JOB POSTS VIEW ── */}
      {viewTab === 'jobs' && (
        <div className="jobs-view">
          {loading ? (
            <div className="loading-state">
              <div className="admin-loading__spinner" />
              <p>Loading job posts...</p>
            </div>
          ) : jobPosts.length === 0 ? (
            <div className="empty-state-admin">
              <p>No job posts found.</p>
            </div>
          ) : (
            <div className="jobs-grid">
              {jobPosts.map((job) => {
                const statusStyle = getStatusStyle(job.status);
                return (
                  <div key={job.job_id} className="admin-job-card">
                    <div className="admin-job-card__top">
                      <div className="admin-job-card__icon">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="admin-job-card__title-wrap">
                        <h3 className="admin-job-card__title">{job.job_title}</h3>
                        <span className="admin-job-card__type">{job.job_type}</span>
                      </div>
                      <span
                        className="admin-status-badge"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                      >
                        <span className="admin-status-dot" style={{ background: statusStyle.dot }} />
                        {job.status}
                      </span>
                    </div>

                    <p className="admin-job-card__desc">{job.description}</p>

                    <div className="admin-job-card__meta">
                      <span className="admin-meta-item">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.8"/>
                          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/>
                        </svg>
                        {job.location_preference || 'Any'}
                      </span>
                      <span className="admin-meta-item">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                        {job.min_experience}–{job.max_experience} yrs
                      </span>
                      <span className="admin-meta-item">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                        </svg>
                        {job.no_of_candidates_required} needed
                      </span>
                    </div>

                    {(job.required_skills as any)?.length > 0 && (
                      <div className="admin-job-card__skills">
                        {(job.required_skills as any[]).slice(0, 5).map((s) => (
                          <span key={s} className="admin-skill-tag">{s}</span>
                        ))}
                        {(job.required_skills as any[]).length > 5 && (
                          <span className="admin-skill-tag admin-skill-tag--more">+{(job.required_skills as any[]).length - 5}</span>
                        )}
                      </div>
                    )}

                    <div className="admin-job-card__footer">
                      <button className="admin-view-btn" onClick={() => onSelectJob(job.job_id)}>
                        View Details
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SOURCED CANDIDATES VIEW ── */}
      {viewTab === 'candidates' && (
        <div className="candidates-view">
          {/* Search bar for candidates */}
          {candidates.length > 0 && (
            <div className="candidates-search-wrapper">
              <div className="candidates-search">
                <svg className="candidates-search-icon" width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  className="candidates-search-input"
                  placeholder="Search by name, skill, email, location..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                />
                {candidateSearch && (
                  <button
                    className="candidates-search-clear"
                    onClick={() => setCandidateSearch('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              {candidateSearch && (
                <div className="search-results-info">
                  Found <strong>{filteredCandidates.length}</strong> of <strong>{candidates.length}</strong> candidates
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="admin-loading__spinner" />
              <p>Loading candidates...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="empty-state-admin">
              <p>No sourced candidates found yet.</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="empty-state-admin">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" style={{ marginBottom: '12px', opacity: 0.5 }}>
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>No candidates match your search "{candidateSearch}"</p>
              <button
                className="btn btn--secondary btn--compact"
                onClick={() => setCandidateSearch('')}
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="candidates-list-admin">
              {filteredCandidates.map((candidate) => (
                <div key={candidate.candidate_id} className="admin-candidate-item">
                  <div className="admin-candidate-avatar">
                    {getInitials(candidate.candidate_name)}
                  </div>

                  <div className="admin-candidate-info">
                    <div className="admin-candidate-header">
                      <h4 className="admin-candidate-name">{candidate.candidate_name}</h4>
                    </div>
                    <p className="admin-candidate-title">{candidate.title}</p>
                    <div className="admin-candidate-meta">
                      <span>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {candidate.candidate_email}
                      </span>
                      {candidate.location && (
                        <span>
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.8"/>
                            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/>
                          </svg>
                          {candidate.location}
                        </span>
                      )}
                      {candidate.contact_linkedin_url && (
                        <a href={candidate.contact_linkedin_url} target="_blank" rel="noreferrer" className="admin-linkedin-link">
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          LinkedIn
                        </a>
                      )}
                    </div>
                    {candidate.hard_skills && candidate.hard_skills.length > 0 && (
                      <div className="admin-candidate-skills">
                        {candidate.hard_skills.slice(0, 4).map((skill) => (
                          <span key={skill} className="admin-skill-badge">{skill}</span>
                        ))}
                        {candidate.hard_skills.length > 4 && (
                          <span className="admin-skill-badge admin-skill-badge--more">+{candidate.hard_skills.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="admin-candidate-action">
                    <button 
                      className="btn btn--small btn--primary" 
                      onClick={() => onSelectCandidate(candidate)}
                    >
                      View Profile
                    </button>
                    <button 
                      className="btn btn--small btn--danger" 
                      onClick={() => setDeleteConfirmModal({
                        isOpen: true,
                        candidateId: candidate.candidate_id,
                        candidateName: candidate.candidate_name,
                      })}
                      title="Delete candidate"
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6M5 6h14l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="delete-confirm-overlay" onClick={() => setDeleteConfirmModal({ isOpen: false, candidateId: null, candidateName: null })}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-modal__header">
              <div className="delete-confirm-modal__icon">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="delete-confirm-modal__title">Delete Candidate</h3>
            </div>

            <div className="delete-confirm-modal__content">
              <p>Are you sure you want to delete <strong>{deleteConfirmModal.candidateName}</strong>?</p>
              <p className="delete-confirm-modal__warning">This action cannot be undone.</p>
            </div>

            {deleteError && (
              <div className="admin-error-banner">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {deleteError}
              </div>
            )}

            <div className="delete-confirm-modal__footer">
              <button 
                className="btn btn--secondary" 
                onClick={() => setDeleteConfirmModal({ isOpen: false, candidateId: null, candidateName: null })}
                disabled={deletingId === deleteConfirmModal.candidateId}
              >
                Cancel
              </button>
              <button 
                className="btn btn--danger" 
                onClick={handleDeleteCandidate}
                disabled={deletingId === deleteConfirmModal.candidateId}
              >
                {deletingId === deleteConfirmModal.candidateId ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.7s linear infinite', marginRight: '6px' }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25"/>
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6M5 6h14l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobPosts;
