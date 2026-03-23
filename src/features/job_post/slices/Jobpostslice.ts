import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface JobPost {
  job_id: string;
  job_title: string;
  description: string;
  min_experience: number;
  max_experience: number;
  min_educational_qualifications: string;
  job_type: string;
  required_skills: string[];
  preferred_skills: string[];
  location_preference: string;
  status: string;
  no_of_candidates_required: number;
  openings?: number; // optional field for frontend convenience
  created_by: string;
  version: number;
}

interface JobPostState {
  jobs: JobPost[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  createError: string | null;
  lastCreatedJobId: string | null;
}

const initialState: JobPostState = {
  jobs: [],
  loading: false,
  error: null,
  creating: false,
  createError: null,
  lastCreatedJobId: null,
};

const jobPostSlice = createSlice({
  name: 'jobPost',
  initialState,
  reducers: {
    fetchJobsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchJobsSuccess(state, action: PayloadAction<JobPost[]>) {
      state.loading = false;
      state.jobs = action.payload;
    },
    fetchJobsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    createJobStart(state) {
      state.creating = true;
      state.createError = null;
    },
    createJobSuccess(state, action: PayloadAction<JobPost>) {
      state.creating = false;
      state.lastCreatedJobId = action.payload.job_id;
      state.jobs = [action.payload, ...state.jobs];
    },
    createJobFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },
    clearCreateError(state) {
      state.createError = null;
    },
  },
});

export const {
  fetchJobsStart, fetchJobsSuccess, fetchJobsFailure,
  createJobStart, createJobSuccess, createJobFailure, clearCreateError,
} = jobPostSlice.actions;
export default jobPostSlice.reducer;