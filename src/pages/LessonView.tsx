import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, ArrowLeft, BookOpen, Trophy, CheckCircle2, Volume2,
  Headphones, MessageSquare, GraduationCap, Mic, Send, Loader2, Play, Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePlan, PLAN_LIMITS } from "@/hooks/usePlan";
import UpgradeDialog from "@/components/UpgradeDialog";
import { Lock, Crown } from "lucide-react";

type VocabItem = {
  word: string;
  translation: string;
  part_of_speech: string;
  example: string;
  example_translation: string;
};

type Grammar = {
  title: string;
  explanation_uz: string;
  examples: { english: string; uzbek: string }[];
};

type MCQ = { question: string; options: string[]; correct_index: number };

type Reading = {
  title?: string;
  passage?: string;
  translation_uz?: string;
  questions?: MCQ[];
};

type Listening = {
  title?: string;
  script?: string;
  translation_uz?: string;
  audio_url?: string;
  questions?: MCQ[];
};

type Speaking = {
  title?: string;
  scenario_uz?: string;
  ai_role?: string;
  starter_message?: string;
  sample_phrases?: { english: string; uzbek: string }[];
};

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  level: string;
  vocabulary: VocabItem[];
  grammar: Grammar;
  reading: Reading;
  listening: Listening;
  speaking: Speaking;
  xp_reward: number;
};

const playBase64Mp3 = (b64: string) => {
  const audio = new Audio(`data:audio/mpeg;base64,${b64}`);
  audio.play().catch((e) => console.warn(e));
  return audio;
};

const speakBrowser = (text: string) => {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
};

const speakAI = async (text: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("tts", { body: { text } });
    if (error) throw error;
    if (data?.audioContent) {
      playBase64Mp3(data.audioContent);
      return;
    }
  } catch (e) {
    console.warn("AI TTS failed, fallback:", e);
  }
  speakBrowser(text);
};

const SKILL_TO_TAB: Record<string, string> = {
  vocabulary: "vocab",
  grammar: "grammar",
  reading: "reading",
  listening: "listening",
  speaking: "speaking",
};

// Map db enum levels -> CEFR codes used by PLAN_LIMITS
const LEVEL_TO_CEFR: Record<string, string> = {
  beginner: "A1",
  elementary: "A2",
  intermediate: "B1",
  upper_intermediate: "B2",
  advanced: "C1",
  proficient: "C2",
};

