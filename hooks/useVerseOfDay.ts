import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BibleVerse } from '@/types';

interface VerseOfDay extends BibleVerse {
  bible_chapters: {
    number: number;
    bible_books: {
      name: string;
      abbrev: string;
      bible_versions: {
        slug: string;
      };
    };
  };
}

// Deterministic "random" verse based on calendar day
// so every user sees the same verse on the same day
function getTodayVerseId(): number {
  const now = new Date();
  // Day of year 1-365
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86_400_000);
  // We'll fetch the verse at row offset = dayOfYear mod (total verses)
  // We use a fixed seed offset so it cycles nicely. Actual total will be
  // determined at runtime; we use 31_102 (ARC full Bible verse count).
  return ((dayOfYear - 1 + 31102) % 31102) + 1; // 1-indexed row offset
}

export function useVerseOfDay(versionSlug = 'arc') {
  const rowOffset = getTodayVerseId();
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

  return useQuery<VerseOfDay | null>({
    queryKey: ['verse-of-day', today, versionSlug],
    staleTime: 24 * 60 * 60 * 1000, // 24h
    queryFn: async () => {
      // Get a single verse using row-level offset
      const { data, error } = await supabase
        .from('bible_verses')
        .select(
          'id, number, text, bible_chapters!inner(number, bible_books!inner(name, abbrev, bible_versions!inner(slug)))',
        )
        .eq('bible_chapters.bible_books.bible_versions.slug', versionSlug)
        .range(rowOffset, rowOffset)
        .single();

      if (error) {
        // Fallback: Salmos 23:1
        const { data: fallback } = await supabase
          .from('bible_verses')
          .select(
            'id, number, text, bible_chapters!inner(number, bible_books!inner(name, abbrev, bible_versions!inner(slug)))',
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
