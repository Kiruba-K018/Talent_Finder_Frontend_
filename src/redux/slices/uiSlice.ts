import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UIState, ActiveView, Toast } from '@types';

const initialState: UIState = {
  activeView: 'job_list',
  sidebarOpen: true,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveView: (state, action: PayloadAction<ActiveView>) => {
      state.activeView = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addToast: (state, action: PayloadAction<Toast>) => {
      state.toasts.push(action.payload);
      // Auto-remove toast after duration (default 3 seconds)
      if (action.payload.duration !== 0) {
        setTimeout(() => {
          state.toasts = state.toasts.filter((t: Toast) => t.id !== action.payload.id);
        }, action.payload.duration || 3000);
      }
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t: Toast) => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const {
  setActiveView,
  toggleSidebar,
  setSidebarOpen,
  addToast,
  removeToast,
  clearToasts,
} = uiSlice.actions;

export default uiSlice.reducer;
