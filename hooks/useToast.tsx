'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Toast {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'share' | 'achievement' | 'gift' | 'success' | 'error' | 'info';
  user?: {
    name: string;
    avatar: string;
  };
  message: string;
  duration?: number;
  autoClose?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto remove if autoClose is true
    if (toast.autoClose !== false) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration || 4000);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastStore() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastStore must be used within ToastProvider');
  }
  return context;
}

export function useToast() {
  const { addToast } = useToastStore();

  return {
    success: (message: string, duration?: number) => {
      addToast({ type: 'success', message, duration, autoClose: true });
    },
    error: (message: string, duration?: number) => {
      addToast({ type: 'error', message, duration, autoClose: true });
    },
    info: (message: string, duration?: number) => {
      addToast({ type: 'info', message, duration, autoClose: true });
    },
    like: (user: { name: string; avatar: string }, duration?: number) => {
      addToast({ type: 'like', user, message: 'a aimé votre publication', duration, autoClose: true });
    },
    comment: (user: { name: string; avatar: string }, duration?: number) => {
      addToast({ type: 'comment', user, message: 'a commenté votre publication', duration, autoClose: true });
    },
    follow: (user: { name: string; avatar: string }, duration?: number) => {
      addToast({ type: 'follow', user, message: 'vous a suivi', duration, autoClose: true });
    },
    share: (user: { name: string; avatar: string }, duration?: number) => {
      addToast({ type: 'share', user, message: 'a partagé votre publication', duration, autoClose: true });
    },
    achievement: (message: string, duration?: number) => {
      addToast({ type: 'achievement', message, duration, autoClose: true });
    },
    gift: (user: { name: string; avatar: string }, message: string, duration?: number) => {
      addToast({ type: 'gift', user, message, duration, autoClose: true });
    },
  };
}
