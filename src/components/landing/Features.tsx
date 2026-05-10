import { Brain, Zap, Target, Globe, Trophy, Sparkles } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-powered learning",
    desc: "Adaptive lessons that adjust to your level, pace, and weak spots in real time.",
  },
  {
    icon: Zap,
    title: "Daily streaks & XP",
    desc: "Gamified progress keeps you coming back. Earn XP, unlock levels, climb the leaderboard.",
  },
  {
    icon: Target,
    title: "Goal-based roadmap",
    desc: "IELTS 7+, business English, fluent speaking — your path is built around your goal.",
  },
  {
    icon: Globe,
    title: "Uzbek & English UI",
    desc: "Learn in your language. Full support for Uzbek learners with native translations.",
  },
  {
    icon: Trophy,
    title: "Real progress",
    desc: "Track vocabulary, grammar, reading, listening and speaking scores week by week.",
  },
  {
    icon: Sparkles,
    title: "24/7 AI tutor",
    desc: "Ask anything. Get instant explanations, corrections and motivation any time.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-16 sm:py-24 lg:py-32">
      <div className="container px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-16">
          <p className="text-xs sm:text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
            Why FluentUp
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Everything you need to{" "}
            <span className="text-gradient">speak fluently</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            One platform. Five core skills. A tutor that never sleeps.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group relative p-6 sm:p-8 rounded-3xl border border-border bg-card hover:shadow-elegant transition-smooth hover:-translate-y-1"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="w-12 h-12 rounded-2xl gradient-primary grid place-items-center mb-5 group-hover:scale-110 transition-bounce">
                <f.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
