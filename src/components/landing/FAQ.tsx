import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is FluentUp suitable for complete beginners?",
    a: "Absolutely. We have dedicated beginner tracks with full Uzbek translations, simple grammar lessons, and audio at slower speeds.",
  },
  {
    q: "Can I prepare for IELTS here?",
    a: "Yes. We have IELTS-style reading passages, listening tasks, speaking roleplays and a goal-based roadmap targeting band 7+.",
  },
  {
    q: "How does the AI speaking module work?",
    a: "Speak into your microphone — our AI scores your pronunciation, fluency, grammar, and vocabulary, then gives targeted tips to improve.",
  },
  {
    q: "Is there a free version?",
    a: "Yes. Our free plan includes 5 lessons per day, basic vocabulary and grammar, and a limited AI tutor — forever.",
  },
  {
    q: "Which payment methods do you support?",
    a: "Click, Payme, Uzum Bank, Visa and Mastercard. International cards are fully supported.",
  },
  {
    q: "Can I use FluentUp on mobile?",
    a: "Yes — the platform is fully responsive and feels native on phones, tablets and desktops.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-24 sm:py-32 gradient-soft">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
            FAQ
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Questions?{" "}
            <span className="text-gradient">We've got answers.</span>
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="bg-card border border-border rounded-2xl px-6 overflow-hidden"
            >
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
