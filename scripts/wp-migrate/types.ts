export type Section =
  | { type: "badge"; module: string }
  | { type: "video"; vimeoId: string }
  | { type: "text"; content: string; style?: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "pdf"; url: string; label?: string }
  | { type: "image"; url: string; alt: string; caption?: string };

export interface ExerciseDump {
  title: string;
  exercise_type: "quiz" | "fill_blank" | "match_pairs" | "word_order" | "listen_write" | "essay";
  questions: {
    question: string;
    options: unknown;          // {type, items}
    correct_answer: string;
    explanation?: string;
    question_type: string;
  }[];
  needsReview?: string;
}

export interface LessonDump {
  wpLessonId: number;
  title: string;
  order_index: number;
  vimeo_video_id: string | null;
  sections: Section[];
  exercises: ExerciseDump[];
}

export interface CourseDump {
  slug: string;
  wpCourseId: number;
  lessons: LessonDump[];
  reviewNotes: string[];
}
