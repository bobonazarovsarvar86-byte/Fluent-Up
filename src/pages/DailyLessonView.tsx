import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sparkles, ArrowLeft, BookOpen, Volume2, Headphones, Mic, PencilLine,
  PenTool, BookMarked, Loader2, Play, Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DailyLesson = {
  id: string;
  for_date: string;
  level: string;
  skill: string;
  topic: string;
  title: string;
  content: any;
};

const SKILL_META: Record<string, { label: string; icon: any; color: string }> = {
  vocabulary: { label: "Lug'at", icon: BookOpen, color: "from-blue-500 to-indigo-500" },
  grammar: { label: "Grammatika", icon: PenTool, color: "from-indigo-500 to-purple-500" },
  reading: { label: "O'qish", icon: BookMarked, color: "from-purple-500 to-pink-500" },
  listening: { label: "Tinglash", icon: Headphones, color: "from-pink-500 to-rose-500" },
  speaking: { label: "Gapirish", icon: Mic, color: "from-blue-500 to-purple-600" },
  writing: { label: "Yozish", icon: PencilLine, color: "from-emerald-500 to-teal-500" },
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
    if (!error && data?.audioContent) {
      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
      audio.play().catch(() => speakBrowser(text));
      return;
    }
  } catch {}
  speakBrowser(text);
};

