import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import LanguageToggle from "@/components/LanguageToggle";
import {
  Sparkles, ArrowLeft, BookOpen, CheckCircle2, Lock, Trophy, Clock,
  PenTool, BookMarked, Headphones, Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Level = "beginner" | "elementary" | "intermediate" | "upper_intermediate" | "advanced" | "proficient";
type Skill = "all" | "vocabulary" | "grammar" | "reading" | "listening" | "speaking";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  level: Level;
  order_index: number;
  xp_reward: number;
  estimated_minutes: number;
  vocabulary: any;
  grammar: any;
  reading: any;
  listening: any;
  speaking: any;
};

type Progress = {
  lesson_id: string;
  completed: boolean;
  xp_earned: number;
};

const SKILL_META: Record<Exclude<Skill, "all">, { label: string; icon: any; color: string }> = {
  vocabulary: { label: "Vocabulary", icon: BookOpen, color: "from-blue-500 to-indigo-500" },
  grammar: { label: "Grammar", icon: PenTool, color: "from-indigo-500 to-purple-500" },
  reading: { label: "Reading", icon: BookMarked, color: "from-purple-500 to-pink-500" },
  listening: { label: "Listening", icon: Headphones, color: "from-pink-500 to-rose-500" },
  speaking: { label: "Speaking", icon: Mic, color: "from-blue-500 to-purple-600" },
};

const hasSkill = (lesson: Lesson, skill: Exclude<Skill, "all">): boolean => {
  switch (skill) {
    case "vocabulary":
      return Array.isArray(lesson.vocabulary) && lesson.vocabulary.length > 0;
    case "grammar":
      return !!lesson.grammar?.title;
    case "reading":
      return !!lesson.reading?.passage;
    case "listening":
      return !!(lesson.listening?.script || lesson.listening?.audio_url);
    case "speaking":
      return !!lesson.speaking?.starter_message;
  }
};

const Lessons = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const skill = (searchParams.get("skill") as Skill) || "all";
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [userLevel, setUserLevel] = useState<string>("beginner");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: less }, { data: prog }] = await Promise.all([
        supabase.from("profiles").select("english_level").eq("id", user.id).maybeSingle(),
        supabase
          .from("lessons")
          .select("id, title, description, level, order_index, xp_reward, estimated_minutes, vocabulary, grammar, reading, listening, speaking")
          .eq("published", true)
          .order("level")
          .order("order_index"),
        supabase
          .from("lesson_progress")
          .select("lesson_id, completed, xp_earned")
          .eq("user_id", user.id),
      ]);
      setUserLevel(prof?.english_level || "beginner");
      setLessons((less as Lesson[]) ?? []);
      const map: Record<string, Progress> = {};
      (prog as Progress[] ?? []).forEach((p) => (map[p.lesson_id] = p));
      setProgress(map);
      setLoading(false);
    })();
  }, [user]);

  const myLevelLessons = useMemo(() => {
    const base = lessons.filter((l) => l.level === userLevel);
    if (skill === "all") return base;
    return base.filter((l) => hasSkill(l, skill));
  }, [lessons, userLevel, skill]);

  const completedCount = myLevelLessons.filter((l) => progress[l.id]?.completed).length;
  const firstIncompleteIndex = myLevelLessons.findIndex((l) => !progress[l.id]?.completed);

  const skillMeta = skill !== "all" ? SKILL_META[skill] : null;

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between gap-2 px-3 sm:px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </span>
            <span className="hidden sm:inline">FluentUp</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <div className="container py-6 sm:py-8 space-y-6 max-w-4xl px-3 sm:px-4">
        <section>
          {skillMeta ? (
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br grid place-items-center shadow-md", skillMeta.color)}>
                <skillMeta.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold">{skillMeta.label}</h1>
                <p className="text-sm text-muted-foreground capitalize">
                  {userLevel.replace(/_/g, " ")} · {completedCount}/{myLevelLessons.length} tugallandi
                </p>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Darsliklar</h1>
              <p className="text-muted-foreground capitalize text-sm">
                Daraja: <span className="font-semibold text-foreground">{userLevel.replace(/_/g, " ")}</span> · {completedCount}/{myLevelLessons.length} tugallandi
              </p>
            </>
          )}
        </section>

        {/* Skill chips */}
        <section className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <SkillChip to="/lessons" active={skill === "all"} label="Hammasi" />
          {(Object.keys(SKILL_META) as Exclude<Skill, "all">[]).map((s) => (
            <SkillChip key={s} to={`/lessons?skill=${s}`} active={skill === s} label={SKILL_META[s].label} />
          ))}
        </section>

        {loading && (
          <div className="text-center py-16 text-muted-foreground">Yuklanmoqda...</div>
        )}

        {!loading && myLevelLessons.length === 0 && (
          <div className="rounded-3xl bg-card border border-border p-8 sm:p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-display text-lg font-bold mb-1">Darsliklar tayyor emas</h3>
            <p className="text-sm text-muted-foreground">
              {skill === "all"
                ? "Tez orada sizning darajangiz uchun darsliklar qo'shiladi."
                : `${skillMeta?.label} bo'limida ${userLevel.replace(/_/g, " ")} uchun hozircha darslik yo'q.`}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {myLevelLessons.map((lesson, idx) => {
            const done = progress[lesson.id]?.completed;
            const locked = firstIncompleteIndex !== -1 && idx > firstIncompleteIndex;
            const href = locked
              ? "#"
              : skill === "all"
              ? `/lessons/${lesson.id}`
              : `/lessons/${lesson.id}?skill=${skill}`;
            return (
              <Link
                key={lesson.id}
                to={href}
                onClick={(e) => locked && e.preventDefault()}
                className={cn(
                  "group flex items-center gap-3 sm:gap-4 rounded-3xl bg-card border border-border p-4 sm:p-5 transition-smooth",
                  locked ? "opacity-60 cursor-not-allowed" : "hover:shadow-elegant hover:border-primary/30 active:scale-[0.99]",
                )}
              >
                <div className={cn(
                  "shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl grid place-items-center font-bold text-lg",
                  done
                    ? "bg-success/10 text-success"
                    : locked
                    ? "bg-muted text-muted-foreground"
                    : "gradient-primary text-primary-foreground shadow-glow",
                )}>
                  {done ? <CheckCircle2 className="w-6 h-6" /> : locked ? <Lock className="w-5 h-5" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold truncate text-sm sm:text-base">{lesson.title}</h3>
                  {lesson.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{lesson.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> {lesson.xp_reward} XP
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {lesson.estimated_minutes} min
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
};

const SkillChip = ({ to, active, label }: { to: string; active: boolean; label: string }) => (
  <Link
    to={to}
    className={cn(
      "shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-smooth",
      active
        ? "gradient-primary text-primary-foreground border-transparent shadow-glow"
        : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30",
    )}
  >
    {label}
  </Link>
);

export default Lessons;
