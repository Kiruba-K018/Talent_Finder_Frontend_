import React, { useState } from 'react';
import { ScoredCandidate, updateCandidateNoteApi } from '../../../api/jobPostApi';
import './Candidatedrawer.css';

interface Props {
  candidate: ScoredCandidate;
  jobId: string;
  recruiterNote: string | null;
  onClose: () => void;
  onNoteSaved: (candidateId: string, note: string) => void;
}

const Badge: React.FC<{ label: string; variant?: 'blue' | 'gray' | 'green' | 'purple' }> = ({
  label, variant = 'blue',
}) => <span className={`cd-badge cd-badge--${variant}`}>{label}</span>;

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="cd-section">
    <h4 className="cd-section__title">{title}</h4>
    {children}
  </div>
);

const formatDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const calcDuration = (start: string, end: string) => {
  const s = new Date(start), e = new Date(end);
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (months < 12) return `${months}m`;
  const y = Math.floor(months / 12), m = months % 12;
  return m ? `${y}y ${m}m` : `${y}y`;
};

// ── Tooltip ───────────────────────────────────────────────────────────────
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="cd-tooltip-wrap"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="cd-tooltip">
          <div className="cd-tooltip__arrow" />
          {text}
        </div>
      )}
    </div>
  );
};

const InfoIcon: React.FC<{ color?: string }> = ({ color = '#94a3b8' }) => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0, cursor: 'help' }}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
    <path d="M12 11v5M12 8v.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ── Score tooltip copy ────────────────────────────────────────────────────
const SCORE_TOOLTIPS: Record<string, string> = {
  ai:          "AI Score — GPT-evaluated holistic rating of the candidate's fit. Considers resume quality, role alignment, communication clarity, and overall impression.",
  confidence:  "Confidence Score — How certain the AI is about its evaluation. Higher scores mean the resume had enough data to make a reliable assessment.",
  completion:  "Completion Score — Measures how complete the candidate's profile is. Rewards having experience, education, skills, projects, and certifications filled in.",
  aggregation: "Aggregated Score — Final weighted composite of all scoring signals. This is the primary ranking metric used to order candidates.",
  ruleBased:   "Rule-Based Score — Deterministic score from structured rules: years of experience, required skills matched, education level, job title relevance.",
  skillMatch:  "Skill Match — Percentage of the job's required skills found in the candidate's resume. 100 = every required skill is present.",
  recency:     "Recency Score — Rewards recent and relevant work experience. Candidates with current roles in the target domain score higher.",
};

// ── ScoreRing ─────────────────────────────────────────────────────────────
const ScoreRing: React.FC<{
  score: number; label: string; color: string; size?: number; tooltipKey: string;
}> = ({ score, label, color, size = 84, tooltipKey }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(score, 100) / 100) * circ;
  return (
    <Tooltip text={SCORE_TOOLTIPS[tooltipKey]}>
      <div className="cd-score-ring">
        <div className="cd-score-ring__svg-wrap" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
              strokeDasharray={`${filled} ${circ}`} strokeLinecap="round" />
          </svg>
          <div className="cd-score-ring__center">
            <span className="cd-score-ring__value" style={{ color }}>{Math.round(score)}</span>
          </div>
        </div>
        <div className="cd-score-ring__footer">
          <p className="cd-score-ring__name">{label}</p>
          <InfoIcon color={color} />
        </div>
      </div>
    </Tooltip>
  );
};

