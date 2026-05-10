import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, ArrowLeft, Plus, Pencil, Trash2, Wand2, BookOpen, Eye, EyeOff,
  GraduationCap, Headphones, MessageSquare, Loader2, Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Level = "beginner" | "elementary" | "intermediate" | "upper_intermediate" | "advanced" | "proficient";

const LEVELS: { v: Level; label: string }[] = [
  { v: "beginner", label: "Beginner (A1)" },
  { v: "elementary", label: "Elementary (A2)" },
  { v: "intermediate", label: "Intermediate (B1)" },
  { v: "upper_intermediate", label: "Upper-Intermediate (B2)" },
  { v: "advanced", label: "Advanced (C1)" },
  { v: "proficient", label: "Proficient (C2)" },
];

type VocabItem = { word: string; translation: string; part_of_speech: string; example: string; example_translation: string };
type Grammar = { title: string; explanation_uz: string; examples: { english: string; uzbek: string }[] };
type MCQ = { question: string; options: string[]; correct_index: number };
type Reading = { title?: string; passage?: string; translation_uz?: string; questions?: MCQ[] };
type Listening = { title?: string; script?: string; translation_uz?: string; audio_url?: string; questions?: MCQ[] };
type Speaking = { title?: string; scenario_uz?: string; ai_role?: string; starter_message?: string; sample_phrases?: { english: string; uzbek: string }[] };

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  level: Level;
  order_index: number;
  vocabulary: VocabItem[];
  grammar: Grammar;
  reading: Reading;
  listening: Listening;
  speaking: Speaking;
  xp_reward: number;
  estimated_minutes: number;
  published: boolean;
  created_at: string;
};

const emptyLesson = (): Partial<Lesson> => ({
  title: "",
  description: "",
  level: "beginner",
  order_index: 0,
  vocabulary: [],
  grammar: { title: "", explanation_uz: "", examples: [] },
  reading: { title: "", passage: "", translation_uz: "", questions: [] },
  listening: { title: "", script: "", translation_uz: "", audio_url: "", questions: [] },
  speaking: { title: "", scenario_uz: "", ai_role: "", starter_message: "", sample_phrases: [] },
  xp_reward: 20,
  estimated_minutes: 10,
  published: true,
});

