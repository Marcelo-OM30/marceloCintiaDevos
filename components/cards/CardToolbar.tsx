import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useCardStore, TextBlock, CARD_DIMS } from '@/stores/cardStore';

// ─── paletas ────────────────────────────────────────────────────────────────
const SOLID_COLORS = [
  '#7C3AED', '#4C1D95', '#1E40AF', '#065F46',
  '#92400E', '#991B1B', '#374151', '#111827',
  '#FFFFFF', '#FDE68A', '#FCA5A5', '#6EE7B7',
];

const GRADIENTS: [string, string][] = [
  ['#7C3AED', '#4C1D95'],
  ['#1E40AF', '#065F46'],
  ['#92400E', '#991B1B'],
  ['#F59E0B', '#EF4444'],
  ['#10B981', '#065F46'],
  ['#1E3A5F', '#0F172A'],
  ['#6D28D9', '#DB2777'],
  ['#0EA5E9', '#6D28D9'],
];

const TEXT_COLORS = [
  '#FFFFFF', '#F3F4F6', '#FDE68A', '#FCA5A5',
  '#A5F3FC', '#BBF7D0', '#DDD6FE', '#000000',
];

const FONT_SIZES = [14, 18, 22, 26, 32, 40, 52];
const FONT_FAMILIES = [
  { label: 'Sistema', value: 'System' },
  { label: 'Serif', value: 'serif' },
  { label: 'Mono', value: 'monospace' },
];

type Tab = 'background' | 'text' | 'settings';