const DailyLessonView = () => {
  const { id } = useParams();
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from("daily_lessons").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => {
        setLesson(data as DailyLesson | null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!lesson) {
    return (
      <div className="min-h-screen grid place-items-center text-center p-6">
        <div>
          <p className="text-muted-foreground mb-4">Dars topilmadi</p>
          <Link to="/dashboard"><Button variant="outline"><ArrowLeft className="w-4 h-4" /> Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const meta = SKILL_META[lesson.skill] ?? SKILL_META.vocabulary;
  const Icon = meta.icon;

  return (
    <main className="min-h-screen bg-muted/30 pb-24">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between gap-2 px-3 sm:px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </span>
            <span className="hidden sm:inline">FluentUp</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-4 sm:py-8 max-w-3xl space-y-4 px-3 sm:px-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br grid place-items-center shadow-md shrink-0", meta.color)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase font-bold text-primary tracking-wider">{meta.label} · {lesson.level}</p>
            <h1 className="font-display text-xl sm:text-2xl font-bold leading-tight">{lesson.title}</h1>
            <p className="text-xs text-muted-foreground capitalize">Mavzu: {lesson.topic}</p>
          </div>
        </div>

        <SkillContent skill={lesson.skill} content={lesson.content} />
      </div>
    </main>
  );
};

const SkillContent = ({ skill, content }: { skill: string; content: any }) => {
  switch (skill) {
    case "vocabulary": return <VocabView content={content} />;
    case "grammar": return <GrammarView content={content} />;
    case "reading": return <ReadingView content={content} />;
    case "listening": return <ListeningView content={content} />;
    case "speaking": return <SpeakingView content={content} />;
    case "writing": return <WritingView content={content} />;
    default: return <pre className="rounded-2xl bg-card border border-border p-4 text-xs overflow-auto">{JSON.stringify(content, null, 2)}</pre>;
  }
};

const Card = ({ children, className }: any) => (
  <div className={cn("rounded-3xl bg-card border border-border p-5 sm:p-6 shadow-sm", className)}>{children}</div>
);

const VocabView = ({ content }: { content: any }) => {
  const items = content?.items ?? [];
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  if (!items.length) return <Card>Lug'at mavjud emas.</Card>;
  const v = items[idx];
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase font-bold text-primary tracking-wider">So'z {idx + 1}/{items.length}</span>
        <span className="text-xs text-muted-foreground">{v.part_of_speech}</span>
      </div>
      <div className="text-center py-6">
        <h2 className="font-display text-3xl sm:text-5xl font-bold mb-3">{v.word}</h2>
        <button onClick={() => speakAI(v.word)} className="text-primary hover:scale-110 transition-transform"><Volume2 className="w-6 h-6 mx-auto" /></button>
        {revealed ? (
          <div className="mt-6 space-y-4 animate-fade-in">
            <p className="text-xl sm:text-2xl font-semibold text-primary">{v.translation}</p>
            <div className="rounded-2xl bg-muted p-4 text-left">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium flex-1">{v.example_sentence ?? v.example}</p>
                <button onClick={() => speakAI(v.example_sentence ?? v.example)} className="text-primary shrink-0"><Volume2 className="w-4 h-4" /></button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{v.example_translation}</p>
            </div>
          </div>
        ) : (
          <Button variant="soft" className="mt-6" onClick={() => setRevealed(true)}>Tarjimani ko'rsatish</Button>
        )}
      </div>
      <div className="flex justify-between gap-2 mt-6">
        <Button variant="outline" disabled={idx === 0} onClick={() => { setIdx(i => i - 1); setRevealed(false); }}><ArrowLeft className="w-4 h-4" /> Oldingi</Button>
        <Button disabled={idx === items.length - 1} onClick={() => { setIdx(i => i + 1); setRevealed(false); }}>Keyingi</Button>
      </div>
    </Card>
  );
};

const GrammarView = ({ content }: { content: any }) => (
  <Card>
    <span className="text-xs uppercase font-bold text-primary tracking-wider">📘 Grammar</span>
    <p className="text-muted-foreground whitespace-pre-line mt-3">{content?.explanation_uz}</p>
    <div className="space-y-2 mt-4">
      <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Misollar</h3>
      {(content?.examples ?? []).map((ex: any, i: number) => (
        <div key={i} className="rounded-2xl bg-muted p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium flex-1">{ex.english}</p>
            <button onClick={() => speakAI(ex.english)} className="text-primary shrink-0"><Volume2 className="w-4 h-4" /></button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{ex.uzbek}</p>
        </div>
      ))}
    </div>
  </Card>
);

const ReadingView = ({ content }: { content: any }) => {
  const [showT, setShowT] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const passage = content?.passage ?? content?.english;
  const translation = content?.translation_uz ?? content?.uzbek;
  return (
    <div className="space-y-4">
      <Card>
        <span className="text-xs uppercase font-bold text-primary tracking-wider">📖 Reading</span>
        <p className="leading-relaxed whitespace-pre-line mt-3">{passage}</p>
        <Button variant="soft" size="sm" className="mt-3" onClick={() => setShowT(s => !s)}>
          {showT ? "Tarjimani yashirish" : "Tarjimani ko'rsatish"}
        </Button>
        {showT && translation && (
          <p className="text-sm text-muted-foreground italic border-l-4 border-primary/30 pl-3 whitespace-pre-line mt-3">{translation}</p>
        )}
      </Card>
      <Quiz questions={content?.questions ?? []} answers={answers} setAnswers={setAnswers} />
    </div>
  );
};

const ListeningView = ({ content }: { content: any }) => {
  const [showScript, setShowScript] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const script = content?.script;
  const scriptText = Array.isArray(script)
    ? script.map((s: any) => `${s.speaker ? s.speaker + ": " : ""}${s.english}`).join("\n")
    : script;

  const togglePlay = async () => {
    if (audioRef.current && playing) { audioRef.current.pause(); setPlaying(false); return; }
    try {
      const { data } = await supabase.functions.invoke("tts", { body: { text: scriptText } });
      if (data?.audioContent) {
        const a = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
        audioRef.current = a;
        a.onended = () => setPlaying(false);
        a.play(); setPlaying(true);
      }
    } catch (e) { console.warn(e); }
  };

  const mcqs = (content?.mcqs ?? content?.questions ?? []).map((q: any, i: number) => ({
    question: q.question,
    options: q.options,
    correct_index: typeof q.correct_index === "number"
      ? q.correct_index
      : q.options?.indexOf(q.correct_answer),
  }));

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase font-bold text-primary tracking-wider">🎧 Listening</span>
          <Button size="sm" onClick={togglePlay} variant="hero">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} {playing ? "Pauza" : "Tinglash"}
          </Button>
        </div>
        <Button variant="soft" size="sm" onClick={() => setShowScript(s => !s)}>
          {showScript ? "Skriptni yashirish" : "Skriptni ko'rsatish"}
        </Button>
        {showScript && (
          <div className="mt-3 space-y-2">
            {Array.isArray(script) ? script.map((s: any, i: number) => (
              <div key={i} className="rounded-2xl bg-muted p-3">
                {s.speaker && <p className="text-xs font-semibold text-primary">{s.speaker}</p>}
                <p className="font-medium">{s.english}</p>
                <p className="text-sm text-muted-foreground">{s.uzbek}</p>
              </div>
            )) : <p className="whitespace-pre-line">{scriptText}</p>}
          </div>
        )}
      </Card>
      <Quiz questions={mcqs} answers={answers} setAnswers={setAnswers} />
    </div>
  );
};