// ── ScoreBar ──────────────────────────────────────────────────────────────
const ScoreBar: React.FC<{
  label: string; score: number; max?: number; color: string; tooltipKey: string;
}> = ({ label, score, max = 100, color, tooltipKey }) => {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div className="cd-score-bar">
      <div className="cd-score-bar__header">
        <Tooltip text={SCORE_TOOLTIPS[tooltipKey]}>
          <span className="cd-score-bar__label-wrap">
            <span className="cd-score-bar__label">{label}</span>
            <InfoIcon />
          </span>
        </Tooltip>
        <span className="cd-score-bar__val" style={{ color }}>{Math.round(score)}</span>
      </div>
      <div className="cd-score-bar__track">
        <div className="cd-score-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

const FLAG_COLORS: Record<string, string> = {
  OVERQUALIFIED: '#d97706', UNDERQUALIFIED: '#dc2626',
  SKILL_GAP: '#7c3aed', DEFAULT: '#2563eb',
};

type Tab = 'scores' | 'overview' | 'experience' | 'projects' | 'education';

const CandidateDrawer: React.FC<Props> = ({ candidate: c, jobId, recruiterNote, onClose, onNoteSaved }) => {
  const [activeTab, setActiveTab] = useState<Tab>('scores');
  const [noteText, setNoteText]   = useState(recruiterNote ?? '');
  const [editingNote, setEditingNote] = useState(false);
  const [savingNote, setSavingNote]   = useState(false);
  const [noteError, setNoteError]     = useState('');
  const [noteSaved, setNoteSaved]     = useState(false);

  const handleSaveNote = async () => {
    setSavingNote(true); setNoteError(''); setNoteSaved(false);
    try {
      await updateCandidateNoteApi(jobId, c.candidate_id, noteText);
      onNoteSaved(c.candidate_id, noteText);
      setEditingNote(false);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);
    } catch {
      setNoteError('Failed to save note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleCancelNote = () => {
    setNoteText(recruiterNote ?? '');
    setEditingNote(false);
    setNoteError('');
  };

  const initials = c.candidate_name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview',   label: 'Overview'   },
    { key: 'experience', label: 'Experience' },
    { key: 'projects',   label: 'Projects'   },
    { key: 'education',  label: 'Education'  },
    { key: 'scores',     label: 'Scores'     },
  ];

  const currentNote = noteText || recruiterNote;

  return (
    <div className="cd-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cd-drawer">

        {/* ── TOP BAR ── */}
        <div className="cd-topbar">
          <div className="cd-topbar__identity">
            <div className="cd-avatar-sm">{initials}</div>
            <div>
              <p className="cd-topbar__name">{c.candidate_name}</p>
              <p className="cd-topbar__role">{c.title}</p>
            </div>
          </div>
          <div className="cd-topbar__actions">
            {noteSaved && (
              <span className="cd-note-saved-toast">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                  <path d="M20 6 9 17l-5-5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                Saved
              </span>
            )}
            <button
              className={`cd-note-toggle-btn ${editingNote ? 'cd-note-toggle-btn--active' : ''}`}
              onClick={() => setEditingNote((v) => !v)}
              title={editingNote ? 'Close note editor' : 'Add / edit recruiter note'}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {editingNote ? 'Cancel' : currentNote ? 'Edit Note' : 'Add Note'}
            </button>
            <button className="cd-close-btn" onClick={onClose} aria-label="Close">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── NOTE PANEL ── */}
        {editingNote && (
          <div className="cd-note-panel">
            <div className="cd-note-panel__inner">
              <textarea
                className="cd-note-input"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value.slice(0, 500))}
                placeholder="Add notes about this candidate — strong fit, needs follow-up, concerns…"
                rows={3}
                autoFocus
              />
              <div className="cd-note-panel__footer">
                <span className="cd-note-chars">{noteText.length}/500</span>
                {noteError && <span className="cd-note-error">{noteError}</span>}
                <div className="cd-note-btns">
                  <button className="cd-note-cancel" onClick={handleCancelNote} disabled={savingNote}>Discard</button>
                  <button className="cd-note-save" onClick={handleSaveNote} disabled={savingNote || !noteText.trim()}>
                    {savingNote
                      ? <><span className="cd-btn-spinner" /> Saving…</>
                      : <><svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                            <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg> Save Note</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!editingNote && currentNote && (
          <div className="cd-note-display">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0, color: '#2563eb' }}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="cd-note-display__text">{currentNote}</span>
          </div>
        )}

        {/* ── TABS ── */}
        <div className="cd-tabs">
          {tabs.map((t) => (
            <button key={t.key}
              className={`cd-tab ${activeTab === t.key ? 'cd-tab--active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="cd-scroll-body">
          <div className="cd-hero-compact">
            <div className="cd-hero-compact__meta">
              {c.location && <span><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>{c.location}</span>}
              {c.candidate_email && <span><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8"/><path d="m22 6-10 7L2 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>{c.candidate_email}</span>}
            </div>
            <div className="cd-hero__links">
              {c.contact_linkedin_url && <a href={c.contact_linkedin_url} target="_blank" rel="noreferrer" className="cd-link-btn cd-link-btn--linkedin">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                LinkedIn
              </a>}
              {c.portfolio_url && <a href={c.portfolio_url} target="_blank" rel="noreferrer" className="cd-link-btn cd-link-btn--github">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                Portfolio
              </a>}
            </div>
          </div>

          <div className="cd-tab-body">

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <>
                {c.summary && <Section title="Summary"><p className="cd-summary">{c.summary}</p></Section>}
                {c.hard_skills?.length > 0 && <Section title="Technical Skills"><div className="cd-tags">{c.hard_skills.map((s) => <Badge key={s} label={s} variant="blue" />)}</div></Section>}
                {c.soft_skills?.length > 0 && <Section title="Soft Skills"><div className="cd-tags">{c.soft_skills.map((s) => <Badge key={s} label={s} variant="gray" />)}</div></Section>}
                {c.languages_known?.length > 0 && <Section title="Languages"><div className="cd-tags">{c.languages_known.map((l) => <Badge key={l} label={l} variant="purple" />)}</div></Section>}
                {c.certifications?.length > 0 && (
                  <Section title="Certifications">
                    <div className="cd-cert-list">
                      {c.certifications.map((cert) => (
                        <div className="cd-cert-card" key={cert.certification_id}>
                          <div className="cd-cert-icon">🏅</div>
                          <div>
                            <p className="cd-cert-name">{cert.certification_name}</p>
                            <div className="cd-tags" style={{ marginTop: '.35rem' }}>
                              {cert.related_technology.map((t) => <Badge key={t} label={t} variant="green" />)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
                {c.volunteer_works?.length > 0 && <Section title="Volunteer Work"><ul className="cd-list">{c.volunteer_works.map((v, i) => <li key={i}>{v}</li>)}</ul></Section>}
                {c.publications?.length > 0 && <Section title="Publications"><ul className="cd-list">{c.publications.map((p, i) => <li key={i}>{p}</li>)}</ul></Section>}
              </>
            )}

            {/* EXPERIENCE */}
            {activeTab === 'experience' && (
              <Section title={`Work Experience (${c.experience?.length ?? 0})`}>
                <div className="cd-timeline">
                  {c.experience?.map((exp, i) => (
                    <div className="cd-timeline-item" key={exp.experience_id}>
                      <div className="cd-timeline-dot" />
                      {i < c.experience.length - 1 && <div className="cd-timeline-line" />}
                      <div className="cd-timeline-body">
                        <div className="cd-exp-header">
                          <div><p className="cd-exp-role">{exp.job_role}</p><p className="cd-exp-company">{exp.company_name}</p></div>
                          <div className="cd-exp-right">
                            <span className="cd-exp-duration">{calcDuration(exp.start_date, exp.end_date)}</span>
                            <span className="cd-exp-dates">{formatDate(exp.start_date)} — {formatDate(exp.end_date)}</span>
                            <span className={`cd-job-type-badge cd-job-type-badge--${exp.job_type?.replace('-', '')}`}>{exp.job_type}</span>
                          </div>
                        </div>
                        {exp.technology?.length > 0 && <div className="cd-tags" style={{ marginTop: '.6rem' }}>{exp.technology.map((t) => <Badge key={t} label={t} variant="blue" />)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* PROJECTS */}
            {activeTab === 'projects' && (
              <Section title={`Projects (${c.projects?.length ?? 0})`}>
                <div className="cd-project-list">
                  {c.projects?.map((p) => (
                    <div className="cd-project-card" key={p.project_id}>
                      <div className="cd-project-header">
                        <p className="cd-project-title">{p.title}</p>
                        <span className="cd-project-duration">{p.duration}</span>
                      </div>
                      <p className="cd-project-desc">{p.description}</p>
                      <div className="cd-tags">{p.technology_used.map((t) => <Badge key={t} label={t} variant="blue" />)}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* EDUCATION */}
            {activeTab === 'education' && (
              <Section title="Education">
                <div className="cd-edu-list">
                  {c.education?.map((e) => (
                    <div className="cd-edu-card" key={e.education_id}>
                      <div className="cd-edu-icon">🎓</div>
                      <div><p className="cd-edu-degree">{e.degree}</p><p className="cd-edu-course">{e.course}</p></div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* AI SCORES */}
            {activeTab === 'scores' && (
              <>
                <div className="cd-score-rings">
                  <ScoreRing score={c.ai_score}          label="AI Score"   color="#2563eb" tooltipKey="ai"          />
                  <ScoreRing score={c.confidence_score}  label="Confidence" color="#7c3aed" tooltipKey="confidence"  />
                  <ScoreRing score={c.completion_score}  label="Completion" color="#16a34a" tooltipKey="completion"  />
                  <ScoreRing score={c.aggregation_score} label="Aggregated" color="#d97706" tooltipKey="aggregation" />
                </div>
                <Section title="Score Breakdown">
                  <div className="cd-score-bars">
                    <ScoreBar label="Rule-Based Score" score={c.rule_based_score}                    color="#2563eb" tooltipKey="ruleBased"   />
                    <ScoreBar label="Skill Match"      score={Math.round(c.skill_match_score * 100)} color="#16a34a" tooltipKey="skillMatch"  />
                    <ScoreBar label="Recency Score"    score={c.recency_score}                       color="#d97706" tooltipKey="recency"     />
                    <ScoreBar label="Completion Score" score={c.completion_score}                    color="#7c3aed" tooltipKey="completion"  />
                  </div>
                </Section>
                {c.ai_explanation && (
                  <Section title="AI Assessment">
                    <div className="cd-ai-explanation">
                      <div className="cd-ai-explanation__icon">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5v6m0 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <p>{c.ai_explanation}</p>
                    </div>
                  </Section>
                )}
                {c.flags?.length > 0 && (
                  <Section title="Flags">
                    <div className="cd-flags">
                      {c.flags.map((f, i) => (
                        <div className="cd-flag" key={i} style={{ borderColor: FLAG_COLORS[f.flag] ?? FLAG_COLORS.DEFAULT }}>
                          <span className="cd-flag__label" style={{ color: FLAG_COLORS[f.flag] ?? FLAG_COLORS.DEFAULT }}>⚑ {f.flag}</span>
                          <span className="cd-flag__reason">{f.reason}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDrawer;