import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  role_id: number;
}

interface AuthState {
  accessToken: string | null;
  tokenType: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  tokenType: null,
  refreshToken: null,
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(
      state,
      action: PayloadAction<{ access_token: string; token_type: string; refresh_token: string }>
    ) {
      state.loading = false;
      state.accessToken = action.payload.access_token;
      state.tokenType = action.payload.token_type;
      state.refreshToken = action.payload.refresh_token;
      state.isAuthenticated = true;
      state.error = null;
    },
    setUser(state, action: PayloadAction<UserProfile>) {
      state.user = action.payload;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout(state) {
      state.accessToken = null;
      state.tokenType = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError, setUser } =
  authSlice.actions;
export default authSlice.reducer;
