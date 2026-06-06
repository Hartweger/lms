import type { Section } from "./section-types";

export type UserRole = "student" | "professor" | "admin";
export type CourseType = "video" | "individual" | "group";
export type LessonType = "video" | "pdf" | "text" | "image";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export type CourseCategory = "video" | "grupni" | "individualni" | "paket" | "usluga" | "mesecni";

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  marketing_description: string | null;
  features: string[] | null;
  category: CourseCategory | null;
  course_type: CourseType;
  price: number;
  thumbnail_url: string | null;
  handbook_url: string | null;
  is_published: boolean;
  is_purchasable: boolean;
  paypal_price_eur: number | null;
  old_wc_product_id: number | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  lesson_type: LessonType;
  content: string;
  vimeo_video_id: string | null;
  order_index: number;
  is_free_preview: boolean;
  sections: Section[] | null;
  created_at: string;
}

export interface CourseAccess {
  id: string;
  user_id: string;
  course_id: string;
  granted_at: string;
  expires_at: string | null;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface Purchase {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  payment_method: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

export type ExerciseType = "quiz" | "fill_blank" | "match_pairs" | "word_order" | "listen_write" | "dialog" | "true_false" | "categorize" | "typing" | "conversation" | "speak" | "essay" | "sprechen";

export interface Exercise {
  id: string;
  lesson_id: string;
  title: string;
  exercise_type: ExerciseType;
  order_index: number;
  created_at: string;
}

export interface ExerciseQuestion {
  id: string;
  exercise_id: string;
  question: string;
  options: unknown;
  correct_answer: string;
  explanation: string | null;
  audio_url: string | null;
  order_index: number;
}

export interface ExerciseAttempt {
  id: string;
  user_id: string;
  exercise_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export interface EssaySubmission {
  id: string;
  user_id: string;
  exercise_id: string;
  lesson_id: string;
  text: string;
  ai_feedback: string | null;
  ai_corrections: unknown;
  ai_score: number | null;
  professor_feedback: string | null;
  professor_score: number | null;
  status: "pending" | "reviewed" | "published";
  submitted_at: string;
  reviewed_at: string | null;
}

export interface ProfessorStudent {
  id: string;
  professor_id: string;
  student_id: string;
  course_id: string;
  assigned_via: "manual" | "wc_variation";
  created_at: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  meta_description: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  country: string;
  items: unknown;
  subtotal: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  payment_method: string;
  payment_status: string;
  nestpay_transaction_id: string | null;
  paypal_note: string | null;
  fiscomm_invoice_id: string | null;
  order_number: string;
  granted: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  amount: number;
  min_order: number | null;
  max_uses: number | null;
  usage_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  course_id: string;
  professor_id: string | null;
  package_type: string | null;
  price: number;
  paypal_price_eur: number | null;
  is_active: boolean;
}
