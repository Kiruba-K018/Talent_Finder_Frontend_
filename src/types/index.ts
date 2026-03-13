// Auth Types
export interface Recruiter {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthState {
  token: string | null;
  recruiter: Recruiter | null;
  loading: boolean;
  error: string | null;
}

// Job Types
export type JobStatus = 'Open' | 'Closed' | 'Draft' | 'Analyzing';
export type EmploymentType = 'Full Time' | 'Part Time' | 'Contract' | 'Freelance';
export type EducationLevel = 'Any' | 'High School' | 'Diploma' | 'Bachelors' | 'Masters' | 'PhD';
export type Department = 'Engineering' | 'Product' | 'Design' | 'Sales' | 'Operations' | 'Marketing' | 'Finance' | 'HR' | 'Legal' | 'Other';

export interface Job {
  job_id: string;
  job_title: string;
  description: string;
  min_experience: number;
  max_experience: number;
  min_educational_qualifications: string; // comma-separated string from API
  job_type: string; // "Full-time", "Part-time", etc.
  required_skills: string[];
  preferred_skills: string[];
  location_preference: string;
  status: string; // "Open", "Closed", etc.
  no_of_candidates_required: number;
  created_by: string; // UUID
  version: number;
}

export interface JobsState {
  list: Job[];
  selectedJob: Job | null;
  loading: boolean;
  error: string | null;
  createLoading: boolean;
  updateLoading: boolean;
}

// Shortlist Types
export interface ShortlistListItem {
  candidate_id: string;
  recruiter_notes: string | null;
  reviewed_by: string | null;
}

export interface ShortlistListResponse {
  job_id: string;
  shortlist: ShortlistListItem[];
  created_at: string | null;
  total_candidates: number;
}

export interface Experience {
  experience_id: string;
  candidate_id: string;
  company_name: string;
  start_date: string;
  end_date: string;
  technology: string[];
  job_role: string;
  job_type: string;
}

export interface Project {
  project_id: string;
  candidate_id: string;
  title: string;
  description: string;
  technology_used: string[];
  duration: string;
}

export interface Education {
  education_id: string;
  candidate_id: string;
  degree: string;
  course: string;
}

export interface Certification {
  certification_id: string;
  candidate_id: string;
  certification_name: string;
  related_technology: string[];
}

export interface ParsedResumeData {
  candidate_id: string;
  candidate_name: string;
  title: string;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  hard_skills: string[];
  soft_skills: string[];
  summary: string;
}

export interface CandidateDetail {
  _id: string;
  candidate_id: string;
  hash: string;
  candidate_name: string;
  resume_id: string;
  platform_id: string;
  sourced_at: string;
  source_run_id: string;
  job_id: string;
  updated_on: string;
  title: string;
  summary: string;
  hard_skills: string[];
  soft_skills: string[];
  languages_known: string[];
  volunteer_works: string[];
  publications: string[];
  location: string;
  contact_phone: string;
  contact_linkedin_url: string;
  candidate_email: string;
  portfolio_url: string;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  parsed_resume_data: ParsedResumeData;
  rule_based_score: number;
  completion_score: number;
  skill_match_score: number;
  recency_score: number;
  ai_score: number;
  confidence_score: number;
  aggregation_score: number;
  strengths?: string[];
  weaknesses?: string[];
  considerations?: string[];
  recruiter_notes?: string;
  flags: Flag[];
  missing_fields: string[];
}

export interface Note {
  note_id: string;
  author: string;
  timestamp: string;
  text: string;
}

export interface Flag {
  type: 'red_flag' | 'yellow_flag' | 'info';
  reason: string;
}

export interface ShortlistState {
  candidates: ShortlistListItem[];
  selectedCandidate: CandidateDetail | null;
  loading: boolean;
  error: string | null;
  noteLoading: boolean;
}

// Source Run Types
export type SourceRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'not_started';

export interface ScoringProgress {
  job_id: string;
  status: SourceRunStatus;
  total_candidates: number;
  processed_candidates: number;
  scored_candidates: number;
  filtered_candidates: number;
  current_stage: 'loading' | 'processing' | 'scoring' | 'shortlisting' | 'completed' | 'failed' | 'idle';
  progress_percent: number;
  message: string;
}

export interface SourceRunStage {
  name: string;
  status: SourceRunStatus;
  count: number;
  icon: string;
}

export interface SourceRun extends ScoringProgress {
  stages?: SourceRunStage[];
  profiles_fetched?: number;
  candidates_scored?: number;
  shortlist_size?: number;
  created_at?: string;
  completed_at?: string;
  error_message?: string;
  current_stage_progress?: number;
  estimated_time_remaining?: number;
}

export interface SourceRunState {
  runsByJobId: Record<string, SourceRun>;
  pollingJobIds: string[];
  loading: boolean;
  error: string | null;
}

// Toast Types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// UI Types
export type ActiveView = 'job_list' | 'job_detail' | 'create_job' | 'shortlist' | 'candidate_detail';

export interface UIState {
  activeView: ActiveView;
  sidebarOpen: boolean;
  toasts: Toast[];
}

// Root State
export interface RootState {
  auth: AuthState;
  jobs: JobsState;
  shortlist: ShortlistState;
  sourceRun: SourceRunState;
  ui: UIState;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
