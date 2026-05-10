import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, BookOpen, PenTool, BookMarked, Headphones, Mic, PencilLine, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type DailyLesson = {
  id: string;
  skill: string;
  title: string;
  topic: string;
  level: string;
};

const SKILL_META: Record<string, { icon: any; color: string; label: string }> = {
  vocabulary: { icon: BookOpen, color: "from-blue-500 to-indigo-500", label: "Lug'at" },
  grammar: { icon: PenTool, color: "from-indigo-500 to-purple-500", label: "Grammatika" },
  reading: { icon: BookMarked, color: "from-purple-500 to-pink-500", label: "O'qish" },
  listening: { icon: Headphones, color: "from-pink-500 to-rose-500", label: "Tinglash" },
  speaking: { icon: Mic, color: "from-blue-500 to-purple-600", label: "Gapirish" },
  writing: { icon: PencilLine, color: "from-emerald-500 to-teal-500", label: "Yozish" },
};

interface Props {
  level: string;
}

const TodayAILessons = ({ level }: Props) => {
  const [lessons, setLessons] = useState<DailyLesson[] | null>(null);

  useEffect(() => {
    if (!level) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("daily_lessons")
      .select("id, skill, title, topic, level")
      .eq("level", level as any)
      .eq("for_date", today)
      .then(({ data }) => setLessons((data as DailyLesson[]) ?? []));
  }, [level]);

  if (lessons === null) {
    return (
      <section className="rounded-3xl bg-card border border-border p-5 sm:p-6">
        <div className="h-6 w-40 bg-muted rounded animate-pulse mb-4" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (lessons.length === 0) {
    return (
      <section className="rounded-3xl bg-card border border-border p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg sm:text-xl font-bold">Bugungi AI darslari</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Bugungi darslar tunda avtomatik tayyorlanadi. Ertaga ertalab tayyor bo'ladi! ✨
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-card border border-border p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg sm:text-xl font-bold">Bugungi AI darslari</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long" })}
        </span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {lessons.map((l) => {
          const meta = SKILL_META[l.skill] ?? SKILL_META.vocabulary;
          const Icon = meta.icon;
          return (
            <Link
              key={l.id}
              to={`/daily/${l.id}`}
              className="group rounded-2xl border border-border bg-background p-4 hover:shadow-elegant hover:border-primary/30 transition-smooth"
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br grid place-items-center shrink-0 shadow-md", meta.color)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wide">
                    {meta.label}
                  </p>
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {l.title}
                  </h3>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default TodayAILessons;
