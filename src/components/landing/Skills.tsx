import { BookOpen, PenTool, BookMarked, Headphones, Mic } from "lucide-react";

const skills = [
  {
    icon: BookOpen,
    title: "Vocabulary",
    desc: "Smart spaced repetition, flashcards, and 5,000+ curated words across IELTS, business, travel and daily life.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: PenTool,
    title: "Grammar",
    desc: "Step-by-step lessons on tenses, conditionals, articles and more — with instant AI corrections.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: BookMarked,
    title: "Reading",
    desc: "Stories, news and IELTS passages adapted to your level. Tap any word for an instant translation.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Headphones,
    title: "Listening",
    desc: "Native American, British and Australian audio. Dictation, fill-in-the-blank, and accent training.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Mic,
    title: "Speaking",
    desc: "AI voice conversations, real-life roleplays and pronunciation scoring that helps you sound natural.",
    color: "from-blue-500 to-purple-600",
  },
];

const Skills = () => {
  return (
    <section id="skills" className="py-16 sm:py-24 lg:py-32 gradient-soft">
      <div className="container px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-16">
          <p className="text-xs sm:text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
            5 Core Skills
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Master English from{" "}
            <span className="text-gradient">every angle</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Built like a real curriculum. Designed to feel like a game.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {skills.map((s, i) => (
            <div
              key={s.title}
              className={`group relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-card border border-border hover:shadow-elegant transition-smooth hover:-translate-y-1 ${
                i === 4 ? "lg:col-span-1 sm:col-span-2 lg:col-auto" : ""
              }`}
            >
              <div
                className={`absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${s.color} opacity-10 group-hover:opacity-20 transition-smooth`}
              />
              <div
                className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} grid place-items-center mb-6 shadow-lg`}
              >
                <s.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-3">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