const LessonView = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const skillParam = searchParams.get("skill") || "";
  const focusedTab = SKILL_TO_TAB[skillParam] || null;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plan, canStartLesson, recordLessonStart } = usePlan();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [tab, setTab] = useState(focusedTab || "vocab");
  const [completing, setCompleting] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"daily_limit" | "level_locked" | "speaking_locked" | "listening_locked">("daily_limit");
  const [accessChecked, setAccessChecked] = useState(false);
  const planLimits = PLAN_LIMITS[plan];

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data } = await supabase
        .from("lessons")
        .select("id, title, description, level, vocabulary, grammar, reading, listening, speaking, xp_reward")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        const v = Array.isArray(data.vocabulary) ? (data.vocabulary as unknown as VocabItem[]) : [];
        const g = (data.grammar as unknown as Grammar) ?? { title: "", explanation_uz: "", examples: [] };
        const r = (data.reading as unknown as Reading) ?? {};
        const l = (data.listening as unknown as Listening) ?? {};
        const s = (data.speaking as unknown as Speaking) ?? {};
        setLesson({ ...data, vocabulary: v, grammar: g, reading: r, listening: l, speaking: s } as Lesson);
      }
      const { data: prog } = await supabase
        .from("lesson_progress")
        .select("completed")
        .eq("user_id", user.id)
        .eq("lesson_id", id)
        .maybeSingle();
      const done = !!prog?.completed;
      setAlreadyDone(done);

      // Plan-based access checks (only for first-time entry)
      if (!done && data) {
        const cefr = LEVEL_TO_CEFR[(data as any).level] ?? "A1";
        // Level lock
        if (!planLimits.levels.includes(cefr)) {
          setUpgradeReason("level_locked");
          setUpgradeOpen(true);
          setAccessChecked(true);
          return;
        }
        // Daily limit
        const gate = await canStartLesson();
        if (!gate.allowed) {
          setUpgradeReason("daily_limit");
          setUpgradeOpen(true);
          setAccessChecked(true);
          return;
        }
        await recordLessonStart();
      }
      setAccessChecked(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, plan]);

  const completeLesson = async () => {
    if (!user || !lesson) return;
    setCompleting(true);
    try {
      const { error: progErr } = await supabase
        .from("lesson_progress")
        .upsert(
          {
            user_id: user.id,
            lesson_id: lesson.id,
            completed: true,
            score: 100,
            xp_earned: alreadyDone ? 0 : lesson.xp_reward,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" },
        );
      if (progErr) throw progErr;

      if (!alreadyDone) {
        const { data: prof } = await supabase
          .from("profiles").select("xp, coins, level").eq("id", user.id).maybeSingle();
        if (prof) {
          const newXp = (prof.xp ?? 0) + lesson.xp_reward;
          const newLevel = Math.max(1, Math.floor(newXp / 100) + 1);
          const newCoins = (prof.coins ?? 0) + 5;
          await supabase
            .from("profiles")
            .update({
              xp: newXp, coins: newCoins, level: newLevel,
              last_active_date: new Date().toISOString().slice(0, 10),
            })
            .eq("id", user.id);
        }
        toast.success(`+${lesson.xp_reward} XP! Ajoyib! 🎉`);
        setAlreadyDone(true);
      } else {
        toast.success("Yakunlandi 👍");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Xato");
    } finally {
      setCompleting(false);
    }
  };

  if (!lesson) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const hasVocab = lesson.vocabulary.length > 0;
  const hasGrammar = !!lesson.grammar?.title;
  const hasReading = !!lesson.reading?.passage;
  const hasListening = !!(lesson.listening?.script || lesson.listening?.audio_url);
  const hasSpeaking = !!lesson.speaking?.starter_message;

  return (
    <main className="min-h-screen bg-muted/30 pb-24">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between gap-2 px-3 sm:px-4">
          <Link to="/lessons" className="flex items-center gap-2 font-display font-bold">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </span>
            <span className="hidden sm:inline">FluentUp</span>
          </Link>
          <Link to="/lessons">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Darsliklar</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-4 sm:py-8 max-w-3xl space-y-4 px-3 sm:px-4">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground capitalize">{lesson.level.replace(/_/g, " ")}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">{lesson.title}</h1>
          {lesson.description && <p className="text-sm sm:text-base text-muted-foreground mt-1">{lesson.description}</p>}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          {!focusedTab && (
            <TabsList className="w-full overflow-x-auto justify-start sm:justify-center h-auto p-1 gap-1 bg-card border border-border">
              <TabTrigger value="vocab" icon={<BookOpen className="w-4 h-4" />} label="Vocab" disabled={!hasVocab} />
              <TabTrigger value="grammar" icon={<GraduationCap className="w-4 h-4" />} label="Grammar" disabled={!hasGrammar} />
              <TabTrigger value="reading" icon={<BookOpen className="w-4 h-4" />} label="Reading" disabled={!hasReading} />
              <TabTrigger value="listening" icon={<Headphones className="w-4 h-4" />} label="Listening" disabled={!hasListening} />
              <TabTrigger value="speaking" icon={<MessageSquare className="w-4 h-4" />} label="Speaking" disabled={!hasSpeaking} />
            </TabsList>
          )}

          <TabsContent value="vocab" className="mt-4">
            <VocabSection items={lesson.vocabulary} />
          </TabsContent>
          <TabsContent value="grammar" className="mt-4">
            <GrammarSection grammar={lesson.grammar} />
          </TabsContent>
          <TabsContent value="reading" className="mt-4">
            <ReadingSection data={lesson.reading} />
          </TabsContent>
          <TabsContent value="listening" className="mt-4">
            {planLimits.aiListening ? (
              <ListeningSection data={lesson.listening} />
            ) : (
              <PremiumLock
                title="Listening — Pro xususiyati"
                description="AI generatsiyalangan audio darslar Pro rejasidan boshlab ochiladi."
              />
            )}
          </TabsContent>
          <TabsContent value="speaking" className="mt-4">
            {planLimits.aiSpeaking ? (
              <SpeakingSection data={lesson.speaking} level={lesson.level} />
            ) : (
              <PremiumLock
                title="Speaking — Pro xususiyati"
                description="AI bilan ovozli suhbat qurish Pro rejasidan boshlab ochiladi."
              />
            )}
          </TabsContent>
        </Tabs>

        <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} reason={upgradeReason} />

        {/* Complete bar */}
        <div className="rounded-3xl bg-card border border-border p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="font-display font-bold flex items-center gap-2 justify-center sm:justify-start">
              <Trophy className="w-5 h-5 text-primary" />
              {alreadyDone ? "Yakunlangan" : `${lesson.xp_reward} XP olish`}
            </p>
            <p className="text-xs text-muted-foreground">Hamma bo'limlarni ko'rib, tugatish tugmasini bosing</p>
          </div>
          <Button onClick={completeLesson} disabled={completing} variant="hero" size="lg" className="w-full sm:w-auto">
            {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {alreadyDone ? "Qayta yakunlash" : "Darslikni yakunlash"}
          </Button>
        </div>
      </div>
    </main>
  );
};

const TabTrigger = ({ value, icon, label, disabled }: { value: string; icon: React.ReactNode; label: string; disabled?: boolean }) => (
  <TabsTrigger
    value={value}
    disabled={disabled}
    className="flex-1 min-w-[80px] data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow gap-1.5 text-xs sm:text-sm"
  >
    {icon}
    <span className="hidden xs:inline sm:inline">{label}</span>
  </TabsTrigger>
);

/* -------- Vocabulary -------- */
const VocabSection = ({ items }: { items: VocabItem[] }) => {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  if (items.length === 0) return <Empty label="Vocabulary mavjud emas" />;
  const v = items[idx];
  return (
    <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase font-bold text-primary tracking-wider">
          So'z {idx + 1}/{items.length}
        </span>
        <span className="text-xs text-muted-foreground">{v.part_of_speech}</span>
      </div>
      <div className="text-center py-6">
        <h2 className="font-display text-4xl sm:text-5xl font-bold mb-3">{v.word}</h2>
        <button onClick={() => speakAI(v.word)} className="text-primary hover:scale-110 transition-transform" aria-label="Talaffuz">
          <Volume2 className="w-6 h-6 mx-auto" />
        </button>
        {revealed ? (
          <div className="mt-6 space-y-4 animate-fade-in">
            <p className="text-xl sm:text-2xl font-semibold text-primary">{v.translation}</p>
            <div className="rounded-2xl bg-muted p-4 text-left">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium flex-1">{v.example}</p>
                <button onClick={() => speakAI(v.example)} className="text-primary shrink-0"><Volume2 className="w-4 h-4" /></button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{v.example_translation}</p>
            </div>
          </div>
        ) : (
          <Button variant="soft" className="mt-6" onClick={() => setRevealed(true)}>Tarjimani ko'rsatish</Button>
        )}
      </div>
      <div className="flex justify-between gap-2 mt-6">
        <Button variant="outline" disabled={idx === 0} onClick={() => { setIdx(i => i - 1); setRevealed(false); }}>
          <ArrowLeft className="w-4 h-4" /> Oldingi
        </Button>
        <Button disabled={idx === items.length - 1} onClick={() => { setIdx(i => i + 1); setRevealed(false); }}>
          Keyingi
        </Button>
      </div>
    </div>
  );
};

/* -------- Grammar -------- */
const GrammarSection = ({ grammar }: { grammar: Grammar }) => {
  if (!grammar?.title) return <Empty label="Grammar mavjud emas" />;
  return (
    <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm space-y-4">
      <span className="text-xs uppercase font-bold text-primary tracking-wider">📘 Grammar</span>
      <h2 className="font-display text-xl sm:text-2xl font-bold">{grammar.title}</h2>
      <p className="text-muted-foreground whitespace-pre-line">{grammar.explanation_uz}</p>
      <div className="space-y-2">
        <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Misollar</h3>
        {grammar.examples?.map((ex, i) => (
          <div key={i} className="rounded-2xl bg-muted p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium flex-1">{ex.english}</p>
              <button onClick={() => speakAI(ex.english)} className="text-primary shrink-0"><Volume2 className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{ex.uzbek}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* -------- Reading -------- */
const ReadingSection = ({ data }: { data: Reading }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  if (!data?.passage) return <Empty label="Reading mavjud emas" />;
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm space-y-3">
        <span className="text-xs uppercase font-bold text-primary tracking-wider">📖 Reading</span>
        {data.title && <h2 className="font-display text-xl sm:text-2xl font-bold">{data.title}</h2>}
        <p className="leading-relaxed whitespace-pre-line">{data.passage}</p>
        <Button variant="soft" size="sm" onClick={() => setShowTranslation(s => !s)}>
          {showTranslation ? "Tarjimani yashirish" : "Tarjimani ko'rsatish"}
        </Button>
        {showTranslation && data.translation_uz && (
          <p className="text-sm text-muted-foreground italic border-l-4 border-primary/30 pl-3 whitespace-pre-line">
            {data.translation_uz}
          </p>
        )}
      </div>
      {data.questions && data.questions.length > 0 && (
        <Quiz questions={data.questions} answers={answers} setAnswers={setAnswers} />
      )}
    </div>
  );
};

/* -------- Listening -------- */
const ListeningSection = ({ data }: { data: Listening }) => {
  const [showScript, setShowScript] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [fallbackB64, setFallbackB64] = useState<string | null>(null);

  const togglePlay = async () => {
    if (data.audio_url) {
      if (!audioRef.current) {
        audioRef.current = new Audio(data.audio_url);
        audioRef.current.onended = () => setPlaying(false);
      }
      if (playing) { audioRef.current.pause(); setPlaying(false); }
      else { await audioRef.current.play(); setPlaying(true); }
      return;
    }
    // No prebuilt audio: generate on-demand TTS once
    if (!fallbackB64 && data.script) {
      setGeneratingAudio(true);
      try {
        const { data: r, error } = await supabase.functions.invoke("tts", { body: { text: data.script } });
        if (error) throw error;
        setFallbackB64(r?.audioContent ?? null);
        const a = new Audio(`data:audio/mpeg;base64,${r.audioContent}`);
        audioRef.current = a;
        a.onended = () => setPlaying(false);
        await a.play();
        setPlaying(true);
      } catch (e: any) {
        toast.error("Audio yaratib bo'lmadi");
      } finally { setGeneratingAudio(false); }
      return;
    }
    if (audioRef.current) {
      if (playing) { audioRef.current.pause(); setPlaying(false); }
      else { await audioRef.current.play(); setPlaying(true); }
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm space-y-3">
        <span className="text-xs uppercase font-bold text-primary tracking-wider">🎧 Listening</span>
        {data.title && <h2 className="font-display text-xl sm:text-2xl font-bold">{data.title}</h2>}
        <Button onClick={togglePlay} disabled={generatingAudio} variant="hero" size="lg" className="w-full sm:w-auto">
          {generatingAudio ? <Loader2 className="w-5 h-5 animate-spin" /> : playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {generatingAudio ? "Audio tayyorlanmoqda..." : playing ? "To'xtatish" : "Audioni tinglash"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowScript(s => !s)}>
          {showScript ? "Skriptni yashirish" : "Skriptni ko'rsatish"}
        </Button>
        {showScript && (
          <div className="space-y-2">
            <p className="leading-relaxed whitespace-pre-line">{data.script}</p>
            {data.translation_uz && (
              <p className="text-sm text-muted-foreground italic border-l-4 border-primary/30 pl-3">{data.translation_uz}</p>
            )}
          </div>
        )}
      </div>
      {data.questions && data.questions.length > 0 && (
        <Quiz questions={data.questions} answers={answers} setAnswers={setAnswers} />
      )}
    </div>
  );
};

/* -------- Speaking -------- */
type ChatMsg = { role: "user" | "assistant"; content: string };

const SpeakingSection = ({ data, level }: { data: Speaking; level: string }) => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data.starter_message && messages.length === 0) {
      setMessages([{ role: "assistant", content: data.starter_message }]);
      // auto-speak the opener (best effort, ignore errors)
      speakAI(data.starter_message).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.starter_message]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data: r, error } = await supabase.functions.invoke("speaking-chat", {
        body: {
          messages: next,
          scenario: data.scenario_uz,
          ai_role: data.ai_role,
          level,
          speak: true,
        },
      });
      if (error) throw error;
      const reply = r?.reply ?? "...";
      setMessages([...next, { role: "assistant", content: reply }]);
      if (r?.audioContent) playBase64Mp3(r.audioContent);
      else speakBrowser(reply);
    } catch (e: any) {
      toast.error(e.message ?? "AI bilan xato");
    } finally { setLoading(false); }
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Brauzeringiz ovozli kiritishni qo'llab-quvvatlamaydi. Chrome ishlating.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev: any) => {
      const transcript = ev.results[0][0].transcript;
      setInput(transcript);
      send(transcript);
    };
    rec.onerror = () => { setRecording(false); toast.error("Mikrofon xatosi"); };
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };
  const stopVoice = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  if (!data?.starter_message) return <Empty label="Speaking mavjud emas" />;

  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-card border border-border p-4 sm:p-6 shadow-sm">
        <span className="text-xs uppercase font-bold text-primary tracking-wider">💬 Speaking · {data.ai_role}</span>
        {data.title && <h2 className="font-display text-lg sm:text-xl font-bold mt-1">{data.title}</h2>}
        {data.scenario_uz && <p className="text-sm text-muted-foreground mt-1">{data.scenario_uz}</p>}
      </div>

      <div ref={scrollRef} className="rounded-3xl bg-card border border-border p-3 sm:p-4 h-[50vh] overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
              m.role === "user" ? "gradient-primary text-primary-foreground" : "bg-muted",
            )}>
              {m.content}
              {m.role === "assistant" && (
                <button onClick={() => speakAI(m.content)} className="ml-2 opacity-70 hover:opacity-100">
                  <Volume2 className="w-3 h-3 inline" />
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="bg-muted rounded-2xl px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> AI yozmoqda...
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex gap-2 items-stretch"
      >
        <Button
          type="button"
          variant={recording ? "destructive" : "outline"}
          size="icon"
          onClick={recording ? stopVoice : startVoice}
          aria-label="Mikrofon"
        >
          <Mic className={cn("w-4 h-4", recording && "animate-pulse")} />
        </Button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Inglizcha yozing yoki mikrofonni bosing..."
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {data.sample_phrases && data.sample_phrases.length > 0 && (
        <details className="rounded-2xl bg-card border border-border p-4">
          <summary className="font-semibold text-sm cursor-pointer">💡 Foydali iboralar</summary>
          <div className="mt-3 space-y-2">
            {data.sample_phrases.map((p, i) => (
              <div key={i} className="rounded-xl bg-muted p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium flex-1 text-sm">{p.english}</p>
                  <button onClick={() => speakAI(p.english)} className="text-primary shrink-0"><Volume2 className="w-4 h-4" /></button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.uzbek}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

/* -------- Quiz -------- */
const Quiz = ({
  questions, answers, setAnswers,
}: { questions: MCQ[]; answers: Record<number, number>; setAnswers: (a: Record<number, number>) => void }) => {
  const allAnswered = questions.every((_, i) => answers[i] !== undefined);
  const correctCount = questions.filter((q, i) => answers[i] === q.correct_index).length;
  return (
    <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm space-y-4">
      <h3 className="font-display text-lg font-bold">Tushunish savollari</h3>
      {questions.map((q, qi) => (
        <div key={qi} className="space-y-2">
          <p className="font-medium text-sm">{qi + 1}. {q.question}</p>
          <div className="grid gap-2">
            {q.options.map((opt, oi) => {
              const chosen = answers[qi] === oi;
              const correct = q.correct_index === oi;
              const showResult = answers[qi] !== undefined;
              return (
                <button
                  key={oi}
                  onClick={() => answers[qi] === undefined && setAnswers({ ...answers, [qi]: oi })}
                  className={cn(
                    "text-left text-sm rounded-xl border-2 px-3 py-2 transition-smooth",
                    showResult && correct && "border-success bg-success/10",
                    showResult && chosen && !correct && "border-destructive bg-destructive/10",
                    !showResult && "border-border hover:border-primary/40",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {allAnswered && (
        <p className="text-sm font-semibold text-center pt-2">
          Natija: {correctCount}/{questions.length}
        </p>
      )}
    </div>
  );
};

const Empty = ({ label }: { label: string }) => (
  <div className="rounded-3xl bg-card border border-border p-12 text-center text-sm text-muted-foreground">{label}</div>
);

const PremiumLock = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-3xl bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent border-2 border-primary/30 p-8 sm:p-12 text-center">
    <div className="w-16 h-16 rounded-2xl gradient-primary grid place-items-center shadow-glow mx-auto mb-4">
      <Lock className="w-8 h-8 text-primary-foreground" />
    </div>
    <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">{description}</p>
    <Link to="/pricing">
      <Button variant="hero" size="lg">
        <Crown className="w-4 h-4" />
        Pro'ga o'tish
      </Button>
    </Link>
  </div>
);

export default LessonView;