export default function CardToolbar() {
  const {
    config,
    selectedBlockId,
    setFormat,
    setBackground,
    setOverlay,
    addTextBlock,
    updateTextBlock,
    removeTextBlock,
    selectBlock,
    setShowLogo,
  } = useCardStore();

  const [activeTab, setActiveTab] = useState<Tab>('background');
  const [editingContent, setEditingContent] = useState(false);
  const [tempContent, setTempContent] = useState('');

  const selectedBlock = config.textBlocks.find((b) => b.id === selectedBlockId);

  const update = (patch: Partial<TextBlock>) => {
    if (selectedBlockId) updateTextBlock(selectedBlockId, patch);
  };

  async function pickBackgroundImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled) {
      setBackground({ type: 'image', imageUri: result.assets[0].uri });
    }
  }

  function openContentEditor() {
    if (!selectedBlock) return;
    setTempContent(selectedBlock.content);
    setEditingContent(true);
  }

  // ─── Format selector ───────────────────────────────────────────────────────
  const FormatSelector = () => (
    <View className="flex-row gap-2 mb-4">
      {(['story', 'square', 'portrait'] as const).map((f) => {
        const labels: Record<string, string> = {
          story: 'Story 9:16',
          square: 'Quadrado 1:1',
          portrait: 'Retrato 4:5',
        };
        return (
          <TouchableOpacity
            key={f}
            onPress={() => setFormat(f)}
            className={`flex-1 py-2 rounded-lg items-center border ${
              config.format === f
                ? 'border-brand bg-brand/10'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                config.format === f ? 'text-brand' : 'text-gray-500'
              }`}
            >
              {labels[f]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ─── Background tab ────────────────────────────────────────────────────────
  const BackgroundTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <FormatSelector />

      {/* Type picker */}
      <View className="flex-row gap-2 mb-4">
        {(['color', 'gradient', 'image'] as const).map((t) => {
          const labels = { color: 'Cor', gradient: 'Gradiente', image: 'Imagem' };
          return (
            <TouchableOpacity
              key={t}
              onPress={() => {
                if (t === 'image') pickBackgroundImage();
                else setBackground({ type: t });
              }}
              className={`flex-1 py-2 rounded-lg items-center border ${
                config.background.type === t
                  ? 'border-brand bg-brand/10'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  config.background.type === t ? 'text-brand' : 'text-gray-500'
                }`}
              >
                {labels[t]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Solid colors */}
      {config.background.type === 'color' && (
        <>
          <Text className="text-xs font-semibold text-gray-500 mb-2">Cor de fundo</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {SOLID_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setBackground({ color: c })}
                style={{ backgroundColor: c, width: 40, height: 40, borderRadius: 8 }}
                className={`border-2 ${config.background.color === c ? 'border-brand' : 'border-transparent'}`}
              />
            ))}
          </View>
        </>
      )}

      {/* Gradients */}
      {config.background.type === 'gradient' && (
        <>
          <Text className="text-xs font-semibold text-gray-500 mb-2">Gradiente</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {GRADIENTS.map(([c1, c2], i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setBackground({ gradientColors: [c1, c2] })}
                style={{
                  width: 56,
                  height: 40,
                  borderRadius: 8,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor:
                    config.background.gradientColors[0] === c1 ? '#7C3AED' : 'transparent',
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: c1,
                    // Simple gradient simulation with two halves
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Overlay */}
      <Text className="text-xs font-semibold text-gray-500 mb-1">
        Escurecimento: {Math.round(config.overlayOpacity * 100)}%
      </Text>
      <View className="flex-row items-center gap-2 mb-4">
        {[0, 0.2, 0.4, 0.6, 0.8].map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => setOverlay(v)}
            className={`flex-1 py-2 rounded-lg items-center border ${
              config.overlayOpacity === v ? 'border-brand bg-brand/10' : 'border-gray-200'
            }`}
          >
            <Text className={`text-xs ${config.overlayOpacity === v ? 'text-brand' : 'text-gray-400'}`}>
              {Math.round(v * 100)}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // ─── Text tab ──────────────────────────────────────────────────────────────
  const TextTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Add block button */}
      <TouchableOpacity
        onPress={() => addTextBlock()}
        className="flex-row items-center justify-center gap-2 bg-brand/10 border border-brand/30 rounded-xl py-3 mb-4"
      >
        <Text className="text-brand font-semibold">+ Adicionar bloco de texto</Text>
      </TouchableOpacity>

      {/* Block list */}
      {config.textBlocks.length === 0 && (
        <Text className="text-gray-400 text-sm text-center py-4">
          Nenhum texto ainda. Adicione um bloco acima.
        </Text>
      )}

      {config.textBlocks.map((block) => (
        <TouchableOpacity
          key={block.id}
          onPress={() => selectBlock(block.id === selectedBlockId ? null : block.id)}
          className={`border rounded-xl p-3 mb-2 ${
            selectedBlockId === block.id
              ? 'border-brand bg-brand/5'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <Text numberOfLines={1} className="text-gray-800 text-sm font-medium">
            {block.content}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Edit selected block */}
      {selectedBlock && (
        <View className="mt-4 pt-4 border-t border-gray-100">
          {/* Content edit */}
          <TouchableOpacity
            onPress={openContentEditor}
            className="bg-gray-100 rounded-xl px-4 py-3 mb-3"
          >
            <Text className="text-xs text-gray-500 mb-1">Texto</Text>
            <Text numberOfLines={2} className="text-gray-800 text-sm">
              {selectedBlock.content}
            </Text>
          </TouchableOpacity>

          {/* Font size */}
          <Text className="text-xs font-semibold text-gray-500 mb-2">Tamanho</Text>
          <View className="flex-row gap-1 mb-3">
            {FONT_SIZES.map((sz) => (
              <TouchableOpacity
                key={sz}
                onPress={() => update({ fontSize: sz })}
                className={`flex-1 py-2 rounded-lg items-center border ${
                  selectedBlock.fontSize === sz ? 'border-brand bg-brand/10' : 'border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs ${selectedBlock.fontSize === sz ? 'text-brand font-bold' : 'text-gray-500'}`}
                >
                  {sz}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Font family */}
          <Text className="text-xs font-semibold text-gray-500 mb-2">Fonte</Text>
          <View className="flex-row gap-2 mb-3">
            {FONT_FAMILIES.map((f) => (
              <TouchableOpacity
                key={f.value}
                onPress={() => update({ fontFamily: f.value })}
                className={`flex-1 py-2 rounded-lg items-center border ${
                  selectedBlock.fontFamily === f.value
                    ? 'border-brand bg-brand/10'
                    : 'border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs ${selectedBlock.fontFamily === f.value ? 'text-brand' : 'text-gray-500'}`}
                  style={{ fontFamily: f.value === 'System' ? undefined : f.value }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Style (bold/italic) */}
          <View className="flex-row gap-2 mb-3">
            <TouchableOpacity
              onPress={() => update({ bold: !selectedBlock.bold })}
              className={`flex-1 py-2 rounded-lg items-center border ${
                selectedBlock.bold ? 'border-brand bg-brand/10' : 'border-gray-200'
              }`}
            >
              <Text className={`font-bold ${selectedBlock.bold ? 'text-brand' : 'text-gray-500'}`}>
                N
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => update({ italic: !selectedBlock.italic })}
              className={`flex-1 py-2 rounded-lg items-center border ${
                selectedBlock.italic ? 'border-brand bg-brand/10' : 'border-gray-200'
              }`}
            >
              <Text
                className={`italic ${selectedBlock.italic ? 'text-brand' : 'text-gray-500'}`}
              >
                I
              </Text>
            </TouchableOpacity>
          </View>

          {/* Alignment */}
          <Text className="text-xs font-semibold text-gray-500 mb-2">Alinhamento</Text>
          <View className="flex-row gap-2 mb-3">
            {(['left', 'center', 'right'] as const).map((a) => {
              const icons = { left: '⬅', center: '↔', right: '➡' };
              return (
                <TouchableOpacity
                  key={a}
                  onPress={() => update({ align: a })}
                  className={`flex-1 py-2 rounded-lg items-center border ${
                    selectedBlock.align === a ? 'border-brand bg-brand/10' : 'border-gray-200'
                  }`}
                >
                  <Text className={selectedBlock.align === a ? 'text-brand' : 'text-gray-400'}>
                    {icons[a]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Vertical position */}
          <Text className="text-xs font-semibold text-gray-500 mb-2">Posição vertical</Text>
          <View className="flex-row gap-1 mb-3">
            {[
              { label: 'Cima', value: 0.2 },
              { label: 'Centro', value: 0.5 },
              { label: 'Baixo', value: 0.78 },
            ].map((p) => (
              <TouchableOpacity
                key={p.value}
                onPress={() => update({ positionY: p.value })}
                className={`flex-1 py-2 rounded-lg items-center border ${
                  selectedBlock.positionY === p.value ? 'border-brand bg-brand/10' : 'border-gray-200'
                }`}
              >
                <Text className={`text-xs ${selectedBlock.positionY === p.value ? 'text-brand' : 'text-gray-500'}`}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Text color */}
          <Text className="text-xs font-semibold text-gray-500 mb-2">Cor do texto</Text>
          <View className="flex-row gap-2 flex-wrap mb-3">
            {TEXT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => update({ color: c })}
                style={{
                  backgroundColor: c,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: selectedBlock.color === c ? '#7C3AED' : '#E5E7EB',
                }}
              />
            ))}
          </View>

          {/* Remove block */}
          <TouchableOpacity
            onPress={() => removeTextBlock(selectedBlock.id)}
            className="bg-red-50 border border-red-200 rounded-xl py-2 items-center mt-2"
          >
            <Text className="text-red-500 text-sm font-medium">Remover bloco</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  // ─── Settings tab ──────────────────────────────────────────────────────────
  const SettingsTab = () => (
    <View>
      <View className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
        <Text className="text-sm font-semibold text-gray-700">Mostrar marca d'água</Text>
        <Switch
          value={config.showLogo}
          onValueChange={setShowLogo}
          trackColor={{ true: '#7C3AED' }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      {/* Tab bar */}
      <View className="flex-row border-b border-gray-100 mb-4">
        {([
          { id: 'background', label: 'Fundo' },
          { id: 'text', label: 'Texto' },
          { id: 'settings', label: 'Config' },
        ] as { id: Tab; label: string }[]).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === tab.id ? 'border-brand' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                activeTab === tab.id ? 'text-brand' : 'text-gray-400'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="flex-1 px-1">
        {activeTab === 'background' && <BackgroundTab />}
        {activeTab === 'text' && <TextTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </View>

      {/* Edit text modal */}
      <Modal visible={editingContent} animationType="slide" transparent>
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setEditingContent(false)}
        />
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
          <Text className="text-base font-bold text-gray-800 mb-3">Editar texto</Text>
          <TextInput
            value={tempContent}
            onChangeText={setTempContent}
            multiline
            autoFocus
            className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800 text-base min-h-24"
            placeholder="Digite o texto..."
            textAlignVertical="top"
          />
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={() => setEditingContent(false)}
              className="flex-1 py-3 rounded-xl border border-gray-200 items-center"
            >
              <Text className="text-gray-500 font-medium">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (tempContent.trim()) update({ content: tempContent.trim() });
                setEditingContent(false);
              }}
              className="flex-1 py-3 rounded-xl bg-brand items-center"
            >
              <Text className="text-white font-semibold">Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
