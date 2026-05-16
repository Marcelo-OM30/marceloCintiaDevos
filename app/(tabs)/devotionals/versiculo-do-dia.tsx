import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

import { useVerseOfDay } from '@/hooks/useVerseOfDay';
import { useCreateDevotional } from '@/hooks/useDevotionals';
import { useCardStore } from '@/stores/cardStore';
import { CardPreview } from '@/components/cards/CardPreview';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

// ── Gera um devocional reformado template a partir do versículo ───────────────
function gerarDevocionalTemplate(
  verseText: string,
  reference: string,
): { title: string; content: string } {
  const title = `Reflexão Reformada: ${reference}`;
  const content = `"${verseText}" — ${reference}

A Palavra de Deus nos confronta hoje com esta verdade imutável. As Escrituras, únicas e suficientes regra de fé e prática (Sola Scriptura), nos revelam aqui o caráter soberano do Deus que governa todas as coisas para a sua glória.

Este versículo nos lembra que toda bênção espiritual vem somente da graça de Deus (Sola Gratia) — não por nossos méritos ou esforços, mas pelo seu eterno propósito. Cristo é o cumprimento de toda promessa bíblica, e é nele que encontramos nossa esperança (Solus Christus).

Como crente, medite hoje nesta verdade e descanse na soberania do Pai que nunca abandona os seus.

Oração: Senhor soberano, obrigado por Tua Palavra que ilumina o nosso caminho. Que esta verdade transforme o meu coração hoje. Toda a glória seja somente a Ti. Amém.`;
  return { title, content };
}

