import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Swords, Timer, Zap } from "lucide-react";

type Profile = { id: string; display_name: string | null };

// Bundled vocab quiz (en -> uz). Used for both vocab battle and speed quiz.
const QUESTIONS = [
  { q: "abundant", a: "ko'p, mo'l", opts: ["ko'p, mo'l", "kam", "yashirin", "qiyin"] },
  { q: "diligent", a: "tirishqoq", opts: ["dangasa", "tirishqoq", "shoshqaloq", "xushyor"] },
  { q: "fragile", a: "mo'rt, sinuvchan", opts: ["mustahkam", "yangi", "mo'rt, sinuvchan", "og'ir"] },
  { q: "imitate", a: "taqlid qilmoq", opts: ["yaratmoq", "yo'qotmoq", "tushunmoq", "taqlid qilmoq"] },
  { q: "obvious", a: "aniq, ravshan", opts: ["aniq, ravshan", "noma'lum", "qiziq", "yashirin"] },
  { q: "reluctant", a: "istamay", opts: ["xohlab", "shoshib", "istamay", "tezda"] },
  { q: "vivid", a: "yorqin, jonli", opts: ["xira", "yorqin, jonli", "qora", "kichik"] },
  { q: "scarce", a: "kam, taqchil", opts: ["serob", "kam, taqchil", "arzon", "katta"] },
  { q: "concise", a: "qisqa va aniq", opts: ["uzun", "noaniq", "qisqa va aniq", "tartibsiz"] },
  { q: "endure", a: "chidamoq", opts: ["chidamoq", "qochmoq", "kulmoq", "to'xtatmoq"] },
];

const TYPES = [
  { value: "vocab", label: "Vocabulary battle", icon: Swords, time: 60 },
  { value: "speed_quiz", label: "Speed quiz (30s)", icon: Zap, time: 30 },
];

const ChallengeDialog = ({ opponent, onClose }: { opponent: Profile; onClose: () => void }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<"choose"|"play"|"done">("choose");
  const [type, setType] = useState<typeof TYPES[number]>(TYPES[0]);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState(QUESTIONS);
  const tickRef = useRef<number | null>(null);

  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  const start = async () => {
    if (!user) return;
    setBusy(true);
    // Shuffle questions deterministically per challenge for fairness
    const seed = Date.now();
    const shuffled = [...QUESTIONS].sort(() => Math.sin(seed) - 0.5);
    setQuestions(shuffled);

    const { data, error } = await supabase.from("challenges").insert({
      challenger_id: user.id,
      opponent_id: opponent.id,
      type: type.value,
      status: "active",
      payload: { time: type.time },
    }).select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    setChallengeId(data.id);
    setTime(type.time);
    setStep("play");
    tickRef.current = window.setInterval(() => {
      setTime(t => {
        if (t <= 1) { finish(); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const finish = async (finalScore?: number) => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    const s = finalScore ?? score;
    if (challengeId) {
      const { data, error } = await supabase.rpc("complete_challenge", { _challenge_id: challengeId, _my_score: s });
      if (error) toast.error(error.message);
      else {
        const r = data as any;
        if (r?.done) toast.success(r.winner === user?.id ? "G'alaba! +30 coins, +50 XP 🏆" : r.winner ? "Yutqazdingiz" : "Durang");
        else toast.success("Natija yuborildi. Raqibingiz hali o'ynamadi.");
      }
    }
    setStep("done");
  };

  const answer = (opt: string) => {
    const correct = opt === questions[qIdx].a;
    const next = correct ? score + 1 : score;
    if (correct) setScore(next);
    if (qIdx + 1 >= questions.length) finish(next);
    else setQIdx(qIdx + 1);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Swords className="w-5 h-5" />Challenge: {opponent.display_name}</DialogTitle></DialogHeader>

        {step === "choose" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">G'olib +30 coin, +50 XP oladi.</p>
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setType(t)} className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-smooth ${type.value === t.value ? "border-primary bg-primary/10" : ""}`}>
                <t.icon className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-xs text-muted-foreground">10 ta savol · {t.time}s</p>
                </div>
              </button>
            ))}
            <Button onClick={start} disabled={busy} variant="hero" className="w-full">Boshlash</Button>
          </div>
        )}

        {step === "play" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Savol {qIdx + 1}/{questions.length}</span>
              <span className="flex items-center gap-1 font-bold text-primary"><Timer className="w-4 h-4" />{time}s</span>
            </div>
            <div className="rounded-2xl gradient-primary p-6 text-center text-primary-foreground">
              <p className="text-xs opacity-80 mb-1">Tarjima qiling:</p>
              <p className="font-display text-3xl font-bold">{questions[qIdx].q}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {questions[qIdx].opts.map(o => (
                <button key={o} onClick={() => answer(o)} className="p-3 rounded-2xl border bg-card hover:bg-primary/10 hover:border-primary transition-smooth text-left">{o}</button>
              ))}
            </div>
            <p className="text-center text-sm">Ball: <b>{score}</b></p>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-4 py-4">
            <div className="text-6xl">🎯</div>
            <p className="font-display text-2xl font-bold">Yakuniy ball: {score}/{questions.length}</p>
            <p className="text-sm text-muted-foreground">Raqibingiz o'ynagandan keyin g'olib aniqlanadi.</p>
            <Button onClick={onClose} variant="hero" className="w-full">Yopish</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeDialog;
