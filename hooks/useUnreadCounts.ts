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
      const response = await fetch('/api/unread-counts');
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

  // Refresh counts every 30 seconds
  useEffect(() => {
    if (!session?.user?.id) return;

    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  return {
    counts,
    loading,
    refreshCounts,
  };
}