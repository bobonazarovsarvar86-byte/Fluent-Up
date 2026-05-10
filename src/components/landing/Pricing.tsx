import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "0",
    period: "so'm",
    desc: "Tatib ko'ring — kuniga 3 ta dars.",
    icon: Star,
    features: [
      "Kuniga 3 ta dars",
      "A1 va A2 darajalari",
      "Asosiy lug'at va grammatika",
      "Reklamalar bilan",
    ],
    cta: "Bepul boshlash",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "49 000",
    period: "so'm/oy",
    desc: "Eng mashhur tanlov — to'liq imkoniyat.",
    icon: Zap,
    features: [
      "Cheksiz darslar",
      "A1 dan B2 gacha barcha darajalar",
      "AI bilan Speaking suhbatlar",
      "AI generatsiyalangan Listening",
      "AI Tutor — istalgan savol",
      "Reklamalarsiz",
    ],
    cta: "Pro'ga o'tish",
    variant: "hero" as const,
    popular: true,
    badge: "Eng mashhur",
  },
  {
    name: "Premium",
    price: "99 000",
    period: "so'm/oy",
    desc: "Maksimal natija — IELTS uchun.",
    icon: Crown,
    features: [
      "Pro'dagi hammasi",
      "C1 va C2 — IELTS darajasi",
      "Shaxsiy yo'l xaritasi",
      "Kengaytirilgan analitika",
      "Ustuvor qo'llab-quvvatlash",
    ],
    cta: "Premium tanlash",
    variant: "outline" as const,
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  return (
    <section id="pricing" className="py-16 sm:py-20 lg:py-28">
      <div className="container px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-14">
          <p className="text-xs sm:text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
            Tariflar
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Oddiy rejalar.{" "}
            <span className="text-gradient">Haqiqiy natija.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Bepul boshlang. Tayyor bo'lganingizda upgrade qiling.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-6xl mx-auto">
          {plans.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className={cn(
                  "relative p-7 sm:p-8 rounded-3xl border bg-card transition-smooth flex flex-col",
                  p.popular
                    ? "border-primary/40 shadow-glow lg:scale-[1.04] z-10 sm:col-span-2 lg:col-auto"
                    : "border-border hover:shadow-elegant hover:border-primary/20",
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
                <p className="text-sm text-muted-foreground mb-5">{p.desc}</p>

                <div className="flex items-baseline gap-1.5 flex-wrap mb-1">
                  <span className="font-display text-4xl sm:text-5xl font-bold">{p.price}</span>
                  <span className="text-muted-foreground text-sm">{p.period}</span>
                </div>

                <Button
                  variant={p.variant}
                  className="w-full mt-6 mb-6"
                  size="lg"
                  onClick={() => navigate("/pricing")}
                >
                  {p.cta}
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

        <p className="text-center text-sm text-muted-foreground mt-10">
          Tez orada: Click • Payme • Uzum • Visa • Mastercard
        </p>
      </div>
    </section>
  );
};

export default Pricing;
