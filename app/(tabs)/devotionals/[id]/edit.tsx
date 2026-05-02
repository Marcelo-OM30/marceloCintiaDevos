import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDevotional, useUpdateDevotional } from '@/hooks/useDevotionals';
import { Button } from '@/components/ui/Button';

export default function EditDevotionalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: dev, isLoading } = useDevotional(id);
  const { mutateAsync: update, isPending } = useUpdateDevotional();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Pré-preenche com dados existentes
  useEffect(() => {
    if (dev) {
      setTitle(dev.title);
      setContent(dev.content);
      setIsPublic(dev.is_public);
      setTags(dev.devotional_tags.map((t) => t.tag));
    }
  }, [dev]);

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (t && !tags.includes(t) && tags.length < 8) setTags((p) => [...p, t]);
    setTagInput('');
  }

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Título obrigatório'); return; }
    if (!content.trim()) { Alert.alert('Conteúdo vazio'); return; }

    try {
      await update({
        id,
        title,
        content,
        is_public: isPublic,
        tags,
        verse_ids: dev?.devotional_verses.map((dv) => dv.bible_verses.id) ?? [],
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível salvar.');
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Título..."
            placeholderTextColor="#D1D5DB"
            className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3 mb-4"
            multiline
            maxLength={120}
          />

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Escreva aqui..."
            placeholderTextColor="#D1D5DB"
            className="text-base text-gray-800 leading-7 min-h-48"
            multiline
            textAlignVertical="top"
          />

          <View className="h-px bg-gray-100 my-6" />

          {/* Tags */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Tags</Text>
            <View className="flex-row flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setTags((p) => p.filter((t) => t !== tag))}
                  className="flex-row items-center bg-brand/10 px-3 py-1 rounded-full"
                >
                  <Text className="text-brand text-sm mr-1">#{tag}</Text>
                  <Text className="text-brand text-xs">✕</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row gap-2">
              <TextInput
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                placeholder="nova tag"
                placeholderTextColor="#9CA3AF"
                returnKeyType="done"
                autoCapitalize="none"
                className="flex-1 bg-gray-100 rounded-xl px-4 h-10 text-sm text-gray-900"
              />
              <TouchableOpacity
                onPress={addTag}
                className="bg-brand/10 px-4 rounded-xl items-center justify-center"
              >
                <Text className="text-brand font-semibold">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Visibilidade */}
          <View className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-8">
            <Text className="text-sm font-semibold text-gray-700">Público</Text>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ true: '#7C3AED' }}
              thumbColor="#fff"
            />
          </View>

          <Button title="Salvar alterações" onPress={handleSave} loading={isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
