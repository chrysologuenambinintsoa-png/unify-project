'use client';

import { useEffect } from 'react';
import { initMobileDiagnostics } from '@/lib/mobileDiagnostics';

export function DiagnosticsClient() {
  useEffect(() => {
    initMobileDiagnostics();
  }, []);

  return null;
}
