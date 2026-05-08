import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDevotionals, useDeleteDevotional, useFeedDevotionals, type FeedDevotional } from '@/hooks/useDevotionals';
import type { Devotional } from '@/types';

function DevotionalCard({
  item,
  onDelete,
}: {
  item: Devotional & { devotional_tags: { tag: string }[] };
  onDelete: (id: string) => void;
}) {
  const date = new Date(item.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  function confirmDelete() {
    Alert.alert('Excluir devocional', 'Tem certeza? Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => onDelete(item.id) },
    ]);
  }

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/devotionals/${item.id}`)}
      className="bg-white mx-4 mb-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:opacity-80"
    >
      {/* Barra colorida no topo */}
      <View className="h-1 bg-brand" />

      <View className="p-4">
        {/* Título e data */}
        <View className="flex-row items-start justify-between mb-1">
          <Text className="text-base font-bold text-gray-900 flex-1 mr-2" numberOfLines={2}>
            {item.title}
          </Text>
          {item.is_public && (
            <View className="bg-green-100 px-2 py-0.5 rounded-full">
              <Text className="text-green-700 text-xs font-semibold">Público</Text>
            </View>
          )}
        </View>

        <Text className="text-xs text-gray-400 mb-3">{date}</Text>

        {/* Prévia do conteúdo */}
        <Text className="text-sm text-gray-600 leading-5" numberOfLines={3}>
          {item.content}
        </Text>

        {/* Tags */}
        {item.devotional_tags.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mt-3">
            {item.devotional_tags.slice(0, 4).map(({ tag }) => (
              <View key={tag} className="bg-brand/10 px-2 py-0.5 rounded-full">
                <Text className="text-brand text-xs">#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Ações */}
        <View className="flex-row justify-end gap-4 mt-4 pt-3 border-t border-gray-100">
          <TouchableOpacity onPress={() => router.push(`/(tabs)/devotionals/${item.id}/edit`)}>
            <Text className="text-sm text-brand font-semibold">Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete}>
            <Text className="text-sm text-red-400 font-semibold">Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Card do Feed (devocionais públicos de outros) ─────────────────────────────
function FeedCard({ item }: { item: FeedDevotional }) {
  const date = new Date(item.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const author = item.profiles?.full_name || item.profiles?.username || 'Anônimo';

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/devotionals/${item.id}`)}
      className="bg-white mx-4 mb-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:opacity-80"
    >
      <View className="h-1 bg-purple-400" />
      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <View className="w-7 h-7 rounded-full bg-brand/20 items-center justify-center mr-2">
            <Text className="text-brand text-xs font-bold">{author.charAt(0).toUpperCase()}</Text>
          </View>
          <Text className="text-xs text-gray-500 font-medium">{author}</Text>
          <Text className="text-xs text-gray-300 mx-1">·</Text>
          <Text className="text-xs text-gray-400">{date}</Text>
        </View>

        <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-sm text-gray-600 leading-5" numberOfLines={3}>
          {item.content}
        </Text>

        {item.devotional_tags.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mt-3">
            {item.devotional_tags.slice(0, 4).map(({ tag }) => (
              <View key={tag} className="bg-brand/10 px-2 py-0.5 rounded-full">
                <Text className="text-brand text-xs">#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function DevotionalsScreen() {
  const [tab, setTab] = useState<'mine' | 'feed'>('mine');
  const { data: devotionals, isLoading: loadingMine } = useDevotionals();
  const { data: feed, isLoading: loadingFeed } = useFeedDevotionals();
  const { mutate: deleteDev } = useDeleteDevotional();

  const isLoading = tab === 'mine' ? loadingMine : loadingFeed;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      {/* Seletor de aba */}
      <View className="flex-row mx-4 mt-4 mb-2 bg-gray-200 rounded-xl p-1">
        <TouchableOpacity
          onPress={() => setTab('mine')}
          className={`flex-1 py-2 rounded-lg items-center ${tab === 'mine' ? 'bg-white shadow-sm' : ''}`}
        >
          <Text className={`text-sm font-semibold ${tab === 'mine' ? 'text-brand' : 'text-gray-500'}`}>
            Meus
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('feed')}
          className={`flex-1 py-2 rounded-lg items-center ${tab === 'feed' ? 'bg-white shadow-sm' : ''}`}
        >
          <Text className={`text-sm font-semibold ${tab === 'feed' ? 'text-brand' : 'text-gray-500'}`}>
            Feed
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C3AED" size="large" />
        </View>
      ) : tab === 'mine' ? (
        <FlatList
          data={devotionals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <DevotionalCard item={item} onDelete={deleteDev} />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center pt-24 px-8">
              <Text className="text-5xl mb-4">📝</Text>
              <Text className="text-gray-500 text-center text-base font-semibold">
                Nenhum devocional ainda
              </Text>
              <Text className="text-gray-400 text-center text-sm mt-1">
                Toque no botão + para começar sua jornada devocional.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          renderItem={({ item }) => <FeedCard item={item} />}
          ListEmptyComponent={
            <View className="items-center justify-center pt-24 px-8">
              <Text className="text-5xl mb-4">🕊️</Text>
              <Text className="text-gray-500 text-center text-base font-semibold">
                Nenhum devocional compartilhado ainda
              </Text>
              <Text className="text-gray-400 text-center text-sm mt-1">
                Quando alguém publicar um devocional como "Público", ele aparece aqui.
              </Text>
            </View>
          }
        />
      )}

      {/* FAB: novo devocional */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/devotionals/new')}
        className="absolute bottom-8 right-6 w-14 h-14 bg-brand rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 6 }}
      >
        <Text className="text-white text-3xl leading-none">+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
