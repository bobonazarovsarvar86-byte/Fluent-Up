import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import LanguageToggle from "@/components/LanguageToggle";
import { Sparkles, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Level = "beginner" | "elementary" | "intermediate" | "upper_intermediate" | "advanced" | "proficient";
type Goal = "ielts" | "speak_fluently" | "business" | "travel" | "school_exam" | "general";
type Lang = "uz" | "en" | "ru" | "other";

const Onboarding = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [level, setLevel] = useState<Level | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [time, setTime] = useState<number>(15);
  const [native, setNative] = useState<Lang>("uz");

  const totalSteps = 4;

  const levelOptions: { v: Level; key: string; cefr: string }[] = [
    { v: "beginner", key: "onb.level.beginner", cefr: "A1" },
    { v: "elementary", key: "onb.level.elementary", cefr: "A2" },
    { v: "intermediate", key: "onb.level.intermediate", cefr: "B1" },
    { v: "upper_intermediate", key: "onb.level.upper", cefr: "B2" },
    { v: "advanced", key: "onb.level.advanced", cefr: "C1" },
    { v: "proficient", key: "onb.level.proficient", cefr: "C2" },
  ];

  const goalOptions: { v: Goal; key: string; emoji: string }[] = [
    { v: "ielts", key: "onb.goal.ielts", emoji: "🎓" },
    { v: "speak_fluently", key: "onb.goal.speak", emoji: "💬" },
    { v: "business", key: "onb.goal.business", emoji: "💼" },
    { v: "travel", key: "onb.goal.travel", emoji: "✈️" },
    { v: "school_exam", key: "onb.goal.school", emoji: "📚" },
    { v: "general", key: "onb.goal.general", emoji: "🌟" },
  ];

  const timeOptions = [5, 10, 15, 30, 60];

  const langOptions: { v: Lang; label: string; flag: string }[] = [
    { v: "uz", label: "O‘zbekcha", flag: "🇺🇿" },
    { v: "en", label: "English", flag: "🇬🇧" },
    { v: "ru", label: "Русский", flag: "🇷🇺" },
    { v: "other", label: "Other", flag: "🌍" },
  ];

  const canNext = () => {
    if (step === 0) return !!level;
    if (step === 1) return !!goal;
    if (step === 2) return !!time;
    if (step === 3) return !!native;
    return false;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        english_level: level!,
        learning_goal: goal!,
        daily_goal_minutes: time,
        native_language: native,
        onboarding_completed: true,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("All set! Let's start learning 🚀");
    navigate("/dashboard");
  };

  return (
    <main className="min-h-screen gradient-hero">
      <header className="container flex justify-between items-center h-16">
        <div className="flex items-center gap-2 font-display font-bold">
          <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </span>
          FluentUp
        </div>
        <LanguageToggle />
      </header>

      <div className="container max-w-2xl py-12">
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{t("onb.step")} {step + 1} {t("onb.of")} {totalSteps}</span>
            <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
          </div>
          <Progress value={((step + 1) / totalSteps) * 100} className="h-2" />
        </div>

        <div className="bg-card rounded-3xl border border-border shadow-elegant p-8 sm:p-10 animate-fade-up">
          <h1 className="font-display text-3xl font-bold mb-8">
            {step === 0 && t("onb.q.level")}
            {step === 1 && t("onb.q.goal")}
            {step === 2 && t("onb.q.time")}
            {step === 3 && t("onb.q.lang")}
          </h1>

          {step === 0 && (
            <div className="space-y-3">
              {levelOptions.map((o) => (
                <OptionCard
                  key={o.v}
                  selected={level === o.v}
                  onClick={() => setLevel(o.v)}
                  label={t(o.key)}
                />
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {goalOptions.map((o) => (
                <OptionCard
                  key={o.v}
                  selected={goal === o.v}
                  onClick={() => setGoal(o.v)}
                  label={t(o.key)}
                  emoji={o.emoji}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {timeOptions.map((m) => (
                <button
                  key={m}
                  onClick={() => setTime(m)}
                  className={cn(
                    "p-5 rounded-2xl border-2 transition-smooth text-center",
                    time === m
                      ? "border-primary bg-accent shadow-glow"
                      : "border-border hover:border-primary/40 bg-card",
                  )}
                >
                  <div className="font-display text-3xl font-bold">{m}</div>
                  <div className="text-xs text-muted-foreground mt-1">min</div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-3">
              {langOptions.map((o) => (
                <OptionCard
                  key={o.v}
                  selected={native === o.v}
                  onClick={() => setNative(o.v)}
                  label={o.label}
                  emoji={o.flag}
                />
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" size="lg" onClick={() => setStep(step - 1)}>
                <ArrowLeft />
                {t("onb.back")}
              </Button>
            )}
            <div className="flex-1" />
            {step < totalSteps - 1 ? (
              <Button
                variant="hero"
                size="lg"
                disabled={!canNext()}
                onClick={() => setStep(step + 1)}
              >
                {t("onb.next")}
                <ArrowRight />
              </Button>
            ) : (
              <Button variant="hero" size="lg" disabled={!canNext() || saving} onClick={handleFinish}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("onb.finish")}
                <Sparkles />
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

const OptionCard = ({
  selected,
  onClick,
  label,
  emoji,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  emoji?: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full text-left p-4 rounded-2xl border-2 transition-smooth flex items-center gap-3",
      selected
        ? "border-primary bg-accent shadow-glow"
        : "border-border hover:border-primary/40 bg-card",
    )}
  >
    {emoji && <span className="text-2xl">{emoji}</span>}
    <span className="flex-1 font-medium">{label}</span>
    {selected && (
      <span className="w-6 h-6 rounded-full gradient-primary grid place-items-center">
        <Check className="w-3.5 h-3.5 text-primary-foreground" />
      </span>
    )}
  </button>
);

export default Onboarding;
