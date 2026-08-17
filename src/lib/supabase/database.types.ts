export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      _backup_hoeren_a1_modelltest_20260711: {
        Row: {
          audio_url: string | null
          correct_answer: string | null
          exercise_id: string | null
          explanation: string | null
          id: string | null
          options: Json | null
          order_index: number | null
          question: string | null
          question_type: string | null
        }
        Insert: {
          audio_url?: string | null
          correct_answer?: string | null
          exercise_id?: string | null
          explanation?: string | null
          id?: string | null
          options?: Json | null
          order_index?: number | null
          question?: string | null
          question_type?: string | null
        }
        Update: {
          audio_url?: string | null
          correct_answer?: string | null
          exercise_id?: string | null
          explanation?: string | null
          id?: string | null
          options?: Json | null
          order_index?: number | null
          question?: string | null
          question_type?: string | null
        }
        Relationships: []
      }
      academy_evaluacija: {
        Row: {
          created_at: string
          duzina: string | null
          id: string
          izbacila: string | null
          materijali: number | null
          name: string | null
          nedostajalo: string | null
          nps: number
          nps_zasto: string | null
          ocene: Json
          prepreka: string | null
          primena: string[]
          promena: string | null
          tempo: string | null
          testimonial: string | null
          top3: string[]
        }
        Insert: {
          created_at?: string
          duzina?: string | null
          id?: string
          izbacila?: string | null
          materijali?: number | null
          name?: string | null
          nedostajalo?: string | null
          nps: number
          nps_zasto?: string | null
          ocene?: Json
          prepreka?: string | null
          primena?: string[]
          promena?: string | null
          tempo?: string | null
          testimonial?: string | null
          top3?: string[]
        }
        Update: {
          created_at?: string
          duzina?: string | null
          id?: string
          izbacila?: string | null
          materijali?: number | null
          name?: string | null
          nedostajalo?: string | null
          nps?: number
          nps_zasto?: string | null
          ocene?: Json
          prepreka?: string | null
          primena?: string[]
          promena?: string | null
          tempo?: string | null
          testimonial?: string | null
          top3?: string[]
        }
        Relationships: []
      }
      activation_nudges: {
        Row: {
          id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          category: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          published_at: string | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          published_at?: string | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          published_at?: string | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          course_id: string
          id: string
          issued_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          id?: string
          issued_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          id?: string
          issued_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_kanali: {
        Row: {
          id: string
          naziv: string
          opis: string
          samo_admin_pise: boolean
          slug: string
          sort: number
        }
        Insert: {
          id?: string
          naziv: string
          opis?: string
          samo_admin_pise?: boolean
          slug: string
          sort?: number
        }
        Update: {
          id?: string
          naziv?: string
          opis?: string
          samo_admin_pise?: boolean
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      chat_poruke: {
        Row: {
          created_at: string
          id: string
          ime: string
          kanal_id: string
          tekst: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ime: string
          kanal_id: string
          tekst: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ime?: string
          kanal_id?: string
          tekst?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_poruke_kanal_id_fkey"
            columns: ["kanal_id"]
            isOneToOne: false
            referencedRelation: "chat_kanali"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_procitano: {
        Row: {
          kanal_id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          kanal_id: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          kanal_id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_procitano_kanal_id_fkey"
            columns: ["kanal_id"]
            isOneToOne: false
            referencedRelation: "chat_kanali"
            referencedColumns: ["id"]
          },
        ]
      }
      clanice: {
        Row: {
          approved_at: string | null
          brend: string | null
          created_at: string
          email: string | null
          foto_url: string | null
          id: string
          ime: string
          instagram: string | null
          linkedin: string | null
          nh_membership: boolean
          opis: string
          sort_order: number
          status: string
          telefon: string | null
          user_id: string | null
          usluge: string[]
          web: string | null
        }
        Insert: {
          approved_at?: string | null
          brend?: string | null
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          ime: string
          instagram?: string | null
          linkedin?: string | null
          nh_membership?: boolean
          opis: string
          sort_order?: number
          status?: string
          telefon?: string | null
          user_id?: string | null
          usluge?: string[]
          web?: string | null
        }
        Update: {
          approved_at?: string | null
          brend?: string | null
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          ime?: string
          instagram?: string | null
          linkedin?: string | null
          nh_membership?: boolean
          opis?: string
          sort_order?: number
          status?: string
          telefon?: string | null
          user_id?: string | null
          usluge?: string[]
          web?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          amount: number
          applies_to_course_id: string | null
          code: string
          created_at: string
          discount_type: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order: number | null
          new_customers_only: boolean
          once_per_email: boolean
          renewal_days_after: number | null
          renewal_days_before: number | null
          renewal_only: boolean
          requires_course_id: string | null
          term_packages_only: boolean
          usage_count: number
          video_only: boolean
        }
        Insert: {
          amount: number
          applies_to_course_id?: string | null
          code: string
          created_at?: string
          discount_type: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order?: number | null
          new_customers_only?: boolean
          once_per_email?: boolean
          renewal_days_after?: number | null
          renewal_days_before?: number | null
          renewal_only?: boolean
          requires_course_id?: string | null
          term_packages_only?: boolean
          usage_count?: number
          video_only?: boolean
        }
        Update: {
          amount?: number
          applies_to_course_id?: string | null
          code?: string
          created_at?: string
          discount_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order?: number | null
          new_customers_only?: boolean
          once_per_email?: boolean
          renewal_days_after?: number | null
          renewal_days_before?: number | null
          renewal_only?: boolean
          requires_course_id?: string | null
          term_packages_only?: boolean
          usage_count?: number
          video_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "coupons_applies_to_course_id_fkey"
            columns: ["applies_to_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_requires_course_id_fkey"
            columns: ["requires_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_access: {
        Row: {
          course_id: string
          expires_at: string | null
          granted_at: string
          id: string
          source: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          source?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_royalties: {
        Row: {
          course_id: string
          created_at: string
          id: string
          percent: number
          professor_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          percent: number
          professor_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          percent?: number
          professor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_royalties_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_royalties_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_unlocks: {
        Row: {
          content_course_id: string
          created_at: string
          id: string
          purchasable_course_id: string
        }
        Insert: {
          content_course_id: string
          created_at?: string
          id?: string
          purchasable_course_id: string
        }
        Update: {
          content_course_id?: string
          created_at?: string
          id?: string
          purchasable_course_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_unlocks_content_course_id_fkey"
            columns: ["content_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_unlocks_purchasable_course_id_fkey"
            columns: ["purchasable_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          course_type: string
          created_at: string
          description: string
          features: Json | null
          handbook_url: string | null
          id: string
          included_lessons: number | null
          is_published: boolean
          is_purchasable: boolean | null
          lang: string
          marketing_description: string | null
          old_wc_product_id: number | null
          paypal_price_eur: number | null
          price: number
          slug: string
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          category?: string | null
          course_type?: string
          created_at?: string
          description?: string
          features?: Json | null
          handbook_url?: string | null
          id?: string
          included_lessons?: number | null
          is_published?: boolean
          is_purchasable?: boolean | null
          lang?: string
          marketing_description?: string | null
          old_wc_product_id?: number | null
          paypal_price_eur?: number | null
          price?: number
          slug: string
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          category?: string | null
          course_type?: string
          created_at?: string
          description?: string
          features?: Json | null
          handbook_url?: string | null
          id?: string
          included_lessons?: number | null
          is_published?: boolean
          is_purchasable?: boolean | null
          lang?: string
          marketing_description?: string | null
          old_wc_product_id?: number | null
          paypal_price_eur?: number | null
          price?: number
          slug?: string
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          instagram_handle: string | null
          last_interaction_at: string
          level: string | null
          name: string | null
          next_action: string | null
          next_action_at: string | null
          note: string | null
          owner: string | null
          phone: string | null
          source: string
          stage: string
          tags: string[]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          instagram_handle?: string | null
          last_interaction_at?: string
          level?: string | null
          name?: string | null
          next_action?: string | null
          next_action_at?: string | null
          note?: string | null
          owner?: string | null
          phone?: string | null
          source?: string
          stage?: string
          tags?: string[]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          instagram_handle?: string | null
          last_interaction_at?: string
          level?: string | null
          name?: string | null
          next_action?: string | null
          next_action_at?: string | null
          note?: string | null
          owner?: string | null
          phone?: string | null
          source?: string
          stage?: string
          tags?: string[]
          user_id?: string | null
        }
        Relationships: []
      }
      crm_interactions: {
        Row: {
          body: string | null
          channel: string
          contact_id: string
          created_at: string
          direction: string
          id: string
          meta: Json | null
          occurred_at: string
          summary: string | null
        }
        Insert: {
          body?: string | null
          channel: string
          contact_id: string
          created_at?: string
          direction?: string
          id?: string
          meta?: Json | null
          occurred_at?: string
          summary?: string | null
        }
        Update: {
          body?: string | null
          channel?: string
          contact_id?: string
          created_at?: string
          direction?: string
          id?: string
          meta?: Json | null
          occurred_at?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_runs: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          name: string
          ok: boolean
          status: number | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          name: string
          ok: boolean
          status?: number | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          name?: string
          ok?: boolean
          status?: number | null
        }
        Relationships: []
      }
      email_bounces: {
        Row: {
          created_at: string
          email: string
          event: string
          id: string
          reason: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event: string
          id?: string
          reason?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event?: string
          id?: string
          reason?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      email_optouts: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      essay_submissions: {
        Row: {
          ai_corrections: Json | null
          ai_feedback: string | null
          ai_score: number | null
          audio_url: string | null
          exercise_id: string
          id: string
          lesson_id: string
          professor_feedback: string | null
          professor_score: number | null
          reviewed_at: string | null
          status: string
          submission_type: string
          submitted_at: string
          text: string | null
          user_id: string
        }
        Insert: {
          ai_corrections?: Json | null
          ai_feedback?: string | null
          ai_score?: number | null
          audio_url?: string | null
          exercise_id: string
          id?: string
          lesson_id: string
          professor_feedback?: string | null
          professor_score?: number | null
          reviewed_at?: string | null
          status?: string
          submission_type?: string
          submitted_at?: string
          text?: string | null
          user_id: string
        }
        Update: {
          ai_corrections?: Json | null
          ai_feedback?: string | null
          ai_score?: number | null
          audio_url?: string | null
          exercise_id?: string
          id?: string
          lesson_id?: string
          professor_feedback?: string | null
          professor_score?: number | null
          reviewed_at?: string | null
          status?: string
          submission_type?: string
          submitted_at?: string
          text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "essay_submissions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "essay_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_attempts: {
        Row: {
          completed_at: string
          exercise_id: string
          id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          exercise_id: string
          id?: string
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string
          exercise_id?: string
          id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_questions: {
        Row: {
          audio_url: string | null
          correct_answer: string
          exercise_id: string
          explanation: string | null
          id: string
          options: Json | null
          order_index: number
          question: string
          question_type: string | null
        }
        Insert: {
          audio_url?: string | null
          correct_answer: string
          exercise_id: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          question: string
          question_type?: string | null
        }
        Update: {
          audio_url?: string | null
          correct_answer?: string
          exercise_id?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          question?: string
          question_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_questions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          exercise_type: string
          id: string
          lesson_id: string
          order_index: number
          title: string
        }
        Insert: {
          created_at?: string
          exercise_type: string
          id?: string
          lesson_id: string
          order_index?: number
          title: string
        }
        Update: {
          created_at?: string
          exercise_type?: string
          id?: string
          lesson_id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          course_id: string | null
          created_at: string
          ended_at: string | null
          expense_date: string
          id: string
          name: string
          note: string | null
          recurring: boolean
        }
        Insert: {
          amount: number
          category: string
          course_id?: string | null
          created_at?: string
          ended_at?: string | null
          expense_date: string
          id?: string
          name: string
          note?: string | null
          recurring?: boolean
        }
        Update: {
          amount?: number
          category?: string
          course_id?: string | null
          created_at?: string
          ended_at?: string | null
          expense_date?: string
          id?: string
          name?: string
          note?: string | null
          recurring?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "expenses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      expiry_reminders: {
        Row: {
          course_id: string
          expires_at: string
          id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          expires_at: string
          id?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          expires_at?: string
          id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_published: boolean
          order_index: number
          question: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          question: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          question?: string
        }
        Relationships: []
      }
      flashcard_progress: {
        Row: {
          card_id: string
          correct_count: number
          last_seen_at: string
          set_key: string
          status: string
          user_id: string
          wrong_count: number
        }
        Insert: {
          card_id: string
          correct_count?: number
          last_seen_at?: string
          set_key: string
          status?: string
          user_id: string
          wrong_count?: number
        }
        Update: {
          card_id?: string
          correct_count?: number
          last_seen_at?: string
          set_key?: string
          status?: string
          user_id?: string
          wrong_count?: number
        }
        Relationships: []
      }
      group_enrollments: {
        Row: {
          cancelled_at: string | null
          enrolled_at: string
          group_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          enrolled_at?: string
          group_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          enrolled_at?: string
          group_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_enrollments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_sessions: {
        Row: {
          cancelled: boolean
          created_at: string
          group_id: string
          id: string
          professor_id: string | null
          session_date: string
          source: string
        }
        Insert: {
          cancelled?: boolean
          created_at?: string
          group_id: string
          id?: string
          professor_id?: string | null
          session_date: string
          source?: string
        }
        Update: {
          cancelled?: boolean
          created_at?: string
          group_id?: string
          id?: string
          professor_id?: string | null
          session_date?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_sessions_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          calendar_id: string | null
          content_course_id: string | null
          created_at: string
          days: number[]
          duration_weeks: number | null
          end_date: string | null
          gcal_event_id: string | null
          id: string
          level: string
          manual_enrolled: number | null
          naknadni_upis: boolean
          max_seats: number
          meet_link: string | null
          min_seats: number
          notes: string | null
          notes_doc_id: string | null
          notes_link: string | null
          notes_url: string | null
          offer_sent_at: string | null
          price: number | null
          prof_reminder_sent_at: string | null
          professor_id: string | null
          purchasable_course_id: string | null
          reminder_sent_at: string | null
          session_time: string | null
          sessions_count: number | null
          source: string | null
          start_date: string | null
          status: string
          term_opened_at: string | null
          type: string
          updated_at: string
        }
        Insert: {
          calendar_id?: string | null
          content_course_id?: string | null
          created_at?: string
          days?: number[]
          duration_weeks?: number | null
          end_date?: string | null
          gcal_event_id?: string | null
          id?: string
          level: string
          manual_enrolled?: number | null
          naknadni_upis?: boolean
          max_seats?: number
          meet_link?: string | null
          min_seats?: number
          notes?: string | null
          notes_doc_id?: string | null
          notes_link?: string | null
          notes_url?: string | null
          offer_sent_at?: string | null
          price?: number | null
          prof_reminder_sent_at?: string | null
          professor_id?: string | null
          purchasable_course_id?: string | null
          reminder_sent_at?: string | null
          session_time?: string | null
          sessions_count?: number | null
          source?: string | null
          start_date?: string | null
          status?: string
          term_opened_at?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          calendar_id?: string | null
          content_course_id?: string | null
          created_at?: string
          days?: number[]
          duration_weeks?: number | null
          end_date?: string | null
          gcal_event_id?: string | null
          id?: string
          level?: string
          manual_enrolled?: number | null
          naknadni_upis?: boolean
          max_seats?: number
          meet_link?: string | null
          min_seats?: number
          notes?: string | null
          notes_doc_id?: string | null
          notes_link?: string | null
          notes_url?: string | null
          offer_sent_at?: string | null
          price?: number | null
          prof_reminder_sent_at?: string | null
          professor_id?: string | null
          purchasable_course_id?: string | null
          reminder_sent_at?: string | null
          session_time?: string | null
          sessions_count?: number | null
          source?: string | null
          start_date?: string | null
          status?: string
          term_opened_at?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_content_course_id_fkey"
            columns: ["content_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_purchasable_course_id_fkey"
            columns: ["purchasable_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      inactivity_reminders: {
        Row: {
          id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      individual_enrollments: {
        Row: {
          course_id: string
          created_at: string
          expires_at: string | null
          id: string
          lessons_used: number
          notes_doc_url: string | null
          one_left_email_sent_at: string | null
          order_id: string | null
          package_lessons: number
          professor_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          lessons_used?: number
          notes_doc_url?: string | null
          one_left_email_sent_at?: string | null
          order_id?: string | null
          package_lessons: number
          professor_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          lessons_used?: number
          notes_doc_url?: string | null
          one_left_email_sent_at?: string | null
          order_id?: string | null
          package_lessons?: number
          professor_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "individual_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_enrollments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_enrollments_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      individual_lessons: {
        Row: {
          created_at: string
          enrollment_id: string
          id: string
          lesson_date: string
          professor_id: string
        }
        Insert: {
          created_at?: string
          enrollment_id: string
          id?: string
          lesson_date: string
          professor_id: string
        }
        Update: {
          created_at?: string
          enrollment_id?: string
          id?: string
          lesson_date?: string
          professor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "individual_lessons_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "individual_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_lessons_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          is_free_preview: boolean
          lesson_type: string
          module_name: string | null
          order_index: number
          sections: Json | null
          title: string
          vimeo_video_id: string | null
        }
        Insert: {
          content?: string
          course_id: string
          created_at?: string
          id?: string
          is_free_preview?: boolean
          lesson_type?: string
          module_name?: string | null
          order_index?: number
          sections?: Json | null
          title: string
          vimeo_video_id?: string | null
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          is_free_preview?: boolean
          lesson_type?: string
          module_name?: string | null
          order_index?: number
          sections?: Json | null
          title?: string
          vimeo_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      masterclass_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          masterclass: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          masterclass?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          masterclass?: string
        }
        Relationships: []
      }
      member_profiles: {
        Row: {
          bio: string
          delatnost: string
          ime: string
          instagram: string
          updated_at: string
          user_id: string
          web: string
        }
        Insert: {
          bio?: string
          delatnost?: string
          ime?: string
          instagram?: string
          updated_at?: string
          user_id: string
          web?: string
        }
        Update: {
          bio?: string
          delatnost?: string
          ime?: string
          instagram?: string
          updated_at?: string
          user_id?: string
          web?: string
        }
        Relationships: []
      }
      naki_daily_usage: {
        Row: {
          count: number
          day: string
        }
        Insert: {
          count?: number
          day: string
        }
        Update: {
          count?: number
          day?: string
        }
        Relationships: []
      }
      naki_messages: {
        Row: {
          created_at: string
          id: number
          ip_hash: string | null
          kind: string
          level: string | null
          message: string
          role: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          ip_hash?: string | null
          kind?: string
          level?: string | null
          message: string
          role: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          ip_hash?: string | null
          kind?: string
          level?: string | null
          message?: string
          role?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      naki_profiles: {
        Row: {
          created_at: string
          email: string
          first_session: string
          last_session: string
          level: string | null
          name: string | null
          strong_areas: string[] | null
          summary: string | null
          topics_covered: string[] | null
          total_messages: number
          total_sessions: number
          user_id: string | null
          weak_areas: string[] | null
        }
        Insert: {
          created_at?: string
          email: string
          first_session?: string
          last_session?: string
          level?: string | null
          name?: string | null
          strong_areas?: string[] | null
          summary?: string | null
          topics_covered?: string[] | null
          total_messages?: number
          total_sessions?: number
          user_id?: string | null
          weak_areas?: string[] | null
        }
        Update: {
          created_at?: string
          email?: string
          first_session?: string
          last_session?: string
          level?: string | null
          name?: string | null
          strong_areas?: string[] | null
          summary?: string | null
          topics_covered?: string[] | null
          total_messages?: number
          total_sessions?: number
          user_id?: string | null
          weak_areas?: string[] | null
        }
        Relationships: []
      }
      nestpay_test_callbacks: {
        Row: {
          created_at: string
          hash_valid: boolean | null
          headers: Json
          id: string
          method: string
          oid: string | null
          params: Json
          proc_return_code: string | null
          trans_id: string | null
        }
        Insert: {
          created_at?: string
          hash_valid?: boolean | null
          headers?: Json
          id?: string
          method: string
          oid?: string | null
          params?: Json
          proc_return_code?: string | null
          trans_id?: string | null
        }
        Update: {
          created_at?: string
          hash_valid?: boolean | null
          headers?: Json
          id?: string
          method?: string
          oid?: string | null
          params?: Json
          proc_return_code?: string | null
          trans_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          country: string
          coupon_code: string | null
          created_at: string
          discount: number
          email: string
          fiscal_journal: string | null
          fiscal_pdf_url: string | null
          fiscal_referent_dt: string | null
          fiscal_referent_number: string | null
          fiscal_response: Json | null
          fiscal_verification_url: string | null
          fiscalized_at: string | null
          fiscomm_invoice_id: string | null
          full_name: string
          ga_client_id: string | null
          ga_session_id: string | null
          grant_lock_at: string | null
          granted: boolean
          id: string
          installment_no: number | null
          items: Json
          meta_purchase_sent: boolean
          nestpay_oid: string | null
          nestpay_response: Json | null
          nestpay_status: string | null
          nestpay_trans_id: string | null
          nestpay_transaction_id: string | null
          order_number: string | null
          payment_method: string
          payment_status: string
          paypal_note: string | null
          phone: string | null
          recovery_email_sent_at: string | null
          recovery_stage: number
          refund_journal: string | null
          refund_pdf_url: string | null
          refund_referent_number: string | null
          refund_response: Json | null
          refund_verification_url: string | null
          refunded_at: string | null
          source_type: string | null
          subscription_id: string | null
          subtotal: number
          total: number
          user_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          country?: string
          coupon_code?: string | null
          created_at?: string
          discount?: number
          email: string
          fiscal_journal?: string | null
          fiscal_pdf_url?: string | null
          fiscal_referent_dt?: string | null
          fiscal_referent_number?: string | null
          fiscal_response?: Json | null
          fiscal_verification_url?: string | null
          fiscalized_at?: string | null
          fiscomm_invoice_id?: string | null
          full_name: string
          ga_client_id?: string | null
          ga_session_id?: string | null
          grant_lock_at?: string | null
          granted?: boolean
          id?: string
          installment_no?: number | null
          items: Json
          meta_purchase_sent?: boolean
          nestpay_oid?: string | null
          nestpay_response?: Json | null
          nestpay_status?: string | null
          nestpay_trans_id?: string | null
          nestpay_transaction_id?: string | null
          order_number?: string | null
          payment_method: string
          payment_status?: string
          paypal_note?: string | null
          phone?: string | null
          recovery_email_sent_at?: string | null
          recovery_stage?: number
          refund_journal?: string | null
          refund_pdf_url?: string | null
          refund_referent_number?: string | null
          refund_response?: Json | null
          refund_verification_url?: string | null
          refunded_at?: string | null
          source_type?: string | null
          subscription_id?: string | null
          subtotal: number
          total: number
          user_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          country?: string
          coupon_code?: string | null
          created_at?: string
          discount?: number
          email?: string
          fiscal_journal?: string | null
          fiscal_pdf_url?: string | null
          fiscal_referent_dt?: string | null
          fiscal_referent_number?: string | null
          fiscal_response?: Json | null
          fiscal_verification_url?: string | null
          fiscalized_at?: string | null
          fiscomm_invoice_id?: string | null
          full_name?: string
          ga_client_id?: string | null
          ga_session_id?: string | null
          grant_lock_at?: string | null
          granted?: boolean
          id?: string
          installment_no?: number | null
          items?: Json
          meta_purchase_sent?: boolean
          nestpay_oid?: string | null
          nestpay_response?: Json | null
          nestpay_status?: string | null
          nestpay_trans_id?: string | null
          nestpay_transaction_id?: string | null
          order_number?: string | null
          payment_method?: string
          payment_status?: string
          paypal_note?: string | null
          phone?: string | null
          recovery_email_sent_at?: string | null
          recovery_stage?: number
          refund_journal?: string | null
          refund_pdf_url?: string | null
          refund_referent_number?: string | null
          refund_response?: Json | null
          refund_verification_url?: string | null
          refunded_at?: string | null
          source_type?: string | null
          subscription_id?: string | null
          subtotal?: number
          total?: number
          user_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_test_questions: {
        Row: {
          correct_answer: number
          id: string
          level: string
          options: Json
          order_index: number
          question: string
        }
        Insert: {
          correct_answer: number
          id?: string
          level: string
          options: Json
          order_index?: number
          question: string
        }
        Update: {
          correct_answer?: number
          id?: string
          level?: string
          options?: Json
          order_index?: number
          question?: string
        }
        Relationships: []
      }
      placement_test_results: {
        Row: {
          created_at: string
          email: string | null
          id: string
          ip_address: string | null
          recommended_level: string
          score: number
          scores: Json | null
          total_questions: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          recommended_level: string
          score: number
          scores?: Json | null
          total_questions: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          recommended_level?: string
          score?: number
          scores?: Json | null
          total_questions?: number
          user_id?: string | null
        }
        Relationships: []
      }
      pozivnica_rsvp: {
        Row: {
          broj: number
          created_at: string
          email: string | null
          event: string
          guests: string | null
          id: string
          name: string
          note: string | null
        }
        Insert: {
          broj?: number
          created_at?: string
          email?: string | null
          event?: string
          guests?: string | null
          id?: string
          name: string
          note?: string | null
        }
        Update: {
          broj?: number
          created_at?: string
          email?: string | null
          event?: string
          guests?: string | null
          id?: string
          name?: string
          note?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          course_id: string
          id: string
          is_active: boolean
          package_type: string | null
          paypal_price_eur: number | null
          price: number
          professor_id: string | null
        }
        Insert: {
          course_id: string
          id?: string
          is_active?: boolean
          package_type?: string | null
          paypal_price_eur?: number | null
          price: number
          professor_id?: string | null
        }
        Update: {
          course_id?: string
          id?: string
          is_active?: boolean
          package_type?: string | null
          paypal_price_eur?: number | null
          price?: number
          professor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_activities: {
        Row: {
          activity_date: string
          amount: number
          approved_by: string | null
          created_at: string
          decided_at: string | null
          description: string
          id: string
          professor_id: string
          reject_reason: string | null
          status: string
          submitted_by: string | null
        }
        Insert: {
          activity_date: string
          amount: number
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          description: string
          id?: string
          professor_id: string
          reject_reason?: string | null
          status?: string
          submitted_by?: string | null
        }
        Update: {
          activity_date?: string
          amount?: number
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          description?: string
          id?: string
          professor_id?: string
          reject_reason?: string | null
          status?: string
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professor_activities_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_activities_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_activities_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          payment_date: string
          professor_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          payment_date: string
          professor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          payment_date?: string
          professor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_payments_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_students: {
        Row: {
          assigned_via: string
          course_id: string
          created_at: string
          id: string
          professor_id: string
          student_id: string
        }
        Insert: {
          assigned_via?: string
          course_id: string
          created_at?: string
          id?: string
          professor_id: string
          student_id: string
        }
        Update: {
          assigned_via?: string
          course_id?: string
          created_at?: string
          id?: string
          professor_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_students_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_students_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount: number
          course_id: string
          created_at: string
          id: string
          payment_method: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          course_id: string
          created_at?: string
          id?: string
          payment_method?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          course_id?: string
          created_at?: string
          id?: string
          payment_method?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          reset_at: string
        }
        Insert: {
          count?: number
          key: string
          reset_at: string
        }
        Update: {
          count?: number
          key?: string
          reset_at?: string
        }
        Relationships: []
      }
      review_requests: {
        Row: {
          id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      smile_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      smile_daily_usage: {
        Row: {
          count: number
          day: string
        }
        Insert: {
          count?: number
          day: string
        }
        Update: {
          count?: number
          day?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          base_oid: string
          cancel_reason: string | null
          cancelled_at: string | null
          course_id: string
          created_at: string
          id: string
          initial_order_id: string
          last_polled_at: string | null
          last_retry_at: string | null
          next_charge_at: string | null
          paid_payments: number
          recurring_id: string
          retry_count: number
          retry_oid: string | null
          retry_planned_for: string | null
          status: string
          total_payments: number
          user_id: string
        }
        Insert: {
          amount: number
          base_oid: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          initial_order_id: string
          last_polled_at?: string | null
          last_retry_at?: string | null
          next_charge_at?: string | null
          paid_payments?: number
          recurring_id: string
          retry_count?: number
          retry_oid?: string | null
          retry_planned_for?: string | null
          status?: string
          total_payments: number
          user_id: string
        }
        Update: {
          amount?: number
          base_oid?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          initial_order_id?: string
          last_polled_at?: string | null
          last_retry_at?: string | null
          next_charge_at?: string | null
          paid_payments?: number
          recurring_id?: string
          retry_count?: number
          retry_oid?: string | null
          retry_planned_for?: string | null
          status?: string
          total_payments?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_initial_order_id_fkey"
            columns: ["initial_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      substitution_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          decided_at: string | null
          group_id: string
          id: string
          reject_reason: string | null
          requested_by: string
          session_date: string
          status: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          group_id: string
          id?: string
          reject_reason?: string | null
          requested_by: string
          session_date: string
          status?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          group_id?: string
          id?: string
          reject_reason?: string | null
          requested_by?: string
          session_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "substitution_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitution_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitution_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_funnel_emails: {
        Row: {
          email: string
          email_number: number
          id: string
          nivo: string
          sent_at: string
        }
        Insert: {
          email: string
          email_number: number
          id?: string
          nivo: string
          sent_at?: string
        }
        Update: {
          email?: string
          email_number?: number
          id?: string
          nivo?: string
          sent_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          calendar_url: string | null
          created_at: string
          email: string
          full_name: string
          honorar_grp: number | null
          honorar_ind: number | null
          id: string
          role: string
        }
        Insert: {
          calendar_url?: string | null
          created_at?: string
          email: string
          full_name?: string
          honorar_grp?: number | null
          honorar_ind?: number | null
          id: string
          role?: string
        }
        Update: {
          calendar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          honorar_grp?: number | null
          honorar_ind?: number | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          current_streak: number
          hearts_today: number
          last_active_date: string | null
          level: number
          longest_streak: number
          total_hearts: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          hearts_today?: number
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          total_hearts?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          hearts_today?: number
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          total_hearts?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wc_orders: {
        Row: {
          country: string | null
          currency: string
          customer_email: string | null
          customer_name: string | null
          date_completed: string | null
          date_created: string
          discount_total: number
          id: number
          items: Json | null
          payment_method: string | null
          payment_method_title: string | null
          source_type: string | null
          status: string
          total: number
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          wc_order_id: number
        }
        Insert: {
          country?: string | null
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          date_completed?: string | null
          date_created: string
          discount_total?: number
          id?: number
          items?: Json | null
          payment_method?: string | null
          payment_method_title?: string | null
          source_type?: string | null
          status: string
          total: number
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          wc_order_id: number
        }
        Update: {
          country?: string | null
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          date_completed?: string | null
          date_created?: string
          discount_total?: number
          id?: number
          items?: Json | null
          payment_method?: string | null
          payment_method_title?: string | null
          source_type?: string | null
          status?: string
          total?: number
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          wc_order_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      javne_clanice: {
        Row: {
          brend: string | null
          created_at: string | null
          email: string | null
          foto_url: string | null
          id: string | null
          ime: string | null
          instagram: string | null
          linkedin: string | null
          nh_aktivna: boolean | null
          opis: string | null
          sort_order: number | null
          telefon: string | null
          usluge: string[] | null
          web: string | null
        }
        Insert: {
          brend?: string | null
          created_at?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string | null
          ime?: string | null
          instagram?: string | null
          linkedin?: string | null
          nh_aktivna?: never
          opis?: string | null
          sort_order?: number | null
          telefon?: string | null
          usluge?: string[] | null
          web?: string | null
        }
        Update: {
          brend?: string | null
          created_at?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string | null
          ime?: string | null
          instagram?: string | null
          linkedin?: string | null
          nh_aktivna?: never
          opis?: string | null
          sort_order?: number | null
          telefon?: string | null
          usluge?: string[] | null
          web?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      chat_neprocitano: {
        Args: never
        Returns: {
          broj: number
          kanal_id: string
        }[]
      }
      get_course_dropoff: {
        Args: never
        Returns: {
          course_id: string
          course_title: string
          dropoff_lesson_id: string
          dropoff_lesson_order: number
          dropoff_lesson_title: string
          stopped_count: number
          total_started: number
        }[]
      }
      je_aktivna_clanica: { Args: { uid: string }; Returns: boolean }
      rate_limit_hit: {
        Args: { p_key: string; p_max: number; p_window_ms: number }
        Returns: {
          allowed: boolean
          remaining: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
