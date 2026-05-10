import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Lang = "en" | "uz";

type Dict = Record<string, { en: string; uz: string }>;

const dict: Dict = {
  // nav
  "nav.features": { en: "Features", uz: "Imkoniyatlar" },
  "nav.skills": { en: "Skills", uz: "Ko‘nikmalar" },
  "nav.aiTutor": { en: "AI Tutor", uz: "AI Ustoz" },
  "nav.pricing": { en: "Pricing", uz: "Narxlar" },
  "nav.faq": { en: "FAQ", uz: "Savol-javob" },
  "nav.login": { en: "Log in", uz: "Kirish" },
  "nav.startFree": { en: "Start Free", uz: "Bepul boshlash" },
  "nav.dashboard": { en: "Dashboard", uz: "Asosiy" },
  "nav.logout": { en: "Log out", uz: "Chiqish" },

  // hero
  "hero.badge": { en: "Trusted by 50,000+ learners worldwide", uz: "50,000+ o‘quvchi tanlagan platforma" },
  "hero.title1": { en: "Learn English", uz: "Ingliz tilini" },
  "hero.titleAccent": { en: "Smarter", uz: "AQLLI" },
  "hero.title2": { en: "with AI", uz: "tarzda o‘rganing" },
  "hero.subtitle": {
    en: "Vocabulary, Grammar, Reading, Listening & Speaking — in one beautifully crafted platform powered by your personal AI tutor.",
    uz: "Lug‘at, grammatika, o‘qish, tinglash va gapirish — barchasi bitta zamonaviy platformada, shaxsiy AI ustoz bilan.",
  },
  "hero.watchDemo": { en: "Watch Demo", uz: "Demoni ko‘rish" },
  "hero.noCard": { en: "No credit card • 7-day free trial • Cancel anytime", uz: "Karta kerak emas • 7 kun bepul • Istalgan vaqt bekor qilish" },

  // auth
  "auth.welcome": { en: "Welcome back", uz: "Xush kelibsiz" },
  "auth.createAccount": { en: "Create your account", uz: "Hisob yarating" },
  "auth.email": { en: "Email", uz: "Email" },
  "auth.password": { en: "Password", uz: "Parol" },
  "auth.fullName": { en: "Full name", uz: "To‘liq ism" },
  "auth.signIn": { en: "Sign in", uz: "Kirish" },
  "auth.signUp": { en: "Sign up", uz: "Ro‘yxatdan o‘tish" },
  "auth.continueWith": { en: "Continue with Google", uz: "Google bilan davom etish" },
  "auth.or": { en: "or", uz: "yoki" },
  "auth.noAccount": { en: "Don't have an account?", uz: "Hisobingiz yo‘qmi?" },
  "auth.haveAccount": { en: "Already have an account?", uz: "Hisobingiz bormi?" },
  "auth.forgot": { en: "Forgot password?", uz: "Parol esdan chiqdimi?" },

  // onboarding
  "onb.title": { en: "Let's personalize your journey", uz: "Yo‘nalishingizni shakllantiramiz" },
  "onb.step": { en: "Step", uz: "Qadam" },
  "onb.of": { en: "of", uz: "/" },
  "onb.next": { en: "Next", uz: "Davom" },
  "onb.back": { en: "Back", uz: "Orqaga" },
  "onb.finish": { en: "Start learning", uz: "O‘qishni boshlash" },
  "onb.q.level": { en: "What's your English level?", uz: "Inglizcha darajangiz qanday?" },
  "onb.q.goal": { en: "What's your main goal?", uz: "Asosiy maqsadingiz?" },
  "onb.q.time": { en: "How much time daily?", uz: "Kuniga qancha vaqt?" },
  "onb.q.lang": { en: "Your native language?", uz: "Ona tilingiz?" },
  "onb.level.beginner": { en: "Beginner — I know almost nothing", uz: "Boshlovchi — deyarli bilmayman" },
  "onb.level.elementary": { en: "Elementary — I know basic words", uz: "Boshlang‘ich — oddiy so‘zlarni bilaman" },
  "onb.level.intermediate": { en: "Intermediate — I can have simple conversations", uz: "O‘rta — oddiy suhbatlasha olaman" },
  "onb.level.upper": { en: "Upper-Intermediate — I'm comfortable", uz: "O‘rtadan yuqori — yaxshi bilaman" },
  "onb.level.advanced": { en: "Advanced — I want to perfect it", uz: "Ilg‘or — mukammallashtiraman" },
  "onb.level.proficient": { en: "Proficient — Near-native level", uz: "Mukammal — deyarli ona tilidek" },
  "onb.goal.ielts": { en: "IELTS / Exams 7+", uz: "IELTS / Imtihonlar 7+" },
  "onb.goal.speak": { en: "Speak English fluently", uz: "Ravon gapirish" },
  "onb.goal.business": { en: "Business English", uz: "Biznes inglizchasi" },
  "onb.goal.travel": { en: "Travel English", uz: "Sayohat uchun" },
  "onb.goal.school": { en: "School / University", uz: "Maktab / Universitet" },
  "onb.goal.general": { en: "General improvement", uz: "Umumiy yaxshilash" },

  // dashboard
  "dash.welcome": { en: "Welcome back", uz: "Xush kelibsiz" },
  "dash.continue": { en: "Continue learning", uz: "O‘qishni davom ettirish" },
  "dash.streak": { en: "Day streak", uz: "Kunlik ketma-ketlik" },
  "dash.xp": { en: "XP points", uz: "XP ballar" },
  "dash.level": { en: "Level", uz: "Daraja" },
  "dash.coins": { en: "Coins", uz: "Tangalar" },
  "dash.weeklyGoal": { en: "Weekly goal", uz: "Haftalik maqsad" },
  "dash.todayTasks": { en: "Today's tasks", uz: "Bugungi vazifalar" },
  "dash.recommended": { en: "Recommended for you", uz: "Siz uchun tavsiya" },
  "dash.skills": { en: "Your skills", uz: "Ko‘nikmalaringiz" },
  "dash.vocabulary": { en: "Vocabulary", uz: "Lug‘at" },
  "dash.grammar": { en: "Grammar", uz: "Grammatika" },
  "dash.reading": { en: "Reading", uz: "O‘qish" },
  "dash.listening": { en: "Listening", uz: "Tinglash" },
  "dash.speaking": { en: "Speaking", uz: "Gapirish" },
  "dash.aiTutor": { en: "Ask AI tutor", uz: "AI ustozdan so‘rang" },
  "dash.start": { en: "Start", uz: "Boshlash" },
  "dash.comingSoon": { en: "Coming soon", uz: "Tez kunda" },
  "dash.minutesPerDay": { en: "min / day", uz: "daqiqa / kun" },
};

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict | string) => string;
};

const I18nContext = createContext<I18nValue>({
  lang: "en",
  setLang: () => {},
  t: (k) => k as string,
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("lang") as Lang | null) : null;
    return stored === "uz" || stored === "en" ? stored : "en";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const t = (key: string) => {
    const entry = dict[key];
    if (!entry) return key;
    return entry[lang];
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
