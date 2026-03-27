import axios from 'axios';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { SourceRunState, SourceRun } from '@types';
import { apiClient } from '@api';

const initialState: SourceRunState = {
  runsByJobId: {},
  pollingJobIds: [],
  loading: false,
  error: null,
};

// Thunks
export const fetchSourceRun = createAsyncThunk<
  { jobId: string; data: SourceRun },
  string,
  { rejectValue: string }
>('sourceRun/fetch', async (jobId: string, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<SourceRun>(`/source-runs/${jobId}/progress`);
    return { jobId, data: response.data };
  } catch (error: unknown) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.error || 'Failed to fetch source run'
      : 'An unexpected error occurred';
    return rejectWithValue(message);
  }
});

const sourceRunSlice = createSlice({
  name: 'sourceRun',
  initialState,
  reducers: {
    startPolling: (state, action: PayloadAction<string>) => {
      const jobId = action.payload;
      if (!state.pollingJobIds.includes(jobId)) {
        state.pollingJobIds.push(jobId);
      }
    },
    stopPolling: (state, action: PayloadAction<string>) => {
      state.pollingJobIds = state.pollingJobIds.filter((id: string) => id !== action.payload);
    },
    updateSourceRunStatus: (state, action: PayloadAction<{ jobId: string; status: SourceRun }>) => {
      state.runsByJobId[action.payload.jobId] = action.payload.status;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSourceRun.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSourceRun.fulfilled, (state, action) => {
        state.loading = false;
        state.runsByJobId[action.payload.jobId] = action.payload.data;
      })
      .addCase(fetchSourceRun.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { startPolling, stopPolling, updateSourceRunStatus, clearError } =
  sourceRunSlice.actions;
export default sourceRunSlice.reducer;
