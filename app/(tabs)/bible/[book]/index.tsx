import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBibleStore } from '@/stores/bibleStore';
import { useBibleChapters } from '@/hooks/useBible';

export default function ChapterSelectScreen() {
  const { book: bookId } = useLocalSearchParams<{ book: string }>();
  const navigation = useNavigation();

  const { selectedBookName, selectedBookAbbrev, setChapter, versionSlug } = useBibleStore();
  const { data: chapters, isLoading } = useBibleChapters(Number(bookId));

  useEffect(() => {
    navigation.setOptions({ title: selectedBookName || 'Capítulos' });
  }, [selectedBookName]);

  function handleSelectChapter(chapterId: number, chapterNumber: number) {
    setChapter(chapterId, chapterNumber);
    router.push(`/(tabs)/bible/${bookId}/${chapterNumber}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">{selectedBookName}</Text>
        <Text className="text-sm text-gray-400 mt-0.5 uppercase">{versionSlug} · {chapters?.length ?? '—'} capítulos</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C3AED" size="large" />
        </View>
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={(item) => String(item.id)}
          numColumns={5}
          contentContainerStyle={{ padding: 16 }}
          columnWrapperStyle={{ gap: 10, marginBottom: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelectChapter(item.id, item.number)}
              className="flex-1 aspect-square rounded-2xl bg-gray-100 items-center justify-center active:bg-brand/20"
            >
              <Text className="text-base font-semibold text-gray-800">{item.number}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
