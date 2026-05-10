import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Timer, Swords } from "lucide-react";

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

const ChallengePlayDialog = ({ challenge, onClose }: { challenge: any; onClose: () => void }) => {
  const { user } = useAuth();
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const totalTime = challenge.payload?.time ?? 60;
  const [time, setTime] = useState(totalTime);
  const [done, setDone] = useState(false);
  const tick = useRef<number | null>(null);

  useEffect(() => {
    tick.current = window.setInterval(() => {
      setTime(t => { if (t <= 1) { finish(); return 0; } return t - 1; });
    }, 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = async (final?: number) => {
    if (tick.current) { clearInterval(tick.current); tick.current = null; }
    const s = final ?? score;
    setDone(true);
    const { data, error } = await supabase.rpc("complete_challenge", { _challenge_id: challenge.id, _my_score: s });
    if (error) toast.error(error.message);
    else {
      const r = data as any;
      if (r?.done) toast.success(r.winner === user?.id ? "G'alaba! +30 coin, +50 XP 🏆" : r.winner ? "Yutqazdingiz" : "Durang");
      else toast.success("Natija yuborildi");
    }
  };

  const answer = (opt: string) => {
    const correct = opt === QUESTIONS[qIdx].a;
    const next = correct ? score + 1 : score;
    if (correct) setScore(next);
    if (qIdx + 1 >= QUESTIONS.length) finish(next);
    else setQIdx(qIdx + 1);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Swords className="w-5 h-5" />Challenge</DialogTitle></DialogHeader>
        {!done ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>{qIdx + 1}/{QUESTIONS.length}</span>
              <span className="flex items-center gap-1 font-bold text-primary"><Timer className="w-4 h-4" />{time}s</span>
            </div>
            <div className="rounded-2xl gradient-primary p-6 text-center text-primary-foreground">
              <p className="text-xs opacity-80 mb-1">Tarjima qiling:</p>
              <p className="font-display text-3xl font-bold">{QUESTIONS[qIdx].q}</p>
            </div>
            <div className="grid gap-2">
              {QUESTIONS[qIdx].opts.map(o => (
                <button key={o} onClick={() => answer(o)} className="p-3 rounded-2xl border bg-card hover:bg-primary/10 hover:border-primary transition-smooth text-left">{o}</button>
              ))}
            </div>
            <p className="text-center text-sm">Ball: <b>{score}</b></p>
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="text-6xl">🎯</div>
            <p className="font-display text-2xl font-bold">Sizning ball: {score}/{QUESTIONS.length}</p>
            <Button onClick={onClose} variant="hero" className="w-full">Yopish</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChallengePlayDialog;
