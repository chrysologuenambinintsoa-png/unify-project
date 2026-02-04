/**
 * Hook pour mesurer la vitesse réelle de connexion et synchroniser la barre de progression
 */

import { useState, useEffect, useRef } from 'react';

export interface ProgressState {
  progress: number;
  isComplete: boolean;
  connectionSpeed: 'slow' | 'medium' | 'fast' | 'unknown';
}

export const useRealProgress = (isLoading: boolean) => {
  const [progressState, setProgressState] = useState<ProgressState>({
    progress: 0,
    isComplete: false,
    connectionSpeed: 'unknown',
  });

  const progressRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionSpeedRef = useRef<'slow' | 'medium' | 'fast' | 'unknown'>('unknown');

  // Mesurer la vitesse de connexion au démarrage
  useEffect(() => {
    const measureConnectionSpeed = async () => {
      try {
        // Test de performance simple
        const start = performance.now();
        const response = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-store',
        }).catch(() => null);
        const end = performance.now();
        const latency = end - start;

        // Déterminer la vitesse basée sur la latence
        if (latency < 100) {
          connectionSpeedRef.current = 'fast';
        } else if (latency < 300) {
          connectionSpeedRef.current = 'medium';
        } else {
          connectionSpeedRef.current = 'slow';
        }
      } catch (error) {
        console.error('Error measuring connection speed:', error);
        connectionSpeedRef.current = 'unknown';
      }
    };

    if (isLoading) {
      measureConnectionSpeed();
    }
  }, [isLoading]);

  // Animation de barre de progression basée sur la vitesse réelle
  useEffect(() => {
    if (!isLoading) {
      // Complétion rapide quand le chargement est terminé
      progressRef.current = 100;
      setProgressState((prev) => ({
        ...prev,
        progress: 100,
        isComplete: true,
      }));
      return;
    }

    progressRef.current = 0;
    setProgressState((prev) => ({
      ...prev,
      progress: 0,
      isComplete: false,
      connectionSpeed: connectionSpeedRef.current,
    }));

    const speedMultiplier =
      connectionSpeedRef.current === 'fast'
        ? 1.5
        : connectionSpeedRef.current === 'slow'
          ? 0.6
          : 1;

    // Phase 1: Progression rapide (0 à 60%)
    const phase1Interval = setInterval(() => {
      progressRef.current += Math.random() * (15 * speedMultiplier);
      if (progressRef.current >= 60) {
        progressRef.current = 60;
        clearInterval(phase1Interval);
      }
      setProgressState((prev) => ({
        ...prev,
        progress: Math.min(progressRef.current, 100),
      }));
    }, 250);

    // Phase 2: Progression lente (60 à 95%)
    const phase2Timer = setTimeout(() => {
      const phase2Interval = setInterval(() => {
        progressRef.current += Math.random() * (8 * speedMultiplier);
        if (progressRef.current >= 95) {
          progressRef.current = 95;
          clearInterval(phase2Interval);
        }
        setProgressState((prev) => ({
          ...prev,
          progress: Math.min(progressRef.current, 100),
        }));
      }, 300);
      intervalRef.current = phase2Interval;
    }, 1500 / speedMultiplier);

    return () => {
      clearInterval(phase1Interval);
      clearTimeout(phase2Timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoading]);

  return progressState;
};
