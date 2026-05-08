import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Devotional } from '@/types';

// ── Tipo estendido com versículos vinculados ──────────────────────────────────
export type DevotionalWithVerses = Devotional & {
  devotional_verses: {
    bible_verses: {
      id: number;
      number: number;
      text: string;
      bible_chapters: {
        number: number;
        bible_books: { name: string; abbrev: string };
      };
    };
  }[];
  devotional_tags: { tag: string }[];
};

// ── Lista de devocionais do usuário ───────────────────────────────────────────
export function useDevotionals() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['devotionals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devotionals')
        .select('*, devotional_tags(tag)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (Devotional & { devotional_tags: { tag: string }[] })[];
    },
    enabled: !!user,
  });
}

// ── Detalhe de um devocional ──────────────────────────────────────────────────
export function useDevotional(id: string) {
  return useQuery({
    queryKey: ['devotional', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devotionals')
        .select(`
          *,
          devotional_tags(tag),
          devotional_verses(
            bible_verses(
              id, number, text,
              bible_chapters(number, bible_books(name, abbrev))
            )
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as DevotionalWithVerses;
    },
    enabled: !!id,
  });
}

// ── Criar devocional ──────────────────────────────────────────────────────────
type CreateDevotionalInput = {
  title: string;
  content: string;
  is_public: boolean;
  tags: string[];
  verse_ids: number[];
};

export function useCreateDevotional() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDevotionalInput) => {
      // 1. Cria o devocional
      const { data: dev, error } = await supabase
        .from('devotionals')
        .insert({
          user_id: user!.id,
          title: input.title.trim(),
          content: input.content.trim(),
          is_public: input.is_public,
        })
        .select('id')
        .single();
      if (error) throw error;

      const devotionalId = dev.id;

      // 2. Tags
      if (input.tags.length) {
        const { error: tagErr } = await supabase
          .from('devotional_tags')
          .insert(input.tags.map((tag) => ({ devotional_id: devotionalId, tag })));
        if (tagErr) throw tagErr;
      }

      // 3. Versículos vinculados
      if (input.verse_ids.length) {
        const { error: verseErr } = await supabase
          .from('devotional_verses')
          .insert(input.verse_ids.map((verse_id) => ({ devotional_id: devotionalId, verse_id })));
        if (verseErr) throw verseErr;
      }

      return devotionalId as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devotionals'] }),
  });
}

// ── Atualizar devocional ──────────────────────────────────────────────────────
type UpdateDevotionalInput = CreateDevotionalInput & { id: string };

export function useUpdateDevotional() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateDevotionalInput) => {
      // 1. Atualiza campos principais
      const { error } = await supabase
        .from('devotionals')
        .update({
          title: input.title.trim(),
          content: input.content.trim(),
          is_public: input.is_public,
        })
        .eq('id', input.id);
      if (error) throw error;

      // 2. Recria tags
      await supabase.from('devotional_tags').delete().eq('devotional_id', input.id);
      if (input.tags.length) {
        await supabase.from('devotional_tags').insert(
          input.tags.map((tag) => ({ devotional_id: input.id, tag }))
        );
      }

      // 3. Recria vínculos de versículos
      await supabase.from('devotional_verses').delete().eq('devotional_id', input.id);
      if (input.verse_ids.length) {
        await supabase.from('devotional_verses').insert(
          input.verse_ids.map((verse_id) => ({ devotional_id: input.id, verse_id }))
        );
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['devotionals'] });
      qc.invalidateQueries({ queryKey: ['devotional', vars.id] });
    },
  });
}

// ── Feed: devocionais públicos de todos os usuários ──────────────────────────
export type FeedDevotional = Devotional & {
  devotional_tags: { tag: string }[];
  profiles: { full_name: string | null; username: string } | null;
};

export function useFeedDevotionals() {
  return useQuery({
    queryKey: ['feed-devotionals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devotionals')
        .select('*, devotional_tags(tag), profiles(full_name, username)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as FeedDevotional[];
    },
  });
}

// ── Excluir devocional ────────────────────────────────────────────────────────
export function useDeleteDevotional() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('devotionals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devotionals'] }),
  });
}
