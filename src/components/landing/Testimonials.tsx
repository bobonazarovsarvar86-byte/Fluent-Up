import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "I went from IELTS 5.5 to 7.5 in four months. The speaking module is genuinely magical — it feels like having a private tutor.",
    name: "Dilnoza R.",
    role: "Student, Tashkent",
    initials: "DR",
  },
  {
    quote:
      "Finally an English app made for Uzbek speakers. The translations and grammar explanations actually make sense.",
    name: "Bobur K.",
    role: "Software Engineer",
    initials: "BK",
  },
  {
    quote:
      "My team uses FluentUp every morning. Streaks, XP and the leaderboard make daily practice genuinely fun.",
    name: "Sarah M.",
    role: "Team Lead, Berlin",
    initials: "SM",
  },
  {
    quote:
      "The AI tutor explains things three different ways until I get it. I've never learned this fast.",
    name: "Aziz T.",
    role: "University student",
    initials: "AT",
  },
  {
    quote:
      "Roleplays for job interviews helped me land my first international role. Worth every penny.",
    name: "Madina S.",
    role: "Marketing Manager",
    initials: "MS",
  },
  {
    quote:
      "Beautiful, fast, and effective. It's the only learning app I've actually stuck with for 6+ months.",
    name: "James L.",
    role: "Designer, London",
    initials: "JL",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 sm:py-32 gradient-soft">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
            Success stories
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Loved by learners{" "}
            <span className="text-gradient">everywhere</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-7 rounded-3xl bg-card border border-border hover:shadow-elegant transition-smooth"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold text-sm">
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
