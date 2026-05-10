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
      challenges: {
        Row: {
          challenger_id: string
          challenger_score: number | null
          completed_at: string | null
          created_at: string
          id: string
          opponent_id: string
          opponent_score: number | null
          payload: Json
          status: string
          type: string
          winner_id: string | null
        }
        Insert: {
          challenger_id: string
          challenger_score?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          opponent_id: string
          opponent_score?: number | null
          payload?: Json
          status?: string
          type: string
          winner_id?: string | null
        }
        Update: {
          challenger_id?: string
          challenger_score?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          opponent_id?: string
          opponent_score?: number | null
          payload?: Json
          status?: string
          type?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_lessons: {
        Row: {
          content: Json
          created_at: string
          for_date: string
          id: string
          level: Database["public"]["Enums"]["english_level"]
          skill: string
          title: string
          topic: string
        }
        Insert: {
          content?: Json
          created_at?: string
          for_date: string
          id?: string
          level: Database["public"]["Enums"]["english_level"]
          skill: string
          title: string
          topic: string
        }
        Update: {
          content?: Json
          created_at?: string
          for_date?: string
          id?: string
          level?: Database["public"]["Enums"]["english_level"]
          skill?: string
          title?: string
          topic?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          score: number
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          score?: number
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          score?: number
          updated_at?: string
          user_id?: string
          xp_earned?: number
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
          created_at: string
          created_by: string | null
          description: string | null
          estimated_minutes: number
          grammar: Json
          id: string
          level: Database["public"]["Enums"]["english_level"]
          listening: Json
          order_index: number
          published: boolean
          reading: Json
          speaking: Json
          title: string
          updated_at: string
          vocabulary: Json
          xp_reward: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number
          grammar?: Json
          id?: string
          level: Database["public"]["Enums"]["english_level"]
          listening?: Json
          order_index?: number
          published?: boolean
          reading?: Json
          speaking?: Json
          title: string
          updated_at?: string
          vocabulary?: Json
          xp_reward?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number
          grammar?: Json
          id?: string
          level?: Database["public"]["Enums"]["english_level"]
          listening?: Json
          order_index?: number
          published?: boolean
          reading?: Json
          speaking?: Json
          title?: string
          updated_at?: string
          vocabulary?: Json
          xp_reward?: number
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          card_holder: string
          card_number: string
          click_link: string | null
          id: string
          instructions: string | null
          payme_link: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          card_holder?: string
          card_number?: string
          click_link?: string | null
          id?: string
          instructions?: string | null
          payme_link?: string | null
          phone?: string
          updated_at?: string
        }
        Update: {
          card_holder?: string
          card_number?: string
          click_link?: string | null
          id?: string
          instructions?: string | null
          payme_link?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number
          created_at: string
          daily_goal_minutes: number
          daily_lessons_count: number
          daily_lessons_date: string | null
          daily_reward_streak: number
          daily_writing_count: number
          daily_writing_date: string | null
          display_name: string | null
          english_level: Database["public"]["Enums"]["english_level"] | null
          equipped_avatar: string | null
          equipped_theme: string | null
          id: string
          last_active_date: string | null
          last_daily_reward_at: string | null
          learning_goal: Database["public"]["Enums"]["learning_goal"] | null
          level: number
          native_language: Database["public"]["Enums"]["native_language"]
          notify_daily_reminder: boolean
          notify_new_lesson: boolean
          notify_streak_warn: boolean
          onboarding_completed: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
          plan_expires_at: string | null
          streak_days: number
          streak_freezes: number
          updated_at: string
          weak_skills: string[]
          xp: number
          xp_boost_until: string | null
        }
        Insert: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          daily_goal_minutes?: number
          daily_lessons_count?: number
          daily_lessons_date?: string | null
          daily_reward_streak?: number
          daily_writing_count?: number
          daily_writing_date?: string | null
          display_name?: string | null
          english_level?: Database["public"]["Enums"]["english_level"] | null
          equipped_avatar?: string | null
          equipped_theme?: string | null
          id: string
          last_active_date?: string | null
          last_daily_reward_at?: string | null
          learning_goal?: Database["public"]["Enums"]["learning_goal"] | null
          level?: number
          native_language?: Database["public"]["Enums"]["native_language"]
          notify_daily_reminder?: boolean
          notify_new_lesson?: boolean
          notify_streak_warn?: boolean
          onboarding_completed?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_expires_at?: string | null
          streak_days?: number
          streak_freezes?: number
          updated_at?: string
          weak_skills?: string[]
          xp?: number
          xp_boost_until?: string | null
        }
        Update: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          daily_goal_minutes?: number
          daily_lessons_count?: number
          daily_lessons_date?: string | null
          daily_reward_streak?: number
          daily_writing_count?: number
          daily_writing_date?: string | null
          display_name?: string | null
          english_level?: Database["public"]["Enums"]["english_level"] | null
          equipped_avatar?: string | null
          equipped_theme?: string | null
          id?: string
          last_active_date?: string | null
          last_daily_reward_at?: string | null
          learning_goal?: Database["public"]["Enums"]["learning_goal"] | null
          level?: number
          native_language?: Database["public"]["Enums"]["native_language"]
          notify_daily_reminder?: boolean
          notify_new_lesson?: boolean
          notify_streak_warn?: boolean
          onboarding_completed?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_expires_at?: string | null
          streak_days?: number
          streak_freezes?: number
          updated_at?: string
          weak_skills?: string[]
          xp?: number
          xp_boost_until?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          metadata: Json
          name: string
          price_coins: number
          slug: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json
          name: string
          price_coins: number
          slug: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json
          name?: string
          price_coins?: number
          slug?: string
        }
        Relationships: []
      }
      subscription_requests: {
        Row: {
          admin_note: string | null
          amount_uzs: number
          created_at: string
          full_name: string
          id: string
          method: string
          note: string | null
          period: string
          phone: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_uzs?: number
          created_at?: string
          full_name: string
          id?: string
          method?: string
          note?: string | null
          period?: string
          phone: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_uzs?: number
          created_at?: string
          full_name?: string
          id?: string
          method?: string
          note?: string | null
          period?: string
          phone?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          acquired_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      writing_submissions: {
        Row: {
          corrected_text: string | null
          created_at: string
          exercise_type: string
          feedback: string | null
          fluency_score: number
          grammar_score: number
          id: string
          ielts_band: number | null
          level: Database["public"]["Enums"]["english_level"]
          mistakes: Json
          overall_score: number
          prompt: string | null
          suggestions: Json
          text: string
          updated_at: string
          user_id: string
          vocabulary_score: number
          word_count: number
          xp_earned: number
        }
        Insert: {
          corrected_text?: string | null
          created_at?: string
          exercise_type?: string
          feedback?: string | null
          fluency_score?: number
          grammar_score?: number
          id?: string
          ielts_band?: number | null
          level?: Database["public"]["Enums"]["english_level"]
          mistakes?: Json
          overall_score?: number
          prompt?: string | null
          suggestions?: Json
          text: string
          updated_at?: string
          user_id: string
          vocabulary_score?: number
          word_count?: number
          xp_earned?: number
        }
        Update: {
          corrected_text?: string | null
          created_at?: string
          exercise_type?: string
          feedback?: string | null
          fluency_score?: number
          grammar_score?: number
          id?: string
          ielts_band?: number | null
          level?: Database["public"]["Enums"]["english_level"]
          mistakes?: Json
          overall_score?: number
          prompt?: string | null
          suggestions?: Json
          text?: string
          updated_at?: string
          user_id?: string
          vocabulary_score?: number
          word_count?: number
          xp_earned?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_subscription_request: {
        Args: { _admin_note?: string; _request_id: string }
        Returns: undefined
      }
      award_coins: {
        Args: {
          _amount: number
          _metadata?: Json
          _reason: string
          _user_id: string
        }
        Returns: undefined
      }
      can_start_lesson: { Args: { _user_id: string }; Returns: Json }
      can_submit_writing: { Args: { _user_id: string }; Returns: Json }
      claim_daily_reward: { Args: { _user_id: string }; Returns: Json }
      complete_challenge: {
        Args: { _challenge_id: string; _my_score: number }
        Returns: Json
      }
      equip_item: {
        Args: { _item_id: string; _user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      purchase_shop_item: {
        Args: { _item_id: string; _user_id: string }
        Returns: Json
      }
      record_lesson_start: { Args: { _user_id: string }; Returns: undefined }
      record_writing_submission: {
        Args: { _user_id: string }
        Returns: undefined
      }
      reject_subscription_request: {
        Args: { _admin_note?: string; _request_id: string }
        Returns: undefined
      }
      respond_friend_request: {
        Args: { _accept: boolean; _request_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      english_level:
        | "beginner"
        | "elementary"
        | "intermediate"
        | "upper_intermediate"
        | "advanced"
        | "upper-intermediate"
        | "proficient"
      learning_goal:
        | "ielts"
        | "speak_fluently"
        | "business"
        | "travel"
        | "school_exam"
        | "general"
      native_language: "uz" | "en" | "ru" | "other"
      payment_status: "pending" | "approved" | "rejected"
      subscription_plan: "free" | "pro" | "premium"
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
    Enums: {
      app_role: ["admin", "user"],
      english_level: [
        "beginner",
        "elementary",
        "intermediate",
        "upper_intermediate",
        "advanced",
        "upper-intermediate",
        "proficient",
      ],
      learning_goal: [
        "ielts",
        "speak_fluently",
        "business",
        "travel",
        "school_exam",
        "general",
      ],
      native_language: ["uz", "en", "ru", "other"],
      payment_status: ["pending", "approved", "rejected"],
      subscription_plan: ["free", "pro", "premium"],
    },
  },
} as const
