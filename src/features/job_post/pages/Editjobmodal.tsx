import React, { useState, useRef } from 'react';
import { JobPost } from '../slices/Jobpostslice';
import { updateJobPostApi } from '../services/jobPostApi';
import '../../../components/Createjobmodal.css';

interface Props {
  job: JobPost;
  onClose: () => void;
  onUpdated: (updated: JobPost) => void;
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];

const TagInput: React.FC<{
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
}> = ({ label, tags, onChange, placeholder, required, error }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1));
  };

  return (
    <div className={`cjm-field ${error ? 'cjm-field--error' : ''}`}>
      <label>{label}{required && <span className="cjm-req">*</span>}</label>
      <div className="cjm-tag-wrap" onClick={() => inputRef.current?.focus()}>
        {tags.map((t) => (
          <span key={t} className="cjm-tag">
            {t}
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(tags.filter(x => x !== t)); }}>×</button>
          </span>
        ))}
        <input
          ref={inputRef} value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="cjm-tag-input"
        />
      </div>
      <span className="cjm-field-hint">Press Enter or comma to add</span>
      {error && <span className="cjm-error-msg">{error}</span>}
    </div>
  );
};

const normalizeSkills = (val: string | string[] | undefined): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : [val]; } catch { return [val]; }
};

const normalizeEdu = (val: string | string[] | undefined): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
};

