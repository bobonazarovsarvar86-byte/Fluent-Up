import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Swords, Trophy, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ChallengePlayDialog from "@/components/ChallengePlayDialog";

type Challenge = any;

const Challenges = () => {
  const { user } = useAuth();
  const [list, setList] = useState<Challenge[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [playing, setPlaying] = useState<Challenge | null>(null);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase.from("challenges")
      .select("*")
      .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .order("created_at", { ascending: false }).limit(50);
    setList(data ?? []);
    const ids = Array.from(new Set((data ?? []).flatMap(c => [c.challenger_id, c.opponent_id])));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
      const map: Record<string, any> = {};
      (ps ?? []).forEach(p => map[p.id] = p);
      setProfiles(map);
    }
  };

  useEffect(() => { refresh(); }, [user]);

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="container flex h-14 items-center gap-3 px-4">
          <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-display font-bold">Challenges</h1>
        </div>
      </header>

      <div className="container py-6 px-4 max-w-3xl space-y-3">
        {list.length === 0 && <div className="rounded-3xl bg-card border p-10 text-center text-muted-foreground">Hech qanday challenge yo'q. Do'stlaringizdan boshlang.</div>}
        {list.map(c => {
          const isChallenger = c.challenger_id === user?.id;
          const otherId = isChallenger ? c.opponent_id : c.challenger_id;
          const other = profiles[otherId];
          const myScore = isChallenger ? c.challenger_score : c.opponent_score;
          const otherScore = isChallenger ? c.opponent_score : c.challenger_score;
          const needsPlay = c.status !== "completed" && myScore == null;
          return (
            <div key={c.id} className="rounded-2xl bg-card border p-4 flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold shrink-0">
                {(other?.display_name?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="flex-1 min-w-[140px]">
                <p className="font-semibold truncate">{other?.display_name || "Foydalanuvchi"}</p>
                <p className="text-xs text-muted-foreground capitalize">{c.type.replace("_"," ")} · {isChallenger ? "siz so'radingiz" : "siz qabul qildingiz"}</p>
              </div>
              <div className={cn("text-xs px-2 py-1 rounded-full font-semibold", c.status === "completed" ? (c.winner_id === user?.id ? "bg-success/20 text-success" : c.winner_id ? "bg-destructive/20 text-destructive" : "bg-muted") : "bg-warning/20 text-warning")}>
                {c.status === "completed" ? (c.winner_id === user?.id ? <><Trophy className="w-3 h-3 inline" /> Yutdingiz</> : c.winner_id ? "Yutqazdingiz" : "Durang") : needsPlay ? <><Clock className="w-3 h-3 inline" /> Sizning navbatingiz</> : <><Check className="w-3 h-3 inline" /> Yuborildi</>}
              </div>
              {(myScore != null || otherScore != null) && <span className="text-sm font-bold w-full sm:w-auto text-right">{myScore ?? "?"} : {otherScore ?? "?"}</span>}
              {needsPlay && <Button size="sm" variant="hero" onClick={() => setPlaying(c)}><Swords className="w-3 h-3" />O'ynash</Button>}
            </div>
          );
        })}
      </div>

      {playing && <ChallengePlayDialog challenge={playing} onClose={() => { setPlaying(null); refresh(); }} />}
    </main>
  );
};

export default Challenges;
