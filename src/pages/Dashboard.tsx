import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import LanguageToggle from "@/components/LanguageToggle";
import {
  Sparkles, Flame, Trophy, Coins, BookOpen, PenTool,
  BookMarked, Headphones, Mic, MessageCircle, ArrowRight, LogOut,
  Target, Shield, Smartphone, Download, Crown, Zap,
  BarChart3, Users, ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { usePlan } from "@/hooks/usePlan";
import TodayAILessons from "@/components/TodayAILessons";
import SubscriptionStatus from "@/components/SubscriptionStatus";

type Profile = {
  display_name: string | null;
  xp: number;
  coins: number;
  level: number;
  streak_days: number;
  daily_goal_minutes: number;
  learning_goal: string | null;
  english_level: string | null;
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const { isAdmin } = useIsAdmin();
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const { plan, isPaid } = usePlan();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, xp, coins, level, streak_days, daily_goal_minutes, learning_goal, english_level")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [user]);

  const skills = [
    { key: "vocabulary", icon: BookOpen, color: "from-blue-500 to-indigo-500", to: "/lessons?skill=vocabulary", available: true },
    { key: "grammar", icon: PenTool, color: "from-indigo-500 to-purple-500", to: "/lessons?skill=grammar", available: true },
    { key: "reading", icon: BookMarked, color: "from-purple-500 to-pink-500", to: "/lessons?skill=reading", available: true },
    { key: "listening", icon: Headphones, color: "from-pink-500 to-rose-500", to: "/lessons?skill=listening", available: true },
    { key: "speaking", icon: Mic, color: "from-blue-500 to-purple-600", to: "/lessons?skill=speaking", available: true },
    { key: "writing", icon: PenTool, color: "from-emerald-500 to-teal-500", to: "/writing", available: true, labelOverride: "Writing", descOverride: "AI grammar checker & IELTS scoring" },
  ];

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const xpForNext = level * 100;
  const xpProgress = (xp % 100);

  return (
    <main className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between gap-2 px-3 sm:px-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </span>
            <span className="hidden xs:inline">FluentUp</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Stat icon={Flame} value={profile?.streak_days ?? 0} color="text-streak" />
            <Stat icon={Coins} value={profile?.coins ?? 0} color="text-warning" />
            <Stat icon={Trophy} value={profile?.xp ?? 0} color="text-primary" />
            <Link to="/pricing" aria-label="Tariflar">
              {isPaid ? (
                <Button variant="soft" size="sm" className="px-2 sm:px-3 gap-1">
                  <Crown className="w-4 h-4 text-warning" />
                  <span className="hidden sm:inline capitalize">{plan}</span>
                </Button>
              ) : (
                <Button variant="hero" size="sm" className="px-2 sm:px-3 gap-1">
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Upgrade</span>
                </Button>
              )}
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="soft" size="sm" className="px-2 sm:px-3">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
            )}
            <LanguageToggle />
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Log out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 sm:py-8 space-y-6 px-3 sm:px-4">
        {/* Welcome */}
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative overflow-hidden rounded-3xl gradient-primary p-6 sm:p-8 text-primary-foreground">
            <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10" />
            <div className="absolute right-12 top-8 w-20 h-20 rounded-full bg-white/10" />
            <div className="relative">
              <p className="opacity-90 text-sm">{t("dash.welcome")},</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
                {profile?.display_name || "Learner"} 👋
              </h1>
              <p className="opacity-90 mb-6 max-w-md">
                Your AI tutor is ready. Let's hit your daily goal of {profile?.daily_goal_minutes ?? 15} minutes.
              </p>
              <Link to="/lessons">
                <Button variant="secondary" size="lg" className="bg-white text-foreground hover:bg-white/90">
                  {t("dash.continue")}
                  <ArrowRight />
                </Button>
              </Link>
            </div>
          </div>

          {/* Level card */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  {t("dash.level")}
                </p>
                <p className="font-display text-4xl font-bold text-gradient">{level}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl gradient-primary grid place-items-center shadow-glow">
                <Trophy className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <Progress value={(xpProgress / 100) * 100} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {xpProgress} / 100 XP to level {level + 1}
            </p>
          </div>
        </section>

        {/* Quick stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BigStat icon={Flame} label={t("dash.streak")} value={profile?.streak_days ?? 0} color="bg-streak/10 text-streak" />
          <BigStat icon={Trophy} label={t("dash.xp")} value={profile?.xp ?? 0} color="bg-primary/10 text-primary" />
          <BigStat icon={Coins} label={t("dash.coins")} value={profile?.coins ?? 0} color="bg-warning/10 text-warning" />
          <BigStat icon={Target} label={t("dash.weeklyGoal")} value={`0/${(profile?.daily_goal_minutes ?? 15) * 7}m`} color="bg-success/10 text-success" />
        </section>

        {/* Gamification quick links */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickLink to="/analytics" icon={BarChart3} label="Analitika" gradient="from-blue-500 to-indigo-600" />
          <QuickLink to="/shop" icon={ShoppingBag} label="Do'kon" gradient="from-amber-500 to-orange-600" />
          <QuickLink to="/friends" icon={Users} label="Do'stlar" gradient="from-pink-500 to-rose-600" />
          <QuickLink to="/leaderboard" icon={Trophy} label="Reyting" gradient="from-purple-500 to-fuchsia-600" />
        </section>

        <SubscriptionStatus />

        {/* Install PWA banner — only if not already installed */}
        {!isInstalled && (
          <section className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl gradient-primary grid place-items-center shadow-glow shrink-0">
              <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base sm:text-lg font-bold">
                Telefoningizga ilova qilib o'rnating 📱
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Brauzersiz, tezroq, bir bosishda. App Store kerak emas — bepul.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {canInstall && (
                <Button onClick={promptInstall} variant="hero" size="sm" className="flex-1 sm:flex-none">
                  <Download className="w-4 h-4" />
                  O'rnatish
                </Button>
              )}
              <Link to="/install" className="flex-1 sm:flex-none">
                <Button variant="outline" size="sm" className="w-full">
                  Yo'riqnoma
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* Skills grid */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-4">{t("dash.skills")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((s) => {
              const card = (
                <div
                  className={cn(
                    "group rounded-3xl bg-card border border-border p-6 hover:shadow-elegant transition-smooth relative overflow-hidden h-full",
                    !s.available && "opacity-70"
                  )}
                >
                  <div className={cn(
                    "absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-smooth",
                    s.color,
                  )} />
                  <div className={cn("relative w-12 h-12 rounded-2xl bg-gradient-to-br grid place-items-center mb-4 shadow-md", s.color)}>
                    <s.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-1">
                    {(s as any).labelOverride ?? t(`dash.${s.key}`)}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {(s as any).descOverride ?? (s.available ? "Boshlash uchun bosing" : t("dash.comingSoon"))}
                  </p>
                  <Button variant="soft" size="sm" disabled={!s.available}>
                    {s.available ? t("dash.start") : t("dash.comingSoon")}
                    {s.available && <ArrowRight className="w-3 h-3" />}
                  </Button>
                </div>
              );
              return s.available ? (
                <Link to={s.to} key={s.key}>{card}</Link>
              ) : (
                <div key={s.key}>{card}</div>
              );
            })}

            {/* AI Tutor card */}
            <Link to="/tutor" className="group rounded-3xl gradient-primary p-6 text-primary-foreground hover:shadow-glow transition-smooth relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10" />
              <div className="relative w-12 h-12 rounded-2xl bg-white/20 backdrop-blur grid place-items-center mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold mb-1">
                {t("dash.aiTutor")}
              </h3>
              <p className="text-sm opacity-90 mb-4">
                Ask anything in English or Uzbek
              </p>
              <Button variant="secondary" size="sm" className="bg-white text-foreground hover:bg-white/90">
                Suhbatni boshlash
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Today's AI-generated lessons */}
        {profile?.english_level && <TodayAILessons level={profile.english_level} />}
      </div>
    </main>
  );
};

const Stat = ({ icon: Icon, value, color }: { icon: any; value: number; color: string }) => (
  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
    <Icon className={cn("w-4 h-4", color)} />
    <span className="font-bold text-sm">{value}</span>
  </div>
);

const BigStat = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) => (
  <div className="rounded-3xl bg-card border border-border p-5">
    <div className={cn("w-10 h-10 rounded-xl grid place-items-center mb-3", color)}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-xs text-muted-foreground uppercase font-semibold">{label}</p>
    <p className="font-display text-2xl font-bold">{value}</p>
  </div>
);

const QuickLink = ({ to, icon: Icon, label, gradient }: { to: string; icon: any; label: string; gradient: string }) => (
  <Link to={to} className={cn("group rounded-2xl p-4 text-white bg-gradient-to-br hover:shadow-glow transition-smooth flex flex-col items-start gap-2", gradient)}>
    <Icon className="w-5 h-5" />
    <span className="font-semibold text-sm">{label}</span>
  </Link>
);

export default Dashboard;
