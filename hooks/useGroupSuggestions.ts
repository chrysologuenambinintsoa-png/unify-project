'use client';

import { useEffect, useState, useCallback } from 'react';

export interface SuggestedGroup {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isPrivate?: boolean;
  createdAt?: string;
  _count?: { members: number };
  mutualFriendsCount?: number;
}

export function useGroupSuggestions({ limit = 10, offset = 0 } = {}) {
  const [items, setItems] = useState<SuggestedGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/suggestions?limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.suggestions) ? data.suggestions : (data.suggestions ?? []));
    } catch (err) {
      setError(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchSuggestions();
    // Auto-refresh disabled to prevent data loss on fast interactions
  }, [fetchSuggestions]);

  return { items, loading, error, refresh: fetchSuggestions };
}
