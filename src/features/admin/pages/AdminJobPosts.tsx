import React, { useEffect, useState } from 'react';
import { getAllJobPostsApi, getAllSourcedCandidatesApi } from '../services/adminApi';
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
}) => {
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
          {loading ? (
            <div className="loading-state">
              <div className="admin-loading__spinner" />
              <p>Loading candidates...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="empty-state-admin">
              <p>No sourced candidates found yet.</p>
            </div>
          ) : (
            <div className="candidates-list-admin">
              {candidates.map((candidate) => (
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
                    <button className="btn btn--small btn--primary" onClick={() => onSelectCandidate(candidate)}>
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminJobPosts;
