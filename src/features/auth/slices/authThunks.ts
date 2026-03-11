import { AppDispatch } from '../../../redux/store';
import { loginStart, loginSuccess, loginFailure, clearError } from './authSlice';
import { setUser } from './authSlice';
import { loginApi, forgotPasswordApi, LoginPayload } from '../services/authApi';
import api from '../../../api/axiosInstance';

export const loginThunk =
  (payload: LoginPayload) => async (dispatch: AppDispatch) => {
    dispatch(loginStart());
    try {
      const data = await loginApi(payload);
      dispatch(loginSuccess(data));

      // Fetch user profile immediately after login
      try {
        const userRes = await api.get('/auth/me');
        dispatch(setUser(userRes.data));
      } catch {
        // non-blocking — dashboard will still load
      }

      return { success: true };
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Login failed. Please try again.';
      dispatch(loginFailure(message));
      return { success: false, error: message };
    }
  };

export const forgotPasswordThunk =
  (email: string) => async (_dispatch: AppDispatch) => {
    try {
      const data = await forgotPasswordApi(email);
      return { success: true, message: data.message };
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Request failed. Please try again.';
      return { success: false, error: message };
    }
  };