const AdminLessons = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Lesson> | null>(null);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLevel, setAiLevel] = useState<Level>("beginner");
  const [aiBusy, setAiBusy] = useState(false);
  const [sectionBusy, setSectionBusy] = useState<string | null>(null);
  const [audioBusy, setAudioBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("lessons").select("*").order("level").order("order_index");
    const normalized = (data ?? []).map((l: any) => ({
      ...l,
      vocabulary: Array.isArray(l.vocabulary) ? l.vocabulary : [],
      grammar: l.grammar ?? { title: "", explanation_uz: "", examples: [] },
      reading: l.reading ?? {},
      listening: l.listening ?? {},
      speaking: l.speaking ?? {},
    })) as Lesson[];
    setLessons(normalized);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(emptyLesson()); setOpen(true); };
  const openEdit = (l: Lesson) => { setEditing({ ...l }); setOpen(true); };

  const save = async () => {
    if (!editing || !user) return;
    if (!editing.title?.trim()) { toast.error("Sarlavha kerak"); return; }
    const payload = {
      title: editing.title!,
      description: editing.description ?? null,
      level: editing.level!,
      order_index: editing.order_index ?? 0,
      vocabulary: (editing.vocabulary ?? []) as any,
      grammar: (editing.grammar ?? {}) as any,
      reading: (editing.reading ?? {}) as any,
      listening: (editing.listening ?? {}) as any,
      speaking: (editing.speaking ?? {}) as any,
      xp_reward: editing.xp_reward ?? 20,
      estimated_minutes: editing.estimated_minutes ?? 10,
      published: editing.published ?? true,
    };
    if (editing.id) {
      const { error } = await supabase.from("lessons").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Saqlandi");
    } else {
      const { error } = await supabase.from("lessons").insert({ ...payload, created_by: user.id });
      if (error) { toast.error(error.message); return; }
      toast.success("Darslik yaratildi");
    }
    setOpen(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("O'chirildi"); load();
  };

  const togglePublish = async (l: Lesson) => {
    const { error } = await supabase.from("lessons").update({ published: !l.published }).eq("id", l.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const generateFull = async () => {
    if (!aiTopic.trim()) { toast.error("Mavzu kiriting"); return; }
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson", {
        body: { topic: aiTopic, level: aiLevel, section: "full" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const r = (data as any).result;
      setEditing({
        ...emptyLesson(),
        ...r,
        level: aiLevel,
        order_index: lessons.filter((l) => l.level === aiLevel).length,
      });
      setOpen(true);
      setAiTopic("");
      toast.success("AI darslik yaratildi! Tekshiring va saqlang.");
    } catch (e: any) {
      toast.error(e.message ?? "AI xato");
    } finally { setAiBusy(false); }
  };

  const generateSection = async (section: "vocabulary" | "grammar" | "reading" | "listening" | "speaking") => {
    if (!editing) return;
    const topic = editing.title?.trim() || aiTopic.trim();
    if (!topic) { toast.error("Avval Sarlavha yoki mavzu kiriting"); return; }
    setSectionBusy(section);
    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson", {
        body: { topic, level: editing.level || "beginner", section },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const r = (data as any).result;
      setEditing(e => e && { ...e, [section]: r[section] });
      toast.success(`${section} yaratildi`);
    } catch (e: any) {
      toast.error(e.message ?? "AI xato");
    } finally { setSectionBusy(null); }
  };

  const generateListeningAudio = async () => {
    if (!editing?.id) { toast.error("Avval darslikni saqlang"); return; }
    const script = editing.listening?.script;
    if (!script) { toast.error("Listening skriptini yozing"); return; }
    setAudioBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-listening-audio", {
        body: { script, lessonId: editing.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const url = (data as any).audio_url as string;
      setEditing(e => e && { ...e, listening: { ...(e.listening ?? {}), audio_url: url } });
      // auto-save audio_url
      await supabase.from("lessons").update({ listening: { ...(editing.listening ?? {}), audio_url: url } as any }).eq("id", editing.id);
      toast.success("Audio yaratildi va saqlandi 🎧");
    } catch (e: any) {
      toast.error(e.message ?? "Audio xato");
    } finally { setAudioBusy(false); }
  };

  /* helpers */
  const setListField = <K extends keyof Lesson>(key: K, val: any) => setEditing(e => e && { ...e, [key]: val });
  const updateVocab = (idx: number, k: keyof VocabItem, v: string) => setEditing(e => {
    if (!e) return e;
    const arr = [...(e.vocabulary ?? [])]; arr[idx] = { ...arr[idx], [k]: v };
    return { ...e, vocabulary: arr };
  });
  const updateMCQ = (section: "reading" | "listening", qi: number, key: keyof MCQ, value: any) => setEditing(e => {
    if (!e) return e;
    const sec = (e[section] as any) ?? {};
    const qs = [...(sec.questions ?? [])];
    qs[qi] = { ...qs[qi], [key]: value };
    return { ...e, [section]: { ...sec, questions: qs } };
  });

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between gap-2 px-3 sm:px-4">
          <Link to="/admin" className="flex items-center gap-2 font-display font-bold">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </span>
            <span className="hidden sm:inline">FluentUp</span>
            <span className="ml-1 text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Admin</span>
          </Link>
          <Link to="/admin">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /> Admin</Button>
          </Link>
        </div>
      </header>

      <div className="container py-6 sm:py-8 space-y-6 px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">Darsliklar boshqaruvi</h1>
            <p className="text-sm text-muted-foreground">Jami {lessons.length} ta darslik</p>
          </div>
          <Button onClick={openNew} variant="hero" className="w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Yangi darslik
          </Button>
        </div>

        {/* AI quick generate full lesson */}
        <section className="rounded-3xl gradient-primary p-5 sm:p-6 text-primary-foreground shadow-glow">
          <h2 className="font-display text-lg sm:text-xl font-bold mb-1 flex items-center gap-2">
            <Wand2 className="w-5 h-5" /> AI bilan to'liq darslik yarating
          </h2>
          <p className="text-sm opacity-90 mb-4">
            Mavzu va daraja kiriting — AI hammasini yaratadi (Vocab + Grammar + Reading + Listening + Speaking).
          </p>
          <div className="grid sm:grid-cols-[1fr,200px,auto] gap-2">
            <Input
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Mavzu, masalan: 'Travel and airports'"
              className="bg-white text-foreground"
            />
            <Select value={aiLevel} onValueChange={(v) => setAiLevel(v as Level)}>
              <SelectTrigger className="bg-white text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEVELS.map(l => <SelectItem key={l.v} value={l.v}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={generateFull} disabled={aiBusy} variant="secondary" className="bg-white text-foreground hover:bg-white/90">
              {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {aiBusy ? "Yaratilmoqda..." : "Yaratish"}
            </Button>
          </div>
        </section>

        {/* Lessons list */}
        <section className="rounded-3xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Sarlavha</th>
                  <th className="text-left px-4 py-3">Daraja</th>
                  <th className="text-right px-4 py-3 hidden sm:table-cell">Bo'limlar</th>
                  <th className="text-right px-4 py-3 hidden sm:table-cell">XP</th>
                  <th className="text-center px-4 py-3">Holat</th>
                  <th className="text-right px-4 py-3">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Yuklanmoqda...</td></tr>}
                {!loading && lessons.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12">
                    <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Hali darslik yo'q. Yuqoridan AI bilan yarating!</p>
                  </td></tr>
                )}
                {lessons.map((l) => {
                  const sections = [
                    l.vocabulary?.length > 0 && "V",
                    l.grammar?.title && "G",
                    l.reading?.passage && "R",
                    (l.listening?.script || l.listening?.audio_url) && "L",
                    l.speaking?.starter_message && "S",
                  ].filter(Boolean).join("·");
                  return (
                    <tr key={l.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold">{l.title}</td>
                      <td className="px-4 py-3 capitalize text-xs">{l.level.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-right text-xs hidden sm:table-cell font-mono">{sections || "—"}</td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">{l.xp_reward}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => togglePublish(l)} className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1",
                          l.published ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        )}>
                          {l.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {l.published ? "Nashrda" : "Yashirin"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(l)} aria-label="Edit"><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(l.id)} aria-label="Delete"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Editor dialog with tabs per section */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Darslikni tahrirlash" : "Yangi darslik"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              {/* Meta */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Sarlavha</label>
                  <Input value={editing.title ?? ""} onChange={(e) => setListField("title", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Daraja</label>
                  <Select value={editing.level} onValueChange={(v) => setListField("level", v as Level)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEVELS.map(l => <SelectItem key={l.v} value={l.v}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Tavsif</label>
                <Input value={editing.description ?? ""} onChange={(e) => setListField("description", e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Tartib</label>
                  <Input type="number" value={editing.order_index ?? 0} onChange={(e) => setListField("order_index", parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">XP</label>
                  <Input type="number" value={editing.xp_reward ?? 20} onChange={(e) => setListField("xp_reward", parseInt(e.target.value) || 20)} />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Daqiqa</label>
                  <Input type="number" value={editing.estimated_minutes ?? 10} onChange={(e) => setListField("estimated_minutes", parseInt(e.target.value) || 10)} />
                </div>
              </div>

              {/* Section tabs */}
              <Tabs defaultValue="vocab" className="w-full">
                <TabsList className="w-full overflow-x-auto justify-start h-auto p-1 gap-1">
                  <TabsTrigger value="vocab" className="gap-1.5"><BookOpen className="w-4 h-4" />Vocab</TabsTrigger>
                  <TabsTrigger value="grammar" className="gap-1.5"><GraduationCap className="w-4 h-4" />Grammar</TabsTrigger>
                  <TabsTrigger value="reading" className="gap-1.5"><BookOpen className="w-4 h-4" />Reading</TabsTrigger>
                  <TabsTrigger value="listening" className="gap-1.5"><Headphones className="w-4 h-4" />Listening</TabsTrigger>
                  <TabsTrigger value="speaking" className="gap-1.5"><MessageSquare className="w-4 h-4" />Speaking</TabsTrigger>
                </TabsList>

                {/* VOCAB */}
                <TabsContent value="vocab" className="space-y-2 mt-4">
                  <SectionAIBar busy={sectionBusy === "vocabulary"} onClick={() => generateSection("vocabulary")} />
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => setListField("vocabulary", [...(editing.vocabulary ?? []), { word: "", translation: "", part_of_speech: "noun", example: "", example_translation: "" }])}>
                      <Plus className="w-4 h-4" /> So'z qo'shish
                    </Button>
                  </div>
                  {(editing.vocabulary ?? []).map((v, i) => (
                    <div key={i} className="rounded-2xl border border-border p-3 space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        <Button size="icon" variant="ghost" onClick={() => setListField("vocabulary", (editing.vocabulary ?? []).filter((_, x) => x !== i))}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-2">
                        <Input placeholder="word" value={v.word} onChange={(e) => updateVocab(i, "word", e.target.value)} />
                        <Input placeholder="tarjima" value={v.translation} onChange={(e) => updateVocab(i, "translation", e.target.value)} />
                        <Input placeholder="part of speech" value={v.part_of_speech} onChange={(e) => updateVocab(i, "part_of_speech", e.target.value)} />
                      </div>
                      <Input placeholder="Example sentence" value={v.example} onChange={(e) => updateVocab(i, "example", e.target.value)} />
                      <Input placeholder="Misol tarjimasi" value={v.example_translation} onChange={(e) => updateVocab(i, "example_translation", e.target.value)} />
                    </div>
                  ))}
                </TabsContent>

                {/* GRAMMAR */}
                <TabsContent value="grammar" className="space-y-2 mt-4">
                  <SectionAIBar busy={sectionBusy === "grammar"} onClick={() => generateSection("grammar")} />
                  <Input placeholder="Grammar title" value={editing.grammar?.title ?? ""} onChange={(e) => setListField("grammar", { ...(editing.grammar ?? {}), title: e.target.value })} />
                  <Textarea placeholder="Tushuntirish (o'zbekcha)" rows={4} value={editing.grammar?.explanation_uz ?? ""} onChange={(e) => setListField("grammar", { ...(editing.grammar ?? {}), explanation_uz: e.target.value })} />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Misollar ({editing.grammar?.examples?.length ?? 0})</span>
                    <Button size="sm" variant="outline" onClick={() => setListField("grammar", { ...(editing.grammar ?? {}), examples: [...(editing.grammar?.examples ?? []), { english: "", uzbek: "" }] })}>
                      <Plus className="w-4 h-4" /> Misol
                    </Button>
                  </div>
                  {(editing.grammar?.examples ?? []).map((ex, i) => (
                    <div key={i} className="rounded-2xl border border-border p-3 space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        <Button size="icon" variant="ghost" onClick={() => setListField("grammar", { ...(editing.grammar ?? {}), examples: (editing.grammar?.examples ?? []).filter((_, x) => x !== i) })}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                      <Input placeholder="English" value={ex.english} onChange={(e) => {
                        const arr = [...(editing.grammar?.examples ?? [])]; arr[i] = { ...arr[i], english: e.target.value };
                        setListField("grammar", { ...(editing.grammar ?? {}), examples: arr });
                      }} />
                      <Input placeholder="O'zbekcha" value={ex.uzbek} onChange={(e) => {
                        const arr = [...(editing.grammar?.examples ?? [])]; arr[i] = { ...arr[i], uzbek: e.target.value };
                        setListField("grammar", { ...(editing.grammar ?? {}), examples: arr });
                      }} />
                    </div>
                  ))}
                </TabsContent>

                {/* READING */}
                <TabsContent value="reading" className="space-y-2 mt-4">
                  <SectionAIBar busy={sectionBusy === "reading"} onClick={() => generateSection("reading")} />
                  <Input placeholder="Reading title" value={editing.reading?.title ?? ""} onChange={(e) => setListField("reading", { ...(editing.reading ?? {}), title: e.target.value })} />
                  <Textarea placeholder="English passage (120-200 so'z)" rows={6} value={editing.reading?.passage ?? ""} onChange={(e) => setListField("reading", { ...(editing.reading ?? {}), passage: e.target.value })} />
                  <Textarea placeholder="O'zbekcha tarjima" rows={4} value={editing.reading?.translation_uz ?? ""} onChange={(e) => setListField("reading", { ...(editing.reading ?? {}), translation_uz: e.target.value })} />
                  <McqEditor
                    questions={editing.reading?.questions ?? []}
                    onChange={(qs) => setListField("reading", { ...(editing.reading ?? {}), questions: qs })}
                  />
                </TabsContent>

                {/* LISTENING */}
                <TabsContent value="listening" className="space-y-2 mt-4">
                  <SectionAIBar busy={sectionBusy === "listening"} onClick={() => generateSection("listening")} />
                  <Input placeholder="Listening title" value={editing.listening?.title ?? ""} onChange={(e) => setListField("listening", { ...(editing.listening ?? {}), title: e.target.value })} />
                  <Textarea placeholder="Audio skripti (60-120 so'z)" rows={5} value={editing.listening?.script ?? ""} onChange={(e) => setListField("listening", { ...(editing.listening ?? {}), script: e.target.value })} />
                  <Textarea placeholder="O'zbekcha tarjima" rows={3} value={editing.listening?.translation_uz ?? ""} onChange={(e) => setListField("listening", { ...(editing.listening ?? {}), translation_uz: e.target.value })} />
                  <div className="rounded-2xl border border-dashed border-primary/40 p-3 bg-accent/30 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-semibold flex items-center gap-1.5"><Volume2 className="w-4 h-4" /> Audio</span>
                      <Button size="sm" onClick={generateListeningAudio} disabled={audioBusy} variant="hero">
                        {audioBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        AI bilan audio yaratish
                      </Button>
                    </div>
                    {editing.listening?.audio_url ? (
                      <audio controls src={editing.listening.audio_url} className="w-full" />
                    ) : (
                      <p className="text-xs text-muted-foreground">Avval darslikni saqlang, keyin AI tugmasini bosing.</p>
                    )}
                  </div>
                  <McqEditor
                    questions={editing.listening?.questions ?? []}
                    onChange={(qs) => setListField("listening", { ...(editing.listening ?? {}), questions: qs })}
                  />
                </TabsContent>

                {/* SPEAKING */}
                <TabsContent value="speaking" className="space-y-2 mt-4">
                  <SectionAIBar busy={sectionBusy === "speaking"} onClick={() => generateSection("speaking")} />
                  <Input placeholder="Speaking title" value={editing.speaking?.title ?? ""} onChange={(e) => setListField("speaking", { ...(editing.speaking ?? {}), title: e.target.value })} />
                  <Input placeholder="AI roli (masalan: waiter)" value={editing.speaking?.ai_role ?? ""} onChange={(e) => setListField("speaking", { ...(editing.speaking ?? {}), ai_role: e.target.value })} />
                  <Textarea placeholder="Vaziyat (o'zbekcha)" rows={3} value={editing.speaking?.scenario_uz ?? ""} onChange={(e) => setListField("speaking", { ...(editing.speaking ?? {}), scenario_uz: e.target.value })} />
                  <Textarea placeholder="AI birinchi xabari (English)" rows={2} value={editing.speaking?.starter_message ?? ""} onChange={(e) => setListField("speaking", { ...(editing.speaking ?? {}), starter_message: e.target.value })} />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Foydali iboralar ({editing.speaking?.sample_phrases?.length ?? 0})</span>
                    <Button size="sm" variant="outline" onClick={() => setListField("speaking", { ...(editing.speaking ?? {}), sample_phrases: [...(editing.speaking?.sample_phrases ?? []), { english: "", uzbek: "" }] })}>
                      <Plus className="w-4 h-4" /> Ibora
                    </Button>
                  </div>
                  {(editing.speaking?.sample_phrases ?? []).map((p, i) => (
                    <div key={i} className="rounded-2xl border border-border p-3 space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        <Button size="icon" variant="ghost" onClick={() => setListField("speaking", { ...(editing.speaking ?? {}), sample_phrases: (editing.speaking?.sample_phrases ?? []).filter((_, x) => x !== i) })}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                      <Input placeholder="English" value={p.english} onChange={(e) => {
                        const arr = [...(editing.speaking?.sample_phrases ?? [])]; arr[i] = { ...arr[i], english: e.target.value };
                        setListField("speaking", { ...(editing.speaking ?? {}), sample_phrases: arr });
                      }} />
                      <Input placeholder="O'zbekcha" value={p.uzbek} onChange={(e) => {
                        const arr = [...(editing.speaking?.sample_phrases ?? [])]; arr[i] = { ...arr[i], uzbek: e.target.value };
                        setListField("speaking", { ...(editing.speaking ?? {}), sample_phrases: arr });
                      }} />
                    </div>
                  ))}
                </TabsContent>
              </Tabs>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <input
                  type="checkbox"
                  id="published"
                  checked={editing.published ?? true}
                  onChange={(e) => setListField("published", e.target.checked)}
                />
                <label htmlFor="published" className="text-sm">Nashr qilish (foydalanuvchilarga ko'rinadi)</label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor</Button>
            <Button variant="hero" onClick={save}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

const SectionAIBar = ({ busy, onClick }: { busy: boolean; onClick: () => void }) => (
  <div className="rounded-2xl border border-dashed border-primary/40 bg-accent/30 p-3 flex flex-col sm:flex-row items-center gap-2 sm:justify-between">
    <p className="text-xs text-muted-foreground">
      💡 Qo'lda yozing yoki AI bilan ushbu bo'limni avtomatik yarating
    </p>
    <Button size="sm" variant="hero" onClick={onClick} disabled={busy} className="shrink-0">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
      AI yarating
    </Button>
  </div>
);

const McqEditor = ({ questions, onChange }: { questions: MCQ[]; onChange: (qs: MCQ[]) => void }) => {
  const update = (i: number, patch: Partial<MCQ>) => {
    const arr = [...questions]; arr[i] = { ...arr[i], ...patch }; onChange(arr);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Savollar ({questions.length})</span>
        <Button size="sm" variant="outline" onClick={() => onChange([...questions, { question: "", options: ["", "", "", ""], correct_index: 0 }])}>
          <Plus className="w-4 h-4" /> Savol
        </Button>
      </div>
      {questions.map((q, i) => (
        <div key={i} className="rounded-2xl border border-border p-3 space-y-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Savol #{i + 1}</span>
            <Button size="icon" variant="ghost" onClick={() => onChange(questions.filter((_, x) => x !== i))}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
          <Input placeholder="Savol matni" value={q.question} onChange={(e) => update(i, { question: e.target.value })} />
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <input type="radio" name={`correct-${i}`} checked={q.correct_index === oi} onChange={() => update(i, { correct_index: oi })} />
              <Input placeholder={`Variant ${oi + 1}`} value={opt} onChange={(e) => {
                const ops = [...q.options]; ops[oi] = e.target.value; update(i, { options: ops });
              }} />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">⭐ tanlangan radio = to'g'ri javob</p>
        </div>
      ))}
    </div>
  );
};

export default AdminLessons;
