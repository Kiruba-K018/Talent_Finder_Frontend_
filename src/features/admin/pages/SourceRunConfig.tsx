import React, { useEffect, useState } from 'react';
import type { SourceRunConfig } from '../services/adminApi';
import {
  getSourceRunConfigApi,
  createSourceRunConfigApi,
  updateSourceRunConfigApi,
  triggerSourceRunManuallyApi,
} from '../services/adminApi';

const SourceRunConfig: React.FC = () => {
  const [config, setConfig] = useState<SourceRunConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [manualTriggering, setManualTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState<SourceRunConfig>({
    frequency: 'weekly',
    keywords: [],
    platform: 'linkedin',
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
      setError(null);
      const resp = await triggerSourceRunManuallyApi(config.id, config.max_profiles || 0);
      // show backend message and status for better UX
      setSuccessMessage(
        `Trigger request sent (${resp.status}): ${resp.message}`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError('Failed to trigger source run. Please try again.');
      console.error(err);
    } finally {
      setManualTriggering(false);
    }
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
                  disabled
                >
                  <option value="linkedin">LinkedIn (Only available)</option>
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
    </div>
  );
};

export default SourceRunConfig;
