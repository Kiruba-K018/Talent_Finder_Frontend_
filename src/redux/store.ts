import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/slices/authSlice';
import jobPostReducer from '../features/job_post/slices/Jobpostslice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobPost: jobPostReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
