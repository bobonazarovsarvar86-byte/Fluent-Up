import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, UserPlus, Check, X, Search, Trophy, Flame, Swords } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ChallengeDialog from "@/components/ChallengeDialog";

type Profile = { id: string; display_name: string | null; avatar_url: string | null; xp: number; streak_days: number; level: number };
type Friendship = { id: string; sender_id: string; receiver_id: string; status: string };

const Friends = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"friends"|"requests"|"search">("friends");
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [challengeTarget, setChallengeTarget] = useState<Profile | null>(null);

  const refresh = async () => {
    if (!user) return;
    const { data: f } = await supabase.from("friendships")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
    setFriendships((f ?? []) as Friendship[]);
    const ids = Array.from(new Set((f ?? []).flatMap(r => [r.sender_id, r.receiver_id]).filter(id => id !== user.id)));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, display_name, avatar_url, xp, streak_days, level").in("id", ids);
      const map: Record<string, Profile> = {};
      (ps ?? []).forEach(p => map[p.id] = p as Profile);
      setProfiles(map);
    } else { setProfiles({}); }
  };

  useEffect(() => { refresh(); }, [user]);

  const search = async () => {
    if (!query.trim()) return;
    const { data } = await supabase.from("profiles")
      .select("id, display_name, avatar_url, xp, streak_days, level")
      .ilike("display_name", `%${query.trim()}%`)
      .limit(20);
    setSearchResults(((data ?? []) as Profile[]).filter(p => p.id !== user?.id));
  };

  const sendRequest = async (receiverId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({ sender_id: user.id, receiver_id: receiverId });
    if (error) return toast.error(error.message.includes("duplicate") ? "Allaqachon yuborilgan" : error.message);
    toast.success("So'rov yuborildi");
    refresh();
  };

  const respond = async (id: string, accept: boolean) => {
    const { error } = await supabase.rpc("respond_friend_request", { _request_id: id, _accept: accept });
    if (error) return toast.error(error.message);
    toast.success(accept ? "Qabul qilindi" : "Rad etildi");
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const accepted = friendships.filter(f => f.status === "accepted");
  const incoming = friendships.filter(f => f.status === "pending" && f.receiver_id === user?.id);
  const outgoing = friendships.filter(f => f.status === "pending" && f.sender_id === user?.id);

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="container flex h-14 items-center gap-3 px-4">
          <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-display font-bold">Do'stlar</h1>
          <Link to="/leaderboard" className="ml-auto"><Button variant="soft" size="sm"><Trophy className="w-4 h-4" />Reyting</Button></Link>
        </div>
      </header>

      <div className="container py-6 px-4 max-w-3xl space-y-5">
        <div className="flex gap-2">
          {[
            { k: "friends", l: `Do'stlar (${accepted.length})` },
            { k: "requests", l: `So'rovlar (${incoming.length})` },
            { k: "search", l: "Qidirish" },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as any)} className={cn("px-4 py-2 rounded-full text-sm font-medium transition-smooth", tab === t.k ? "gradient-primary text-primary-foreground shadow-glow" : "bg-card border")}>
              {t.l}
            </button>
          ))}
        </div>

        {tab === "friends" && (
          <section className="space-y-3">
            {accepted.length === 0 && <Empty msg="Hali do'stlaringiz yo'q. Qidirish orqali toping." />}
            {accepted.map(f => {
              const otherId = f.sender_id === user?.id ? f.receiver_id : f.sender_id;
              const p = profiles[otherId];
              if (!p) return null;
              return <FriendRow key={f.id} p={p} onChallenge={() => setChallengeTarget(p)} onRemove={() => remove(f.id)} />;
            })}
          </section>
        )}

        {tab === "requests" && (
          <section className="space-y-3">
            {incoming.length === 0 && outgoing.length === 0 && <Empty msg="Yangi so'rovlar yo'q." />}
            {incoming.map(f => {
              const p = profiles[f.sender_id]; if (!p) return null;
              return (
                <div key={f.id} className="rounded-2xl bg-card border p-4 flex items-center gap-3">
                  <Avatar p={p} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.display_name || "Foydalanuvchi"}</p>
                    <p className="text-xs text-muted-foreground">Sizga so'rov yubordi</p>
                  </div>
                  <Button size="icon" variant="hero" onClick={() => respond(f.id, true)}><Check className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => respond(f.id, false)}><X className="w-4 h-4" /></Button>
                </div>
              );
            })}
            {outgoing.length > 0 && <p className="text-xs text-muted-foreground pt-2">Yuborilgan: {outgoing.length}</p>}
            {outgoing.map(f => {
              const p = profiles[f.receiver_id]; if (!p) return null;
              return (
                <div key={f.id} className="rounded-2xl bg-card border p-4 flex items-center gap-3 opacity-70">
                  <Avatar p={p} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.display_name || "Foydalanuvchi"}</p>
                    <p className="text-xs text-muted-foreground">Kutilmoqda...</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>Bekor</Button>
                </div>
              );
            })}
          </section>
        )}

        {tab === "search" && (
          <section className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Ism bo'yicha qidiring..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
              <Button onClick={search}><Search className="w-4 h-4" /></Button>
            </div>
            {searchResults.map(p => {
              const existing = friendships.find(f => f.sender_id === p.id || f.receiver_id === p.id);
              return (
                <div key={p.id} className="rounded-2xl bg-card border p-4 flex items-center gap-3">
                  <Avatar p={p} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.display_name || "Foydalanuvchi"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2"><Trophy className="w-3 h-3" />{p.xp} XP <Flame className="w-3 h-3 text-streak" />{p.streak_days}</p>
                  </div>
                  {existing ? (
                    <span className="text-xs text-muted-foreground capitalize">{existing.status}</span>
                  ) : (
                    <Button size="sm" variant="hero" onClick={() => sendRequest(p.id)}><UserPlus className="w-4 h-4" />Qo'shish</Button>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </div>

      {challengeTarget && <ChallengeDialog opponent={challengeTarget} onClose={() => setChallengeTarget(null)} />}
    </main>
  );
};

const Avatar = ({ p }: { p: Profile }) => (
  <div className="w-10 h-10 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold shrink-0">
    {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : (p.display_name?.[0] ?? "?").toUpperCase()}
  </div>
);

const FriendRow = ({ p, onChallenge, onRemove }: { p: Profile; onChallenge: () => void; onRemove: () => void }) => (
  <div className="rounded-2xl bg-card border p-4 flex items-center gap-3">
    <Avatar p={p} />
    <div className="flex-1 min-w-0">
      <p className="font-semibold truncate">{p.display_name || "Foydalanuvchi"}</p>
      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <Trophy className="w-3 h-3" />{p.xp} XP
        <Flame className="w-3 h-3 text-streak" />{p.streak_days}
        <span>L{p.level}</span>
      </p>
    </div>
    <Button size="sm" variant="hero" onClick={onChallenge}><Swords className="w-4 h-4" />Challenge</Button>
    <Button size="icon" variant="ghost" onClick={onRemove}><X className="w-4 h-4" /></Button>
  </div>
);

const Empty = ({ msg }: { msg: string }) => (
  <div className="rounded-3xl bg-card border p-10 text-center text-muted-foreground">{msg}</div>
);

export default Friends;
