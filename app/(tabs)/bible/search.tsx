import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBibleStore } from '@/stores/bibleStore';
import { useSearchVerses, type SearchResult } from '@/hooks/useBible';
import { useBibleChapters } from '@/hooks/useBible';

export default function BibleSearchScreen() {
  const { versionSlug, setBook, setChapter } = useBibleStore();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data: results, isLoading, isFetching } = useSearchVerses(submitted, versionSlug);

  function handleSearch() {
    Keyboard.dismiss();
    setSubmitted(query.trim());
  }

  async function handleOpenVerse(item: SearchResult) {
    // Atualiza o store com o contexto do resultado
    setBook(item.book_number, item.book_name, item.book_abbrev, 0);
    setChapter(item.chapter_id, item.chapter_num);
    router.push(`/(tabs)/bible/${item.book_number}/${item.chapter_num}`);
  }

  const loading = isLoading || isFetching;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      {/* Barra de busca */}
      <View className="px-4 pt-4 pb-3 flex-row gap-2 border-b border-gray-100">
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          placeholder="Pesquise palavras ou frases..."
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          className="flex-1 bg-gray-100 rounded-xl px-4 h-11 text-base text-gray-900"
          autoFocus
        />
        <TouchableOpacity
          onPress={handleSearch}
          className="bg-brand rounded-xl px-4 items-center justify-center"
        >
          <Text className="text-white font-semibold">Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Resultados */}
      {loading && submitted ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C3AED" size="large" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.verse_id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
          ListHeaderComponent={
            submitted && !loading ? (
              <Text className="px-4 py-3 text-xs text-gray-400">
                {results?.length
                  ? `${results.length} resultado(s) para "${submitted}" · ${versionSlug.toUpperCase()}`
                  : `Nenhum resultado para "${submitted}"`}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            !submitted ? (
              <View className="items-center justify-center pt-20 px-8">
                <Text className="text-5xl mb-4">📖</Text>
                <Text className="text-gray-400 text-center text-base">
                  Digite uma palavra, frase ou referência bíblica para pesquisar.
                </Text>
                <Text className="text-gray-300 text-center text-sm mt-2">
                  Ex: "amor", "fé", "João 3"
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleOpenVerse(item)}
              className="px-4 py-4 border-b border-gray-100 active:bg-gray-50"
            >
              <View className="flex-row items-center mb-1">
                <View className="bg-brand/10 px-2 py-0.5 rounded-full mr-2">
                  <Text className="text-brand text-xs font-bold">{item.book_abbrev}</Text>
                </View>
                <Text className="text-sm font-semibold text-gray-700">
                  {item.book_name} {item.chapter_num}:{item.verse_number}
                </Text>
              </View>
              <Text className="text-sm text-gray-600 leading-5" numberOfLines={3}>
                {highlightQuery(item.verse_text, submitted)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// Simples highlight textual — retorna o texto puro pois RN não renderiza HTML
// Para highlight real, seria necessário uma lib de texto rico ou lógica de spans
function highlightQuery(text: string, query: string): string {
  return text; // mantemos simples por ora; pode ser evoluído com Text spans
}
