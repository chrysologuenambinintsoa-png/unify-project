import { useState, useEffect, useCallback } from 'react';

export interface BadgesData {
  home: number;
  friends: number;
  messages: number;
  notifications: number;
  groups: number;
  pages: number;
  stats: {
    friends: number;
    groups: number;
  };
}

export const useBadges = () => {
  const [badges, setBadges] = useState<BadgesData>({
    home: 0,
    friends: 0,
    messages: 0,
    notifications: 0,
    groups: 0,
    pages: 0,
    stats: {
      friends: 0,
      groups: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build the URL properly for both localhost and remote access
      const url = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/badges`
        : '/api/badges';

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('Badges API error:', response.status, response.statusText);
        setError(`Error ${response.status}: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setBadges(data.data);
        setError(null);
      } else {
        console.error('Invalid badges response:', data);
        setError('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      console.error('Error fetching badges:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch badges on mount
  useEffect(() => {
    fetchBadges();

    // Refresh badges every 30 seconds
    const interval = setInterval(fetchBadges, 30000);

    return () => clearInterval(interval);
  }, [fetchBadges]);

  // Listen for real-time updates via postMessage (from another tab/window)
  useEffect(() => {
    const handleMessageEvent = (event: MessageEvent) => {
      if (event.data.type === 'BADGES_UPDATED') {
        setBadges(event.data.badges);
      }
    };

    window.addEventListener('message', handleMessageEvent);
    return () => window.removeEventListener('message', handleMessageEvent);
  }, []);

  return {
    badges,
    loading,
    error,
    refetch: fetchBadges,
    incrementHomeBadge: () => setBadges(prev => ({ ...prev, home: prev.home + 1 })),
    clearHomeBadge: () => setBadges(prev => ({ ...prev, home: 0 }))
  };
};

// Hook pour écouter les updates en temps réel (WebSocket simulation)
export const useBadgesRealtime = () => {
  const { badges, loading, error, refetch } = useBadges();

  useEffect(() => {
    // Simuler les updates en temps réel avec polling
    const interval = setInterval(() => {
      refetch();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  return { badges, loading, error, refetch };
};
