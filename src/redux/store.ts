import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/slices/authSlice';
import jobPostReducer from '../features/job_post/slices/Jobpostslice';
import sourceRunReducer from './slices/sourceRunSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobPost: jobPostReducer,
    sourceRun: sourceRunReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
