import { useState } from 'react';
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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreateDevotional } from '@/hooks/useDevotionals';
import { Button } from '@/components/ui/Button';

export default function NewDevotionalScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const { mutateAsync: create, isPending } = useCreateDevotional();

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (t && !tags.includes(t) && tags.length < 8) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Título obrigatório', 'Dê um título ao seu devocional.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Conteúdo vazio', 'Escreva algo no seu devocional.');
      return;
    }

    try {
      const id = await create({ title, content, is_public: isPublic, tags, verse_ids: [] });
      router.replace(`/(tabs)/devotionals/${id}`);
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível salvar.');
    }
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
          {/* Título */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Título do devocional..."
            placeholderTextColor="#D1D5DB"
            className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3 mb-4"
            multiline
            maxLength={120}
          />

          {/* Corpo */}
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Escreva seu devocional aqui...&#10;&#10;Compartilhe o que Deus tem falado ao seu coração. 🙏"
            placeholderTextColor="#D1D5DB"
            className="text-base text-gray-800 leading-7 min-h-48"
            multiline
            textAlignVertical="top"
            autoFocus
          />

          {/* Separador */}
          <View className="h-px bg-gray-100 my-6" />

          {/* Tags */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Tags</Text>
            <View className="flex-row flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => removeTag(tag)}
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
                placeholder="ex: gratidão"
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
            <Text className="text-xs text-gray-400 mt-1">{tags.length}/8 tags</Text>
          </View>

          {/* Visibilidade */}
          <View className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-8">
            <View>
              <Text className="text-sm font-semibold text-gray-700">Devocional público</Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                Visível para outros usuários no feed
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ true: '#7C3AED' }}
              thumbColor="#fff"
            />
          </View>

          <Button title="Salvar devocional" onPress={handleSave} loading={isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
