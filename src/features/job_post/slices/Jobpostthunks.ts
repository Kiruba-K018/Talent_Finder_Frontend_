import { AppDispatch } from '../../../redux/store';
import { fetchJobsStart, fetchJobsSuccess, fetchJobsFailure, createJobStart, createJobSuccess, createJobFailure } from './Jobpostslice';
import { logout, setUser } from '../../auth/slices/authSlice';
import { getJobPostsApi, createJobPostApi, logoutApi, getUserProfileApi, CreateJobPayload } from '../../../api/jobPostApi';

export const fetchJobsThunk = () => async (dispatch: AppDispatch) => {
  dispatch(fetchJobsStart());
  try {
    const jobs = await getJobPostsApi();
    dispatch(fetchJobsSuccess(jobs));
  } catch (err: any) {
    dispatch(fetchJobsFailure(err.response?.data?.detail || 'Failed to load job posts.'));
  }
};

export const createJobThunk = (payload: CreateJobPayload) => async (dispatch: AppDispatch) => {
  dispatch(createJobStart());
  try {
    const job = await createJobPostApi(payload);
    dispatch(createJobSuccess(job));
    return { success: true };
  } catch (err: any) {
    const msg = err.response?.data?.detail || 'Failed to create job post.';
    dispatch(createJobFailure(msg));
    return { success: false, error: msg };
  }
};

export const fetchUserProfileThunk = () => async (dispatch: AppDispatch) => {
  try {
    const user = await getUserProfileApi();
    dispatch(setUser(user));
  } catch {
    // non-blocking — user may already be stored
  }
};

export const logoutThunk = () => async (dispatch: AppDispatch) => {
  try {
    await logoutApi();
  } catch {
    // ignore API errors on logout
  } finally {
    dispatch(logout());
  }
};