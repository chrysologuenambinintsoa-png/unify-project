'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface SearchResult {
  id: string;
  username?: string;
  fullName?: string;
  avatar?: string;
  isVerified?: boolean;
  content?: string;
  name?: string;
  description?: string;
  type: 'user' | 'post' | 'page';
}

export function SearchBar() {
  const router = useRouter();
  const { translation } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ personnes: any[]; groupes: any[]; pages: any[] }>({
    personnes: [],
    groupes: [],
    pages: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search handler
  useEffect(() => {
    if (query.length < 2) {
      setResults({ personnes: [], groupes: [], pages: [] });
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  const totalResults = results.personnes.length + results.groupes.length + results.pages.length;

  return (
    <div className="relative flex-1 max-w-xs md:max-w-md lg:max-w-md mx-2 lg:mx-8" ref={searchRef}>
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 sm:w-5 h-4 sm:h-5" />
          <input
            type="text"
            placeholder={translation.common.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            className="w-full pl-10 pr-10 py-2 text-sm bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:bg-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              </div>
            ) : totalResults === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Aucun résultat trouvé
              </div>
            ) : (
              <div className="py-2">
                {/* Personnes Section */}
                {results.personnes.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Personnes
                    </div>
                    {results.personnes.map((person) => (
                      <Link key={person.id} href={`/users/${person.id}/profile`}>
                        <div
                          onClick={() => setIsOpen(false)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                        >
                          {person.avatar ? (
                            <img
                              src={person.avatar}
                              alt={person.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-dark to-accent-dark flex items-center justify-center text-white text-xs font-bold">
                              {person.username?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {person.fullName || person.username}
                              </p>
                              {person.isVerified && (
                                <span className="text-blue-500 text-xs">✓</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">@{person.username}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </>
                )}

                {/* Groupes Section */}
                {results.groupes.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Groupes
                    </div>
                    {results.groupes.map((groupe) => (
                      <Link key={groupe.id} href={`/groups/${groupe.id}`}>
                        <div
                          onClick={() => setIsOpen(false)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                        >
                          {groupe.image ? (
                            <img
                              src={groupe.image}
                              alt={groupe.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gradient-to-br from-primary-dark to-accent-dark flex items-center justify-center text-white text-xs font-bold">
                              {groupe.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{groupe.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {groupe.isMember ? 'Membre' : 'Non-membre'} {groupe.isPrivate && '· Privé'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </>
                )}

                {/* Pages Section */}
                {results.pages.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Pages
                    </div>
                    {results.pages.map((page) => (
                      <Link key={page.id} href={`/pages/${page.id}`}>
                        <div
                          onClick={() => setIsOpen(false)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                        >
                          {page.coverImage ? (
                            <img
                              src={page.coverImage}
                              alt={page.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gradient-to-br from-primary-dark to-accent-dark"></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{page.name}</p>
                            <p className="text-xs text-gray-500 truncate">{page.description}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </>
                )}

                {/* View All Results */}
                {totalResults > 0 && (
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
                    <button
                      onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(query)}`);
                        setIsOpen(false);
                      }}
                      className="text-sm text-primary-dark hover:text-accent-dark font-medium transition-colors"
                    >
                      Voir tous les résultats ({totalResults})
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
