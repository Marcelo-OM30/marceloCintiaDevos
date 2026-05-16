import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BibleVerse } from '@/types';
import { CURATED_VERSES } from '@/lib/curatedVerses';

interface VerseOfDay extends BibleVerse {
  bible_chapters: {
    number: number;
    bible_books: {
      name: string;
      abbrev: string;
    };
  };
}

// Seleciona o versículo do dia a partir da lista curada
// — mesmo versículo para todos os usuários no mesmo dia
function getTodayRef() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return CURATED_VERSES[(dayOfYear - 1 + CURATED_VERSES.length) % CURATED_VERSES.length];
}

export function useVerseOfDay(versionSlug = 'arc') {
  const ref = getTodayRef();
  const today = new Date().toISOString().slice(0, 10);

  return useQuery<VerseOfDay | null>({
    queryKey: ['verse-of-day', today, versionSlug],
    staleTime: 24 * 60 * 60 * 1000, // 24h
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bible_verses')
        .select(
          'id, number, text, bible_chapters!inner(number, bible_books!inner(name, abbrev))',
        )
        .eq('number', ref.verse)
        .eq('bible_chapters.number', ref.chapter)
        .eq('bible_chapters.bible_books.name', ref.book)
        .limit(1)
        .single();

      if (error) {
        // Fallback: Salmos 23:1
        const { data: fallback } = await supabase
          .from('bible_verses')
          .select(
            'id, number, text, bible_chapters!inner(number, bible_books!inner(name, abbrev))',
          )
          .eq('number', 1)
          .eq('bible_chapters.number', 23)
          .eq('bible_chapters.bible_books.name', 'Salmos')
          .limit(1)
          .single();
        return fallback as VerseOfDay | null;
      }
      return data as VerseOfDay | null;
    },
  });
}
