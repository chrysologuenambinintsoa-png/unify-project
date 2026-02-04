import { useState, useEffect } from 'react';
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

  const fetchCounts = async () => {
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
  };

  const refreshCounts = () => {
    fetchCounts();
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchCounts();
    }
  }, [session?.user?.id]);

  // Auto-refresh disabled - only manual refresh allowed

  return {
    counts,
    loading,
    refreshCounts,
  };
}