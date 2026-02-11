'use client';

import { useEffect, useState, useCallback } from 'react';

export interface SuggestedPage {
  id: string;
  name: string;
  description?: string;
  category?: string;
  image?: string;
  coverImage?: string;
  followers?: number;
}

export function usePageSuggestions({ limit = 10, offset = 0 } = {}) {
  const [items, setItems] = useState<SuggestedPage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pages?type=discover&limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // API returns array or { pages: [] }
      if (Array.isArray(data)) setItems(data);
      else if (Array.isArray(data.pages)) setItems(data.pages);
      else setItems(data || []);
    } catch (err) {
      setError(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchSuggestions();
    const t = setInterval(fetchSuggestions, 30000);
    return () => clearInterval(t);
  }, [fetchSuggestions]);

  return { items, loading, error, refresh: fetchSuggestions };
}
