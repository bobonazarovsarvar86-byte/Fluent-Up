import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Plan = "free" | "pro" | "premium";

export type PlanState = {
  plan: Plan;
  isPaid: boolean;
  isPremium: boolean;
  loading: boolean;
  /** Returns whether a lesson can be started right now (calls DB). */
  canStartLesson: () => Promise<{ allowed: boolean; remaining: number; limit?: number }>;
  /** Records that a lesson was started (increments daily counter for free users). */
  recordLessonStart: () => Promise<void>;
  refresh: () => void;
};

/**
 * Plan limits (Englify-style):
 * - free:    3 lessons/day, A1+A2 only, no AI Speaking/Listening
 * - pro:     unlimited lessons, all levels, AI Speaking/Listening, no 1-on-1 coaching
 * - premium: everything in Pro + advanced analytics + priority support
 */
export const PLAN_LIMITS = {
  free: {
    dailyLessons: 3,
    levels: ["A1", "A2"] as string[],
    aiSpeaking: false,
    aiListening: false,
    aiTutor: false,
  },
  pro: {
    dailyLessons: Infinity,
    levels: ["A1", "A2", "B1", "B2"] as string[],
    aiSpeaking: true,
    aiListening: true,
    aiTutor: true,
  },
  premium: {
    dailyLessons: Infinity,
    levels: ["A1", "A2", "B1", "B2", "C1", "C2"] as string[],
    aiSpeaking: true,
    aiListening: true,
    aiTutor: true,
  },
} as const;

export const usePlan = (): PlanState => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancel = false;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancel) return;
        setPlan(((data as any)?.plan as Plan) ?? "free");
        setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [user, tick]);

  const canStartLesson = useCallback(async () => {
    if (!user) return { allowed: false, remaining: 0 };
    const { data, error } = await supabase.rpc("can_start_lesson" as any, { _user_id: user.id });
    if (error || !data) return { allowed: true, remaining: -1 };
    const d = data as any;
    return { allowed: !!d.allowed, remaining: d.remaining ?? 0, limit: d.limit };
  }, [user]);

  const recordLessonStart = useCallback(async () => {
    if (!user) return;
    await supabase.rpc("record_lesson_start" as any, { _user_id: user.id });
  }, [user]);

  return {
    plan,
    isPaid: plan === "pro" || plan === "premium",
    isPremium: plan === "premium",
    loading,
    canStartLesson,
    recordLessonStart,
    refresh: () => setTick((t) => t + 1),
  };
};
