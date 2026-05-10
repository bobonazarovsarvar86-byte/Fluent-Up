import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan, type Plan } from "@/hooks/usePlan";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, ArrowLeft, Crown, Zap, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PaymentDialog from "@/components/PaymentDialog";

type Period = "monthly" | "yearly";

type PricingPlan = {
  key: Plan;
  name: string;
  tagline: string;
  monthlyUzs: number;
  yearlyUzs: number;
  features: string[];
  badge?: string;
  popular?: boolean;
  icon: any;
};

const PLANS: PricingPlan[] = [
  {
    key: "free",
    name: "Free",
    tagline: "Tatib ko'ring",
    monthlyUzs: 0,
    yearlyUzs: 0,
    icon: Star,
    features: [
      "Kuniga 3 ta dars",
      "A1 va A2 darajalari",
      "Asosiy lug'at va grammatika",
      "Reklamalar bilan",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    tagline: "Eng mashhur tanlov",
    monthlyUzs: 49000,
    yearlyUzs: 390000,
    badge: "Eng mashhur",
    popular: true,
    icon: Zap,
    features: [
      "Cheksiz darslar — har kuni",
      "A1 dan B2 gacha barcha darajalar",
      "AI bilan Speaking suhbatlar",
      "AI generatsiyalangan Listening",
      "AI Tutor — istalgan savol",
      "Reklamalarsiz",
      "Smart spaced repetition",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    tagline: "Maksimal natija",
    monthlyUzs: 99000,
    yearlyUzs: 790000,
    icon: Crown,
    features: [
      "Pro'dagi hammasi",
      "C1 va C2 — IELTS darajasi",
      "Shaxsiy o'rganish yo'l xaritasi",
      "Kengaytirilgan analitika",
      "Ustuvor qo'llab-quvvatlash",
      "Ekskluziv Premium kontent",
      "Yangi xususiyatlardan birinchi foydalanish",
    ],
  },
];

const formatUzs = (n: number) =>
  n === 0 ? "0" : new Intl.NumberFormat("uz-UZ").format(n);

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plan: currentPlan } = usePlan();
  const [period, setPeriod] = useState<Period>("monthly");
  const [upgrading, setUpgrading] = useState<Plan | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payPlan, setPayPlan] = useState<"pro" | "premium">("pro");
  const [payAmount, setPayAmount] = useState(0);

  useEffect(() => {
    document.title = "Tariflar — FluentUp";
    const desc = "FluentUp tariflari: Free, Pro va Premium. Englify uslubidagi AI bilan ingliz tilini o'rganing.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  const choose = async (p: PricingPlan) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (p.key === currentPlan) {
      toast.info("Siz allaqachon ushbu rejadasiz");
      return;
    }
    if (p.key === "free") {
      // downgrade
      setUpgrading(p.key);
      const { error } = await supabase
        .from("profiles")
        .update({ plan: "free", plan_expires_at: null } as any)
        .eq("id", user.id);
      setUpgrading(null);
      if (error) return toast.error(error.message);
      toast.success("Free rejaga o'tdingiz");
      navigate("/dashboard");
      return;
    }
    // Paid — open payment dialog
    setPayPlan(p.key as "pro" | "premium");
    setPayAmount(period === "yearly" ? p.yearlyUzs : p.monthlyUzs);
    setPayOpen(true);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between px-3 sm:px-4">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-display font-bold">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </span>
            FluentUp
          </Link>
          <Link to={user ? "/dashboard" : "/"}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Orqaga</span>
            </Button>
          </Link>
        </div>
      </header>

      <section className="gradient-hero py-12 sm:py-20">
        <div className="container text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Tariflar
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold leading-tight mb-4">
            O'zingizga mos <span className="text-gradient">rejani tanlang</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-8">
            Bepul boshlang. Tayyor bo'lganingizda upgrade qiling. Istalgan vaqt bekor qiling.
          </p>

          {/* Period toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-card border border-border shadow-sm">
            <button
              onClick={() => setPeriod("monthly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-smooth",
                period === "monthly" ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"
              )}
            >
              Oylik
            </button>
            <button
              onClick={() => setPeriod("yearly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-smooth flex items-center gap-1.5",
                period === "yearly" ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"
              )}
            >
              Yillik
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                period === "yearly" ? "bg-white/25" : "bg-success/15 text-success",
              )}>
                -33%
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {PLANS.map((p) => {
              const price = period === "yearly" ? p.yearlyUzs : p.monthlyUzs;
              const monthlyEq = period === "yearly" && p.yearlyUzs > 0 ? Math.round(p.yearlyUzs / 12) : null;
              const isCurrent = currentPlan === p.key;
              const Icon = p.icon;
              return (
                <div
                  key={p.key}
                  className={cn(
                    "relative p-7 sm:p-8 rounded-3xl border bg-card transition-smooth flex flex-col",
                    p.popular
                      ? "border-primary/40 shadow-glow md:scale-[1.04] z-10"
                      : "border-border hover:shadow-elegant hover:border-primary/20"
                  )}
                >
                  {p.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold flex items-center gap-1 shadow-glow whitespace-nowrap">
                      <Sparkles className="w-3 h-3" />
                      {p.badge}
                    </div>
                  )}

                  <div className={cn(
                    "w-12 h-12 rounded-2xl grid place-items-center mb-4",
                    p.popular ? "gradient-primary shadow-glow" : "bg-muted",
                  )}>
                    <Icon className={cn("w-6 h-6", p.popular ? "text-primary-foreground" : "text-foreground")} />
                  </div>

                  <h3 className="font-display text-2xl font-bold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mb-5">{p.tagline}</p>

                  <div className="mb-1">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-display text-4xl sm:text-5xl font-bold">
                        {formatUzs(price)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {p.monthlyUzs === 0 ? "so'm" : period === "yearly" ? "so'm/yil" : "so'm/oy"}
                      </span>
                    </div>
                    {monthlyEq && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ≈ {formatUzs(monthlyEq)} so'm/oy
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => choose(p)}
                    variant={p.popular ? "hero" : isCurrent ? "outline" : "soft"}
                    size="lg"
                    className="w-full mt-6 mb-6"
                    disabled={upgrading !== null || isCurrent}
                  >
                    {upgrading === p.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrent ? (
                      "Joriy reja"
                    ) : p.key === "free" ? (
                      "Bepul boshlash"
                    ) : (
                      `${p.name}'ga o'tish`
                    )}
                  </Button>

                  <ul className="space-y-2.5 mt-auto">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <span className={cn(
                          "shrink-0 w-5 h-5 rounded-full grid place-items-center mt-0.5",
                          p.popular ? "gradient-primary" : "bg-primary/10",
                        )}>
                          <Check className={cn("w-3 h-3", p.popular ? "text-primary-foreground" : "text-primary")} />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-12">
            Tez orada: Click • Payme • Uzum • Visa • Mastercard
          </p>
        </div>
      </section>
      <PaymentDialog open={payOpen} onOpenChange={setPayOpen} plan={payPlan} period={period} amount={payAmount} />
    </main>
  );
};

export default Pricing;
