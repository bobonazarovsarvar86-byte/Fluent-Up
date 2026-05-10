import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, ArrowLeft, Users, Trophy, Flame, Coins,
  Search, Shield, ShieldOff, LogOut, RefreshCcw, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AdminUser = {
  id: string;
  display_name: string | null;
  english_level: string | null;
  learning_goal: string | null;
  xp: number;
  coins: number;
  level: number;
  streak_days: number;
  onboarding_completed: boolean;
  created_at: string;
};

type RoleRow = { user_id: string; role: string };

const Admin = () => {
  const { signOut } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roleRows }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, english_level, learning_goal, xp, coins, level, streak_days, onboarding_completed, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setUsers((profiles as AdminUser[]) ?? []);
    setRoles((roleRows as RoleRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const adminIds = useMemo(
    () => new Set(roles.filter((r) => r.role === "admin").map((r) => r.user_id)),
    [roles],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.display_name ?? "").toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  }, [users, query]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.streak_days > 0).length;
    const totalXp = users.reduce((s, u) => s + (u.xp ?? 0), 0);
    const totalCoins = users.reduce((s, u) => s + (u.coins ?? 0), 0);
    return { total, active, totalXp, totalCoins };
  }, [users]);

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    if (currentlyAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Admin huquqi olib tashlandi");
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Admin qilindi");
    }
    load();
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </span>
            FluentUp
            <span className="ml-2 text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Log out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-6">
        <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Admin Panel</h1>
            <p className="text-muted-foreground">
              Foydalanuvchilarni boshqaring va platforma statistikasini kuzating.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/payments">
              <Button variant="outline">
                💳 To'lovlar
              </Button>
            </Link>
            <Link to="/admin/lessons">
              <Button variant="hero">
                <BookOpen className="w-4 h-4" />
                Darsliklar
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BigStat icon={Users} label="Foydalanuvchilar" value={stats.total} color="bg-primary/10 text-primary" />
          <BigStat icon={Flame} label="Faol (streak)" value={stats.active} color="bg-streak/10 text-streak" />
          <BigStat icon={Trophy} label="Jami XP" value={stats.totalXp} color="bg-success/10 text-success" />
          <BigStat icon={Coins} label="Jami coins" value={stats.totalCoins} color="bg-warning/10 text-warning" />
        </section>

        <section className="rounded-3xl bg-card border border-border overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-b border-border">
            <div>
              <h2 className="font-display text-xl font-bold">Foydalanuvchilar</h2>
              <p className="text-sm text-muted-foreground">
                Jami {filtered.length} ta foydalanuvchi
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ism yoki ID bo'yicha qidiring"
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
                <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Foydalanuvchi</th>
                  <th className="text-left px-4 py-3">Daraja</th>
                  <th className="text-left px-4 py-3">Maqsad</th>
                  <th className="text-right px-4 py-3">Level</th>
                  <th className="text-right px-4 py-3">XP</th>
                  <th className="text-right px-4 py-3">Streak</th>
                  <th className="text-right px-4 py-3">Coins</th>
                  <th className="text-center px-4 py-3">Onboarding</th>
                  <th className="text-right px-4 py-3">Amal</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      Yuklanmoqda...
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      Foydalanuvchilar topilmadi.
                    </td>
                  </tr>
                )}
                {filtered.map((u) => {
                  const isAdmin = adminIds.has(u.id);
                  return (
                    <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full gradient-primary grid place-items-center text-primary-foreground text-xs font-bold">
                            {(u.display_name ?? "?").slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {u.display_name ?? "—"}
                              {isAdmin && (
                                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {u.id.slice(0, 8)}…
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize">{u.english_level ?? "—"}</td>
                      <td className="px-4 py-3 capitalize">{u.learning_goal ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-bold">{u.level}</td>
                      <td className="px-4 py-3 text-right">{u.xp}</td>
                      <td className="px-4 py-3 text-right">{u.streak_days}</td>
                      <td className="px-4 py-3 text-right">{u.coins}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-semibold",
                          u.onboarding_completed
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {u.onboarding_completed ? "Tugatgan" : "Tugatmagan"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant={isAdmin ? "outline" : "soft"}
                          size="sm"
                          onClick={() => toggleAdmin(u.id, isAdmin)}
                        >
                          {isAdmin ? (
                            <>
                              <ShieldOff className="w-4 h-4" />
                              Admin olish
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              Admin qilish
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};

const BigStat = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) => (
  <div className="rounded-3xl bg-card border border-border p-5">
    <div className={cn("w-10 h-10 rounded-xl grid place-items-center mb-3", color)}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-xs text-muted-foreground uppercase font-semibold">{label}</p>
    <p className="font-display text-2xl font-bold">{value}</p>
  </div>
);

export default Admin;
