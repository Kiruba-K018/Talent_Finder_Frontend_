import {api, source_api} from '../../../api/axiosInstance';
import { JobPost } from '../../job_post/slices/Jobpostslice';
import { ScoredCandidate } from '../../job_post/services/jobPostApi';

// Re-export ScoredCandidate for use in admin features
export type { ScoredCandidate };

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

// Helper function to convert ISO datetime string to IST format
const formatToIST = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    // Format in IST timezone (UTC+5:30)
    const istFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    return istFormatter.format(date);
  } catch (error) {
    console.error('Error formatting date to IST:', error);
    return dateString;
  }
};

export interface DashboardStats {
  total_jobs: number;
  total_users: number;
  total_sourced_candidates: number;
  next_source_run: string | null;
}

// Calculate stats from API responses
export const calculateDashboardStats = async (): Promise<DashboardStats> => {
  const [jobPosts, users, candidates, config] = await Promise.all([
    getAllJobPostsApi(),
    getAllUsersApi(),
    getAllSourcedCandidatesApi(),
    getSourceRunConfigApi(),
  ]);

  // Format next_run_at to IST timezone
  const nextRunIST = config?.next_run_at ? formatToIST(config.next_run_at) : null;

  return {
    total_jobs: jobPosts.length,
    total_users: users.length,
    total_sourced_candidates: candidates.length,
    next_source_run: nextRunIST,
  };
};

// ── Source Run Configuration ───────────────────────────────────────────────

export interface SourceRunConfig {
  id?: string;
  frequency: string; // 'daily', 'weekly', 'monthly'
  keywords: string[];
  platform: 'Postfreejobs'; // Currently only LinkedIn
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
  next_run_at?: string | null;
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
    const response = await api.get<SourceRunConfig>('/admin/sourcing-config/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sourcing config:', error);
    return null;
  }
};

export interface TriggerResponse {
  message: string;
  config_id: string;
  status: string;
}

export interface SourcingConfigResponse {
  id: string;
  org_id: string;
  is_active: boolean;
  frequency: string;
  scheduled_time: string;
  scheduled_day: string | null;
  search_skills: string[];
  search_location: string;
  max_profiles: number;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  created_by: string;
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

export interface SourceRunWithConfig extends SourceRun {
  config?: SourcingConfigResponse;
}

export const getSourceRunsHistoryApi = async (): Promise<SourceRun[]> => {
  try {
    const response = await api.get<SourceRun[]>('/source-runs/');
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
};

export const getSourceRunsHistoryWithConfigApi = async (): Promise<SourceRunWithConfig[]> => {
  try {
    const runs = await getSourceRunsHistoryApi();
    
    // Fetch config details for each source run in parallel
    const runsWithConfig = await Promise.all(
      runs.map(async (run) => {
        try {
          const config = await getSourcingConfigByIdApi(run.config_id);
          return {
            ...run,
            config: config || undefined,
          };
        } catch (error) {
          console.error(`Failed to fetch config for run ${run.source_run_id}:`, error);
          return run; // Return run without config if fetch fails
        }
      })
    );
    
    // Sort by run_at in descending order (latest first)
    return runsWithConfig.sort((a, b) => {
      const dateA = new Date(a.run_at).getTime();
      const dateB = new Date(b.run_at).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Failed to fetch source runs with config:', error);
    return [];
  }
};

export const getSourcingConfigByIdApi = async (configId: string): Promise<SourcingConfigResponse | null> => {
  try {
    const response = await api.get<SourcingConfigResponse>(`/admin/sourcing-config/${configId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch sourcing config ${configId}:`, error);
    return null;
  }
};

export const getSourcedCandidatesByRunIdApi = async (sourceRunId: string): Promise<ScoredCandidate[]> => {
  try {
    const response = await api.get<ScoredCandidate[]>(`/sourced-candidates/${sourceRunId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`Failed to fetch sourced candidates for run ${sourceRunId}:`, error);
    return [];
  }
};

export const deleteSourceRunApi = async (sourceRunId: string): Promise<boolean> => {
  try {
    const response = await api.delete<{ message: string }>(`/source-runs/${sourceRunId}`);
    return response.status === 200;
  } catch (error) {
    console.error(`Failed to delete source run ${sourceRunId}:`, error);
    throw error;
  }
};
