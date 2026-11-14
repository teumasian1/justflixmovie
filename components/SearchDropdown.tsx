'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IMG_URL, type TmdbItem } from '@/lib/tmdb';
import { useModal } from './ModalContext';
import Icon from './Icon';

export type SearchFilter = 'all' | 'movie' | 'tv';

function itemTypeOf(item: TmdbItem): 'movie' | 'tv' {
  return (item.media_type || (item.first_air_date ? 'tv' : 'movie')) === 'tv' ? 'tv' : 'movie';
}

interface UseLiveSearchOptions {
  initialQuery?: string;
  onAfterSelect?: () => void;
}

export function useLiveSearch({ initialQuery = '', onAfterSelect }: UseLiveSearchOptions = {}) {
  const [query, setQueryState] = useState(initialQuery);
  const [dirty, setDirty] = useState(false);
  const [results, setResults] = useState<TmdbItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { open } = useModal();
  const router = useRouter();

  const setQuery = (next: string) => {
    setDirty(true);
    setQueryState(next);
  };

  const clear = () => {
    setDirty(false);
    setQueryState('');
    setResults(null);
    setActiveIndex(-1);
    setSearchFilter('all');
  };

  const closeDropdown = () => {
    setResults(null);
    setActiveIndex(-1);
  };

  // Debounced live search when the user actively edits the query.
  useEffect(() => {
    if (!dirty) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setActiveIndex(-1);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);

    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        const top = (data.results || [])
          .filter((i: TmdbItem) => i.poster_path)
          .slice(0, 6);
        setResults(top);
        setActiveIndex(top.length ? 0 : -1);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([]);
          setActiveIndex(-1);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query, dirty]);

  // Close dropdown on outside click.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setResults(null);
        setActiveIndex(-1);
        onAfterSelect?.();
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [onAfterSelect]);

  const filteredResults = useMemo(() => {
    if (!results) return [];
    if (searchFilter === 'all') return results;
    return results.filter((item) => itemTypeOf(item) === searchFilter);
  }, [results, searchFilter]);

  const openResult = (item: TmdbItem) => {
    open(item);
    clear();
    onAfterSelect?.();
    inputRef.current?.blur();
  };

  const navigateToSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    closeDropdown();
    onAfterSelect?.();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!results || filteredResults.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        navigateToSearch();
      } else if (e.key === 'Escape') {
        closeDropdown();
        inputRef.current?.blur();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? filteredResults.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredResults[activeIndex];
      if (target) openResult(target);
      else navigateToSearch();
    } else if (e.key === 'Escape') {
      closeDropdown();
      inputRef.current?.blur();
    }
  };

  return {
    query,
    setQuery,
    clear,
    results,
    filteredResults,
    searching,
    activeIndex,
    setActiveIndex,
    searchFilter,
    setSearchFilter,
    containerRef,
    inputRef,
    openResult,
    closeDropdown,
    navigateToSearch,
    onKeyDown,
  };
}

interface SearchDropdownProps {
  id: string;
  idPrefix: string;
  className?: string;
  query: string;
  results: TmdbItem[] | null;
  filteredResults: TmdbItem[];
  searching: boolean;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  searchFilter: SearchFilter;
  setSearchFilter: (filter: SearchFilter) => void;
  onSelect: (item: TmdbItem) => void;
  onSeeAll: () => void;
}

export function SearchDropdown({
  id,
  idPrefix,
  className = '',
  query,
  results,
  filteredResults,
  searching,
  activeIndex,
  setActiveIndex,
  searchFilter,
  setSearchFilter,
  onSelect,
  onSeeAll,
}: SearchDropdownProps) {
  if (results === null) return null;

  const movieCount = results.filter((i) => itemTypeOf(i) === 'movie').length;
  const tvCount = results.filter((i) => itemTypeOf(i) === 'tv').length;

  return (
    <div className={`nav-search-dropdown ${className}`.trim()} id={id} role="listbox">
      {searching && (
        <div className="nav-search-status">
          <span className="spinner spinner-sm" /> Searching…
        </div>
      )}
      {!searching && results.length === 0 && (
        <div className="nav-search-status">No results found</div>
      )}
      {!searching && results.length > 0 && (
        <div className="nav-search-tabs">
          <button
            type="button"
            className={`search-tab-pill ${searchFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setSearchFilter('all');
              setActiveIndex(0);
            }}
          >
            All ({results.length})
          </button>
          <button
            type="button"
            className={`search-tab-pill ${searchFilter === 'movie' ? 'active' : ''}`}
            onClick={() => {
              setSearchFilter('movie');
              setActiveIndex(0);
            }}
          >
            Movies ({movieCount})
          </button>
          <button
            type="button"
            className={`search-tab-pill ${searchFilter === 'tv' ? 'active' : ''}`}
            onClick={() => {
              setSearchFilter('tv');
              setActiveIndex(0);
            }}
          >
            TV ({tvCount})
          </button>
        </div>
      )}
      {!searching &&
        filteredResults.map((item, i) => (
          <button
            key={item.id}
            id={`${idPrefix}-${item.id}`}
            type="button"
            role="option"
            aria-selected={i === activeIndex}
            className={`nav-search-item ${i === activeIndex ? 'is-active' : ''}`}
            onMouseEnter={() => setActiveIndex(i)}
            onClick={() => onSelect(item)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="nav-search-poster"
              width={92}
              height={138}
              src={`${IMG_URL}${item.poster_path}`}
              alt=""
            />
            <span className="nav-search-info">
              <span className="nav-search-title">{item.title || item.name}</span>
              <span className="nav-search-type">
                {itemTypeOf(item) === 'tv' ? 'TV Series' : 'Movie'}
                {item.release_date || item.first_air_date
                  ? ` · ${new Date(item.release_date || item.first_air_date || '').getFullYear()}`
                  : ''}
              </span>
            </span>
          </button>
        ))}
      {!searching && results.length > 0 && (
        <Link
          className="nav-search-all"
          href={`/search?q=${encodeURIComponent(query.trim())}`}
          onClick={onSeeAll}
        >
          See all results for “{query.trim()}” <Icon name="arrow-right" />
        </Link>
      )}
    </div>
  );
}
