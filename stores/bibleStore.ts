import { create } from 'zustand';

type BibleState = {
  versionSlug: string;
  versionName: string;
  selectedBookId: number | null;
  selectedBookName: string;
  selectedBookAbbrev: string;
  selectedChapterId: number | null;
  selectedChapterNumber: number;
  totalChapters: number;
  setVersion: (slug: string, name: string) => void;
  setBook: (id: number, name: string, abbrev: string, totalChapters: number) => void;
  setChapter: (id: number, number: number) => void;
};

export const useBibleStore = create<BibleState>((set) => ({
  versionSlug: 'arc',
  versionName: 'Almeida Revista e Corrigida',
  selectedBookId: null,
  selectedBookName: '',
  selectedBookAbbrev: '',
  selectedChapterId: null,
  selectedChapterNumber: 1,
  totalChapters: 0,

  setVersion: (slug, name) => set({ versionSlug: slug, versionName: name }),

  setBook: (id, name, abbrev, totalChapters) =>
    set({ selectedBookId: id, selectedBookName: name, selectedBookAbbrev: abbrev, totalChapters }),

  setChapter: (id, number) =>
    set({ selectedChapterId: id, selectedChapterNumber: number }),
}));
