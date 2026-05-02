import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BibleVersion, BibleBook, BibleChapter, BibleVerse } from '@/types';

// ── Versões disponíveis ────────────────────────────────────────────────────────
export function useBibleVersions() {
  return useQuery({
    queryKey: ['bible-versions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bible_versions')
        .select('*')
        .order('id');
      if (error) throw error;
      return data as BibleVersion[];
    },
    staleTime: Infinity, // versões não mudam
  });
}

// ── Livros de uma versão ───────────────────────────────────────────────────────
export function useBibleBooks(versionSlug: string) {
  return useQuery({
    queryKey: ['bible-books', versionSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bible_books')
        .select('*, bible_versions!inner(slug)')
        .eq('bible_versions.slug', versionSlug)
        .order('number');
      if (error) throw error;
      return data as (BibleBook & { bible_versions: { slug: string } })[];
    },
    staleTime: Infinity,
    enabled: !!versionSlug,
  });
}

// ── Capítulos de um livro ──────────────────────────────────────────────────────
export function useBibleChapters(bookId: number | null) {
  return useQuery({
    queryKey: ['bible-chapters', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bible_chapters')
        .select('*')
        .eq('book_id', bookId!)
        .order('number');
      if (error) throw error;
      return data as BibleChapter[];
    },
    staleTime: Infinity,
    enabled: !!bookId,
  });
}

// ── Versículos de um capítulo ──────────────────────────────────────────────────
export function useBibleVerses(chapterId: number | null) {
  return useQuery({
    queryKey: ['bible-verses', chapterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bible_verses')
        .select('id, number, text')
        .eq('chapter_id', chapterId!)
        .order('number');
      if (error) throw error;
      return data as Pick<BibleVerse, 'id' | 'number' | 'text'>[];
    },
    enabled: !!chapterId,
  });
}

// ── Pesquisa full-text ─────────────────────────────────────────────────────────
export type SearchResult = {
  verse_id: number;
  chapter_id: number;
  verse_number: number;
  verse_text: string;
  chapter_num: number;
  book_name: string;
  book_abbrev: string;
  book_number: number;
  testament: 'OT' | 'NT';
  rank: number;
};

export function useSearchVerses(query: string, versionSlug: string) {
  return useQuery({
    queryKey: ['bible-search', query, versionSlug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_verses', {
        query_text: query,
        version_slug: versionSlug,
        max_results: 50,
      });
      if (error) throw error;
      return data as SearchResult[];
    },
    enabled: query.trim().length >= 3,
    staleTime: 1000 * 60 * 5,
  });
}
