import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDevotional } from '@/hooks/useDevotionals';

export default function DevotionalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { data: dev, isLoading } = useDevotional(id);

  useEffect(() => {
    if (dev) navigation.setOptions({ title: dev.title });
  }, [dev]);

  async function handleShare() {
    if (!dev) return;
    await Share.share({
      title: dev.title,
      message: `${dev.title}\n\n${dev.content}\n\n— Devocional compartilhado pelo app Devos`,
    });
  }

  if (isLoading || !dev) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  const date = new Date(dev.created_at).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        {/* Cabeçalho */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 leading-tight mb-2">
            {dev.title}
          </Text>
          <Text className="text-sm text-gray-400 capitalize">{date}</Text>

          {/* Badges */}
          <View className="flex-row flex-wrap gap-2 mt-3">
            {dev.is_public && (
              <View className="bg-green-100 px-2 py-0.5 rounded-full">
                <Text className="text-green-700 text-xs font-semibold">Público</Text>
              </View>
            )}
            {dev.devotional_tags.map(({ tag }) => (
              <View key={tag} className="bg-brand/10 px-2 py-0.5 rounded-full">
                <Text className="text-brand text-xs">#{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Versículos vinculados */}
        {dev.devotional_verses.length > 0 && (
          <View className="mb-6 bg-brand/5 rounded-2xl p-4 border border-brand/10">
            <Text className="text-xs font-bold text-brand/70 uppercase mb-3 tracking-wide">
              Versículos
            </Text>
            {dev.devotional_verses.map(({ bible_verses: v }) => (
              <View key={v.id} className="mb-3 last:mb-0">
                <Text className="text-xs text-brand font-semibold mb-0.5">
                  {v.bible_chapters.bible_books.name}{' '}
                  {v.bible_chapters.number}:{v.number}
                </Text>
                <Text className="text-sm text-gray-700 italic leading-5">"{v.text}"</Text>
              </View>
            ))}
          </View>
        )}

        {/* Conteúdo */}
        <Text className="text-base text-gray-800 leading-8">{dev.content}</Text>

        {/* Ações */}
        <View className="flex-row gap-3 mt-10">
          <TouchableOpacity
            onPress={handleShare}
            className="flex-1 flex-row items-center justify-center border border-gray-200 rounded-xl py-3 gap-2"
          >
            <Text className="text-gray-600 font-semibold">📤 Compartilhar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/(tabs)/devotionals/${id}/edit`)}
            className="flex-1 flex-row items-center justify-center bg-brand rounded-xl py-3 gap-2"
          >
            <Text className="text-white font-semibold">✏️ Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Criar card */}
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: '/(tabs)/creator', params: { devotionalId: id } })
          }
          className="mt-3 border border-brand/30 rounded-xl py-3 items-center"
        >
          <Text className="text-brand font-semibold">🎨 Criar card/story com este devocional</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
