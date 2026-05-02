import { create } from 'zustand';

export type CardFormat = 'story' | 'square' | 'portrait';

export type BackgroundType = 'color' | 'gradient' | 'image';

export interface CardBackground {
  type: BackgroundType;
  color: string;
  gradientColors: [string, string];
  imageUri?: string;
}

export interface TextBlock {
  id: string;
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  paddingH: number; // horizontal padding %
  positionY: number; // 0-1 vertical position
}

export interface CardConfig {
  format: CardFormat;
  background: CardBackground;
  textBlocks: TextBlock[];
  overlayOpacity: number; // 0-0.8
  showLogo: boolean;
}

interface CardState {
  config: CardConfig;
  selectedBlockId: string | null;
  setFormat: (format: CardFormat) => void;
  setBackground: (bg: Partial<CardBackground>) => void;
  setOverlay: (opacity: number) => void;
  addTextBlock: (content?: string) => void;
  updateTextBlock: (id: string, patch: Partial<TextBlock>) => void;
  removeTextBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  setShowLogo: (v: boolean) => void;
  reset: () => void;
}

const DEFAULT_BLOCK = (): TextBlock => ({
  id: Date.now().toString(),
  content: 'Toque para editar',
  fontSize: 24,
  fontFamily: 'System',
  color: '#FFFFFF',
  align: 'center',
  bold: false,
  italic: false,
  paddingH: 8,
  positionY: 0.5,
});

const DEFAULT_CONFIG: CardConfig = {
  format: 'story',
  background: {
    type: 'gradient',
    color: '#7C3AED',
    gradientColors: ['#7C3AED', '#4C1D95'],
  },
  textBlocks: [],
  overlayOpacity: 0,
  showLogo: true,
};

export const useCardStore = create<CardState>((set) => ({
  config: DEFAULT_CONFIG,
  selectedBlockId: null,

  setFormat: (format) =>
    set((s) => ({ config: { ...s.config, format } })),

  setBackground: (bg) =>
    set((s) => ({
      config: { ...s.config, background: { ...s.config.background, ...bg } },
    })),

  setOverlay: (overlayOpacity) =>
    set((s) => ({ config: { ...s.config, overlayOpacity } })),

  addTextBlock: (content) => {
    const block = DEFAULT_BLOCK();
    if (content) block.content = content;
    set((s) => ({
      config: { ...s.config, textBlocks: [...s.config.textBlocks, block] },
      selectedBlockId: block.id,
    }));
  },

  updateTextBlock: (id, patch) =>
    set((s) => ({
      config: {
        ...s.config,
        textBlocks: s.config.textBlocks.map((b) =>
          b.id === id ? { ...b, ...patch } : b,
        ),
      },
    })),

  removeTextBlock: (id) =>
    set((s) => ({
      config: {
        ...s.config,
        textBlocks: s.config.textBlocks.filter((b) => b.id !== id),
      },
      selectedBlockId: null,
    })),

  selectBlock: (id) => set({ selectedBlockId: id }),

  setShowLogo: (showLogo) =>
    set((s) => ({ config: { ...s.config, showLogo } })),

  reset: () => set({ config: DEFAULT_CONFIG, selectedBlockId: null }),
}));

// Dimensões de preview (px)
export const CARD_DIMS: Record<CardFormat, { w: number; h: number }> = {
  story: { w: 270, h: 480 },
  square: { w: 340, h: 340 },
  portrait: { w: 272, h: 340 },
};
