import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import { createJobThunk } from '../features/job_post/slices/Jobpostthunks';
import { clearCreateError } from '../features/job_post/slices/Jobpostslice';
import './Createjobmodal.css';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];

const TagInput: React.FC<{
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
  inputId?: string;
}> = ({ label, tags, onChange, placeholder, required, error, inputId }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1));
  };

  return (
    <div className={`cjm-field ${error ? 'cjm-field--error' : ''}`}>
      <label htmlFor={inputId}>
        {label}
        {required && <span className="cjm-req">*</span>}
      </label>
      <div className="cjm-tag-wrap" onClick={() => inputRef.current?.focus()}>
        {tags.map((t) => (
          <span key={t} className="cjm-tag">
            {t}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(tags.filter((x) => x !== t));
              }}
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => {
            if (input.trim()) addTag(input);
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="cjm-tag-input"
          aria-describedby={`${hintId}${error ? ` ${errorId}` : ''}`}
          aria-invalid={!!error}
        />
      </div>
      <span id={hintId} className="cjm-field-hint">
        Press Enter or comma to add
      </span>
      {error && (
        <span id={errorId} className="cjm-error-msg" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

const CreateJobModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const dispatch = useAppDispatch();
  const { creating, createError } = useAppSelector((s) => s.jobPost);

  const [form, setForm] = useState({
    job_title: '',
    job_description: '',
    min_experience: '',
    max_experience: '',
    location_preference: '',
    job_type: 'Full-time',
    no_of_candidates_required: '',
    openings: '',
  });
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [educationQuals, setEducationQuals] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    dispatch(clearCreateError());
  }, []);

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.job_title.trim()) e.job_title = 'Job title is required.';
    if (!form.job_description.trim()) e.job_description = 'Description is required.';
    if (!form.min_experience) e.min_experience = 'Required.';
    if (!form.max_experience) e.max_experience = 'Required.';
    if (Number(form.min_experience) > Number(form.max_experience))
      e.max_experience = 'Max must be ≥ min.';
    if (!form.location_preference.trim()) e.location_preference = 'Location is required.';
    if (!form.openings || Number(form.openings) == 0) e.openings = 'Required';
    if (requiredSkills.length === 0) e.required_skills = 'Add at least one required skill.';
    if (educationQuals.length === 0) e.education = 'Add at least one qualification.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const result = await dispatch(
      createJobThunk({
        job_title: form.job_title.trim(),
        job_description: form.job_description.trim(),
        min_experience: Number(form.min_experience),
        max_experience: Number(form.max_experience),
        min_education_qualifications: educationQuals,
        location_preference: form.location_preference.trim(),
        job_type: form.job_type,
        required_skills: requiredSkills,
        preferred_skills: preferredSkills,
        no_of_candidates_required: Number(form.no_of_candidates_required),
      }) as any
    );

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onCreated();
        onClose();
      }, 1500);
    }
  };

  return (
    <div
      className="cjm-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cjm-modal">
        {/* Header */}
        <div className="cjm-header">
          <div className="cjm-header__left">
            <div className="cjm-header__icon">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="14" rx="2" stroke="white" strokeWidth="1.8" />
                <path
                  d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path d="M12 12v4M10 14h4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2>Create Job Post</h2>
              <p>Fill in the details to publish a new opening</p>
            </div>
          </div>
          <button className="cjm-close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M18 6 6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="cjm-success">
            <div className="cjm-success__icon">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <path
                  d="M20 6 9 17l-5-5"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>Job post created!</h3>
            <p>Your opening has been published successfully.</p>
          </div>
        ) : (
          <form
            className="cjm-body"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Create Job Post Form"
          >
            <div className="cjm-scroll">
              {/* Section: Basic Info */}
              <div className="cjm-section-label" role="heading" aria-level={2}>
                Basic Information
              </div>

              <div className={`cjm-field ${errors.job_title ? 'cjm-field--error' : ''}`}>
                <label htmlFor="job-title">
                  Job Title <span className="cjm-req">*</span>
                </label>
                <input
                  id="job-title"
                  type="text"
                  value={form.job_title}
                  onChange={(e) => set('job_title', e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  aria-invalid={!!errors.job_title}
                  aria-describedby={errors.job_title ? 'job-title-error' : undefined}
                />
                {errors.job_title && (
                  <span id="job-title-error" className="cjm-error-msg" role="alert">
                    {errors.job_title}
                  </span>
                )}
              </div>

              <div className={`cjm-field ${errors.job_description ? 'cjm-field--error' : ''}`}>
                <label htmlFor="job-description">
                  Job Description <span className="cjm-req">*</span>
                </label>
                <textarea
                  id="job-description"
                  value={form.job_description}
                  onChange={(e) => set('job_description', e.target.value)}
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  rows={4}
                  aria-invalid={!!errors.job_description}
                  aria-describedby={errors.job_description ? 'job-description-error' : undefined}
                />
                {errors.job_description && (
                  <span id="job-description-error" className="cjm-error-msg" role="alert">
                    {errors.job_description}
                  </span>
                )}
              </div>

              <div className="cjm-row">
                <div className={`cjm-field ${errors.job_type ? 'cjm-field--error' : ''}`}>
                  <label htmlFor="job-type">
                    Job Type <span className="cjm-req">*</span>
                  </label>
                  <select
                    id="job-type"
                    value={form.job_type}
                    onChange={(e) => set('job_type', e.target.value)}
                    aria-invalid={!!errors.job_type}
                  >
                    {JOB_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div
                  className={`cjm-field ${errors.location_preference ? 'cjm-field--error' : ''}`}
                >
                  <label htmlFor="location">
                    Location <span className="cjm-req">*</span>
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={form.location_preference}
                    onChange={(e) => set('location_preference', e.target.value)}
                    placeholder="e.g. Chennai / Remote"
                    aria-invalid={!!errors.location_preference}
                    aria-describedby={errors.location_preference ? 'location-error' : undefined}
                  />
                  {errors.location_preference && (
                    <span id="location-error" className="cjm-error-msg" role="alert">
                      {errors.location_preference}
                    </span>
                  )}
                </div>
              </div>

              {/* Section: Experience & Headcount */}
              <div className="cjm-section-label" role="heading" aria-level={2}>
                Experience & Headcount
              </div>

              <div className="cjm-row cjm-row--3">
                <div className={`cjm-field ${errors.min_experience ? 'cjm-field--error' : ''}`}>
                  <label htmlFor="min-exp">
                    Min Experience (yrs) <span className="cjm-req">*</span>
                  </label>
                  <input
                    id="min-exp"
                    type="number"
                    min="0"
                    value={form.min_experience}
                    onChange={(e) => set('min_experience', e.target.value)}
                    placeholder="0"
                    aria-invalid={!!errors.min_experience}
                    aria-describedby={errors.min_experience ? 'min-exp-error' : undefined}
                  />
                  {errors.min_experience && (
                    <span id="min-exp-error" className="cjm-error-msg" role="alert">
                      {errors.min_experience}
                    </span>
                  )}
                </div>
                <div className={`cjm-field ${errors.max_experience ? 'cjm-field--error' : ''}`}>
                  <label htmlFor="max-exp">
                    Max Experience (yrs) <span className="cjm-req">*</span>
                  </label>
                  <input
                    id="max-exp"
                    type="number"
                    min="0"
                    value={form.max_experience}
                    onChange={(e) => set('max_experience', e.target.value)}
                    placeholder="5"
                    aria-invalid={!!errors.max_experience}
                    aria-describedby={errors.max_experience ? 'max-exp-error' : undefined}
                  />
                  {errors.max_experience && (
                    <span id="max-exp-error" className="cjm-error-msg" role="alert">
                      {errors.max_experience}
                    </span>
                  )}
                </div>
                <div
                  className={`cjm-field ${errors.no_of_candidates_required ? 'cjm-field--error' : ''}`}
                >
                  <label htmlFor="candidates-shortlist">
                    No of profile to be shortlisted<span className="cjm-req">*</span>
                  </label>
                  <input
                    id="candidates-shortlist"
                    type="number"
                    min="10"
                    value={form.no_of_candidates_required}
                    onChange={(e) => set('no_of_candidates_required', e.target.value)}
                    placeholder="1"
                    aria-invalid={!!errors.no_of_candidates_required}
                    aria-describedby={
                      errors.no_of_candidates_required ? 'candidates-shortlist-error' : undefined
                    }
                  />
                  {errors.no_of_candidates_required && (
                    <span id="candidates-shortlist-error" className="cjm-error-msg" role="alert">
                      {errors.no_of_candidates_required}
                    </span>
                  )}
                </div>
                <div className={`cjm-field ${errors.openings ? 'cjm-field--error' : ''}`}>
                  <label htmlFor="openings">
                    No of openings<span className="cjm-req">*</span>
                  </label>
                  <input
                    id="openings"
                    type="number"
                    min="1"
                    value={form.openings}
                    onChange={(e) => set('openings', e.target.value)}
                    placeholder="1"
                    aria-invalid={!!errors.openings}
                    aria-describedby={errors.openings ? 'openings-error' : undefined}
                  />
                  {errors.openings && (
                    <span id="openings-error" className="cjm-error-msg" role="alert">
                      {errors.openings}
                    </span>
                  )}
                </div>
              </div>

              {/* Section: Skills & Education */}
              <div className="cjm-section-label" role="heading" aria-level={2}>
                Skills & Education
              </div>

              <TagInput
                label="Required Skills"
                tags={requiredSkills}
                onChange={setRequiredSkills}
                placeholder="Python, FastAPI, PostgreSQL..."
                required
                error={errors.required_skills}
                inputId="required-skills"
              />

              <TagInput
                label="Preferred Skills"
                tags={preferredSkills}
                onChange={setPreferredSkills}
                placeholder="Kubernetes, Redis, AWS..."
                inputId="preferred-skills"
              />

              <TagInput
                label="Minimum Education Qualifications"
                tags={educationQuals}
                onChange={setEducationQuals}
                placeholder="B.E./B.Tech in CS or related field..."
                required
                error={errors.education}
                inputId="education-quals"
              />

              {createError && (
                <div className="cjm-alert" role="alert">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M12 8v4M12 16h.01"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {createError}
                </div>
              )}
            </div>
            <div className="cjm-footer">
              <button
                type="button"
                className="cjm-cancel-btn"
                onClick={onClose}
                aria-label="Cancel job post creation"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cjm-submit-btn"
                disabled={creating}
                aria-busy={creating}
                aria-label={creating ? 'Publishing job post...' : 'Publish job post'}
              >
                {creating ? (
                  <span className="cjm-spinner" aria-hidden="true" />
                ) : (
                  <>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Publish Job Post
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateJobModal;
