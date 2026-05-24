import { create } from 'zustand';

interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIState {
  isDark: boolean;
  isLoading: boolean;
  toast: ToastData | null;
  setTheme: (isDark: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => {
  let toastTimeout: any = null;

  return {
    isDark: false,
    isLoading: false,
    toast: null,
    setTheme: (isDark) => set({ isDark }),
    setLoading: (isLoading) => set({ isLoading }),
    showToast: (message, type = 'info') => {
      // Clear any active toast timeouts
      if (toastTimeout) {
        clearTimeout(toastTimeout);
      }
      
      set({ toast: { message, type } });
      
      // Auto-hide toast after 3.5 seconds
      toastTimeout = setTimeout(() => {
        set({ toast: null });
        toastTimeout = null;
      }, 3500);
    },
    hideToast: () => {
      if (toastTimeout) {
        clearTimeout(toastTimeout);
        toastTimeout = null;
      }
      set({ toast: null });
    },
  };
});
