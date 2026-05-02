// Tipos base do banco de dados (serão expandidos conforme as migrations)

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

export type BibleVersion = {
  id: number;
  slug: string;
  name: string;
  language: string;
};

export type BibleBook = {
  id: number;
  version_id: number;
  number: number;
  name: string;
  abbrev: string;
  testament: 'OT' | 'NT';
};

export type BibleChapter = {
  id: number;
  book_id: number;
  number: number;
};

export type BibleVerse = {
  id: number;
  chapter_id: number;
  number: number;
  text: string;
};

export type Devotional = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type Card = {
  id: string;
  user_id: string;
  image_url: string | null;
  template_config: Record<string, unknown>;
  verse_id: number | null;
  created_at: string;
};
