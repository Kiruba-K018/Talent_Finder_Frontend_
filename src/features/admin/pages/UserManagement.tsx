import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../../hooks/hooks';
import { getAllUsersApi, createUserApi, CreateUserPayload, User } from '../services/adminApi';

const UserManagement: React.FC = () => {
  const currentUser = useAppSelector((s) => s.auth.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirm_password: '',
    role: 'recruiter', // 'admin' or 'recruiter'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await getAllUsersApi();
      // Show all users
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      // Get org_id from current authenticated user
      const adminOrgId = (currentUser as any)?.org_id;
      
      if (!adminOrgId) {
        setError('Unable to determine organization. Please try again.');
        return;
      }

      const payload: CreateUserPayload = {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        role_id: formData.role === 'admin' ? 1 : 2, // 1 for Admin, 2 for Recruiter
        org_id: adminOrgId,
      };

      const newUser = await createUserApi(payload);
      setUsers([...users, newUser]);
      setSuccessMessage(`User ${newUser.name} created successfully! Credentials sent to ${newUser.email}`);
      setFormData({ email: '', name: '', password: '', confirm_password: '', role: 'recruiter' });
      setShowAddForm(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to create user. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="user-management">
      <div className="user-management__header">
        <h2 className="admin-section__title">User Management</h2>
        <button
          className="btn btn--primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New User'}
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

      {/* ── ADD USER FORM ── */}
      {showAddForm && (
        <div className="add-user-form">
          <form onSubmit={handleAddUser} className="form">
            <div className="form__group">
              <label className="form__label">Full Name *</label>
              <input
                type="text"
                name="name"
                className={`form__input ${formErrors.name ? 'form__input--error' : ''}`}
                placeholder="Enter user's full name"
                value={formData.name}
                onChange={handleFormChange}
              />
              {formErrors.name && <span className="form__error">{formErrors.name}</span>}
            </div>

            <div className="form__group">
              <label className="form__label">Email Address *</label>
              <input
                type="email"
                name="email"
                className={`form__input ${formErrors.email ? 'form__input--error' : ''}`}
                placeholder="user@example.com"
                value={formData.email}
                onChange={handleFormChange}
              />
              {formErrors.email && <span className="form__error">{formErrors.email}</span>}
            </div>

            <div className="form__group">
              <label className="form__label">Role *</label>
              <select
                name="role"
                className={`form__input ${formErrors.role ? 'form__input--error' : ''}`}
                value={formData.role}
                onChange={handleFormChange}
              >
                <option value="recruiter">Recruiter</option>
                <option value="admin">Admin</option>
              </select>
              {formErrors.role && <span className="form__error">{formErrors.role}</span>}
            </div>

            <div className="form__row">
              <div className="form__group">
                <label className="form__label">Password *</label>
                <input
                  type="password"
                  name="password"
                  className={`form__input ${formErrors.password ? 'form__input--error' : ''}`}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleFormChange}
                />
                {formErrors.password && <span className="form__error">{formErrors.password}</span>}
              </div>

              <div className="form__group">
                <label className="form__label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirm_password"
                  className={`form__input ${formErrors.confirm_password ? 'form__input--error' : ''}`}
                  placeholder="Confirm password"
                  value={formData.confirm_password}
                  onChange={handleFormChange}
                />
                {formErrors.confirm_password && <span className="form__error">{formErrors.confirm_password}</span>}
              </div>
            </div>

            <p className="form__note">
              Credentials will be automatically emailed to the user's email address.
            </p>

            <div className="form__actions">
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? 'Creating user...' : 'Create User & Send Credentials'}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── USERS TABLE ── */}
      <div className="users-section" id="users-section">
        <h3 className="admin-section__subtitle">All Users ({users.length})</h3>

        {loadingUsers ? (
          <div className="loading-state">
            <span>Loading recruiters...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No recruiters found. Click "Add New Recruiter" to get started.</p>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="user-cell user-cell--name">
                      <div className="user-avatar">
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <span>{user.name}</span>
                    </td>
                    <td className="user-cell">{user.email}</td>
                    <td className="user-cell">
                      <span className="role-badge">
                        {user.role_id === 1 ? 'Admin' : user.role_id === 2 ? 'Recruiter' : 'User'}
                      </span>
                    </td>
                    <td className="user-cell">
                      {new Date(user.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="user-cell user-cell--actions">
                      <button className="action-btn action-btn--view" title="View details" onClick={() => setSelectedUser(user)}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── USER DETAILS MODAL ── */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">User Details</h3>
              <button className="modal-close" onClick={() => setSelectedUser(null)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="user-detail-item">
                <span className="user-detail-label">Name</span>
                <span className="user-detail-value">{selectedUser.name}</span>
              </div>
              <div className="user-detail-item">
                <span className="user-detail-label">Email</span>
                <span className="user-detail-value">{selectedUser.email}</span>
              </div>
              <div className="user-detail-item">
                <span className="user-detail-label">Role</span>
                <span className="role-badge">
                  {selectedUser.role_id === 1 ? 'Admin' : selectedUser.role_id === 2 ? 'Recruiter' : 'User'}
                </span>
              </div>
              <div className="user-detail-item">
                <span className="user-detail-label">Created Date</span>
                <span className="user-detail-value">{new Date(selectedUser.created_at).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="user-detail-item">
                <span className="user-detail-label">Created Time</span>
                <span className="user-detail-value">{new Date(selectedUser.created_at).toLocaleTimeString('en-IN')}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn--primary" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
