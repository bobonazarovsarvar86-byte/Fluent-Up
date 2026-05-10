import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Upload, Loader2, CheckCircle2, CreditCard, Phone } from "lucide-react";
import { toast } from "sonner";

type Plan = "pro" | "premium";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  plan: Plan;
  period: "monthly" | "yearly";
  amount: number;
};

type Settings = {
  card_number: string;
  card_holder: string;
  phone: string;
  payme_link: string | null;
  click_link: string | null;
  instructions: string | null;
};

const PaymentDialog = ({ open, onOpenChange, plan, period, amount }: Props) => {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<"payme" | "click">("payme");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setFile(null);
    setNote("");
    supabase.from("payment_settings").select("*").limit(1).maybeSingle().then(({ data }) => {
      if (data) setSettings(data as any);
    });
    if (user) {
      supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => {
        if (data?.display_name && !fullName) setFullName(data.display_name);
      });
    }
  }, [open, user]);

  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    toast.success("Nusxa olindi");
  };

  const submit = async () => {
    if (!user) return toast.error("Tizimga kiring");
    if (!fullName.trim() || !phone.trim()) return toast.error("Ism va telefon majburiy");
    if (!file) return toast.error("To'lov chekini yuklang");

    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment_screenshots")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("payment_screenshots").getPublicUrl(path);
      const screenshotUrl = pub.publicUrl;

      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("submit-subscription-request", {
        body: { plan, period, amount, fullName, phone, method, note, screenshotUrl },
      });
      if (res.error) throw res.error;
      setStep(3);
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {step === 1 && settings && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                {plan === "pro" ? "Pro" : "Premium"} — {amount.toLocaleString("uz-UZ")} so'm
              </DialogTitle>
              <DialogDescription>
                Quyidagi rekvizitga to'lov qiling, so'ng "To'ladim" tugmasini bosing.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={method} onValueChange={(v) => setMethod(v as any)}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="payme">Payme</TabsTrigger>
                <TabsTrigger value="click">Click</TabsTrigger>
              </TabsList>
              <TabsContent value="payme" className="space-y-3 mt-4">
                <PayInfo settings={settings} onCopy={copy} />
              </TabsContent>
              <TabsContent value="click" className="space-y-3 mt-4">
                <PayInfo settings={settings} onCopy={copy} />
              </TabsContent>
            </Tabs>

            {settings.instructions && (
              <p className="text-xs text-muted-foreground whitespace-pre-line">{settings.instructions}</p>
            )}

            <Button variant="hero" size="lg" onClick={() => setStep(2)} className="w-full">
              <CheckCircle2 /> To'ladim — chekni yuklash
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Ma'lumotlaringiz</DialogTitle>
              <DialogDescription>
                To'lov chekini va ma'lumotlaringizni yuboring. Admin 24 soat ichida tasdiqlaydi.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Ism familiya</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="To'liq ism" />
              </div>
              <div>
                <Label>Telefon raqam</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
              </div>
              <div>
                <Label>To'lov cheki (screenshot)</Label>
                <label className="block mt-1 cursor-pointer rounded-2xl border-2 border-dashed border-border hover:border-primary/40 p-6 text-center transition-smooth">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      {file.name}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                      <Upload className="w-5 h-5" />
                      Faylni tanlang yoki bosib yuklang
                    </div>
                  )}
                </label>
              </div>
              <div>
                <Label>Izoh (ixtiyoriy)</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Qo'shimcha ma'lumot..." />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={submitting}>
                  Orqaga
                </Button>
                <Button variant="hero" className="flex-1" onClick={submit} disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" /> : "Yuborish"}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full gradient-primary grid place-items-center shadow-glow">
              <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <DialogTitle className="font-display text-2xl">Yuborildi! 🎉</DialogTitle>
            <p className="text-muted-foreground text-sm">
              So'rovingiz qabul qilindi. Admin tasdiqlagach, rejangiz avtomatik faollashadi.
              Holatni Dashboard'da kuzatishingiz mumkin.
            </p>
            <Button variant="hero" className="w-full" onClick={() => onOpenChange(false)}>
              Yopish
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const PayInfo = ({ settings, onCopy }: { settings: Settings; onCopy: (s: string) => void }) => (
  <div className="space-y-3">
    <Row icon={CreditCard} label="Karta raqami" value={settings.card_number} onCopy={onCopy} mono />
    <Row icon={CreditCard} label="Karta egasi" value={settings.card_holder} onCopy={onCopy} />
    <Row icon={Phone} label="Telefon" value={settings.phone} onCopy={onCopy} />
  </div>
);

const Row = ({ icon: Icon, label, value, onCopy, mono }: any) => (
  <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-muted/50 border border-border">
    <div className="flex items-center gap-3 min-w-0">
      <Icon className="w-4 h-4 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-bold truncate ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
    <Button variant="ghost" size="icon" onClick={() => onCopy(value)} aria-label="Copy">
      <Copy className="w-4 h-4" />
    </Button>
  </div>
);

export default PaymentDialog;
