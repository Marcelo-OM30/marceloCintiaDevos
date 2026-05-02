import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useVerseOfDay } from '@/hooks/useVerseOfDay';
import { useDevotionals } from '@/hooks/useDevotionals';
import { useBibleStore } from '@/stores/bibleStore';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const username = user?.user_metadata?.username ?? 'amigo(a)';
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  const { data: verse, isLoading: verseLoading } = useVerseOfDay();
  const { data: devotionals } = useDevotionals();
  const { selectedBookName, selectedChapterNumber } = useBibleStore();

  const bookRef = (verse?.bible_chapters as any)?.bible_books;
  const chapterRef = (verse?.bible_chapters as any)?.chapter_number;
  const verseRef = bookRef
    ? `${bookRef.name} ${chapterRef}:${verse?.verse_number}`
    : '';

  async function shareVerse() {
    if (!verse) return;
    await Share.share({ message: `"${verse.text}"\n— ${verseRef}\n\nMarceloCintia Devos` });
  }

  const recentDevotionals = devotionals?.slice(0, 3) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Greeting */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-gray-400 text-sm capitalize">{today}</Text>
          <Text className="text-2xl font-bold text-gray-900 mt-1">
            {greeting()}, {username}! 👋
          </Text>
        </View>

        {/* Versículo do dia */}
        <View className="mx-6 mb-6 rounded-3xl overflow-hidden shadow-sm">
          <LinearGradient colors={['#7C3AED', '#4C1D95']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}>
            <View className="px-6 pt-6 pb-5">
              <Text className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-4">
                ✦ Versículo do dia
              </Text>

              {verseLoading ? (
                <ActivityIndicator color="#fff" />
              ) : verse ? (
                <>
                  <Text className="text-white text-lg leading-7 font-medium mb-4 italic">
                    "{verse.text}"
                  </Text>
                  <Text className="text-white/80 text-sm font-semibold">{verseRef}</Text>

                  <View className="flex-row gap-3 mt-5">
                    <TouchableOpacity
                      onPress={shareVerse}
                      className="flex-1 bg-white/20 rounded-xl py-2.5 items-center"
                    >
                      <Text className="text-white text-sm font-medium">Compartilhar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/creator',
                          params: { verseId: verse.id },
                        })
                      }
                      className="flex-1 bg-white/20 rounded-xl py-2.5 items-center"
                    >
                      <Text className="text-white text-sm font-medium">Criar card</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <Text className="text-white/60 text-sm">
                  Configure o Supabase para ver o versículo.
                </Text>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Continue lendo */}
        {selectedBookName ? (
          <View className="mx-6 mb-6">
            <Text className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
              Continue lendo
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/(tabs)/bible/${encodeURIComponent(selectedBookName)}/${selectedChapterNumber ?? 1}`,
                )
              }
              className="bg-white rounded-2xl px-5 py-4 flex-row items-center shadow-sm border border-gray-100"
            >
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">{selectedBookName}</Text>
                <Text className="text-sm text-gray-400 mt-0.5">
                  Capítulo {selectedChapterNumber}
                </Text>
              </View>
              <Text className="text-2xl">📖</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mx-6 mb-6">
            <Text className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
              Bíblia
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/bible')}
              className="bg-white rounded-2xl px-5 py-4 flex-row items-center shadow-sm border border-gray-100"
            >
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">Abrir a Bíblia</Text>
                <Text className="text-sm text-gray-400 mt-0.5">
                  ARC, ARA, ACF disponíveis
                </Text>
              </View>
              <Text className="text-2xl">📖</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Devocionais recentes */}
        <View className="mx-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-bold text-gray-400 uppercase tracking-wide">
              Devocionais recentes
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/devotionals')}>
              <Text className="text-brand text-sm font-medium">Ver todos</Text>
            </TouchableOpacity>
          </View>

          {recentDevotionals.length === 0 ? (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/devotionals/new')}
              className="bg-white rounded-2xl px-5 py-5 items-center border border-dashed border-brand/30"
            >
              <Text className="text-3xl mb-2">✍️</Text>
              <Text className="text-brand font-semibold text-sm">Escrever primeiro devocional</Text>
            </TouchableOpacity>
          ) : (
            <View className="gap-3">
              {recentDevotionals.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => router.push(`/(tabs)/devotionals/${d.id}`)}
                  className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100"
                >
                  <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
                    {d.title}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                    {d.content}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

