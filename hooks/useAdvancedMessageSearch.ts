import { useMemo, useCallback, useState, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    fullName: string;
  };
  timestamp: string;
  reactions?: Array<{
    emoji: string;
    count: number;
  }>;
}

interface SearchFilters {
  query: string;
  from?: string; // sender username
  startDate?: string; // ISO date
  endDate?: string;
  hasReactions?: boolean;
  hasAttachments?: boolean;
  regex?: boolean; // use regex instead of substring
}

interface SearchResult extends Message {
  highlights: Array<{
    start: number;
    end: number;
  }>;
  snippet: string; // excerpt with context
  matchScore: number; // relevance score 0-100
}

/**
 * Hook pour recherche avancée de messages côté client
 * Supporte regex, filtres de date, filtres par sender, etc.
 */
export function useAdvancedMessageSearch(messages: Message[]) {
  const [searchHistory, setSearchHistory] = useState<SearchFilters[]>([]);

  /**
   * Tokenizer - diviser le contenu en mots pour recherche plus nuancée
   */
  const tokenize = useCallback((text: string): string[] => {
    return text
      .toLowerCase()
      .split(/[\s\n\r\t]+/)
      .filter(token => token.length > 0);
  }, []);

  /**
   * Calculer un score de pertinence
   * Basé sur: position du premier match, nombre de matches, longueur du match
   */
  const calculateMatchScore = useCallback(
    (text: string, query: string, useRegex: boolean = false): number => {
      if (!query) return 0;

      let matches = 0;
      let firstMatchPos = -1;

      try {
        if (useRegex) {
          const regex = new RegExp(query, 'gi');
          let match;
          while ((match = regex.exec(text)) !== null) {
            matches++;
            if (firstMatchPos === -1) firstMatchPos = match.index;
          }
        } else {
          const lowerText = text.toLowerCase();
          const lowerQuery = query.toLowerCase();
          let pos = 0;

          while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
            matches++;
            if (firstMatchPos === -1) firstMatchPos = pos;
            pos += lowerQuery.length;
          }
        }
      } catch (error) {
        console.error('Regex error:', error);
        return 0;
      }

      if (matches === 0) return 0;

      // Score: nombre de matches * 30 + (100 - position du premier match / longueur du texte)
      const positionScore = firstMatchPos === -1 ? 0 : Math.max(0, 100 - (firstMatchPos / text.length) * 100);
      return Math.min(100, matches * 30 + positionScore * 0.3);
    },
    []
  );

  /**
   * Extraire un snippet du contenu avec contexte
   */
  const getSnippet = useCallback((text: string, query: string, contextChars: number = 50): string => {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
      // Si pas trouvé, retourner le début du texte
      return text.substring(0, contextChars * 2) + (text.length > contextChars * 2 ? '...' : '');
    }

    // Extraire avec contexte avant et après
    const start = Math.max(0, index - contextChars);
    const end = Math.min(text.length, index + query.length + contextChars);
    const snippet = text.substring(start, end);

    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';

    return prefix + snippet + suffix;
  }, []);

  /**
   * Récupérer les positions de tous les matches dans le texte
   */
  const getHighlights = useCallback(
    (text: string, query: string, useRegex: boolean = false): Array<{ start: number; end: number }> => {
      const highlights: Array<{ start: number; end: number }> = [];

      if (!query) return highlights;

      try {
        if (useRegex) {
          const regex = new RegExp(query, 'gi');
          let match;
          while ((match = regex.exec(text)) !== null) {
            highlights.push({
              start: match.index,
              end: match.index + match[0].length,
            });
          }
        } else {
          const lowerText = text.toLowerCase();
          const lowerQuery = query.toLowerCase();
          let pos = 0;

          while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
            highlights.push({
              start: pos,
              end: pos + lowerQuery.length,
            });
            pos += lowerQuery.length;
          }
        }
      } catch (error) {
        console.error('Highlight error:', error);
      }

      return highlights;
    },
    []
  );

  /**
   * Vérifier si une date est dans la plage
   */
  const isDateInRange = useCallback((timestamp: string, startDate?: string, endDate?: string): boolean => {
    if (!startDate && !endDate) return true;

    const date = new Date(timestamp);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && date < start) return false;
    if (end && date > end) return false;

    return true;
  }, []);

  /**
   * Recherche avancée principale
   */
  const search = useCallback(
    (filters: SearchFilters): SearchResult[] => {
      const {
        query = '',
        from,
        startDate,
        endDate,
        hasReactions,
        hasAttachments,
        regex = false,
      } = filters;

      // Valider la regex si utilisée
      let regexValid = true;
      if (regex && query) {
        try {
          new RegExp(query);
        } catch (error) {
          console.error('Invalid regex:', query);
          regexValid = false;
        }
      }

      if (!regexValid) return [];
      if (!query && !from && !startDate && !endDate) return [];

      // Ajouter à l'historique si c'est une nouvelle recherche
      if (query || from) {
        setSearchHistory(prev => {
          const isDuplicate = prev.some(h => h.query === query && h.from === from);
          if (!isDuplicate) {
            return [filters, ...prev.slice(0, 9)]; // Keep last 10
          }
          return prev;
        });
      }

      // Filtrer les messages
      const results: SearchResult[] = messages
        .filter(msg => {
          // Filtre par contenu
          if (query) {
            if (regex) {
              try {
                if (!new RegExp(query, 'i').test(msg.content)) return false;
              } catch {
                return false;
              }
            } else {
              if (!msg.content.toLowerCase().includes(query.toLowerCase())) return false;
            }
          }

          // Filtre par sender
          if (from) {
            if (
              !msg.sender.username.toLowerCase().includes(from.toLowerCase()) &&
              !msg.sender.fullName.toLowerCase().includes(from.toLowerCase())
            ) {
              return false;
            }
          }

          // Filtre par date
          if (!isDateInRange(msg.timestamp, startDate, endDate)) return false;

          // Filtre par réactions
          if (hasReactions && (!msg.reactions || msg.reactions.length === 0)) return false;

          // Filtre par attachments (placeholder pour future implémentation)
          if (hasAttachments && !msg.content.includes('attachment:')) return false;

          return true;
        })
        .map(msg => {
          const highlights = query ? getHighlights(msg.content, query, regex) : [];
          const snippet = query ? getSnippet(msg.content, query) : msg.content.substring(0, 100);
          const matchScore = query ? calculateMatchScore(msg.content, query, regex) : 100;

          return {
            ...msg,
            highlights,
            snippet,
            matchScore,
          };
        })
        // Trier par score de pertinence
        .sort((a, b) => b.matchScore - a.matchScore);

      return results;
    },
    [messages, getHighlights, getSnippet, calculateMatchScore, isDateInRange]
  );

  /**
   * Recherche avec debounce
   */
  const [debouncedResults, setDebouncedResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useCallback(
    (filters: SearchFilters) => {
      setIsSearching(true);
      const results = search(filters);
      setDebouncedResults(results);
      setIsSearching(false);
      return results;
    },
    [search]
  );

  /**
   * Suggestions de recherche basées sur l'historique et le contenu
   */
  const getSearchSuggestions = useCallback(
    (partialQuery: string, limit: number = 5
  ): Array<{ text: string; type: 'history' | 'sender' | 'content' }> => {
      if (!partialQuery) return [];

      const suggestions = new Set<string>();

      // Du l'historique
      searchHistory
        .filter(h => h.query?.toLowerCase().includes(partialQuery.toLowerCase()))
        .slice(0, 2)
        .forEach(h => suggestions.add(h.query));

      // Des senders
      messages
        .filter(m =>
          m.sender.username.toLowerCase().includes(partialQuery.toLowerCase()) ||
          m.sender.fullName.toLowerCase().includes(partialQuery.toLowerCase())
        )
        .slice(0, 3)
        .forEach(m => {
          suggestions.add(`from:${m.sender.username}`);
        });

      // Du contenu (mots commençant par la requête)
      messages
        .flatMap(m => tokenize(m.content))
        .filter(word => word.startsWith(partialQuery.toLowerCase()))
        .slice(0, 5)
        .forEach(word => suggestions.add(word));

      return Array.from(suggestions)
        .slice(0, limit)
        .map((text, index) => ({
          text,
          type: index < 2 ? 'history' : index < 5 ? 'sender' : 'content',
        }));
    },
    [searchHistory, messages, tokenize]
  );

  /**
   * Récupérer l'historique de recherche
   */
  const getSearchHistory = useCallback(() => {
    return searchHistory;
  }, [searchHistory]);

  /**
   * Supprimer un élément de l'historique
   */
  const removeFromHistory = useCallback((index: number) => {
    setSearchHistory(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Vider l'historique
   */
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  /**
   * Recherche facettes - compter matches par catégorie
   */
  const getFacets = useCallback(() => {
    const facets = {
      senders: new Map<string, number>(),
      dates: new Map<string, number>(),
      hasReactions: 0,
    };

    messages.forEach(msg => {
      // Count par sender
      const senderKey = msg.sender.username;
      facets.senders.set(senderKey, (facets.senders.get(senderKey) || 0) + 1);

      // Count par date (jour)
      const day = new Date(msg.timestamp).toISOString().split('T')[0];
      facets.dates.set(day, (facets.dates.get(day) || 0) + 1);

      // Count avec réactions
      if (msg.reactions && msg.reactions.length > 0) {
        facets.hasReactions++;
      }
    });

    return facets;
  }, [messages]);

  return {
    // Méthodes
    search,
    debouncedSearch,
    getSearchSuggestions,
    getSearchHistory,
    removeFromHistory,
    clearHistory,
    getFacets,

    // État
    debouncedResults,
    isSearching,
    searchHistory,
  };
}
