export interface Definition {
  partOfSpeech: string;
  meaning: string;
}

export interface ExampleSentence {
  english: string;
  chinese: string;
}

export interface WordDetails {
  word: string;
  phonetic: string;
  audioUrl?: string;
  definitions: Definition[];
  examples: ExampleSentence[];
}

export interface Story {
  id: string;
  title: string;
  content: string;
  status?: 'caching' | 'reviewing' | 'published';
  order?: number;
}

export interface StorySeries {
  id:string;
  title: string;
  description: string;
  stories: Story[];
}

export interface VocabularyLibrary {
  id: string;
  title: string;
  description: string;
  series: StorySeries[];
}

// --- New Types for User Management ---

export interface User {
  phone: string;
  email: string;
  password: string; 
  role: 'admin' | 'user';
  activationCodeUsed: string;
}

export interface ActivationCode {
  code: string;
  isUsed: boolean;
  usedBy: string | null; // phone number of user
  usedAt: string | null; // ISO date string
  createdAt: string; // ISO date string
}