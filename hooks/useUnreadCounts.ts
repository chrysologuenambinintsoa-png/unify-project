import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UnreadCounts {
  notifications: number;
  messages: number;
}

export function useUnreadCounts() {
  const { data: session } = useSession();
  const [counts, setCounts] = useState<UnreadCounts>({
    notifications: 0,
    messages: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchCounts = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      // Build the URL properly for both localhost and remote access
      const url = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/unread-counts`
        : '/api/unread-counts';

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCounts(data);
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const refreshCounts = useCallback(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Load counts on mount and when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchCounts();
    }
  }, [session?.user?.id, fetchCounts]);

  // Auto-refresh every 15 seconds to stay in sync with sidebar badges
  useEffect(() => {
    if (!session?.user?.id) return;

    const interval = setInterval(() => {
      fetchCounts();
    }, 15000);

    return () => clearInterval(interval);
  }, [session?.user?.id, fetchCounts]);

  // Listen for real-time updates via postMessage
  useEffect(() => {
    const handleMessageEvent = (event: MessageEvent) => {
      if (event.data.type === 'COUNTS_UPDATED') {
        setCounts(event.data.counts);
      }
    };

    window.addEventListener('message', handleMessageEvent);
    return () => window.removeEventListener('message', handleMessageEvent);
  }, []);

  return {
    counts,
    loading,
    refreshCounts,
  };
}