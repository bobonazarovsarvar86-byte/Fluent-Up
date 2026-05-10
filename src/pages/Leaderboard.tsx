import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Flame, Crown, Medal, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Row = { id: string; display_name: string | null; avatar_url: string | null; xp: number; streak_days: number; level: number };

const Leaderboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"global"|"friends">("global");
  const [global, setGlobal] = useState<Row[]>([]);
  const [friends, setFriends] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles")
        .select("id, display_name, avatar_url, xp, streak_days, level")
        .order("xp", { ascending: false })
        .limit(100);
      setGlobal((data ?? []) as Row[]);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: f } = await supabase.from("friendships")
        .select("sender_id, receiver_id")
        .eq("status", "accepted")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      const ids = Array.from(new Set([user.id, ...(f ?? []).flatMap(r => [r.sender_id, r.receiver_id])]));
      const { data: ps } = await supabase.from("profiles")
        .select("id, display_name, avatar_url, xp, streak_days, level")
        .in("id", ids)
        .order("xp", { ascending: false });
      setFriends((ps ?? []) as Row[]);
    })();
  }, [user]);

  const list = tab === "global" ? global : friends;

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="container flex h-14 items-center gap-3 px-4">
          <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-display font-bold">Reyting</h1>
        </div>
      </header>

      <div className="container py-6 px-4 max-w-3xl space-y-5">
        <div className="flex gap-2">
          <button onClick={() => setTab("global")} className={cn("flex-1 px-4 py-2 rounded-full text-sm font-medium transition-smooth", tab === "global" ? "gradient-primary text-primary-foreground shadow-glow" : "bg-card border")}><Trophy className="w-4 h-4 inline -mt-0.5 mr-1" />Global</button>
          <button onClick={() => setTab("friends")} className={cn("flex-1 px-4 py-2 rounded-full text-sm font-medium transition-smooth", tab === "friends" ? "gradient-primary text-primary-foreground shadow-glow" : "bg-card border")}><Users className="w-4 h-4 inline -mt-0.5 mr-1" />Do'stlar</button>
        </div>

        {/* Top 3 podium */}
        {list.length >= 3 && (
          <section className="grid grid-cols-3 gap-3 items-end">
            <Podium row={list[1]} place={2} height="h-28" gradient="from-slate-300 to-slate-500" />
            <Podium row={list[0]} place={1} height="h-36" gradient="from-yellow-300 to-amber-500" crown />
            <Podium row={list[2]} place={3} height="h-24" gradient="from-orange-300 to-orange-600" />
          </section>
        )}

        <section className="space-y-2">
          {list.slice(list.length >= 3 ? 3 : 0).map((r, i) => {
            const rank = (list.length >= 3 ? 3 : 0) + i + 1;
            const isMe = r.id === user?.id;
            return (
              <div key={r.id} className={cn("rounded-2xl border p-3 flex items-center gap-3", isMe ? "bg-primary/10 border-primary" : "bg-card")}>
                <span className="font-display font-bold w-8 text-center text-muted-foreground">{rank}</span>
                <div className="w-10 h-10 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold shrink-0">
                  {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : (r.display_name?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{r.display_name || "Foydalanuvchi"}{isMe && <span className="text-xs text-primary ml-1">(siz)</span>}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2"><Flame className="w-3 h-3 text-streak" />{r.streak_days} <span>L{r.level}</span></p>
                </div>
                <div className="flex items-center gap-1 text-warning font-bold"><Trophy className="w-4 h-4" />{r.xp}</div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
};

const Podium = ({ row, place, height, gradient, crown }: { row: Row; place: number; height: string; gradient: string; crown?: boolean }) => (
  <div className="text-center">
    <div className="relative inline-block mb-2">
      {crown && <Crown className="w-5 h-5 text-yellow-400 absolute -top-4 left-1/2 -translate-x-1/2 fill-yellow-400" />}
      <div className="w-14 h-14 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold mx-auto">
        {row.avatar_url ? <img src={row.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : (row.display_name?.[0] ?? "?").toUpperCase()}
      </div>
    </div>
    <p className="text-xs font-semibold truncate">{row.display_name || "—"}</p>
    <p className="text-xs text-warning font-bold">{row.xp} XP</p>
    <div className={cn("mt-2 rounded-t-2xl bg-gradient-to-b grid place-items-center text-white font-display font-bold text-2xl", height, gradient)}>
      {place === 1 ? <Medal className="w-7 h-7" /> : place}
    </div>
  </div>
);

export default Leaderboard;
