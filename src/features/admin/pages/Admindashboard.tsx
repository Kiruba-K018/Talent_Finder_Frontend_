import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import { logoutThunk } from '../../job_post/slices/Jobpostthunks';
import AdminHome from './AdminHome';
import UserManagement from './UserManagement';
import SourceRunConfig from './SourceRunConfig';
import AdminJobPosts from './AdminJobPosts';
import './Admindashboard.css';

type AdminTab = 'home' | 'users' | 'source-run' | 'job-posts';

interface AdminDashboardProps {
  onLogout?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<AdminTab>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const user = useAppSelector((s) => s.auth.user);

  const handleLogout = () => dispatch(logoutThunk() as any);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'A';

  const navItems: { key: AdminTab; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'users', label: 'User Management' },
    { key: 'source-run', label: 'Source Configuration' },
    { key: 'job-posts', label: 'All Posts & Candidates' },
  ];

  const getIcon = (tab: AdminTab) => {
    const icons: Record<AdminTab, JSX.Element> = {
      home: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.8"/>
        </svg>
      ),
      users: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      'source-run': (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
          <circle cx="19" cy="12" r="1" fill="currentColor"/>
          <circle cx="5" cy="12" r="1" fill="currentColor"/>
          <path d="M12 2v20M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      'job-posts': (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    };
    return icons[tab];
  };

  return (
    <div className="admin-root">
      {/* ── SIDEBAR ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : 'admin-sidebar--closed'}`}>
        <div className="admin-sidebar__header">
          <div className="admin-brand">
            <div className="admin-brand__logo">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor" opacity="0.8"/>
              </svg>
            </div>
            {sidebarOpen && <span className="admin-brand__name">TalentFinder</span>}
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`admin-sidebar__item ${activeTab === item.key ? 'admin-sidebar__item--active' : ''}`}
              onClick={() => setActiveTab(item.key)}
              title={item.label}
            >
              <span className="admin-sidebar__icon">{getIcon(item.key)}</span>
              {sidebarOpen && <span className="admin-sidebar__label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__footer" />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header__left">
            <button
              className="admin-header__hamburger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="admin-header__content">
              {activeTab === 'home' && (
                <>
                  <h1 className="admin-header__title">Dashboard</h1>
                  <p className="admin-header__subtitle">System overview and key metrics</p>
                </>
              )}
              {activeTab === 'users' && (
                <>
                  <h1 className="admin-header__title">User Management</h1>
                  <p className="admin-header__subtitle">Add and manage system users</p>
                </>
              )}
              {activeTab === 'source-run' && (
                <>
                  <h1 className="admin-header__title">Source Configuration</h1>
                  <p className="admin-header__subtitle">Configure automated candidate sourcing</p>
                </>
              )}
              {activeTab === 'job-posts' && (
                <>
                  <h1 className="admin-header__title">All Posts & Candidates</h1>
                  <p className="admin-header__subtitle">View all job posts and sourced candidates</p>
                </>
              )}
            </div>
          </div>

          <div className="admin-header__right">
            <div className="admin-profile-wrap" ref={profileRef}>
              <button
                className="admin-profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
              >
                <div className="admin-profile-avatar">{getInitials(user?.full_name || 'Admin')}</div>
                <div className="admin-profile-info">
                  <span className="admin-profile-name">{user?.full_name || 'Admin'}</span>
                  <span className="admin-profile-role">Administrator</span>
                </div>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                  style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: 'rgba(255,255,255,0.6)' }}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {profileOpen && (
                <div className="admin-profile-dropdown">
                  <div className="admin-dropdown-user">
                    <div className="admin-profile-avatar admin-profile-avatar--lg">{getInitials(user?.full_name || 'A')}</div>
                    <div>
                      <div className="admin-dropdown-name">{user?.full_name || 'Administrator'}</div>
                      <div className="admin-dropdown-email">{user?.email || ''}</div>
                    </div>
                  </div>
                  <div className="admin-dropdown-divider" />
                  <button className="admin-dropdown-item admin-dropdown-item--danger" onClick={handleLogout}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content">
          {activeTab === 'home' && <AdminHome />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'source-run' && <SourceRunConfig />}
          {activeTab === 'job-posts' && <AdminJobPosts />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
