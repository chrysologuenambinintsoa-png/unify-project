import { useEffect, useState, useCallback } from 'react';

interface FriendBadges {
  pendingRequests: number;
  suggestions: number;
  friends: number;
  total: number;
}

interface UseFriendBadgesOptions {
  refetchInterval?: number; // en millisecondes, défaut: 0 (disabled)
  enabled?: boolean;
}

/**
 * Hook pour obtenir et synchroniser les compteurs d'amis
 * Fournit les compteurs pour les badges d'affichage
 * 
 * Usage:
 * const { badges, loading, error, refetch } = useFriendBadges();
 * 
 * Retourne:
 * - badges: objet avec pendingRequests, suggestions, friends, total
 * - loading: booléen indiquant si les données se chargent
 * - error: message d'erreur ou null
 * - refetch: fonction pour rafraîchir les données manuellement
 */
export function useFriendBadges(
  options: UseFriendBadgesOptions = {}
) {
  const { refetchInterval = 0, enabled = true } = options;

  const [badges, setBadges] = useState<FriendBadges>({
    pendingRequests: 0,
    suggestions: 0,
    friends: 0,
    total: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/friends/badges');

      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }

      const data: FriendBadges = await response.json();
      setBadges(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching friend badges:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Fetch initial data
  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // Setup auto-refresh interval
  useEffect(() => {
    if (!enabled || refetchInterval <= 0) return;

    const interval = setInterval(fetchBadges, refetchInterval);

    return () => clearInterval(interval);
  }, [enabled, refetchInterval, fetchBadges]);

  return {
    badges,
    loading,
    error,
    refetch: fetchBadges,
  };
}

/**
 * Hook pour obtenir la liste des demandes d'amis
 */
export function useFriendRequests(options: UseFriendBadgesOptions = {}) {
  const { refetchInterval = 0, enabled = true } = options;

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchRequests = useCallback(async (limit = 20, offset = 0) => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/friends/requests?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data.requests);
      setTotal(data.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching friend requests:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!enabled || refetchInterval <= 0) return;

    const interval = setInterval(() => fetchRequests(), refetchInterval);

    return () => clearInterval(interval);
  }, [enabled, refetchInterval, fetchRequests]);

  return {
    requests,
    total,
    loading,
    error,
    refetch: fetchRequests,
  };
}

/**
 * Hook pour obtenir la liste des suggestions d'amis
 */
export function useFriendSuggestions(options: UseFriendBadgesOptions = {}) {
  const { refetchInterval = 60000, enabled = true } = options;

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchSuggestions = useCallback(async (limit = 20, offset = 0) => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/friends/suggestions?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
      setTotal(data.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching friend suggestions:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  useEffect(() => {
    if (!enabled || refetchInterval <= 0) return;

    const interval = setInterval(() => fetchSuggestions(), refetchInterval);

    return () => clearInterval(interval);
  }, [enabled, refetchInterval, fetchSuggestions]);

  return {
    suggestions,
    total,
    loading,
    error,
    refetch: fetchSuggestions,
  };
}

/**
 * Hook pour obtenir la liste des amis
 */
export function useFriendsList(options: UseFriendBadgesOptions = {}) {
  const { refetchInterval = 60000, enabled = true } = options;

  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchFriends = useCallback(
    async (limit = 20, offset = 0, search = '') => {
      if (!enabled) return;

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());
        if (search) params.append('search', search);

        const response = await fetch(`/api/friends/list?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch friends');
        }

        const data = await response.json();
        setFriends(data.friends);
        setTotal(data.total);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching friends list:', err);
      } finally {
        setLoading(false);
      }
    },
    [enabled]
  );

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  useEffect(() => {
    if (!enabled || refetchInterval <= 0) return;

    const interval = setInterval(() => fetchFriends(), refetchInterval);

    return () => clearInterval(interval);
  }, [enabled, refetchInterval, fetchFriends]);

  return {
    friends,
    total,
    loading,
    error,
    refetch: fetchFriends,
  };
}
