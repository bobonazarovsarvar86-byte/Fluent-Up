import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle2, XCircle, RefreshCcw, Sparkles, ExternalLink, Settings } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Req = {
  id: string;
  user_id: string;
  plan: string;
  period: string;
  amount_uzs: number;
  full_name: string;
  phone: string;
  method: string;
  note: string | null;
  screenshot_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
};

const AdminPayments = () => {
  const [items, setItems] = useState<Req[]>([]);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("subscription_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as Req[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase.from("payment_settings").select("*").limit(1).maybeSingle().then(({ data }) => setSettings(data));
  }, []);

  const filtered = items.filter((i) => i.status === tab);

  const act = async (id: string, type: "approve" | "reject") => {
    const note = type === "reject" ? prompt("Rad etish sababi (ixtiyoriy):") ?? "" : "";
    const fn = type === "approve" ? "approve_subscription_request" : "reject_subscription_request";
    const { error } = await supabase.rpc(fn as any, { _request_id: id, _admin_note: note });
    if (error) return toast.error(error.message);
    toast.success(type === "approve" ? "Tasdiqlandi va reja faollashtirildi" : "Rad etildi");
    load();
  };

  const saveSettings = async () => {
    const { error } = await supabase.from("payment_settings").update({
      card_number: settings.card_number,
      card_holder: settings.card_holder,
      phone: settings.phone,
      instructions: settings.instructions,
      updated_at: new Date().toISOString(),
    }).eq("id", settings.id);
    if (error) return toast.error(error.message);
    toast.success("Saqlandi");
    setSettingsOpen(false);
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between gap-4 px-4">
          <Link to="/admin" className="flex items-center gap-2 font-display font-bold">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </span>
            FluentUp
            <span className="ml-2 text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              To'lovlar
            </span>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <Settings className="w-4 h-4" /> Sozlash
            </Button>
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" /> Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-6 px-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold">To'lov so'rovlari</h1>
          <Button variant="outline" size="icon" onClick={load}>
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="pending">
              Kutilmoqda ({items.filter((i) => i.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="approved">Tasdiqlangan</TabsTrigger>
            <TabsTrigger value="rejected">Rad etilgan</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-12">Hozircha yo'q.</p>
          )}
          {filtered.map((r) => (
            <div key={r.id} className="rounded-3xl bg-card border border-border p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold">{r.full_name}</h3>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("uz-UZ")}</p>
                </div>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold uppercase",
                  r.plan === "premium" ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary",
                )}>
                  {r.plan} {r.period === "yearly" ? "/ yil" : ""}
                </span>
              </div>

              <div className="text-sm space-y-1">
                <p>📞 {r.phone}</p>
                <p>💰 <b>{r.amount_uzs.toLocaleString("uz-UZ")}</b> so'm — {r.method}</p>
                {r.note && <p className="text-muted-foreground italic">"{r.note}"</p>}
              </div>

              {r.screenshot_url && (
                <a href={r.screenshot_url} target="_blank" rel="noreferrer" className="block">
                  <img src={r.screenshot_url} alt="Chek" className="w-full h-40 object-cover rounded-xl border border-border" />
                </a>
              )}

              {r.status === "pending" ? (
                <div className="flex gap-2">
                  <Button variant="hero" size="sm" className="flex-1" onClick={() => act(r.id, "approve")}>
                    <CheckCircle2 className="w-4 h-4" /> Tasdiqlash
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => act(r.id, "reject")}>
                    <XCircle className="w-4 h-4" /> Rad etish
                  </Button>
                </div>
              ) : (
                <div className={cn(
                  "text-xs font-bold uppercase text-center py-2 rounded-xl",
                  r.status === "approved" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                )}>
                  {r.status === "approved" ? "✓ Tasdiqlandi" : "✗ Rad etildi"}
                  {r.admin_note && <p className="font-normal mt-1">{r.admin_note}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>To'lov rekvizitlari</DialogTitle>
          </DialogHeader>
          {settings && (
            <div className="space-y-3">
              <div>
                <Label>Karta raqami</Label>
                <Input value={settings.card_number} onChange={(e) => setSettings({ ...settings, card_number: e.target.value })} />
              </div>
              <div>
                <Label>Karta egasi</Label>
                <Input value={settings.card_holder} onChange={(e) => setSettings({ ...settings, card_holder: e.target.value })} />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
              </div>
              <div>
                <Label>Yo'riqnoma (ixtiyoriy)</Label>
                <Input value={settings.instructions ?? ""} onChange={(e) => setSettings({ ...settings, instructions: e.target.value })} />
              </div>
              <Button variant="hero" className="w-full" onClick={saveSettings}>Saqlash</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default AdminPayments;
