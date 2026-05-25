export type BadgeCategory = "grammatik" | "lesen" | "hoeren" | "schreiben" | "wortschatz";
export type TextStyle = "default" | "beispiele" | "uebung" | "info";
export type LinkType = "kviz" | "quizlet" | "pdf" | "dw" | "external";

export interface BadgeSection {
  type: "badge";
  module: string;
  category?: BadgeCategory;
}

export interface VideoSection {
  type: "video";
  vimeoId: string;
}

export interface TextSection {
  type: "text";
  content: string;
  style?: TextStyle;
}

export interface FormulaSection {
  type: "formula";
  content: string;
}

export interface TableSection {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface MistakesSection {
  type: "mistakes";
  items: {
    wrong: string;
    correct: string;
    explanation?: string;
  }[];
}

export interface SpoilerSection {
  type: "spoiler";
  title?: string;
  items: {
    question: string;
    answer: string;
  }[];
}

export interface VocabularySection {
  type: "vocabulary";
  rows: string[][];
}

export interface PdfSection {
  type: "pdf";
  url: string;
  label?: string;
}

export interface ImageSection {
  type: "image";
  url: string;
  alt: string;
  caption?: string;
}

export interface LinkSection {
  type: "link";
  linkType: LinkType;
  href: string;
  label?: string;
}

export interface FlashcardSection {
  type: "flashcard";
  items: {
    front: string;
    back: string;
  }[];
}

export interface YoutubeSection {
  type: "youtube";
  videoId: string;
  label?: string;
}

export type Section =
  | BadgeSection
  | VideoSection
  | TextSection
  | FormulaSection
  | TableSection
  | MistakesSection
  | SpoilerSection
  | VocabularySection
  | PdfSection
  | ImageSection
  | LinkSection
  | FlashcardSection
  | YoutubeSection;
