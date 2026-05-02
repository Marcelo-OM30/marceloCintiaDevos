import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBibleStore } from '@/stores/bibleStore';
import { useBibleBooks, useBibleVersions } from '@/hooks/useBible';

const TESTAMENT_LABELS = { OT: 'Antigo Testamento', NT: 'Novo Testamento' };

export default function BibleIndexScreen() {
  const { versionSlug, versionName, setVersion, setBook } = useBibleStore();
  const [search, setSearch] = useState('');
  const [showVersionPicker, setShowVersionPicker] = useState(false);

  const { data: versions } = useBibleVersions();
  const { data: books, isLoading } = useBibleBooks(versionSlug);

  const filtered = useMemo(() => {
    if (!books) return [];
    if (!search.trim()) return books;
    return books.filter((b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.abbrev.toLowerCase().includes(search.toLowerCase())
    );
  }, [books, search]);

  // Separa AT e NT
  const sections = useMemo(() => {
    const ot = filtered.filter((b) => b.testament === 'OT');
    const nt = filtered.filter((b) => b.testament === 'NT');
    const result: { title: string; data: typeof filtered }[] = [];
    if (ot.length) result.push({ title: TESTAMENT_LABELS.OT, data: ot });
    if (nt.length) result.push({ title: TESTAMENT_LABELS.NT, data: nt });
    return result;
  }, [filtered]);

  function handleSelectBook(book: NonNullable<typeof books>[number]) {
    setBook(book.id, book.name, book.abbrev, 0);
    router.push(`/(tabs)/bible/${book.id}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Cabeçalho */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900">Bíblia</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowVersionPicker(true)}
              className="bg-brand/10 px-3 py-1.5 rounded-full"
            >
              <Text className="text-brand font-semibold text-sm uppercase">{versionSlug}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/bible/search')}
              className="bg-gray-100 px-3 py-1.5 rounded-full"
            >
              <Text className="text-gray-600 text-sm">🔍 Pesquisar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Busca local por nome do livro */}
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Filtrar livro..."
          placeholderTextColor="#9CA3AF"
          className="bg-gray-100 rounded-xl px-4 h-10 text-base text-gray-900"
        />
      </View>

      {/* Lista de livros */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C3AED" size="large" />
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.title}
          renderItem={({ item: section }) => (
            <View>
              <Text className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50">
                {section.title}
              </Text>
              {section.data.map((book) => (
                <TouchableOpacity
                  key={book.id}
                  onPress={() => handleSelectBook(book)}
                  className="flex-row items-center px-4 py-3 border-b border-gray-100 active:bg-gray-50"
                >
                  <View className="w-10 h-10 rounded-full bg-brand/10 items-center justify-center mr-3">
                    <Text className="text-brand font-bold text-xs">{book.abbrev}</Text>
                  </View>
                  <Text className="text-base text-gray-900 flex-1">{book.name}</Text>
                  <Text className="text-gray-400">›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}

      {/* Modal de seleção de versão */}
      <Modal visible={showVersionPicker} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowVersionPicker(false)}
        >
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Escolha a versão</Text>
            {(versions ?? []).map((v) => (
              <TouchableOpacity
                key={v.id}
                onPress={() => {
                  setVersion(v.slug, v.name);
                  setShowVersionPicker(false);
                }}
                className={[
                  'py-4 border-b border-gray-100 flex-row items-center justify-between',
                ].join('')}
              >
                <View>
                  <Text className="font-semibold text-gray-900">{v.slug.toUpperCase()}</Text>
                  <Text className="text-sm text-gray-500">{v.name}</Text>
                </View>
                {v.slug === versionSlug && (
                  <Text className="text-brand font-bold">✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowVersionPicker(false)}
              className="mt-4 py-3 items-center"
            >
              <Text className="text-gray-500">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
