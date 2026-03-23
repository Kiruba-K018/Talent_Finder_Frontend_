import React, { useEffect, useState } from 'react';
import type { SourceRunConfig, SourceRun, SourcingConfigResponse, ScoredCandidate } from '../services/adminApi';
import {
  getSourceRunConfigApi,
  createSourceRunConfigApi,
  updateSourceRunConfigApi,
  triggerSourceRunManuallyApi,
  getSourceRunsHistoryApi,
  getSourceRunsHistoryWithConfigApi,
  getSourcingConfigByIdApi,
  getSourcedCandidatesByRunIdApi,
  deleteSourceRunApi,
} from '../services/adminApi';

type Tab = 'config' | 'history';

// Progress Bar Modal Component
const ProgressBarModal: React.FC<{
  isOpen: boolean;
  progress: number;
  message: string;
  onClose?: () => void;
}> = ({ isOpen, progress, message, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className="progress-overlay" onClick={handleBackdropClick}>
      <div className="progress-modal">
        <div className="progress-modal__content">
          <div className="progress-modal__spinner">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 2s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25"/>
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h3 className="progress-modal__title">Processing Source Run</h3>
          <p className="progress-modal__message">{message}</p>
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-bar__text">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Source Run Detail Modal Component
const SourceRunDetailModal: React.FC<{
  isOpen: boolean;
  sourceRun: SourceRun | null;
  onClose?: () => void;
  onRefresh?: () => void;
  candidatesPage?: number;
  setCandidatesPage?: (page: number) => void;  
  CANDIDATES_PER_PAGE?: number;
  renderPaginationControls?: (currentPage: number, totalItems: number, itemsPerPage: number, onPageChange: (page: number) => void) => React.ReactNode;
}> = ({ isOpen, sourceRun, onClose, onRefresh = () => {}, candidatesPage = 1, setCandidatesPage = () => {}, CANDIDATES_PER_PAGE = 8, renderPaginationControls = () => null }) => {
  const [config, setConfig] = useState<SourcingConfigResponse | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [candidates, setCandidates] = useState<ScoredCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && sourceRun) {
      setConfigLoading(true);
      setCandidatesLoading(true);
      setCandidatesPage(1);
      
      Promise.all([
        getSourcingConfigByIdApi(sourceRun.config_id).then((configData) => {
          setConfig(configData);
          setConfigLoading(false);
        }),
        getSourcedCandidatesByRunIdApi(sourceRun.source_run_id).then((candidatesData) => {
          setCandidates(candidatesData);
          setCandidatesLoading(false);
        }),
      ]);
    }
  }, [isOpen, sourceRun]);

  if (!isOpen || !sourceRun) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '—';
    try {
      // Handle time format HH:MM:SS or ISO string
      if (timeString.includes(':')) {
        return timeString.substring(0, 5); // HH:MM
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  const handleDeleteSourceRun = async () => {
    try {
      setIsDeleting(true);
      await deleteSourceRunApi(sourceRun.source_run_id);
      setShowDeleteConfirm(false);
      onRefresh();
      onClose?.();
    } catch (error) {
      console.error('Failed to delete source run:', error);
      alert('Failed to delete source run. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: '#22c55e',
      pending: '#f59e0b',
      in_progress: '#3b82f6',
      failed: '#ef4444',
    };
    return colors[status] || '#64748b';
  };

  const getStatusBgColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: '#f0fdf4',
      pending: '#fffbeb',
      in_progress: '#eff6ff',
      failed: '#fef2f2',
    };
    return colors[status] || '#f8fafc';
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '0.75rem 0.75rem 0 0',
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
              Source Run Details
            </h2>
            <p style={{ margin: '0', fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
              ID: <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>
                {sourceRun.source_run_id.substring(0, 16)}...
              </code>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.375rem',
              color: '#64748b',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '2.5rem',
          overflowY: 'auto',
          flex: '1',
        }}>
          {/* Status Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            marginBottom: '2.5rem',
            padding: '1.25rem',
            backgroundColor: getStatusBgColor(sourceRun.status),
            borderRadius: '0.5rem',
            borderLeft: `5px solid ${getStatusColor(sourceRun.status)}`,
          }}>
            <div>
              <span style={{
                display: 'inline-block',
                backgroundColor: getStatusColor(sourceRun.status),
                color: '#ffffff',
                padding: '0.625rem 1.25rem',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {sourceRun.status.replace('_', ' ')}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Duration</div>
              <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: '700' }}>
                {sourceRun.completed_at
                  ? `${Math.round((new Date(sourceRun.completed_at).getTime() - new Date(sourceRun.run_at).getTime()) / 1000)}s`
                  : 'In Progress'}
              </div>
            </div>
          </div>

          {/* Two Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
            {/* Run Information Card */}
            <div style={{
              padding: '1.75rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.625rem',
              border: '1px solid #cbd5e1',
            }}>
              <h3 style={{
                margin: '0 0 1.5rem 0',
                fontSize: '1rem',
                fontWeight: '700',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Run Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  { label: 'Started At', value: formatDate(sourceRun.run_at) },
                  { label: 'Completed At', value: sourceRun.completed_at ? formatDate(sourceRun.completed_at) : '—' },
                  { label: 'Resumes Fetched', value: sourceRun.number_of_resume_fetched.toString(), highlight: true },
                  { label: 'Platform', value: sourceRun.platform_id },
                ].map((item, idx) => (
                  <div key={idx} style={{ borderBottom: idx < 3 ? '1px solid #e2e8f0' : 'none', paddingBottom: idx < 3 ? '1rem' : '0' }}>
                    <label style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '0.375rem',
                    }}>
                      {item.label}
                    </label>
                    <div style={{
                      fontSize: '0.95rem',
                      color: '#1e293b',
                      fontWeight: item.highlight ? '700' : '500',
                    }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuration Card */}
            <div style={{
              padding: '1.75rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.625rem',
              border: '1px solid #cbd5e1',
            }}>
              <h3 style={{
                margin: '0 0 1.5rem 0',
                fontSize: '1rem',
                fontWeight: '700',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/>
                  <path d="M12 1v6m0 6v6"/>
                  <circle cx="12" cy="12" r="11"/>
                </svg>
                Configuration
              </h3>
              {configLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 2a10 10 0 0 0 0 20"/>
                    </svg>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Loading...</div>
                </div>
              ) : config ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {[
                    { label: 'Frequency', value: config.frequency, capitalize: true },
                    { label: 'Scheduled Time', value: formatTime(config.scheduled_time) },
                    { label: 'Scheduled Day', value: config.scheduled_day || '—' },
                    { label: 'Max Profiles', value: config.max_profiles.toString() },
                    { label: 'Active', value: config.is_active ? 'Yes' : 'No', badge: config.is_active },
                  ].map((item, idx) => (
                    <div key={idx} style={{ borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none', paddingBottom: idx < 4 ? '1rem' : '0' }}>
                      <label style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '0.375rem',
                      }}>
                        {item.label}
                      </label>
                      <div style={{
                        fontSize: '0.95rem',
                        color: '#1e293b',
                        fontWeight: '500',
                      }}>
                        {item.badge !== undefined ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '0.4rem 0.9rem',
                            borderRadius: '0.375rem',
                            backgroundColor: item.badge ? '#f0fdf4' : '#fef2f2',
                            color: item.badge ? '#166534' : '#991b1b',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            border: `1px solid ${item.badge ? '#bbf7d0' : '#fecaca'}`,
                          }}>
                            {item.value}
                          </span>
                        ) : (
                          item.capitalize ? item.value.charAt(0).toUpperCase() + item.value.slice(1) : item.value
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                  Unable to load configuration
                </div>
              )}
            </div>
          </div>

          {/* Skills Section */}
          {config && (
            <div style={{
              padding: '1.75rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '0.625rem',
              border: '1px solid #bae6fd',
              marginBottom: '1.5rem',
            }}>
              <h3 style={{
                margin: '0 0 1rem 0',
                fontSize: '1rem',
                fontWeight: '700',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                Search Skills
              </h3>
              {config.search_skills && config.search_skills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {config.search_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#dbeafe',
                        color: '#0c4a6e',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        border: '1px solid #0284c7',
                      }}
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>No skills configured</div>
              )}
            </div>
          )}

          {/* Location Section */}
          {config && (
            <div style={{
              padding: '1.75rem',
              backgroundColor: '#fef3c7',
              borderRadius: '0.625rem',
              border: '1px solid #fcd34d',
              marginBottom: '1.5rem',
            }}>
              <h3 style={{
                margin: '0 0 0.75rem 0',
                fontSize: '1rem',
                fontWeight: '700',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Search Location
              </h3>
              <div style={{
                fontSize: '1rem',
                color: '#a16207',
                fontWeight: '700',
                padding: '0.875rem',
                backgroundColor: '#fffbeb',
                borderRadius: '0.375rem',
              }}>
                📍 {config.search_location || '—'}
              </div>
            </div>
          )}

          {/* Sourced Candidates Section */}
          <div style={{
            padding: '1.75rem',
            backgroundColor: '#f5f3ff',
            borderRadius: '0.625rem',
            border: '1px solid #ddd6fe',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{
              margin: '0 0 1.5rem 0',
              fontSize: '1rem',
              fontWeight: '700',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Sourced Candidates ({candidates.length})
            </h3>
            {candidatesLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2a10 10 0 0 0 0 20"/>
                  </svg>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Loading candidates...</div>
              </div>
            ) : candidates.length > 0 ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {candidates
                    .slice((candidatesPage - 1) * CANDIDATES_PER_PAGE, candidatesPage * CANDIDATES_PER_PAGE)
                    .map((candidate, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '1rem',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e0d9f7',
                          borderRadius: '0.375rem',
                          fontSize: '0.9rem',
                          color: '#1e293b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#7c3aed',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          flexShrink: 0,
                        }}>
                          {(candidatesPage - 1) * CANDIDATES_PER_PAGE + idx + 1}
                        </span>
                        <span>{candidate.candidate_name || 'Unknown Candidate'}</span>
                      </div>
                    ))}
                </div>
                {renderPaginationControls(candidatesPage, candidates.length, CANDIDATES_PER_PAGE, setCandidatesPage)}
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#64748b',
                fontSize: '0.9rem',
              }}>
                No candidates were sourced in this run
              </div>
            )}
          </div>

          {/* Error Section */}
          {sourceRun.error_message && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fef2f2',
              borderRadius: '0.625rem',
              border: '1px solid #fecaca',
              borderLeft: '5px solid #ef4444',
              marginBottom: '1.5rem',
            }}>
              <h3 style={{
                margin: '0 0 0.75rem 0',
                fontSize: '1rem',
                fontWeight: '700',
                color: '#7f1d1d',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12" stroke="#fef2f2" strokeWidth="2"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" stroke="#fef2f2" strokeWidth="2"/>
                </svg>
                Error
              </h3>
              <div style={{
                fontSize: '0.95rem',
                color: '#7f1d1d',
                wordBreak: 'break-word',
                lineHeight: '1.6',
              }}>
                {sourceRun.error_message}
              </div>
            </div>
          )}

          {/* Metadata */}
          {config && (
            <div style={{
              padding: '1.25rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '0.625rem',
              border: '1px solid #bae6fd',
              fontSize: '0.85rem',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <div style={{ color: '#0369a1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Config ID</div>
                  <div style={{ fontFamily: 'monospace', color: '#0c4a6e', wordBreak: 'break-all', fontSize: '0.8rem' }}>
                    {config.id}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#0369a1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Created</div>
                  <div style={{ color: '#0c4a6e' }}>
                    {new Date(config.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem 2.5rem',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          borderRadius: '0 0 0.75rem 0.75rem',
        }}>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            style={{
              padding: '0.75rem 1.75rem',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? '0.6' : '1',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.backgroundColor = '#dc2626';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.75rem',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1e293b';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0f172a';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Close Modal
          </button>
        </div>

        {/* Confirmation Dialog Overlay */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '400px',
              width: '90%',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}>
              <div>
                <h3 style={{
                  margin: '0 0 0.75rem 0',
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#ef4444">
                    <circle cx="12" cy="12" r="10"/>
                    <text x="12" y="16" textAnchor="middle" fontSize="16" fill="white" fontWeight="bold">!</text>
                  </svg>
                  Delete Source Run
                </h3>
                <p style={{
                  margin: '0',
                  fontSize: '0.95rem',
                  color: '#64748b',
                  lineHeight: '1.6',
                }}>
                  Are you sure you want to delete this source run? This action cannot be undone and all associated data will be permanently removed.
                </p>
              </div>
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
              }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  style={{
                    padding: '0.65rem 1.5rem',
                    backgroundColor: '#e2e8f0',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? '0.6' : '1',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.backgroundColor = '#cbd5e1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#e2e8f0';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSourceRun}
                  disabled={isDeleting}
                  style={{
                    padding: '0.65rem 1.5rem',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? '0.6' : '1',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SourceRunConfig: React.FC = () => {
  const [config, setConfig] = useState<SourceRunConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [manualTriggering, setManualTriggering] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [sourceRuns, setSourceRuns] = useState<SourceRun[]>([]);
  const [sourceRunsLoading, setSourceRunsLoading] = useState(false);
  const [selectedSourceRun, setSelectedSourceRun] = useState<SourceRun | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Pagination for source runs history table
  const [sourceRunsPage, setSourceRunsPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Pagination for modal candidates
  const [candidatesPage, setCandidatesPage] = useState(1);
  const CANDIDATES_PER_PAGE = 8;

  const [formData, setFormData] = useState<SourceRunConfig>({
    frequency: 'weekly',
    keywords: [],
    platform: 'Postfreejobs',
    locations: [],
    department: '',
    experience_min: 0,
    experience_max: 10,
    education_requirements: [],
    other_keywords: [],
    // added backend-required fields
    scheduled_time: '',
    search_skills: [],
    search_location: '',
    max_profiles: 0,
    is_active: false,
  });

  const [inputValues, setInputValues] = useState({
    keyword: '',
    location: '',
    education: '',
    otherKeyword: '',
  });

  // input for search_skills separate from keywords
  const [searchSkillInput, setSearchSkillInput] = useState('');

  // Fetch existing config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const existingConfig = await getSourceRunConfigApi();
        if (existingConfig) {
          setConfig(existingConfig);
          setFormData({
            ...existingConfig,
            scheduled_time: existingConfig.scheduled_time || '',
            search_skills: existingConfig.search_skills || [],
            search_location: existingConfig.search_location || '',
            max_profiles: existingConfig.max_profiles || 0,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Fetch source runs when history tab is selected
  useEffect(() => {
    if (activeTab === 'history') {
      fetchSourceRuns();
      setSourceRunsPage(1);
    }
  }, [activeTab]);

  const fetchSourceRuns = async () => {
    try {
      setSourceRunsLoading(true);
      const runsWithConfig = await getSourceRunsHistoryWithConfigApi();
      setSourceRuns(runsWithConfig);
    } catch (err) {
      console.error('Failed to fetch source runs:', err);
      setError('Failed to load source runs history');
    } finally {
      setSourceRunsLoading(false);
    }
  };

  const calculateDuration = (startTime: string, endTime: string | null): string => {
    if (!endTime) return '—';
    try {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      if (isNaN(start) || isNaN(end)) return '—';
      
      const durationMs = end - start;
      const durationMinutes = Math.round(durationMs / (1000 * 60));
      return durationMinutes > 0 ? `${durationMinutes}` : '< 1';
    } catch {
      return '—';
    }
  };

  const renderPaginationControls = (currentPage: number, totalItems: number, itemsPerPage: number, onPageChange: (page: number) => void) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1.5rem 1rem',
        borderTop: '1px solid #e2e8f0',
        marginTop: '1rem',
      }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #cbd5e1',
            borderRadius: '0.375rem',
            backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff',
            color: currentPage === 1 ? '#cbd5e1' : '#0f172a',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
        >
          Previous
        </button>
        <div style={{
          display: 'flex',
          gap: '0.3rem',
          alignItems: 'center',
        }}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                style={{
                  width: '32px',
                  height: '32px',
                  padding: '0',
                  border: currentPage === pageNum ? 'none' : '1px solid #cbd5e1',
                  borderRadius: '0.375rem',
                  backgroundColor: currentPage === pageNum ? '#0f172a' : '#ffffff',
                  color: currentPage === pageNum ? '#ffffff' : '#0f172a',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #cbd5e1',
            borderRadius: '0.375rem',
            backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
            color: currentPage === totalPages ? '#cbd5e1' : '#0f172a',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
        >
          Next
        </button>
        <span style={{
          fontSize: '0.8rem',
          color: '#64748b',
          marginLeft: '1rem',
        }}>
          Page {currentPage} of {totalPages}
        </span>
      </div>
    );
  };

  const handleAddKeyword = () => {
    if (inputValues.keyword.trim()) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...(prev.keywords || []), inputValues.keyword.trim()],
      }));
      setInputValues((prev) => ({ ...prev, keyword: '' }));
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleAddLocation = () => {
    if (inputValues.location.trim()) {
      setFormData((prev) => ({
        ...prev,
        locations: [...(prev.locations || []), inputValues.location.trim()],
      }));
      setInputValues((prev) => ({ ...prev, location: '' }));
    }
  };

  const handleRemoveLocation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleAddEducation = () => {
    if (inputValues.education.trim()) {
      setFormData((prev) => ({
        ...prev,
        education_requirements: [...(prev.education_requirements || []), inputValues.education.trim()],
      }));
      setInputValues((prev) => ({ ...prev, education: '' }));
    }
  };

  const handleRemoveEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education_requirements: prev.education_requirements?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleAddOtherKeyword = () => {
    if (inputValues.otherKeyword.trim()) {
      setFormData((prev) => ({
        ...prev,
        other_keywords: [...(prev.other_keywords || []), inputValues.otherKeyword.trim()],
      }));
      setInputValues((prev) => ({ ...prev, otherKeyword: '' }));
    }
  };

  const handleAddSearchSkill = () => {
    if (searchSkillInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        search_skills: [...(prev.search_skills || []), searchSkillInput.trim()],
      }));
      setSearchSkillInput('');
    }
  };

  const handleRemoveSearchSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      search_skills: prev.search_skills?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleRemoveOtherKeyword = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      other_keywords: prev.other_keywords?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.keywords || formData.keywords.length === 0) {
      setError('Please add at least one keyword');
      return;
    }

    if (!formData.locations || formData.locations.length === 0) {
      setError('Please add at least one location');
      return;
    }

    // new validations required by backend
    if (!formData.scheduled_time) {
      setError('Please select a scheduled time');
      return;
    }

    if (!formData.search_location) {
      setError('Please specify a search location');
      return;
    }

    if (!formData.max_profiles || formData.max_profiles <= 0) {
      setError('Please enter a valid max profiles value');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (config?.id) {
        await updateSourceRunConfigApi(config.id, formData);
      } else {
        await createSourceRunConfigApi(formData);
      }

      setConfig(formData);
      setEditMode(false);
      setSuccessMessage('Source run configuration saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to save configuration. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleManualTrigger = async () => {
    if (!config?.id) {
      setError('Please save configuration first before triggering');
      return;
    }

    if (!config.max_profiles || config.max_profiles <= 0) {
      setError('Cannot trigger: max profiles must be greater than zero');
      return;
    }

    try {
      setManualTriggering(true);
      setProgressModalOpen(true);
      setProgressPercent(10);
      setError(null);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 800);

      const resp = await triggerSourceRunManuallyApi(config.id, config.max_profiles || 0);
      
      clearInterval(progressInterval);
      setProgressPercent(100);

      // Keep modal open for another second then close
      setTimeout(() => {
        setProgressModalOpen(false);
        setProgressPercent(0);
        setSuccessMessage(`Trigger request sent (${resp.status}): ${resp.message}`);
        setTimeout(() => setSuccessMessage(null), 5000);
        // Refresh source runs if we're on that tab
        if (activeTab === 'history') {
          fetchSourceRuns();
        }
      }, 1000);
    } catch (err) {
      clearInterval(undefined);
      setProgressModalOpen(false);
      setProgressPercent(0);
      setError('Failed to trigger source run. Please try again.');
      console.error(err);
    } finally {
      setManualTriggering(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: '#22c55e',
      pending: '#f59e0b',
      in_progress: '#3b82f6',
      failed: '#ef4444',
    };
    return colors[status] || '#64748b';
  };

  const getStatusBgColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: '#f0fdf4',
      pending: '#fffbeb',
      in_progress: '#eff6ff',
      failed: '#fef2f2',
    };
    return colors[status] || '#f8fafc';
  };

  if (loading) {
    return (
      <div className="source-run-config">
        <h2 className="admin-section__title">Source Run Configuration</h2>
        <div className="loading-state">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="source-run-config" id="source-config-section">
      {/* Tab Navigation */}
      <div className="source-config-tabs">
        <button
          className={`source-config-tab ${activeTab === 'config' ? 'source-config-tab--active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="1" fill="currentColor"/>
            <circle cx="19" cy="12" r="1" fill="currentColor"/>
            <circle cx="5" cy="12" r="1" fill="currentColor"/>
            <path d="M12 2v20M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Configuration
        </button>
        <button
          className={`source-config-tab ${activeTab === 'history' ? 'source-config-tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
            <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Run History ({sourceRuns.length})
        </button>
      </div>

      {successMessage && (
        <div className="admin-success-banner">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="admin-error-banner">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <>
          <div className="source-run-config__header">
            <div>
              <h2 className="admin-section__title">Source Configuration</h2>
              <p className="source-run-config__subtitle">Configure parameters for automated candidate sourcing</p>
            </div>
            {!editMode && config && (
              <button
                className="btn btn--primary"
                onClick={() => setEditMode(true)}
                title="Edit configuration"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit Configuration
              </button>
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleSaveConfig} className="source-run-form">
              {/* ── BASIC SETTINGS ── */}
              <div className="form-section">
                <h3 className="form-section__title">Basic Settings</h3>

                <div className="form__row">
                  <div className="form__group">
                    <label className="form__label">Frequency *</label>
                    <select
                      className="form__input"
                      value={formData.frequency}
                      onChange={(e) => setFormData((prev) => ({ ...prev, frequency: e.target.value }))}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="form__group">
                    <label className="form__label">Platform *</label>
                    <select
                      className="form__input"
                      value={formData.platform}
                    >
                      <option value="postfreejob">Postfreejobs (Only available)</option>
                    </select>
                  </div>
                </div>

                <div className="form__group">
                  <label className="form__label">Department / Service *</label>
                  <input
                    type="text"
                    className="form__input"
                    placeholder="e.g., Engineering, Sales, HR"
                    value={formData.department}
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                  />
                </div>

                <div className="form__row">
                  <div className="form__group">
                    <label className="form__label">Experience (Min) *</label>
                    <input
                      type="number"
                      className="form__input"
                      min="0"
                      value={formData.experience_min}
                      onChange={(e) => setFormData((prev) => ({ ...prev, experience_min: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="form__group">
                    <label className="form__label">Experience (Max) *</label>
                    <input
                      type="number"
                      className="form__input"
                      min="0"
                      value={formData.experience_max}
                      onChange={(e) => setFormData((prev) => ({ ...prev, experience_max: parseInt(e.target.value) || 10 }))}
                    />
                  </div>
                </div>
              </div>

              {/* ── SCHEDULE & SEARCH DETAILS ── */}
              <div className="form-section">
                <h3 className="form-section__title">Schedule & Search Details</h3>

                <div className="form__group">
                  <label className="form__label">Scheduled Time *</label>
                  <input
                    type="time"
                    className="form__input"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scheduled_time: e.target.value }))}
                  />
                </div>

                <div className="form__group">
                  <label className="form__label">Search Location *</label>
                  <input
                    type="text"
                    className="form__input"
                    placeholder="e.g., India, Remote"
                    value={formData.search_location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, search_location: e.target.value }))}
                  />
                </div>

                <div className="form__group">
                  <label className="form__label">Max Profiles *</label>
                  <input
                    type="number"
                    className="form__input"
                    min="1"
                    value={formData.max_profiles}
                    onChange={(e) => setFormData((prev) => ({ ...prev, max_profiles: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="form__group">
                  <label className="form__label">Search Skills</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      className="form__input"
                      placeholder="e.g., Python, React"
                      value={searchSkillInput}
                      onChange={(e) => setSearchSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSearchSkill())}
                    />
                    <button
                      type="button"
                      className="btn btn--secondary btn--compact"
                      onClick={handleAddSearchSkill}
                    >
                      Add
                    </button>
                  </div>
                  <div className="tags-container">
                    {formData.search_skills?.map((skill, idx) => (
                      <span key={idx} className="tag">
                        {skill}
                        <button type="button" onClick={() => handleRemoveSearchSkill(idx)}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── KEYWORDS ── */}
              <div className="form-section">
                <h3 className="form-section__title">Keywords</h3>
                <div className="form__group">
                  <label className="form__label">Add Skill Keywords *</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      className="form__input"
                      placeholder="e.g., Python, React, AWS"
                      value={inputValues.keyword}
                      onChange={(e) => setInputValues((prev) => ({ ...prev, keyword: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    />
                    <button
                      type="button"
                      className="btn btn--secondary btn--compact"
                      onClick={handleAddKeyword}
                    >
                      Add
                    </button>
                  </div>
                  <div className="tags-container">
                    {formData.keywords?.map((keyword, idx) => (
                      <span key={idx} className="tag">
                        {keyword}
                        <button type="button" onClick={() => handleRemoveKeyword(idx)}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form__group">
                  <label className="form__label">Other Keywords</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      className="form__input"
                      placeholder="e.g., agile, microservices"
                      value={inputValues.otherKeyword}
                      onChange={(e) => setInputValues((prev) => ({ ...prev, otherKeyword: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOtherKeyword())}
                    />
                    <button
                      type="button"
                      className="btn btn--secondary btn--compact"
                      onClick={handleAddOtherKeyword}
                    >
                      Add
                    </button>
                  </div>
                  <div className="tags-container">
                    {formData.other_keywords?.map((keyword, idx) => (
                      <span key={idx} className="tag tag--secondary">
                        {keyword}
                        <button type="button" onClick={() => handleRemoveOtherKeyword(idx)}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── LOCATION ── */}
              <div className="form-section">
                <h3 className="form-section__title">Location Preferences</h3>
                <div className="form__group">
                  <label className="form__label">Locations *</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      className="form__input"
                      placeholder="e.g., Bangalore, San Francisco"
                      value={inputValues.location}
                      onChange={(e) => setInputValues((prev) => ({ ...prev, location: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                    />
                    <button
                      type="button"
                      className="btn btn--secondary btn--compact"
                      onClick={handleAddLocation}
                    >
                      Add
                    </button>
                  </div>
                  <div className="tags-container">
                    {formData.locations?.map((location, idx) => (
                      <span key={idx} className="tag">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor"/>
                          <circle cx="12" cy="10" r="3" fill="white"/>
                        </svg>
                        {location}
                        <button type="button" onClick={() => handleRemoveLocation(idx)}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── EDUCATION ── */}
              <div className="form-section">
                <h3 className="form-section__title">Education Requirements</h3>
                <div className="form__group">
                  <label className="form__label">Minimum Education Level</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      className="form__input"
                      placeholder="e.g., Bachelor's, Master's, PhD"
                      value={inputValues.education}
                      onChange={(e) => setInputValues((prev) => ({ ...prev, education: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEducation())}
                    />
                    <button
                      type="button"
                      className="btn btn--secondary btn--compact"
                      onClick={handleAddEducation}
                    >
                      Add
                    </button>
                  </div>
                  <div className="tags-container">
                    {formData.education_requirements?.map((edu, idx) => (
                      <span key={idx} className="tag tag--tertiary">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                          <path d="M22 10v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="L1 6.52a2 2 0 0 1 1.88-2.52c.59 0 1.16.2 1.63.55L12 12l7.49-5.45c.47-.35 1.04-.55 1.63-.55a2 2 0 0 1 1.88 2.52l1.01 5.76" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        {edu}
                        <button type="button" onClick={() => handleRemoveEducation(idx)}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── STATUS ── */}
              <div className="form-section">
                <h3 className="form-section__title">Configuration Status</h3>
                <label className="form__checkbox">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <span>Enable automatic source runs on schedule</span>
                </label>
              </div>

              {/* ── ACTIONS ── */}
              <div className="form__actions">
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setEditMode(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="source-run-display">
              {config ? (
                <>
                  <div className="config-card">
                    <h3 className="config-card__title">Current Configuration</h3>

                    <div className="config-info">
                      <div className="config-row">
                        <span className="config-label">Frequency</span>
                        <span className="config-value">{config.frequency.charAt(0).toUpperCase() + config.frequency.slice(1)}</span>
                      </div>
                      <div className="config-row">
                        <span className="config-label">Platform</span>
                        <span className="config-value">LinkedIn</span>
                      </div>
                      <div className="config-row">
                        <span className="config-label">Department</span>
                        <span className="config-value">{config.department || '—'}</span>
                      </div>
                      <div className="config-row">
                        <span className="config-label">Experience Range</span>
                        <span className="config-value">{config.experience_min} - {config.experience_max} years</span>
                      </div>
                      <div className="config-row">
                        <span className="config-label">Scheduled Time</span>
                        <span className="config-value">{config.scheduled_time || '—'}</span>
                      </div>
                      <div className="config-row">
                        <span className="config-label">Search Location</span>
                        <span className="config-value">{config.search_location || '—'}</span>
                      </div>
                      <div className="config-row">
                        <span className="config-label">Max Profiles</span>
                        <span className="config-value">{config.max_profiles || '—'}</span>
                      </div>
                      <div className="config-row">
                        <span className="config-label">Status</span>
                        <span className={`config-status ${config.is_active ? 'config-status--active' : 'config-status--inactive'}`}>
                          {config.is_active ? '✓ Active' : '○ Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="config-tags-section">
                      <h4>Keywords</h4>
                      <div className="tags-container">
                        {formData.keywords?.map((kw, idx) => (
                          <span key={idx} className="tag">{kw}</span>
                        ))}
                      </div>
                    </div>

                    {config.other_keywords?.length > 0 && (
                      <div className="config-tags-section">
                        <h4>Additional Keywords</h4>
                        <div className="tags-container">
                          {config.other_keywords.map((kw, idx) => (
                            <span key={idx} className="tag tag--secondary">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {config.search_skills?.length > 0 && (
                      <div className="config-tags-section">
                        <h4>Search Skills</h4>
                        <div className="tags-container">
                          {config.search_skills.map((sk, idx) => (
                            <span key={idx} className="tag">{sk}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="config-tags-section">
                      <h4>Locations</h4>
                      <div className="tags-container">
                        {config.locations?.map((loc, idx) => (
                          <span key={idx} className="tag">
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor"/>
                              <circle cx="12" cy="10" r="3" fill="white"/>
                            </svg>
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>

                    {config.education_requirements?.length > 0 && (
                      <div className="config-tags-section">
                        <h4>Education Requirements</h4>
                        <div className="tags-container">
                          {config.education_requirements.map((edu, idx) => (
                            <span key={idx} className="tag tag--tertiary">
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                                <path d="M22 10v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="L1 6.52a2 2 0 0 1 1.88-2.52c.59 0 1.16.2 1.63.55L12 12l7.49-5.45c.47-.35 1.04-.55 1.63-.55a2 2 0 0 1 1.88 2.52l1.01 5.76" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                              {edu}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── MANUAL TRIGGER ── */}
                  <div className="manual-trigger-section">
                    <div className="manual-trigger-header">
                      <h3 className="admin-section__subtitle">Trigger Sourcing Run</h3>
                      <p className="section-description">
                        Click below to immediately source candidates based on the configuration. Candidates will be fetched from LinkedIn and added to the pool.
                      </p>
                    </div>
                    <button
                      className="btn btn--success btn--large"
                      onClick={handleManualTrigger}
                      disabled={manualTriggering}
                    >
                      {manualTriggering ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin .7s linear infinite' }}>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
                        </svg>
                      )}
                      {manualTriggering ? 'Triggering Source Run...' : 'Trigger Sourcing Run Now'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="source-run-config__empty-state">
                  <div className="source-run-config__empty-icon">
                    <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="1" fill="currentColor"/>
                      <circle cx="19" cy="12" r="1" fill="currentColor"/>
                      <circle cx="5" cy="12" r="1" fill="currentColor"/>
                      <path d="M12 2v20M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 className="source-run-config__empty-title">No Configuration Yet</h3>
                  <p className="source-run-config__empty-description">
                    Create your first configuration to start sourcing candidates automatically from LinkedIn based on your requirements.
                  </p>
                  <button className="btn btn--primary" onClick={() => setEditMode(true)}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Create Configuration
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="source-runs-history">
          <h2 className="admin-section__title">Source Runs History</h2>
          <p className="source-run-config__subtitle">View all source runs and their details</p>

          {sourceRunsLoading ? (
            <div className="loading-state">
              <div className="admin-loading__spinner" />
              <p>Loading source runs...</p>
            </div>
          ) : sourceRuns.length === 0 ? (
            <div className="empty-state-admin">
              <p>No source runs found yet.</p>
            </div>
          ) : (
            <div>
              <div className="source-runs-table">
                <div className="table-header">
                  <div className="table-cell table-cell--wide">Run ID</div>
                  <div className="table-cell">Status</div>
                  <div className="table-cell">Started</div>
                  <div className="table-cell">Completed</div>
                  <div className="table-cell">Duration (min)</div>
                  <div className="table-cell">Resumes Fetched</div>
                  <div className="table-cell table-cell--action">Action</div>
                </div>
                {sourceRuns
                  .slice((sourceRunsPage - 1) * ITEMS_PER_PAGE, sourceRunsPage * ITEMS_PER_PAGE)
                  .map((run) => (
                    <div key={run.source_run_id} className="table-row">
                      <div className="table-cell table-cell--wide">
                        <div>
                          <code className="run-id" style={{ display: 'block', marginBottom: '0.25rem' }}>{run.source_run_id.substring(0, 8)}...</code>
                          {(run as any).config && (
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Skills: {(run as any).config.search_skills.join(', ')} | Location: {(run as any).config.search_location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="table-cell">
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: getStatusBgColor(run.status),
                            color: getStatusColor(run.status),
                          }}
                        >
                          {run.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="table-cell">{formatDate(run.run_at)}</div>
                      <div className="table-cell">
                        {run.completed_at ? formatDate(run.completed_at) : '—'}
                      </div>
                      <div className="table-cell">
                        <strong>{calculateDuration(run.run_at, run.completed_at)}</strong>
                      </div>
                      <div className="table-cell">
                        <strong>{run.number_of_resume_fetched}</strong>
                      </div>
                      <div className="table-cell table-cell--action">
                        <button
                          className="view-btn"
                          onClick={() => {
                            setSelectedSourceRun(run);
                            setIsDetailModalOpen(true);
                          }}
                          title="View details"
                          aria-label={`View details for run ${run.source_run_id}`}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                            <circle cx="12" cy="12" r="3" fill="currentColor"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              {renderPaginationControls(sourceRunsPage, sourceRuns.length, ITEMS_PER_PAGE, setSourceRunsPage)}
            </div>
          )}
        </div>
      )}

      <ProgressBarModal
        isOpen={progressModalOpen}
        progress={Math.min(Math.round(progressPercent), 100)}
        message="Sourcing candidates from LinkedIn..."
        onClose={() => setProgressModalOpen(false)}
      />

      <SourceRunDetailModal
        isOpen={isDetailModalOpen}
        sourceRun={selectedSourceRun}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSourceRun(null);
        }}
        onRefresh={fetchSourceRuns}
        candidatesPage={candidatesPage}
        setCandidatesPage={setCandidatesPage}
        CANDIDATES_PER_PAGE={CANDIDATES_PER_PAGE}
        renderPaginationControls={renderPaginationControls}
      />
    </div>
  );
};

export default SourceRunConfig;

