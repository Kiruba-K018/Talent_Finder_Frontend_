import api from '../../../api/axiosInstance';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
}

export const loginApi = async (payload: LoginPayload): Promise<LoginResponse> => {
  // FastAPI OAuth2PasswordRequestForm expects form-encoded body with "username" field
  const formData = new URLSearchParams();
  formData.append('username', payload.email);
  formData.append('password', payload.password);

  const response = await api.post<LoginResponse>('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

export const registerApi = async (payload: RegisterPayload): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/register', payload);
  return response.data;
};

export const forgotPasswordApi = async (email: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return response.data;
};

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export const verifyOtpApi = async (payload: VerifyOtpPayload): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/verify-otp', payload);
  return response.data;
};

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  new_password: string;
}

export const resetPasswordApi = async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/reset-password', payload);
  return response.data;
};