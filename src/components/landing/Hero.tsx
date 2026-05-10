import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Star } from "lucide-react";
import heroImage from "@/assets/hero-dashboard.jpg";
import { useI18n } from "@/contexts/I18nContext";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 overflow-hidden gradient-hero px-4">
      {/* glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-40"
        style={{ background: "var(--gradient-glow)" }}
      />

      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-6">
            <Star className="w-3.5 h-3.5 fill-current" />
            {t("hero.badge")}
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] sm:leading-[1.05] mb-6 break-words">
            {t("hero.title1")}{" "}
            <span className="text-gradient">{t("hero.titleAccent")}</span>
            <br />
            {t("hero.title2")}
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto px-2">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="xl" onClick={() => navigate("/auth")}>
              {t("nav.startFree")}
              <ArrowRight />
            </Button>
            <Button variant="outline" size="xl">
              <Play />
              {t("hero.watchDemo")}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-5">
            {t("hero.noCard")}
          </p>
        </div>

        <div className="mt-16 relative animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 gradient-primary blur-3xl opacity-20 rounded-[2rem]" />
            <img
              src={heroImage}
              alt="FluentUp dashboard preview showing progress charts, XP rewards and vocabulary cards"
              width={1280}
              height={960}
              className="relative rounded-3xl shadow-elegant border border-border/50 w-full"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { v: "50K+", l: "Active learners" },
            { v: "12M+", l: "Words mastered" },
            { v: "98%", l: "Goal completion" },
            { v: "4.9★", l: "App store rating" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-bold text-gradient">
                {s.v}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
