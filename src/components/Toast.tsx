import React from 'react';
import type { Toast } from '@types';
import { useAppDispatch } from '@hooks';
import { removeToast } from '@redux/slices/uiSlice';

interface ToastContainerProps {
  toasts: Toast[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        dispatch(removeToast(toast.id));
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, dispatch]);

  const bgColorMap = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };
  const bgColorClass = bgColorMap[toast.type as keyof typeof bgColorMap];

  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };
  const iconClass = iconMap[toast.type as keyof typeof iconMap];

  return (
    <div className={`${bgColorClass} text-white rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-sm animate-bounce-slow`}>
      <span className="text-xl font-bold">{iconClass}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="text-white/80 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
};
