import axios from 'axios';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  ShortlistState,
  CandidateDetail,
  ShortlistListItem,
  ShortlistListResponse,
} from '@types';
import { apiClient } from '@api';

const initialState: ShortlistState = {
  candidates: [],
  selectedCandidate: null,
  loading: false,
  error: null,
  noteLoading: false,
};

// Thunks
export const fetchShortlist = createAsyncThunk<
  ShortlistListItem[],
  string,
  { rejectValue: string }
>('shortlist/fetch', async (jobId: string, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<ShortlistListResponse>(`/shortlist/${jobId}`);
    return response.data.shortlist || [];
  } catch (error: unknown) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.error || 'Failed to fetch shortlist'
      : 'An unexpected error occurred';
    return rejectWithValue(message);
  }
});

export const fetchCandidateDetail = createAsyncThunk<
  CandidateDetail,
  { jobId: string; candidateId: string },
  { rejectValue: string }
>('shortlist/fetchCandidate', async ({ jobId, candidateId }, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<CandidateDetail>(`/shortlist/${jobId}/${candidateId}`);
    return response.data;
  } catch (error: unknown) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.error || 'Failed to fetch candidate details'
      : 'An unexpected error occurred';
    return rejectWithValue(message);
  }
});

export const addNote = createAsyncThunk<
  void,
  { jobId: string; candidateId: string; note: string },
  { rejectValue: string }
>('shortlist/addNote', async ({ jobId, candidateId, note }, { rejectWithValue }) => {
  try {
    await apiClient.put(`/shortlist/${jobId}/${candidateId}`, {
      note: note,
    });
  } catch (error: unknown) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.error || 'Failed to add note'
      : 'An unexpected error occurred';
    return rejectWithValue(message);
  }
});

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
      .addCase(addNote.fulfilled, (state) => {
        state.noteLoading = false;
      })
      .addCase(addNote.rejected, (state, action) => {
        state.noteLoading = false;
        state.error = action.payload || 'Failed to add note';
      });
  },
});

export const { setSelectedCandidate, clearError, resetShortlist } = shortlistSlice.actions;
export default shortlistSlice.reducer;
