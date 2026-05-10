import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coins, Gift, Check, Sparkles, Flame } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Item = { id: string; slug: string; name: string; description: string | null; category: string; price_coins: number; icon: string | null };

const categories = [
  { key: "avatar", label: "Avatarlar" },
  { key: "theme", label: "Mavzular" },
  { key: "booster", label: "Boosterlar" },
  { key: "freeze", label: "Streak Freeze" },
  { key: "badge", label: "Badge'lar" },
];

const Shop = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState("avatar");
  const [claimable, setClaimable] = useState(false);

  const refresh = async () => {
    if (!user) return;
    const [{ data: p }, { data: it }, { data: inv }] = await Promise.all([
      supabase.from("profiles").select("coins, last_daily_reward_at, daily_reward_streak, equipped_avatar, equipped_theme, streak_freezes, xp_boost_until").eq("id", user.id).maybeSingle(),
      supabase.from("shop_items").select("*").eq("active", true).order("price_coins"),
      supabase.from("user_inventory").select("item_id").eq("user_id", user.id),
    ]);
    setProfile(p);
    setItems((it ?? []) as Item[]);
    setOwned(new Set((inv ?? []).map(r => r.item_id)));
    const last = p?.last_daily_reward_at ? new Date(p.last_daily_reward_at) : null;
    setClaimable(!last || last.toDateString() !== new Date().toDateString());
  };

  useEffect(() => { refresh(); }, [user]);

  const claim = async () => {
    if (!user) return;
    setBusy("daily");
    const { data, error } = await supabase.rpc("claim_daily_reward", { _user_id: user.id });
    setBusy(null);
    if (error) return toast.error(error.message);
    const r = data as any;
    if (r?.claimed) toast.success(`+${r.reward} coins! 🔥 ${r.streak} kunlik streak`);
    else toast.info("Bugun allaqachon olgansiz");
    refresh();
  };

  const buy = async (item: Item) => {
    if (!user) return;
    if ((profile?.coins ?? 0) < item.price_coins) return toast.error("Tangalar yetarli emas");
    setBusy(item.id);
    const { data, error } = await supabase.rpc("purchase_shop_item", { _user_id: user.id, _item_id: item.id });
    setBusy(null);
    if (error) return toast.error(error.message);
    const r = data as any;
    if (r?.success) toast.success("Sotib olindi! 🎉");
    else toast.error(r?.reason === "already_owned" ? "Allaqachon mavjud" : "Xato");
    refresh();
  };

  const equip = async (item: Item) => {
    if (!user) return;
    setBusy(item.id);
    const { error } = await supabase.rpc("equip_item", { _user_id: user.id, _item_id: item.id });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("O'rnatildi");
    refresh();
  };

  const filtered = items.filter(i => i.category === tab);

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="container flex h-14 items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <h1 className="font-display font-bold">Shop</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10">
            <Coins className="w-4 h-4 text-warning" />
            <span className="font-bold">{profile?.coins ?? 0}</span>
          </div>
        </div>
      </header>

      <div className="container py-6 px-4 space-y-6 max-w-4xl">
        {/* Daily reward */}
        <section className="rounded-3xl gradient-primary p-6 text-primary-foreground flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="w-14 h-14 rounded-2xl bg-white/20 grid place-items-center shrink-0">
            <Gift className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-lg">Kunlik mukofot</h3>
            <p className="text-sm opacity-90 flex items-center gap-1">
              <Flame className="w-3 h-3" /> {profile?.daily_reward_streak ?? 0} kunlik streak — har kun ortadi
            </p>
          </div>
          <Button onClick={claim} disabled={!claimable || busy === "daily"} variant="secondary" className="bg-white text-foreground hover:bg-white/90 shrink-0">
            {claimable ? "Olish" : "Olingan"}
          </Button>
        </section>

        {/* Active boosts */}
        {(profile?.xp_boost_until && new Date(profile.xp_boost_until) > new Date()) || profile?.streak_freezes ? (
          <section className="grid sm:grid-cols-2 gap-3">
            {profile?.xp_boost_until && new Date(profile.xp_boost_until) > new Date() && (
              <div className="rounded-2xl bg-card border p-4 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-warning" />
                <div className="text-sm"><p className="font-semibold">XP Booster faol</p><p className="text-muted-foreground text-xs">2x XP</p></div>
              </div>
            )}
            {profile?.streak_freezes > 0 && (
              <div className="rounded-2xl bg-card border p-4 flex items-center gap-3">
                <span className="text-2xl">🧊</span>
                <div className="text-sm"><p className="font-semibold">Streak Freeze: {profile.streak_freezes}</p><p className="text-muted-foreground text-xs">streakingizni himoya qiladi</p></div>
              </div>
            )}
          </section>
        ) : null}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(c => (
            <button key={c.key} onClick={() => setTab(c.key)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-smooth", tab === c.key ? "gradient-primary text-primary-foreground shadow-glow" : "bg-card border")}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Items */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(item => {
            const isOwned = owned.has(item.id);
            const isEquipped = (item.category === "avatar" && profile?.equipped_avatar === item.slug) ||
                               (item.category === "theme" && profile?.equipped_theme === item.slug);
            const consumable = item.category === "booster" || item.category === "freeze";
            return (
              <div key={item.id} className="rounded-3xl bg-card border p-5 hover:shadow-elegant transition-smooth flex flex-col">
                <div className="text-5xl mb-3">{item.icon ?? "🎁"}</div>
                <h3 className="font-display font-bold">{item.name}</h3>
                <p className="text-xs text-muted-foreground mb-3 flex-1">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 font-bold text-warning"><Coins className="w-4 h-4" />{item.price_coins}</div>
                  {consumable ? (
                    <Button size="sm" variant="hero" disabled={busy === item.id} onClick={() => buy(item)}>Sotib olish</Button>
                  ) : isOwned ? (
                    isEquipped ? (
                      <Button size="sm" variant="soft" disabled><Check className="w-3 h-3" />O'rnatilgan</Button>
                    ) : (
                      <Button size="sm" variant="soft" disabled={busy === item.id} onClick={() => equip(item)}>O'rnatish</Button>
                    )
                  ) : (
                    <Button size="sm" variant="hero" disabled={busy === item.id} onClick={() => buy(item)}>Sotib olish</Button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
};

export default Shop;
