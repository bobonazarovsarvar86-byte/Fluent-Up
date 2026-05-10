import { Sparkles, Send, CheckCircle2 } from "lucide-react";

const AITutor = () => {
  return (
    <section id="ai-tutor" className="py-24 sm:py-32 overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
              AI Tutor
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
              Your personal English coach,{" "}
              <span className="text-gradient">always on</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Stuck on a tense? Need a translation? Want to practice a job
              interview? Just ask. Our AI tutor explains in both English and
              Uzbek — patiently, instantly, 24/7.
            </p>

            <ul className="space-y-3">
              {[
                "Instant grammar explanations in your native language",
                "Translate any sentence with deep context",
                "Real-time speaking feedback & pronunciation tips",
                "A custom study roadmap tuned to your goals",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute inset-0 gradient-primary blur-3xl opacity-20 rounded-3xl" />
            <div className="relative rounded-3xl bg-card border border-border shadow-elegant p-6 space-y-4">
              {/* User msg */}
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-muted rounded-2xl rounded-tr-md p-4 text-sm">
                  Men "present perfect" tense ni tushunmayapman 😅
                </div>
              </div>

              {/* AI response */}
              <div className="flex gap-3">
                <div className="w-9 h-9 shrink-0 rounded-full gradient-primary grid place-items-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="max-w-[85%] bg-accent text-accent-foreground rounded-2xl rounded-tl-md p-4 text-sm space-y-2">
                  <p>
                    <strong>Present Perfect</strong> — bu o'tmishda boshlangan
                    va hozirgacha davom etayotgan, yoki natijasi hozirda
                    sezilayotgan ishlar uchun ishlatiladi.
                  </p>
                  <p className="font-mono text-xs bg-background/60 px-3 py-2 rounded-lg">
                    have/has + V3 (past participle)
                  </p>
                  <p>
                    <em>I have learned 100 new words this week.</em> 🎯
                  </p>
                </div>
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1 h-12 rounded-full bg-muted border border-border px-5 flex items-center text-sm text-muted-foreground">
                  Ask anything in English or Uzbek...
                </div>
                <button className="w-12 h-12 rounded-full gradient-primary grid place-items-center shadow-glow hover:scale-105 transition-bounce">
                  <Send className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-card border border-border rounded-2xl px-4 py-2 shadow-elegant flex items-center gap-2 animate-float">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-semibold">Online 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AITutor;
