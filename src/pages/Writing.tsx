import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, PenLine, Sparkles, CheckCircle2, AlertCircle,
  Trophy, BookOpen, Lightbulb, Loader2, History, Target, Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlan } from "@/hooks/usePlan";

type Mistake = { original: string; correction: string; explanation: string };
type Submission = {
  id: string;
  exercise_type: string;
  level: string;
  prompt: string | null;
  text: string;
  corrected_text: string | null;
  grammar_score: number;
  vocabulary_score: number;
  fluency_score: number;
  overall_score: number;
  ielts_band: number | null;
  mistakes: Mistake[];
  suggestions: string[];
  feedback: string | null;
  word_count: number;
  xp_earned: number;
  created_at: string;
};

const EXERCISES = [
  { id: "sentence", label: "Sentence", desc: "Practice individual sentences", icon: PenLine },
  { id: "essay", label: "Essay", desc: "Multi-paragraph essay", icon: BookOpen },
  { id: "story", label: "Story", desc: "Creative storytelling", icon: Sparkles },
  { id: "ielts_task1", label: "IELTS Task 1", desc: "Graphs / letters", icon: Target },
  { id: "ielts_task2", label: "IELTS Task 2", desc: "Opinion essay", icon: Target },
  { id: "journal", label: "Journal", desc: "Daily diary entry", icon: PenLine },
  { id: "grammar_fix", label: "Grammar Fix", desc: "Correct given text", icon: CheckCircle2 },
];

const LEVELS = [
  { id: "beginner", label: "A1" },
  { id: "elementary", label: "A2" },
  { id: "intermediate", label: "B1" },
  { id: "upper_intermediate", label: "B2" },
  { id: "advanced", label: "C1" },
  { id: "proficient", label: "C2" },
];

const PROMPTS: Record<string, string[]> = {
  sentence: [
    "Write 5 sentences about your morning routine.",
    "Describe your favorite place using adjectives.",
  ],
  essay: [
    "The advantages and disadvantages of social media.",
    "Why learning English is important in 2026.",
  ],
  story: [
    "Write a short story that begins: 'I opened the door and...'",
    "Tell a story about an unexpected friendship.",
  ],
  ielts_task1: [
    "The chart shows the percentage of households with internet access in 4 countries from 2010 to 2020. Summarize the information.",
  ],
  ielts_task2: [
    "Some people think technology makes life easier; others think it makes life more stressful. Discuss both views and give your opinion.",
  ],
  journal: ["Write about your day today."],
  grammar_fix: [
    "Rewrite correctly: 'He don't likes go to school because is boring and he prefer plays football with friends in park yesterday.'",
  ],
};

