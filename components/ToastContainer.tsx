'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { NotificationToast } from '@/components/NotificationToast';
import { useToastStore } from '@/hooks/useToast';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[200] space-y-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <NotificationToast
              type={toast.type as any}
              user={toast.user}
              message={toast.message}
              onDismiss={() => removeToast(toast.id)}
              autoClose={toast.autoClose}
              duration={toast.duration}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
