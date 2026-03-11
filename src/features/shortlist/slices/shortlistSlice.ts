import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { ShortlistState, CandidateDetail } from '@types';
import { apiClient } from '@api';

const initialState: ShortlistState = {
  candidates: [],
  selectedCandidate: null,
  loading: false,
  error: null,
  noteLoading: false,
};

// Thunks
export const fetchShortlist = createAsyncThunk(
  'shortlist/fetch',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/shortlist/${jobId}`);
      // Extract shortlist array from response wrapper
      return response.data.shortlist || [];
    } catch (error: any) {
      console.error('Fetch shortlist error:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch shortlist');
    }
  }
);

export const fetchCandidateDetail = createAsyncThunk(
  'shortlist/fetchCandidate',
  async ({ jobId, candidateId }: { jobId: string; candidateId: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/shortlist/${jobId}/${candidateId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch candidate details');
    }
  }
);



export const addNote = createAsyncThunk(
  'shortlist/addNote',
  async ({ jobId, candidateId, note }: { jobId: string; candidateId: string; note: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/shortlist/${jobId}/${candidateId}`, {
        note: note,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add note');
    }
  }
);

const shortlistSlice = createSlice({
  name: 'shortlist',
  initialState,
  reducers: {
    setSelectedCandidate: (state, action: PayloadAction<CandidateDetail | null>) => {
      state.selectedCandidate = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetShortlist: (state) => {
      state.candidates = [];
      state.selectedCandidate = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Shortlist
    builder
      .addCase(fetchShortlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShortlist.fulfilled, (state, action) => {
        state.loading = false;
        state.candidates = action.payload;
      })
      .addCase(fetchShortlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Candidate Detail
    builder
      .addCase(fetchCandidateDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCandidateDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCandidate = action.payload;
      })
      .addCase(fetchCandidateDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add Note
    builder
      .addCase(addNote.pending, (state) => {
        state.noteLoading = true;
        state.error = null;
      })
      .addCase(addNote.fulfilled, (state, action) => {
        state.noteLoading = false;
        // Note updated successfully; note is stored in backend
      })
      .addCase(addNote.rejected, (state, action) => {
        state.noteLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedCandidate, clearError, resetShortlist } = shortlistSlice.actions;
export default shortlistSlice.reducer;
