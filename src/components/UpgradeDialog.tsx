import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Check, Sparkles } from "lucide-react";

type Reason =
  | "daily_limit"
  | "level_locked"
  | "speaking_locked"
  | "listening_locked"
  | "tutor_locked"
  | "generic";

const COPY: Record<Reason, { title: string; description: string }> = {
  daily_limit: {
    title: "Bugungi limit tugadi",
    description: "Free rejada kuniga faqat 3 ta dars. Pro'ga o'ting va cheksiz darslarni oching.",
  },
  level_locked: {
    title: "Bu daraja Premium uchun",
    description: "Yuqori darajalar (B2, C1, C2) Pro va Premium rejalarida ochiladi.",
  },
  speaking_locked: {
    title: "AI Speaking — Pro xususiyati",
    description: "AI bilan ovozli suhbat qurish Pro va Premium rejalarida ishlaydi.",
  },
  listening_locked: {
    title: "AI Listening — Pro xususiyati",
    description: "AI generatsiyalangan audio darslar Pro rejasidan boshlab.",
  },
  tutor_locked: {
    title: "AI Tutor — Pro xususiyati",
    description: "Shaxsiy AI ustoz bilan cheksiz suhbat Pro rejasidan boshlab.",
  },
  generic: {
    title: "Premium xususiyat",
    description: "Bu xususiyat Pro yoki Premium rejasida ochiladi.",
  },
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reason?: Reason;
};

const UpgradeDialog = ({ open, onOpenChange, reason = "generic" }: Props) => {
  const copy = COPY[reason];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-14 h-14 rounded-2xl gradient-primary grid place-items-center shadow-glow mb-2">
            <Crown className="w-7 h-7 text-primary-foreground" />
          </div>
          <DialogTitle className="font-display text-2xl">{copy.title}</DialogTitle>
          <DialogDescription className="text-base">{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 p-4 my-2">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-display font-bold">Pro rejasi imkoniyatlari</span>
          </div>
          <ul className="space-y-2 text-sm">
            {[
              "Cheksiz darslar — har kuni",
              "AI Speaking & Listening",
              "AI Tutor — istalgan savol",
              "Reklamalarsiz",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
            Keyinroq
          </Button>
          <Link to="/pricing" className="flex-1" onClick={() => onOpenChange(false)}>
            <Button variant="hero" className="w-full">
              <Sparkles className="w-4 h-4" />
              Tariflarni ko'rish
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeDialog;