const EditJobModal: React.FC<Props> = ({ job, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    job_title:                 job.job_title ?? '',
    job_description:           job.description ?? '',
    min_experience:            String(job.min_experience ?? ''),
    max_experience:            String(job.max_experience ?? ''),
    location_preference:       job.location_preference ?? '',
    job_type:                  job.job_type ?? 'Full-time',
    no_of_candidates_required: String(job.no_of_candidates_required ?? ''),
  });

  const [requiredSkills,  setRequiredSkills]  = useState<string[]>(normalizeSkills(job.required_skills as any));
  const [preferredSkills, setPreferredSkills] = useState<string[]>(normalizeSkills(job.preferred_skills as any));
  const [educationQuals,  setEducationQuals]  = useState<string[]>(normalizeEdu(job.min_educational_qualifications as any));

  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');
  const [success,  setSuccess]  = useState(false);

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.job_title.trim())           e.job_title           = 'Job title is required.';
    if (!form.job_description.trim())     e.job_description     = 'Description is required.';
    if (!form.min_experience)             e.min_experience      = 'Required.';
    if (!form.max_experience)             e.max_experience      = 'Required.';
    if (Number(form.min_experience) > Number(form.max_experience)) e.max_experience = 'Max must be ≥ min.';
    if (!form.location_preference.trim()) e.location_preference = 'Location is required.';
    if (!form.no_of_candidates_required)  e.no_of_candidates_required = 'Required.';
    if (Number(form.no_of_candidates_required) == 0) e.no_of_candidates_required = 'Required';
    if (requiredSkills.length === 0)      e.required_skills     = 'Add at least one required skill.';
    if (educationQuals.length === 0)      e.education           = 'Add at least one qualification.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // ── Diff check: reject if nothing changed ────────────────────────────
    const origReqSkills  = normalizeSkills(job.required_skills as any).slice().sort().join('|');
    const origPrefSkills = normalizeSkills(job.preferred_skills as any).slice().sort().join('|');
    const origEdu        = normalizeEdu(job.min_educational_qualifications as any).slice().sort().join('|');
    const newReqSkills   = [...requiredSkills].sort().join('|');
    const newPrefSkills  = [...preferredSkills].sort().join('|');
    const newEdu         = [...educationQuals].sort().join('|');
    const unchanged =
      form.job_title.trim()                  === (job.job_title ?? '').trim()           &&
      form.job_description.trim()            === (job.description ?? '').trim()         &&
      Number(form.min_experience)            === (job.min_experience ?? 0)              &&
      Number(form.max_experience)            === (job.max_experience ?? 0)              &&
      form.location_preference.trim()        === (job.location_preference ?? '').trim() &&
      form.job_type                          === (job.job_type ?? 'Full-time')          &&
      Number(form.no_of_candidates_required) === (job.no_of_candidates_required ?? 0)  &&
      newReqSkills  === origReqSkills  &&
      newPrefSkills === origPrefSkills &&
      newEdu        === origEdu;
    if (unchanged) {
      setApiError('No changes detected — modify at least one field to save a new version.');
      return;
    }
    // ────────────────────────────────────────────────────────────────────

    setSaving(true); setApiError('');
    try {
      const updated = await updateJobPostApi(job.job_id, {
        job_title:                    form.job_title.trim(),
        job_description:              form.job_description.trim(),
        min_experience:               Number(form.min_experience),
        max_experience:               Number(form.max_experience),
        min_education_qualifications: educationQuals,
        location_preference:          form.location_preference.trim(),
        job_type:                     form.job_type,
        required_skills:              requiredSkills,
        preferred_skills:             preferredSkills,
        no_of_candidates_required:    Number(form.no_of_candidates_required),
      });
      setSuccess(true);
      setTimeout(() => { onUpdated(updated); onClose(); }, 1500);
    } catch (err: any) {
      setApiError(err.response?.data?.detail || 'Failed to update job. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cjm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cjm-modal">

        {/* ── Header ── */}
        <div className="cjm-header">
          <div className="cjm-header__left">
            <div className="cjm-header__icon">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2>Edit Job Post</h2>
              <p>Changes will create a new version and re-score all candidates</p>
            </div>
          </div>
          <button className="cjm-close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Success state ── */}
        {success ? (
          <div className="cjm-success">
            <div className="cjm-success__icon">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <path d="M20 6 9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Job updated!</h3>
            <p>A new version has been created. AI is re-scoring candidates now.</p>
          </div>
        ) : (

          /* ── Form — same structure as CreateJobModal ── */
          <form className="cjm-body" onSubmit={handleSubmit} noValidate>
            <div className="cjm-scroll">

              <div className="cjm-section-label">Basic Information</div>

              <div className={`cjm-field ${errors.job_title ? 'cjm-field--error' : ''}`}>
                <label>Job Title <span className="cjm-req">*</span></label>
                <input
                  type="text"
                  value={form.job_title}
                  onChange={(e) => set('job_title', e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                />
                {errors.job_title && <span className="cjm-error-msg">{errors.job_title}</span>}
              </div>

              <div className={`cjm-field ${errors.job_description ? 'cjm-field--error' : ''}`}>
                <label>Job Description <span className="cjm-req">*</span></label>
                <textarea
                  value={form.job_description}
                  onChange={(e) => set('job_description', e.target.value)}
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  rows={4}
                />
                {errors.job_description && <span className="cjm-error-msg">{errors.job_description}</span>}
              </div>

              <div className="cjm-row">
                <div className={`cjm-field ${errors.job_type ? 'cjm-field--error' : ''}`}>
                  <label>Job Type <span className="cjm-req">*</span></label>
                  <select value={form.job_type} onChange={(e) => set('job_type', e.target.value)}>
                    {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className={`cjm-field ${errors.location_preference ? 'cjm-field--error' : ''}`}>
                  <label>Location <span className="cjm-req">*</span></label>
                  <input
                    type="text"
                    value={form.location_preference}
                    onChange={(e) => set('location_preference', e.target.value)}
                    placeholder="e.g. Chennai / Remote"
                  />
                  {errors.location_preference && <span className="cjm-error-msg">{errors.location_preference}</span>}
                </div>
              </div>

              <div className="cjm-section-label">Experience &amp; Headcount</div>

              <div className="cjm-row cjm-row--3">
                <div className={`cjm-field ${errors.min_experience ? 'cjm-field--error' : ''}`}>
                  <label>Min Experience (yrs) <span className="cjm-req">*</span></label>
                  <input type="number" min="0" value={form.min_experience}
                    onChange={(e) => set('min_experience', e.target.value)} placeholder="0" />
                  {errors.min_experience && <span className="cjm-error-msg">{errors.min_experience}</span>}
                </div>
                <div className={`cjm-field ${errors.max_experience ? 'cjm-field--error' : ''}`}>
                  <label>Max Experience (yrs) <span className="cjm-req">*</span></label>
                  <input type="number" min="0" value={form.max_experience}
                    onChange={(e) => set('max_experience', e.target.value)} placeholder="5" />
                  {errors.max_experience && <span className="cjm-error-msg">{errors.max_experience}</span>}
                </div>
                <div className={`cjm-field ${errors.no_of_candidates_required ? 'cjm-field--error' : ''}`}>
                  <label>Openings <span className="cjm-req">*</span></label>
                  <input type="number" min="10" value={form.no_of_candidates_required}
                    onChange={(e) => set('no_of_candidates_required', e.target.value)} placeholder="10" />
                  {errors.no_of_candidates_required && <span className="cjm-error-msg">{errors.no_of_candidates_required}</span>}
                </div>
              </div>

              <div className="cjm-section-label">Skills &amp; Education</div>

              <TagInput
                label="Required Skills"
                tags={requiredSkills}
                onChange={setRequiredSkills}
                placeholder="Python, FastAPI, PostgreSQL..."
                required
                error={errors.required_skills}
              />

              <TagInput
                label="Preferred Skills"
                tags={preferredSkills}
                onChange={setPreferredSkills}
                placeholder="Kubernetes, Redis, AWS..."
              />

              <TagInput
                label="Minimum Education Qualifications"
                tags={educationQuals}
                onChange={setEducationQuals}
                placeholder="B.E./B.Tech in CS or related field..."
                required
                error={errors.education}
              />

              {apiError && (
                <div className="cjm-alert">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {apiError}
                </div>
              )}

            </div>{/* cjm-scroll */}

            <div className="cjm-footer">
              <button type="button" className="cjm-cancel-btn" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="cjm-submit-btn" disabled={saving}>
                {saving ? <span className="cjm-spinner" /> : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Save &amp; Re-score
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

export default EditJobModal;