import api from '../../../api/axiosInstance';
import { JobPost } from '../slices/Jobpostslice';

export interface JobPostsResponse {
  job_posts: JobPost[];
}

export interface CreateJobPayload {
  job_title: string;
  job_description: string;
  min_experience: number;
  max_experience: number;
  min_education_qualifications: string[];
  location_preference: string;
  job_type: string;
  required_skills: string[];
  preferred_skills: string[];
  no_of_candidates_required: number;
}

export const getJobPostsApi = async (): Promise<JobPost[]> => {
  const response = await api.get<JobPostsResponse>('/jobpost/');
  return response.data.job_posts;
};

export const getJobPostByIdApi = async (jobId: string): Promise<JobPost> => {
  const response = await api.get<JobPost>(`/jobpost/${jobId}`);
  return response.data;
};

export const closeJobPostApi = async (jobId: string): Promise<void> => {
  await api.put(`/jobpost/${jobId}/close`);
};

export const createJobPostApi = async (payload: CreateJobPayload): Promise<JobPost> => {
  const response = await api.post<JobPost>('/jobpost/', payload);
  return response.data;
};

export const updateJobPostApi = async (
  jobId: string,
  payload: CreateJobPayload
): Promise<JobPost> => {
  const response = await api.put<JobPost>(`/jobpost/${jobId}`, payload);
  return response.data;
};

export const logoutApi = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const getUserProfileApi = async (): Promise<any> => {
  const response = await api.get('/auth/me');
  return response.data;
};

// ── Shortlist ──────────────────────────────────────────────────────────────

export interface ShortlistEntry {
  candidate_id: string;
  recruiter_notes: string | null;
  reviewed_by: string | null;
}

export interface ShortlistResponse {
  job_id: string;
  shortlist: ShortlistEntry[];
  created_at: string | null;
  total_candidates: number;
}

/**
 * Fetch the shortlist for a job.
 * When a version is supplied the versioned endpoint is used:
 *   GET /shortlist/{job_id}/version/{version}
 * Otherwise falls back to the latest:
 *   GET /shortlist/{job_id}
 */
export const getShortlistApi = async (
  jobId: string,
  version?: number
): Promise<ShortlistResponse> => {
  const url = version != null
    ? `/shortlist/${jobId}/version/${version}`
    : `/shortlist/${jobId}`;
  const response = await api.get<ShortlistResponse>(url);
  return response.data;
};

/**
 * Fetch all candidates (including those beyond required count) for a job.
 * When a version is supplied the versioned endpoint is used:
 *   GET /shortlist/{job_id}/all/version/{version}
 * Response format is the same as getShortlistApi.
 */
export const getAllShortlistApi = async (
  jobId: string,
  version?: number
): Promise<ShortlistResponse> => {
  const url = version != null
    ? `/shortlist/${jobId}/all/version/${version}`
    : `/shortlist/${jobId}/all`;
  const response = await api.get<ShortlistResponse>(url);
  return response.data;
};

/**
 * Versioned job snapshot — returns the job description / skills as they were
 * at a specific version. Endpoint: GET /jobpost/{job_id}/version/{version}
 * Falls back gracefully: if the endpoint doesn't exist yet we return null.
 */
export interface JobVersionSnapshot {
  job_id: string;
  version: number;
  job_title: string;
  description: string;
  min_experience: number;
  max_experience: number;
  location_preference: string;
  job_type: string;
  required_skills: string[];
  preferred_skills: string[];
  min_educational_qualifications: string | string[];
  no_of_candidates_required: number;
}

export const getJobVersionSnapshotApi = async (
  jobId: string,
  version: number
): Promise<JobVersionSnapshot | null> => {
  try {
    const response = await api.get<JobVersionSnapshot>(`/jobpost/${jobId}/version/${version}`);
    return response.data;
  } catch {
    return null;
  }
};

// ── Scored candidate ───────────────────────────────────────────────────────

export interface CandidateFlag {
  flag: string;
  reason: string;
}

export interface ScoredCandidate {
  _id: string;
  candidate_id: string;
  hash: string;
  candidate_name: string;
  resume_id: string;
  platform_id: string;
  sourced_at: string;
  source_run_id: string;
  job_id: string | null;
  updated_on: string;
  title: string;
  summary: string;
  location: string;
  contact_phone: string;
  contact_linkedin_url: string;
  candidate_email: string;
  portfolio_url: string;
  hard_skills: string[];
  soft_skills: string[];
  languages_known: string[];
  volunteer_works: string[];
  publications: string[];
  experience: CandidateExperience[];
  projects: CandidateProject[];
  education: CandidateEducation[];
  certifications: CandidateCertification[];
  parsed_resume_data?: any;
  // Scoring fields
  rule_based_score: number;
  completion_score: number;
  skill_match_score: number;
  recency_score: number;
  ai_score: number;
  strengths: string[];
  weaknesses: string[];
  considerations: string[];
  confidence_score: number;
  aggregation_score: number;
  flags: CandidateFlag[];
  missing_fields: string[];
}

export const getCandidateScoreApi = async (
  jobId: string,
  candidateId: string
): Promise<ScoredCandidate> => {
  const response = await api.get<ScoredCandidate>(`/shortlist/${jobId}/${candidateId}`);
  return response.data;
};

export const updateCandidateNoteApi = async (
  jobId: string,
  candidateId: string,
  note: string
): Promise<boolean> => {
  const response = await api.put<boolean>(
    `/shortlist/${jobId}/${candidateId}`,
    { note }
  );
  return response.data;
};

// ── Candidate profile ──────────────────────────────────────────────────────

export interface CandidateExperience {
  experience_id: string;
  company_name: string;
  start_date: string;
  end_date: string;
  technology: string[];
  job_role: string;
  job_type: string;
}

export interface CandidateProject {
  project_id: string;
  title: string;
  description: string;
  technology_used: string[];
  duration: string;
}

export interface CandidateEducation {
  education_id: string;
  degree: string;
  course: string;
}

export interface CandidateCertification {
  certification_id: string;
  certification_name: string;
  related_technology: string[];
}

export interface CandidateProfile {
  _id: string;
  candidate_id: string;
  candidate_name: string;
  title: string;
  summary: string;
  location: string;
  contact_phone: string;
  contact_linkedin_url: string;
  candidate_email: string;
  portfolio_url: string;
  hard_skills: string[];
  soft_skills: string[];
  languages_known: string[];
  volunteer_works: string[];
  publications: string[];
  experience: CandidateExperience[];
  projects: CandidateProject[];
  education: CandidateEducation[];
  certifications: CandidateCertification[];
}

export const getCandidateProfileApi = async (candidateId: string): Promise<CandidateProfile> => {
  const response = await api.get<CandidateProfile>(`/sourced-candidates/${candidateId}`);
  return response.data;
};