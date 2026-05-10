import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import {
  Sparkles, ArrowLeft, Smartphone, Download, Apple, Chrome,
  Share, Plus, MoreVertical, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const Install = () => {
  const { canInstall, isInstalled, isIOS, isAndroid, promptInstall } = useInstallPrompt();

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") toast.success("FluentUp o'rnatildi! 🎉");
    else if (outcome === "dismissed") toast.info("O'rnatish bekor qilindi");
    else toast.info("Brauzeringiz tugmasini ko'rsatmadi. Quyidagi yo'riqnomadan foydalaning.");
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between gap-2 px-3 sm:px-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </span>
            <span className="hidden xs:inline">FluentUp</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Orqaga</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-8 max-w-2xl space-y-6 px-3 sm:px-4">
        <section className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-3xl gradient-primary grid place-items-center shadow-glow">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">
            FluentUp'ni telefoningizga o'rnating
          </h1>
          <p className="text-muted-foreground">
            Brauzersiz, tezroq, App Store kerak emas. Bir bosishda ilovaga aylanadi.
          </p>
        </section>

        {isInstalled ? (
          <div className="rounded-3xl bg-success/10 border-2 border-success/30 p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 mx-auto text-success" />
            <h2 className="font-display text-xl font-bold">Allaqachon o'rnatilgan ✨</h2>
            <p className="text-sm text-muted-foreground">
              Siz FluentUp'ni ilova sifatida ishlatayapsiz.
            </p>
          </div>
        ) : canInstall ? (
          <div className="rounded-3xl gradient-primary p-6 sm:p-8 text-primary-foreground text-center space-y-4 shadow-glow">
            <h2 className="font-display text-2xl font-bold">Bir bosishda o'rnatish</h2>
            <p className="opacity-90 text-sm">
              Brauzeringiz qo'llab-quvvatlaydi. Quyidagi tugmani bosing:
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleInstall}
              className="bg-white text-foreground hover:bg-white/90 w-full sm:w-auto"
            >
              <Download className="w-5 h-5" />
              Hozir o'rnatish
            </Button>
          </div>
        ) : (
          <div className="rounded-3xl bg-card border border-border p-5 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Telefoningizdan ushbu sahifani oching va quyidagi yo'riqnomadan foydalaning ⤵️
            </p>
          </div>
        )}

        {/* iOS Instructions */}
        <div className={`rounded-3xl bg-card border-2 ${isIOS ? "border-primary/30 shadow-glow" : "border-border"} p-5 sm:p-6 space-y-4`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-foreground grid place-items-center">
              <Apple className="w-6 h-6 text-background" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">iPhone / iPad</h3>
              <p className="text-xs text-muted-foreground">Safari brauzerida</p>
            </div>
          </div>

          <ol className="space-y-3">
            <Step
              num={1}
              title="Safari'da oching"
              desc="Bu sahifani Chrome'da emas, Safari'da oching."
            />
            <Step
              num={2}
              title={
                <span className="flex items-center gap-2 flex-wrap">
                  Pastdagi <Share className="w-4 h-4 inline text-primary" /> Share tugmasini bosing
                </span>
              }
              desc="Ekran pastida (yoki yuqorida iPad'da) yuqoriga strelka belgisi."
            />
            <Step
              num={3}
              title={
                <span className="flex items-center gap-2 flex-wrap">
                  <Plus className="w-4 h-4 inline text-primary" /> "Add to Home Screen" tanlang
                </span>
              }
              desc="Ro'yxatdan pastga aylantirib toping."
            />
            <Step
              num={4}
              title="O'ng yuqoridagi 'Add' tugmasini bosing"
              desc="FluentUp ikonkasi telefon ekraningizga qo'shiladi."
            />
          </ol>
        </div>

        {/* Android Instructions */}
        <div className={`rounded-3xl bg-card border-2 ${isAndroid ? "border-primary/30 shadow-glow" : "border-border"} p-5 sm:p-6 space-y-4`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 grid place-items-center">
              <Chrome className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">Android</h3>
              <p className="text-xs text-muted-foreground">Chrome brauzerida</p>
            </div>
          </div>

          <ol className="space-y-3">
            <Step
              num={1}
              title="Chrome'da oching"
              desc="Bu sahifani Google Chrome brauzerida oching."
            />
            <Step
              num={2}
              title={
                <span className="flex items-center gap-2 flex-wrap">
                  O'ng yuqoridagi <MoreVertical className="w-4 h-4 inline text-primary" /> menyusini bosing
                </span>
              }
              desc="Uch nuqta belgisi."
            />
            <Step
              num={3}
              title={'"Install app" yoki "Add to Home screen" tanlang'}
              desc="Brauzer versiyasiga qarab biri ko'rinadi."
            />
            <Step
              num={4}
              title="Tasdiqlang"
              desc="FluentUp ilova sifatida o'rnatiladi va telefon ekranida paydo bo'ladi."
            />
          </ol>
        </div>

        {/* Benefits */}
        <div className="rounded-3xl bg-card border border-border p-5 sm:p-6 space-y-3">
          <h3 className="font-display text-lg font-bold">Nima uchun o'rnatish kerak?</h3>
          <ul className="space-y-2 text-sm">
            <Benefit text="Brauzer paneli ko'rinmaydi — to'liq ekran ilova" />
            <Benefit text="Tezroq ochiladi va silliqroq ishlaydi" />
            <Benefit text="Telefon ekranidan bir bosish bilan kirish" />
            <Benefit text="App Store yoki Play Store kerak emas — bepul" />
            <Benefit text="Joy egallamaydi (bir necha MB)" />
          </ul>
        </div>
      </div>
    </main>
  );
};

const Step = ({ num, title, desc }: { num: number; title: React.ReactNode; desc: string }) => (
  <li className="flex gap-3">
    <span className="shrink-0 w-7 h-7 rounded-full gradient-primary text-primary-foreground grid place-items-center font-bold text-sm shadow-glow">
      {num}
    </span>
    <div className="flex-1 pt-0.5">
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  </li>
);

const Benefit = ({ text }: { text: string }) => (
  <li className="flex items-start gap-2">
    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
    <span className="text-muted-foreground">{text}</span>
  </li>
);

export default Install;
