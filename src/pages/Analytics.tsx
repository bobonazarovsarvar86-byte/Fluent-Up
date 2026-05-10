import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Sparkles, TrendingUp, Target, Brain, Flame, Trophy, Coins } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

type Insights = {
  weakest_skill?: string;
  strongest_skill?: string;
  weak_grammar_topics?: string[];
  vocab_focus?: string[];
  next_actions?: string[];
  motivation?: string;
  estimated_band?: number;
};

const Analytics = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [writings, setWritings] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: w }, { data: l }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("writing_submissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
        supabase.from("lesson_progress").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(60),
      ]);
      setProfile(p); setWritings(w ?? []); setLessons(l ?? []);
    })();
  }, [user]);

  const generateInsights = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analytics-insights");
      if (error) throw error;
      setInsights(data?.aiInsights ?? null);
    } finally { setAiLoading(false); }
  };

  // Build 7-day chart data
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = startOfDay(subDays(new Date(), 6 - i));
    const xp = lessons
      .filter(l => l.completed_at && startOfDay(new Date(l.completed_at)).getTime() === d.getTime())
      .reduce((acc, l) => acc + (l.xp_earned || 0), 0);
    return { day: format(d, "EEE"), xp };
  });

  const trend = writings.slice().reverse().slice(-10).map((w, i) => ({
    n: i + 1,
    overall: w.overall_score,
    grammar: w.grammar_score,
    vocabulary: w.vocabulary_score,
  }));

  const avg = (k: string) => {
    const xs = writings.map(w => w[k]).filter(Boolean);
    return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0;
  };

  const skillBars = [
    { skill: "Grammar", value: avg("grammar_score") },
    { skill: "Vocabulary", value: avg("vocabulary_score") },
    { skill: "Fluency", value: avg("fluency_score") },
    { skill: "Overall", value: avg("overall_score") },
  ];

  const xpForNext = (profile?.level ?? 1) * 100;
  const xpInLevel = (profile?.xp ?? 0) % 100;

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="container flex h-14 items-center gap-3 px-4">
          <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-display font-bold">Analytics</h1>
        </div>
      </header>

      <div className="container py-6 px-4 space-y-6 max-w-5xl">
        {/* Top stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Flame} label="Streak" value={profile?.streak_days ?? 0} color="text-streak bg-streak/10" />
          <StatCard icon={Trophy} label="XP" value={profile?.xp ?? 0} color="text-primary bg-primary/10" />
          <StatCard icon={Coins} label="Coins" value={profile?.coins ?? 0} color="text-warning bg-warning/10" />
          <StatCard icon={Target} label="Level" value={profile?.level ?? 1} color="text-success bg-success/10" />
        </section>

        {/* Level progress radial */}
        <section className="grid lg:grid-cols-3 gap-4">
          <div className="rounded-3xl bg-card border p-5 lg:col-span-1">
            <p className="text-xs uppercase font-semibold text-muted-foreground mb-2">Level Progress</p>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "xp", value: xpInLevel, fill: "hsl(var(--primary))" }]} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "hsl(var(--muted))" }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center font-display font-bold text-2xl -mt-4">{xpInLevel}/100 XP</p>
          </div>

          <div className="rounded-3xl bg-card border p-5 lg:col-span-2">
            <p className="text-xs uppercase font-semibold text-muted-foreground mb-3">Weekly XP activity</p>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="xp" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Skill bars */}
        <section className="rounded-3xl bg-card border p-5">
          <p className="text-xs uppercase font-semibold text-muted-foreground mb-4">Writing skills (avg)</p>
          <div className="space-y-3">
            {skillBars.map(s => (
              <div key={s.skill}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{s.skill}</span>
                  <span className="text-muted-foreground">{s.value}/100</span>
                </div>
                <Progress value={s.value} className="h-2" />
              </div>
            ))}
          </div>
        </section>

        {/* Score trend */}
        {trend.length > 1 && (
          <section className="rounded-3xl bg-card border p-5">
            <p className="text-xs uppercase font-semibold text-muted-foreground mb-3">Writing score trend</p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="n" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="overall" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="grammar" stroke="hsl(var(--success))" strokeWidth={2} />
                  <Line type="monotone" dataKey="vocabulary" stroke="hsl(var(--warning))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* AI Insights */}
        <section className="rounded-3xl gradient-primary p-6 text-primary-foreground">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-5 h-5" />
                <h3 className="font-display font-bold text-lg">AI Insights</h3>
              </div>
              <p className="text-sm opacity-90">Sun'iy intellekt zaif joylaringizni aniqlaydi va tavsiya beradi.</p>
            </div>
            <Button onClick={generateInsights} disabled={aiLoading} variant="secondary" className="bg-white text-foreground hover:bg-white/90 shrink-0">
              <Sparkles className="w-4 h-4" />
              {aiLoading ? "Tahlil..." : "Tahlil qilish"}
            </Button>
          </div>

          {insights && (
            <div className="space-y-3 text-sm">
              <div className="grid sm:grid-cols-2 gap-3">
                <Pill label="Eng zaif" value={insights.weakest_skill} />
                <Pill label="Eng kuchli" value={insights.strongest_skill} />
              </div>
              {insights.estimated_band != null && (
                <Pill label="Taxminiy IELTS Band" value={String(insights.estimated_band)} />
              )}
              {insights.weak_grammar_topics?.length ? (
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="font-semibold mb-1">Grammar zaif mavzular</p>
                  <ul className="list-disc list-inside opacity-95">{insights.weak_grammar_topics.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </div>
              ) : null}
              {insights.vocab_focus?.length ? (
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="font-semibold mb-1">Vocabulary fokus</p>
                  <div className="flex flex-wrap gap-2">{insights.vocab_focus.map((t, i) => <span key={i} className="px-2 py-1 rounded-full bg-white/20">{t}</span>)}</div>
                </div>
              ) : null}
              {insights.next_actions?.length ? (
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="font-semibold mb-1 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Keyingi qadamlar</p>
                  <ul className="list-disc list-inside opacity-95">{insights.next_actions.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </div>
              ) : null}
              {insights.motivation && (
                <p className="italic opacity-95 border-l-2 border-white/40 pl-3">"{insights.motivation}"</p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="rounded-2xl bg-card border p-4">
    <div className={`w-9 h-9 rounded-xl grid place-items-center mb-2 ${color}`}><Icon className="w-4 h-4" /></div>
    <p className="text-xs text-muted-foreground uppercase font-semibold">{label}</p>
    <p className="font-display text-xl font-bold">{value}</p>
  </div>
);
const Pill = ({ label, value }: { label: string; value?: string }) => value ? (
  <div className="flex items-center justify-between bg-white/10 rounded-2xl p-3">
    <span className="opacity-90">{label}</span>
    <span className="font-semibold capitalize">{value}</span>
  </div>
) : null;

export default Analytics;