// ── Configura o cardStore para o story do versículo ──────────────────────────
function configurarStoryVerse(
  verseText: string,
  reference: string,
  primeiraFrase: string,
) {
  const store = useCardStore.getState();
  store.reset();
  store.setFormat('story');
  store.setBackground({
    type: 'gradient',
    color: '#0f0f23',
    gradientColors: ['#0f0f23', '#1a1a3e'],
  });
  store.setOverlay(0.15);
  store.setShowLogo(true);

  // Bloco 1 — referência (topo)
  store.addTextBlock(reference);
  const blocks1 = useCardStore.getState().config.textBlocks;
  const id1 = blocks1[blocks1.length - 1].id;
  store.updateTextBlock(id1, {
    fontSize: 15,
    positionY: 0.08,
    color: '#a0a0cc',
    bold: false,
    align: 'center',
    paddingH: 10,
  });

  // Bloco 2 — texto do versículo (centro)
  store.addTextBlock(`"${verseText}"`);
  const blocks2 = useCardStore.getState().config.textBlocks;
  const id2 = blocks2[blocks2.length - 1].id;
  store.updateTextBlock(id2, {
    fontSize: 20,
    positionY: 0.35,
    color: '#FFFFFF',
    bold: true,
    align: 'center',
    paddingH: 8,
  });

  // Bloco 3 — trecho devocional (inferior)
  store.addTextBlock(primeiraFrase);
  const blocks3 = useCardStore.getState().config.textBlocks;
  const id3 = blocks3[blocks3.length - 1].id;
  store.updateTextBlock(id3, {
    fontSize: 13,
    positionY: 0.74,
    color: '#c8c8e8',
    italic: true,
    align: 'center',
    paddingH: 10,
  });
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function VersiculoDoDiaScreen() {
  const { data: verse, isLoading, isError } = useVerseOfDay('arc');
  const { mutateAsync: create, isPending: isSaving } = useCreateDevotional();
  const { user } = useAuthStore();
  const cardConfig = useCardStore((s) => s.config);
  const viewShotRef = useRef<ViewShot>(null);

  const [devocionalTitle, setDevocionalTitle] = useState('');
  const [devocionalContent, setDevocionalContent] = useState('');
  const [storyGerado, setStoryGerado] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // ── Formata a referência bíblica ──
  const referencia = verse
    ? `${verse.bible_chapters.bible_books.name} ${verse.bible_chapters.chapter_number}:${verse.verse_number}`
    : '';

  // ── Gerar devocional e story ──────────────────────────────────────────────
  const handleGerar = useCallback(() => {
    if (!verse) return;
    const { title, content } = gerarDevocionalTemplate(verse.text, referencia);
    setDevocionalTitle(title);
    setDevocionalContent(content);

    // Primeira frase do devocional para o story
    const primeiraFrase = content.split('\n\n')[1]?.split('.')[0] ?? referencia;
    configurarStoryVerse(verse.text, referencia, primeiraFrase);
    setStoryGerado(true);
    setSalvo(false);
  }, [verse, referencia]);

  // ── Salvar devocional no Supabase ─────────────────────────────────────────
  const handleSalvar = useCallback(async () => {
    if (!verse || !devocionalTitle || !devocionalContent) return;

    // Verificar se já existe devocional do dia
    const hoje = new Date().toISOString().slice(0, 10);
    const { data: existente } = await supabase
      .from('devotionals')
      .select('id')
      .eq('user_id', user!.id)
      .gte('created_at', `${hoje}T00:00:00`)
      .lte('created_at', `${hoje}T23:59:59`)
      .limit(1)
      .maybeSingle();

    if (existente) {
      Alert.alert(
        'Já gerado hoje',
        'Você já possui um devocional do dia salvo. Deseja substituí-lo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Substituir', onPress: () => salvarDevocional() },
        ],
      );
      return;
    }

    salvarDevocional();
  }, [verse, devocionalTitle, devocionalContent, user]);

  async function salvarDevocional() {
    try {
      await create({
        title: devocionalTitle,
        content: devocionalContent,
        is_public: false,
        tags: ['versiculo-do-dia', 'reformado', 'calvinista'],
        verse_ids: verse ? [verse.id] : [],
      });
      setSalvo(true);
      Alert.alert('Salvo!', 'Devocional salvo com sucesso.');
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível salvar.');
    }
  }

  // ── Compartilhar story ───────────────────────────────────────────────────
  const handleCompartilhar = useCallback(async () => {
    try {
      const uri = await (viewShotRef.current as any)?.capture?.();
      if (!uri) { Alert.alert('Erro', 'Não foi possível gerar o story.'); return; }
      const available = await Sharing.isAvailableAsync();
      if (!available) { Alert.alert('Compartilhamento não disponível.'); return; }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartilhar Story' });
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar.');
    }
  }, []);

  // ── Salvar story na galeria ──────────────────────────────────────────────
  const handleSalvarGaleria = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos acessar a galeria para salvar.');
      return;
    }
    try {
      const uri = await (viewShotRef.current as any)?.capture?.();
      if (!uri) { Alert.alert('Erro', 'Não foi possível gerar o story.'); return; }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Salvo!', 'Story salvo na galeria.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar na galeria.');
    }
  }, []);

  // ── Loading / Error ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="mt-3 text-gray-500 text-sm">Buscando versículo do dia...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !verse) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-gray-500 text-center">
          Não foi possível carregar o versículo de hoje. Verifique sua conexão.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Data */}
          <View className="px-5 pt-4 pb-2">
            <Text className="text-xs text-gray-400 uppercase tracking-widest">{hoje}</Text>
          </View>

          {/* Card do versículo */}
          <View className="mx-4 mb-5 rounded-2xl overflow-hidden shadow-md">
            <View
              style={{ backgroundColor: '#1a1a3e' }}
              className="p-6"
            >
              <Text className="text-purple-300 text-xs font-semibold tracking-widest uppercase mb-3">
                Versículo do Dia
              </Text>
              <Text className="text-white text-xl font-bold leading-8 mb-4">
                "{verse.text}"
              </Text>
              <Text className="text-purple-300 text-sm font-semibold text-right">
                — {referencia}
              </Text>
            </View>
          </View>

          {/* Botão gerar */}
          {!storyGerado && (
            <View className="px-4 mb-5">
              <Button
                title="Gerar Devocional + Story"
                onPress={handleGerar}
              />
              <Text className="text-xs text-gray-400 text-center mt-2">
                Gera um devocional reformado e calvinista com o versículo de hoje
              </Text>
            </View>
          )}

          {/* Seção do devocional */}
          {storyGerado && (
            <>
              <View className="mx-4 mb-4">
                <Text className="text-sm font-bold text-gray-700 mb-1">Título</Text>
                <TextInput
                  value={devocionalTitle}
                  onChangeText={setDevocionalTitle}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm"
                  placeholder="Título do devocional"
                />
              </View>

              <View className="mx-4 mb-4">
                <Text className="text-sm font-bold text-gray-700 mb-1">Devocional Reformado</Text>
                <TextInput
                  value={devocionalContent}
                  onChangeText={setDevocionalContent}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm leading-6"
                  multiline
                  numberOfLines={10}
                  textAlignVertical="top"
                  style={{ minHeight: 220 }}
                  placeholder="Conteúdo do devocional..."
                />
                <Text className="text-xs text-gray-400 mt-1">
                  Edite livremente antes de salvar. Visão reformada e calvinista.
                </Text>
              </View>

              {/* Botão salvar devocional */}
              <View className="px-4 mb-6">
                <Button
                  title={salvo ? 'Devocional Salvo ✓' : 'Salvar Devocional'}
                  onPress={handleSalvar}
                  loading={isSaving}
                  variant={salvo ? 'outline' : 'primary'}
                />
              </View>

              {/* Preview do story */}
              <View className="mx-4 mb-3">
                <Text className="text-sm font-bold text-gray-700 mb-3">Preview do Story</Text>
                <View className="items-center">
                  <CardPreview
                    ref={viewShotRef}
                    config={cardConfig}
                    scale={0.55}
                  />
                </View>
              </View>

              {/* Ações do story */}
              <View className="px-4 gap-3">
                <Button
                  title="Compartilhar Story"
                  onPress={handleCompartilhar}
                />
                <Button
                  title="Salvar na Galeria"
                  onPress={handleSalvarGaleria}
                  variant="outline"
                />
                <TouchableOpacity onPress={handleGerar} className="items-center py-2">
                  <Text className="text-brand text-sm font-semibold">↺ Gerar novamente</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
