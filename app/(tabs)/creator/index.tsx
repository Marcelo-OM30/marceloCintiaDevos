import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { supabase } from '@/lib/supabase';
import { useCardStore, CARD_DIMS } from '@/stores/cardStore';
import { useCardExport } from '@/hooks/useCardExport';
import CardPreview from '@/components/cards/CardPreview';
import CardToolbar from '@/components/cards/CardToolbar';

const { width: SCREEN_W } = Dimensions.get('window');

export default function CreatorScreen() {
  const params = useLocalSearchParams<{ verseId?: string; devotionalId?: string }>();
  const { config, addTextBlock, reset } = useCardStore();
  const { viewShotRef, saveToGallery, shareCard } = useCardExport();

  // Scale the preview to fit the screen width with padding
  const PADDING = 32;
  const dims = CARD_DIMS[config.format];
  const scale = Math.min(1, (SCREEN_W - PADDING * 2) / dims.w);
  const previewW = dims.w * scale;
  const previewH = dims.h * scale;

  // On mount: reset store and pre-load content from params
  useEffect(() => {
    reset();
    loadInitialContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInitialContent() {
    try {
      if (params.verseId) {
        const { data } = await supabase
          .from('bible_verses')
          .select('text, verse_number, bible_chapters(chapter_number, bible_books(name))')
          .eq('id', params.verseId)
          .single();

        if (data) {
          const book = (data.bible_chapters as any)?.bible_books?.name ?? '';
          const ch = (data.bible_chapters as any)?.chapter_number ?? '';
          const ref = `${book} ${ch}:${data.verse_number}`;
          addTextBlock(data.text);
          addTextBlock(ref);
        }
      } else if (params.devotionalId) {
        const { data } = await supabase
          .from('devotionals')
          .select('title, content')
          .eq('id', params.devotionalId)
          .single();

        if (data) {
          addTextBlock(data.title);
          // First 200 chars of content as excerpt
          const excerpt = data.content.length > 200
            ? data.content.slice(0, 197) + '...'
            : data.content;
          addTextBlock(excerpt);
        }
      }
    } catch {
      // silently fail — user can add text manually
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-brand text-sm font-medium">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900">Editor de Card</Text>
        <View className="w-16" />
      </View>

      {/* Preview area */}
      <View
        style={{ height: previewH + 24 }}
        className="items-center justify-center bg-gray-50 border-b border-gray-100"
      >
        <CardPreview ref={viewShotRef} config={config} scale={scale} />
      </View>

      {/* Action buttons */}
      <View className="flex-row gap-3 px-4 py-3 border-b border-gray-100">
        <TouchableOpacity
          onPress={saveToGallery}
          className="flex-1 flex-row items-center justify-center gap-2 bg-brand py-3 rounded-xl"
        >
          <Text className="text-white font-semibold text-sm">⬇ Salvar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={shareCard}
          className="flex-1 flex-row items-center justify-center gap-2 bg-brand/10 border border-brand/30 py-3 rounded-xl"
        >
          <Text className="text-brand font-semibold text-sm">↑ Compartilhar</Text>
        </TouchableOpacity>
      </View>

      {/* Toolbar */}
      <View className="flex-1 px-4 pt-2">
        <CardToolbar />
      </View>
    </SafeAreaView>
  );
}
