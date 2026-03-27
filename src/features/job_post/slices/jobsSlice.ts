import axios from 'axios';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { JobsState, Job } from '@types';
import { apiClient } from '@api';

const initialState: JobsState = {
  list: [],
  selectedJob: null,
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
};

// Thunks
export const fetchAllJobs = createAsyncThunk<Job[], void, { rejectValue: string }>(
  'jobs/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<Job[] | { job_posts: Job[] }>('/jobpost/');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return (response.data as { job_posts: Job[] }).job_posts || [];
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || 'Failed to fetch jobs'
        : 'An unexpected error occurred';
      return rejectWithValue(message);
    }
  }
);

export const fetchJobDetail = createAsyncThunk<Job, string, { rejectValue: string }>(
  'jobs/fetchDetail',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<Job>(`/jobpost/${jobId}`);
      return response.data;
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || 'Failed to fetch job'
        : 'An unexpected error occurred';
      return rejectWithValue(message);
    }
  }
);

interface CreateJobPayload {
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
  created_by: string;
}

export const createJob = createAsyncThunk<Job, CreateJobPayload, { rejectValue: string }>(
  'jobs/create',
  async (jobData: CreateJobPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<Job>('/jobpost/', jobData);
      return response.data;
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.response?.data?.error || 'Failed to create job'
        : error instanceof Error
          ? error.message
          : 'An unexpected error occurred';
      return rejectWithValue(message);
    }
  }
);

interface UpdateJobPayload {
  jobId: string;
  data: Partial<CreateJobPayload>;
}

export const updateJob = createAsyncThunk<Job, UpdateJobPayload, { rejectValue: string }>(
  'jobs/update',
  async ({ jobId, data }: UpdateJobPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<Job>(`/jobpost/${jobId}`, data);
      return response.data;
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || 'Failed to update job'
        : 'An unexpected error occurred';
      return rejectWithValue(message);
    }
  }
);

export const closeJob = createAsyncThunk<Job, string, { rejectValue: string }>(
  'jobs/close',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<Job>(`/jobpost/${jobId}/close`, {});
      return response.data;
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || 'Failed to close job'
        : 'An unexpected error occurred';
      return rejectWithValue(message);
    }
  }
);

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setSelectedJob: (state, action: PayloadAction<Job | null>) => {
      state.selectedJob = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All Jobs
    builder
      .addCase(fetchAllJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Job Detail
    builder
      .addCase(fetchJobDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedJob = action.payload;
      })
      .addCase(fetchJobDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Job
    builder
      .addCase(createJob.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.createLoading = false;
        state.list.push(action.payload);
        state.selectedJob = action.payload;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      });

    // Update Job
    builder
      .addCase(updateJob.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.list.findIndex((j: Job) => j.job_id === action.payload.job_id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.selectedJob?.job_id === action.payload.job_id) {
          state.selectedJob = action.payload;
        }
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      });

    // Close Job
    builder
      .addCase(closeJob.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(closeJob.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.list.findIndex((j: Job) => j.job_id === action.payload.job_id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.selectedJob?.job_id === action.payload.job_id) {
          state.selectedJob = action.payload;
        }
      })
      .addCase(closeJob.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedJob, clearError } = jobsSlice.actions;
export default jobsSlice.reducer;
