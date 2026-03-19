import React, { useEffect, useState } from 'react';
import { calculateDashboardStats, DashboardStats } from '../services/adminApi';

type AdminTab = 'home' | 'users' | 'source-run' | 'job-posts';

interface AdminHomeProps {
  onNavigate?: (tab: AdminTab) => void;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  children: React.ReactNode;
  color: string;
  loading?: boolean;
}> = ({ title, value, children, color, loading = false }) => (
  <div className="stat-card" style={{ borderLeftColor: color }}>
    <div className="stat-card__icon" style={{ backgroundColor: `${color}14`, color }}>
      {children}
    </div>
    <div className="stat-card__content">
      <p className="stat-card__title">{title}</p>
      <p className="stat-card__value">
        {loading ? <span className="stat-skeleton">Loading...</span> : value}
      </p>
    </div>
  </div>
);

const AdminHome: React.FC<AdminHomeProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await calculateDashboardStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="admin-home">
      <h2 className="admin-section__title">Dashboard Overview</h2>

      {error && (
        <div className="admin-error-banner">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── STATISTICS CARDS ── */}
      <div className="stats-grid">
        <StatCard
          title="Total Job Posts"
          value={loading ? '0' : (stats?.total_jobs ?? 0)}
          color="#2563eb"
          loading={loading}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </StatCard>
        <StatCard
          title="Total Users"
          value={loading ? '0' : (stats?.total_users ?? 0)}
          color="#7c3aed"
          loading={loading}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </StatCard>
        <StatCard
          title="Sourced Candidates"
          value={loading ? '0' : (stats?.total_sourced_candidates ?? 0)}
          color="#16a34a"
          loading={loading}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
        </StatCard>
        <StatCard
          title="Next Source Run"
          value={stats?.next_source_run ?? 'Not scheduled'}
          color="#d97706"
          loading={loading}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
            <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </StatCard>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="admin-home__actions">
        <h3 className="admin-section__subtitle">Quick Access</h3>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => onNavigate?.('users')}>
            <span className="quick-action-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="quick-action-label">Add New Recruiter</span>
            <span className="quick-action-arrow">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate?.('source-run')}>
            <span className="quick-action-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1" fill="currentColor"/>
                <circle cx="19" cy="12" r="1" fill="currentColor"/>
                <circle cx="5" cy="12" r="1" fill="currentColor"/>
                <path d="M12 2v20M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="quick-action-label">Source Configuration</span>
            <span className="quick-action-arrow">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
        </button>
          <button className="quick-action-btn" onClick={() => onNavigate?.('job-posts')}>
            <span className="quick-action-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="quick-action-label">View All Posts</span>
            <span className="quick-action-arrow">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* ── SYSTEM INFO ── */}
      <div className="admin-home__info">
        <h3 className="admin-section__subtitle">System Information</h3>
        <div className="system-info">
          <div className="info-row">
            <span className="info-label">Platform</span>
            <span className="info-value">Talent Finder Pro</span>
          </div>
          <div className="info-row">
            <span className="info-label">Status</span>
            <span className="info-value info-status info-status--active">Active</span>
          </div>
          <div className="info-row">
            <span className="info-label">Last Updated</span>
            <span className="info-value">{new Date().toLocaleDateString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
