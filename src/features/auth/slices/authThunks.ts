import { AppDispatch } from '../../../redux/store';
import { loginStart, loginSuccess, loginFailure, clearError } from './authSlice';
import { setUser } from './authSlice';
import { loginApi, forgotPasswordApi, LoginPayload } from '../services/authApi';
import { decodeToken, getRoleIdFromToken } from '../../../utils/tokenUtils';
import api from '../../../api/axiosInstance';

/**
 * Map role name (string) to role ID (number)
 * Backend returns role as string, but we need numeric role_id for routing
 */
const mapRoleToId = (role: string | number | undefined | null): number | null => {
  if (typeof role === 'number') {
    return role;
  }
  if (typeof role === 'string') {
    const lowerRole = role.toLowerCase();
    if (lowerRole === 'admin') return 1;
    if (lowerRole === 'recruiter') return 2;
  }
  return null;
};

export const loginThunk =
  (payload: LoginPayload) => async (dispatch: AppDispatch) => {
    dispatch(loginStart());
    try {
      const data = await loginApi(payload);
      dispatch(loginSuccess(data));

      // Decode access token to get role_id
      const tokenRoleId = getRoleIdFromToken(data.access_token);
      console.log('Login - Extracted roleId from token:', tokenRoleId);

      // Fetch user profile immediately after login
      try {
        const userRes = await api.get<any>('/auth/me');
        console.log('User profile from API:', userRes.data);
        
        // Normalize role_id: if API sent role as string, convert to numeric id
        let finalRoleId = tokenRoleId;
        if (!finalRoleId && userRes.data.role) {
          finalRoleId = mapRoleToId(userRes.data.role);
          console.log('Mapped role name to numeric ID:', userRes.data.role, '→', finalRoleId);
        }
        
        const userWithRole = {
          ...userRes.data,
          role_id: finalRoleId, // Ensure role_id is always numeric
        };
        
        console.log('Dispatching user with role_id:', userWithRole);
        dispatch(setUser(userWithRole));
      } catch (apiError) {
        console.error('Error fetching user profile:', apiError);
        // non-blocking — dashboard will still load
        // But ensure we at least have role_id from token
        if (tokenRoleId !== null) {
          console.log('Setting user with only role_id from token:', tokenRoleId);
          dispatch(setUser({
            role_id: tokenRoleId,
          } as any));
        }
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