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

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  course_type: CourseType;
  price: number;
  thumbnail_url: string | null;
  is_published: boolean;
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
  created_at: string;
}

export interface CourseAccess {
  id: string;
  user_id: string;
  course_id: string;
  granted_at: string;
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
