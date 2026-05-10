import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import LanguageToggle from "@/components/LanguageToggle";

const Navbar = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const links = [
    { label: t("nav.features"), href: "/#features" },
    { label: t("nav.skills"), href: "/#skills" },
    { label: t("nav.aiTutor"), href: "/#ai-tutor" },
    { label: t("nav.pricing"), href: "/pricing" },
    { label: t("nav.faq"), href: "/#faq" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-smooth",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/60"
          : "bg-transparent",
      )}
    >
      <nav className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </span>
          FluentUp
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <LanguageToggle />
          {user ? (
            <Button variant="hero" size="sm" onClick={() => navigate("/dashboard")}>
              {t("nav.dashboard")}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                {t("nav.login")}
              </Button>
              <Button variant="hero" size="sm" onClick={() => navigate("/auth")}>
                {t("nav.startFree")}
              </Button>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg hover:bg-accent"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container py-4 flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium"
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2 items-center">
              <LanguageToggle />
              {user ? (
                <Button variant="hero" size="sm" className="flex-1" onClick={() => navigate("/dashboard")}>
                  {t("nav.dashboard")}
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate("/auth")}>
                    {t("nav.login")}
                  </Button>
                  <Button variant="hero" size="sm" className="flex-1" onClick={() => navigate("/auth")}>
                    {t("nav.startFree")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