const SpeakingView = ({ content }: { content: any }) => (
  <Card>
    <span className="text-xs uppercase font-bold text-primary tracking-wider">🗣 Speaking</span>
    {content?.scenario_uz && <p className="mt-3"><strong>Vaziyat:</strong> {content.scenario_uz}</p>}
    {content?.ai_role && <p className="mt-2 text-sm text-muted-foreground"><strong>AI roli:</strong> {content.ai_role}</p>}
    {content?.starter_message && (
      <div className="rounded-2xl bg-muted p-4 mt-4 flex items-start justify-between gap-2">
        <p className="font-medium flex-1">{content.starter_message}</p>
        <button onClick={() => speakAI(content.starter_message)} className="text-primary shrink-0"><Volume2 className="w-4 h-4" /></button>
      </div>
    )}
    {content?.sample_phrases?.length > 0 && (
      <div className="mt-4 space-y-2">
        <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Foydali iboralar</h3>
        {content.sample_phrases.map((p: any, i: number) => (
          <div key={i} className="rounded-2xl bg-muted p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium flex-1">{p.english}</p>
              <button onClick={() => speakAI(p.english)} className="text-primary shrink-0"><Volume2 className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground">{p.uzbek}</p>
          </div>
        ))}
      </div>
    )}
    <Link to="/tutor" className="block mt-4">
      <Button variant="hero" className="w-full"><Mic className="w-4 h-4" /> AI tutor bilan mashq qilish</Button>
    </Link>
  </Card>
);

const WritingView = ({ content }: { content: any }) => {
  const [showSample, setShowSample] = useState(false);
  return (
    <Card>
      <span className="text-xs uppercase font-bold text-primary tracking-wider">✍️ Writing</span>
      {content?.prompt_uz && <p className="mt-3 font-medium">{content.prompt_uz}</p>}
      {content?.english_prompt && <p className="mt-1 text-sm text-muted-foreground italic">{content.english_prompt}</p>}
      {content?.useful_phrases?.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Foydali iboralar</h3>
          {content.useful_phrases.map((p: any, i: number) => (
            <div key={i} className="rounded-2xl bg-muted p-3">
              <p className="font-medium">{p.english}</p>
              <p className="text-sm text-muted-foreground">{p.uzbek}</p>
            </div>
          ))}
        </div>
      )}
      <textarea className="w-full mt-4 rounded-2xl border border-border bg-background p-4 min-h-[160px] text-sm" placeholder="Bu yerda yozing..." />
      {content?.sample_answer && (
        <>
          <Button variant="soft" size="sm" className="mt-3" onClick={() => setShowSample(s => !s)}>
            {showSample ? "Namunani yashirish" : "Namunaviy javobni ko'rsatish"}
          </Button>
          {showSample && (
            <div className="mt-3 rounded-2xl bg-muted p-4 text-sm whitespace-pre-line">{content.sample_answer}</div>
          )}
        </>
      )}
    </Card>
  );
};

const Quiz = ({ questions, answers, setAnswers }: { questions: any[]; answers: Record<number, number>; setAnswers: (a: any) => void }) => {
  if (!questions?.length) return null;
  return (
    <Card>
      <h3 className="font-display font-bold mb-3">Savollar</h3>
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi}>
            <p className="font-medium mb-2">{qi + 1}. {q.question}</p>
            <div className="space-y-1.5">
              {q.options?.map((opt: string, oi: number) => {
                const picked = answers[qi];
                const isPicked = picked === oi;
                const isCorrect = q.correct_index === oi;
                const showResult = picked !== undefined;
                return (
                  <button
                    key={oi}
                    onClick={() => setAnswers({ ...answers, [qi]: oi })}
                    className={cn(
                      "w-full text-left rounded-xl border px-4 py-2.5 text-sm transition-smooth",
                      !showResult && "border-border hover:border-primary/40",
                      showResult && isCorrect && "border-success bg-success/10 text-success",
                      showResult && isPicked && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                      showResult && !isPicked && !isCorrect && "border-border opacity-60",
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DailyLessonView;
