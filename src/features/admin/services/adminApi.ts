import {api, source_api} from '../../../api/axiosInstance';
import { JobPost } from '../../job_post/slices/Jobpostslice';
import { ScoredCandidate } from '../../job_post/services/jobPostApi';

// ── Admin Users ────────────────────────────────────────────────────────────

export interface User {
  user_id: string;
  email: string;
  name: string;
  role_id: number;
  org_id: string;
  created_at: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role_id: number;
  org_id: string;
}

export const getAllUsersApi = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users/');
  // Handle both array and wrapped response formats
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return (response.data as any).users || [];
};

export const createUserApi = async (payload: CreateUserPayload): Promise<User> => {
  const response = await api.post<User>('/users/', payload);
  return response.data;
};

// ── Admin Job Posts ────────────────────────────────────────────────────────

export interface JobPostsResponse {
  job_posts: JobPost[];
}

export const getAllJobPostsApi = async (): Promise<JobPost[]> => {
  const response = await api.get<JobPostsResponse>('/jobpost/');
  return response.data.job_posts;
};

// ── Admin Sourced Candidates ───────────────────────────────────────────────

export interface SourcedCandidatesResponse {
  candidates: ScoredCandidate[];
}

export const getAllSourcedCandidatesApi = async (): Promise<ScoredCandidate[]> => {
  const response = await api.get<SourcedCandidatesResponse>('/sourced-candidates/');
  return response.data.candidates;
};

export const deleteSourcedCandidateApi = async (candidateId: string): Promise<void> => {
  await api.delete(`/sourced-candidates/${candidateId}/`);
};

// ── Admin Dashboard Statistics ─────────────────────────────────────────────

export interface DashboardStats {
  total_jobs: number;
  total_users: number;
  total_sourced_candidates: number;
  next_source_run: string | null;
}

// Calculate stats from API responses
export const calculateDashboardStats = async (): Promise<DashboardStats> => {
  const [jobPosts, users, candidates] = await Promise.all([
    getAllJobPostsApi(),
    getAllUsersApi(),
    getAllSourcedCandidatesApi(),
  ]);

  return {
    total_jobs: jobPosts.length,
    total_users: users.length,
    total_sourced_candidates: candidates.length,
    next_source_run: null, // To be implemented
  };
};

// ── Source Run Configuration ───────────────────────────────────────────────

export interface SourceRunConfig {
  id?: string;
  frequency: string; // 'daily', 'weekly', 'monthly'
  keywords: string[];
  platform: 'linkedin'; // Currently only LinkedIn
  locations: string[];
  department: string;
  experience_min: number;
  experience_max: number;
  education_requirements: string[];
  other_keywords: string[];
  // fields required by backend validation
  scheduled_time: string;
  search_skills: string[];
  search_location: string;
  max_profiles: number;
  is_active: boolean;
  created_at?: string;
  next_run?: string;
}

export const createSourceRunConfigApi = async (config: SourceRunConfig): Promise<SourceRunConfig> => {
  const response = await api.post<SourceRunConfig>('admin/sourcing-config/', config);
  return response.data;
};

export const updateSourceRunConfigApi = async (configId: string, config: SourceRunConfig): Promise<SourceRunConfig> => {
  const response = await api.put<SourceRunConfig>(`admin/sourcing-config/${configId}`, config);
  return response.data;
};

export const getSourceRunConfigApi = async (): Promise<SourceRunConfig | null> => {
  try {
    const response = await api.get<SourceRunConfig>('admin/sourcing-config/');
    return response.data;
  } catch {
    return null;
  }
};

export interface TriggerResponse {
  message: string;
  config_id: string;
  status: string;
}

export const triggerSourceRunManuallyApi = async (
  configId: string,
  maxProfiles: number
): Promise<TriggerResponse> => {
  // backend expects payload with config_id and max_profiles
  const response = await source_api.post<TriggerResponse>('/trigger', {
    config_id: configId,
    max_profiles: maxProfiles,
  });
  return response.data;
};

// ── Source Run History ─────────────────────────────────────────────────────

export interface SourceRun {
  source_run_id: string;
  platform_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  schedule: string | null;
  skills: string[] | null;
  location: string | null;
  number_of_resume_fetched: number;
  run_at: string;
  config_id: string;
  error_message: string | null;
  completed_at: string | null;
}

export const getSourceRunsHistoryApi = async (): Promise<SourceRun[]> => {
  try {
    const response = await source_api.get<SourceRun[]>('/source-runs/');
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
};
