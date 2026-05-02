import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Modal,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useBibleStore } from '@/stores/bibleStore';
import { useBibleVerses, useBibleChapters } from '@/hooks/useBible';
import { useAuthStore } from '@/stores/authStore';

type VerseItem = { id: number; number: number; text: string };

export default function ChapterReaderScreen() {
  const { book: bookId, chapter: chapterNumber } = useLocalSearchParams<{
    book: string;
    chapter: string;
  }>();
  const navigation = useNavigation();

  const {
    selectedBookName,
    selectedBookAbbrev,
    selectedChapterId,
    setChapter,
    versionSlug,
  } = useBibleStore();

  const { user } = useAuthStore();
  const { data: chapters } = useBibleChapters(Number(bookId));
  const { data: verses, isLoading } = useBibleVerses(selectedChapterId);

  const [selectedVerse, setSelectedVerse] = useState<VerseItem | null>(null);
  const [highlights, setHighlights] = useState<Record<number, string>>({});
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());

  // Sincroniza chapterId quando a rota muda
  useEffect(() => {
    if (chapters && chapterNumber) {
      const ch = chapters.find((c) => c.number === Number(chapterNumber));
      if (ch) setChapter(ch.id, ch.number);
    }
  }, [chapters, chapterNumber]);

  useEffect(() => {
    navigation.setOptions({
      title: `${selectedBookAbbrev} ${chapterNumber}`,
    });
  }, [selectedBookAbbrev, chapterNumber]);

  // Carrega highlights e bookmarks do usuário
  useEffect(() => {
    if (!user || !selectedChapterId) return;

    supabase
      .from('highlights')
      .select('verse_id, color')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          const map: Record<number, string> = {};
          data.forEach((h) => { map[h.verse_id] = h.color; });
          setHighlights(map);
        }
      });

    supabase
      .from('bookmarks')
      .select('verse_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setBookmarks(new Set(data.map((b) => b.verse_id)));
      });
  }, [user, selectedChapterId]);

  // Navegação entre capítulos
  function goToChapter(delta: number) {
    const next = Number(chapterNumber) + delta;
    if (!chapters || next < 1 || next > chapters.length) return;
    const ch = chapters[next - 1];
    setChapter(ch.id, ch.number);
    router.replace(`/(tabs)/bible/${bookId}/${next}`);
  }

  async function toggleBookmark(verseId: number) {
    if (!user) return;
    if (bookmarks.has(verseId)) {
      await supabase.from('bookmarks').delete().match({ user_id: user.id, verse_id: verseId });
      setBookmarks((prev) => { const s = new Set(prev); s.delete(verseId); return s; });
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, verse_id: verseId });
      setBookmarks((prev) => new Set(prev).add(verseId));
    }
  }

  async function toggleHighlight(verseId: number, color: string) {
    if (!user) return;
    if (highlights[verseId] === color) {
      await supabase.from('highlights').delete().match({ user_id: user.id, verse_id: verseId });
      setHighlights((prev) => { const h = { ...prev }; delete h[verseId]; return h; });
    } else {
      await supabase.from('highlights').upsert(
        { user_id: user.id, verse_id: verseId, color },
        { onConflict: 'user_id,verse_id' }
      );
      setHighlights((prev) => ({ ...prev, [verseId]: color }));
    }
    setSelectedVerse(null);
  }

  async function shareVerse(verse: VerseItem) {
    const text = `"${verse.text}"\n\n— ${selectedBookName} ${chapterNumber}:${verse.number} (${versionSlug.toUpperCase()})`;
    await Share.share({ message: text });
    setSelectedVerse(null);
  }

  const HIGHLIGHT_COLORS = ['#FDE68A', '#A7F3D0', '#BFDBFE', '#FECACA', '#E9D5FF'];

  const renderVerse = useCallback(({ item }: { item: VerseItem }) => {
    const highlight = highlights[item.id];
    const isBookmarked = bookmarks.has(item.id);

    return (
      <TouchableOpacity
        onPress={() => setSelectedVerse(item)}
        activeOpacity={0.7}
        className="flex-row px-4 py-1.5"
        style={highlight ? { backgroundColor: highlight + '60' } : undefined}
      >
        <Text className="text-brand text-xs font-bold w-7 mt-0.5 select-none">
          {item.number}
        </Text>
        <Text className="text-base text-gray-900 leading-7 flex-1">{item.text}</Text>
        {isBookmarked && (
          <Text className="text-brand text-xs ml-1 mt-1">🔖</Text>
        )}
      </TouchableOpacity>
    );
  }, [highlights, bookmarks]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C3AED" size="large" />
        </View>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderVerse}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
          ListHeaderComponent={
            <Text className="text-center text-2xl font-bold text-gray-900 pb-4">
              {selectedBookName} {chapterNumber}
            </Text>
          }
          ListFooterComponent={
            /* Navegação prev/next */
            <View className="flex-row justify-between px-4 mt-6">
              <TouchableOpacity
                onPress={() => goToChapter(-1)}
                disabled={Number(chapterNumber) <= 1}
                className="bg-gray-100 px-5 py-3 rounded-xl disabled:opacity-40"
              >
                <Text className="text-gray-700 font-semibold">← Anterior</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => goToChapter(1)}
                disabled={!chapters || Number(chapterNumber) >= chapters.length}
                className="bg-brand px-5 py-3 rounded-xl disabled:opacity-40"
              >
                <Text className="text-white font-semibold">Próximo →</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modal de ações do versículo */}
      <Modal
        visible={!!selectedVerse}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedVerse(null)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setSelectedVerse(null)}
        >
          <View className="bg-white rounded-t-3xl p-6">
            {selectedVerse && (
              <>
                {/* Texto do versículo */}
                <Text className="text-sm text-gray-500 mb-1">
                  {selectedBookName} {chapterNumber}:{selectedVerse.number}
                </Text>
                <Text className="text-base text-gray-900 leading-6 mb-5">
                  "{selectedVerse.text}"
                </Text>

                {/* Cores de destaque */}
                <Text className="text-xs font-bold text-gray-400 uppercase mb-2">Destacar</Text>
                <View className="flex-row gap-3 mb-5">
                  {HIGHLIGHT_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => toggleHighlight(selectedVerse.id, color)}
                      className="w-9 h-9 rounded-full border-2"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          highlights[selectedVerse.id] === color ? '#7C3AED' : 'transparent',
                      }}
                    />
                  ))}
                  {highlights[selectedVerse.id] && (
                    <TouchableOpacity
                      onPress={() => toggleHighlight(selectedVerse.id, highlights[selectedVerse.id])}
                      className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                    >
                      <Text className="text-gray-500 text-xs">✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Ações */}
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => toggleBookmark(selectedVerse.id)}
                    className="flex-row items-center py-3 border-b border-gray-100"
                  >
                    <Text className="text-base mr-3">
                      {bookmarks.has(selectedVerse.id) ? '🔖 Remover favorito' : '🔖 Favoritar'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => shareVerse(selectedVerse)}
                    className="flex-row items-center py-3 border-b border-gray-100"
                  >
                    <Text className="text-base mr-3">📤 Compartilhar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedVerse(null);
                      router.push({
                        pathname: '/(tabs)/creator',
                        params: { verseId: selectedVerse.id },
                      });
                    }}
                    className="flex-row items-center py-3"
                  >
                    <Text className="text-base mr-3">🎨 Criar card/story</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
