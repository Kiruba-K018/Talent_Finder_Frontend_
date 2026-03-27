import { useCallback } from 'react';
import { useAppDispatch } from './useRedux';
import { addToast, removeToast } from '@redux/slices/uiSlice';
import { Toast } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useToast = () => {
  const dispatch = useAppDispatch();

  const showToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
      duration: number = 3000
    ) => {
      const id = generateId();
      const toast: Toast = {
        id,
        message,
        type,
        duration,
      };
      dispatch(addToast(toast));
      return id;
    },
    [dispatch]
  );

  const removeToastFn = useCallback(
    (id: string) => {
      dispatch(removeToast(id));
    },
    [dispatch]
  );

  return { showToast, removeToast: removeToastFn };
};