export default function Writing() {
  const { user } = useAuth();
  const { isPaid, plan } = usePlan();
  const [exercise, setExercise] = useState("sentence");
  const [level, setLevel] = useState("intermediate");
  const [prompt, setPrompt] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Submission | null>(null);
  const [history, setHistory] = useState<Submission[]>([]);
  const [tab, setTab] = useState("write");

  const wordCount = useMemo(
    () => (text.trim() ? text.trim().split(/\s+/).length : 0),
    [text]
  );

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("writing_submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data as any) ?? []);
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const avg = (key: keyof Submission) =>
      Math.round(
        (history.reduce((s, h) => s + (h[key] as number), 0) / history.length) * 10
      ) / 10;
    return {
      count: history.length,
      avgOverall: avg("overall_score"),
      avgGrammar: avg("grammar_score"),
      avgVocab: avg("vocabulary_score"),
      avgFluency: avg("fluency_score"),
      totalXP: history.reduce((s, h) => s + h.xp_earned, 0),
      totalWords: history.reduce((s, h) => s + h.word_count, 0),
    };
  }, [history]);

  const submit = async () => {
    if (!user) return;
    if (text.trim().length < 5) {
      toast({ title: "Please write more", description: "At least a few words." });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("check-writing", {
        body: { text, exercise_type: exercise, level, prompt },
      });
      if (error) {
        const ctx = (error as any).context;
        let msg = error.message;
        try {
          const parsed = ctx ? await ctx.json() : null;
          if (parsed?.error === "daily_limit") {
            toast({
              title: "Kunlik chegara tugadi",
              description: "Bepul reja: kuniga 3 ta yozma tekshiruv. Pro / Premium uchun Tariflar bo'limini ko'ring.",
              variant: "destructive",
            });
            setSubmitting(false);
            return;
          }
          if (parsed?.error) msg = parsed.error;
        } catch {}
        throw new Error(msg);
      }
      setResult(data.submission);
      setTab("write");
      loadHistory();
      toast({ title: "Done!", description: `+${data.submission.xp_earned} XP` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between px-3 sm:px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <PenLine className="w-3 h-3" /> Writing
            </Badge>
            {!isPaid && (
              <Link to="/pricing">
                <Button size="sm" variant="hero" className="gap-1">
                  <Crown className="w-4 h-4" /> Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container py-6 px-3 sm:px-4 space-y-6 max-w-5xl">
        <div className="rounded-3xl gradient-primary p-6 sm:p-8 text-primary-foreground relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10" />
          <div className="relative">
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
              Writing Practice ✍️
            </h1>
            <p className="opacity-90 max-w-md">
              Improve your English writing from A1 to C2 with instant AI feedback,
              corrections and IELTS scoring.
            </p>
            {!isPaid && (
              <p className="text-xs mt-3 opacity-80">
                Free plan: 3 checks per day. Upgrade for unlimited.
              </p>
            )}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 max-w-sm">
            <TabsTrigger value="write" className="gap-2">
              <PenLine className="w-4 h-4" /> Write
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="write" className="space-y-6 mt-6">
            {/* Exercise picker */}
            <Card className="p-5 space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">Exercise type</p>
                <div className="flex flex-wrap gap-2">
                  {EXERCISES.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setExercise(e.id);
                        setPrompt("");
                      }}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-sm flex items-center gap-2 transition-smooth",
                        exercise === e.id
                          ? "bg-primary text-primary-foreground border-primary shadow-glow"
                          : "bg-card hover:bg-muted border-border"
                      )}
                    >
                      <e.icon className="w-3.5 h-3.5" />
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Level</p>
                <div className="flex flex-wrap gap-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLevel(l.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-sm font-semibold transition-smooth",
                        level === l.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card hover:bg-muted border-border"
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              {PROMPTS[exercise] && (
                <div>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-warning" /> Prompt ideas
                  </p>
                  <div className="space-y-1.5">
                    {PROMPTS[exercise].map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(p)}
                        className="text-left text-xs sm:text-sm p-2 rounded-lg bg-muted hover:bg-muted/70 w-full transition-smooth"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Custom prompt or topic (optional)"
              />
            </Card>

            {/* Editor */}
            <Card className="p-5 space-y-3">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Start writing here..."
                className="min-h-[260px] text-base leading-relaxed font-serif"
                maxLength={8000}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {wordCount} words · {text.length}/8000 chars
                </div>
                <Button
                  onClick={submit}
                  disabled={submitting || text.trim().length < 5}
                  variant="hero"
                  size="lg"
                  className="gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Checking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Check with AI
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {result && <ResultView submission={result} />}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-6">
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Submissions" value={stats.count} />
                <StatCard label="Avg overall" value={`${stats.avgOverall}/10`} />
                <StatCard label="Total words" value={stats.totalWords} />
                <StatCard label="XP earned" value={stats.totalXP} />
              </div>
            )}
            {history.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No submissions yet. Start writing!
              </Card>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <Card key={h.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{h.exercise_type}</Badge>
                        <Badge variant="outline">{h.level}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(h.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        <Trophy className="w-4 h-4 text-primary" />
                        {h.overall_score}/10
                        {h.ielts_band ? ` · IELTS ${h.ielts_band}` : ""}
                      </div>
                    </div>
                    <p className="text-sm line-clamp-2 text-muted-foreground">{h.text}</p>
                    <button
                      onClick={() => {
                        setResult(h);
                        setTab("write");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-xs text-primary mt-2 hover:underline"
                    >
                      View feedback →
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground uppercase font-semibold">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
    </Card>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground">{value}/10</span>
      </div>
      <Progress value={value * 10} className="h-2" />
    </div>
  );
}

function ResultView({ submission }: { submission: Submission }) {
  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> Your Score
          </h3>
          <div className="text-right">
            <div className="font-display text-3xl font-bold text-gradient">
              {submission.overall_score}/10
            </div>
            {submission.ielts_band && (
              <Badge variant="secondary">IELTS Band {submission.ielts_band}</Badge>
            )}
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <ScoreBar label="Grammar" value={submission.grammar_score} />
          <ScoreBar label="Vocabulary" value={submission.vocabulary_score} />
          <ScoreBar label="Fluency" value={submission.fluency_score} />
        </div>
        {submission.feedback && (
          <p className="mt-4 text-sm bg-muted/50 p-3 rounded-xl">{submission.feedback}</p>
        )}
      </Card>

      {submission.corrected_text && (
        <Card className="p-5">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" /> Corrected version
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap font-serif">
            {submission.corrected_text}
          </p>
        </Card>
      )}

      {submission.mistakes?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" /> Mistakes ({submission.mistakes.length})
          </h3>
          <div className="space-y-3">
            {submission.mistakes.map((m, i) => (
              <div key={i} className="border-l-2 border-destructive pl-3">
                <p className="text-sm">
                  <span className="line-through text-destructive/80">{m.original}</span>
                  {" → "}
                  <span className="text-success font-semibold">{m.correction}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{m.explanation}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {submission.suggestions?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-warning" /> Better vocabulary & alternatives
          </h3>
          <ul className="space-y-1.5">
            {submission.suggestions.map((s, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-primary">•</span>
                {s}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
