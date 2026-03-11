import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  [key: string]: any;
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

const storedUser = localStorage.getItem('user');

const initialState: AuthState = {
  accessToken: localStorage.getItem('access_token'),
  tokenType: localStorage.getItem('token_type'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  user: storedUser ? JSON.parse(storedUser) : null,
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
      localStorage.setItem('access_token', action.payload.access_token);
      localStorage.setItem('token_type', action.payload.token_type);
      localStorage.setItem('refresh_token', action.payload.refresh_token);
    },
    setUser(state, action: PayloadAction<UserProfile>) {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
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
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;