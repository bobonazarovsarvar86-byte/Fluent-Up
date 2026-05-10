import { Sparkles, Twitter, Instagram, Send, Youtube } from "lucide-react";

const cols = [
  {
    title: "Product",
    links: ["Features", "Skills", "AI Tutor", "Pricing", "Roadmap"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Press", "Contact"],
  },
  {
    title: "Resources",
    links: ["IELTS guide", "Grammar hub", "Vocabulary lists", "Help center"],
  },
  {
    title: "Legal",
    links: ["Terms", "Privacy", "Cookies", "Refunds"],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-16">
        <div className="grid lg:grid-cols-6 gap-12">
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2 font-display font-bold text-lg mb-4">
              <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </span>
              FluentUp
            </a>
            <p className="text-sm text-muted-foreground max-w-xs mb-5">
              The smartest way to learn English. Built for Uzbekistan, loved
              worldwide.
            </p>
            <div className="flex gap-2">
              {[Twitter, Instagram, Send, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full border border-border grid place-items-center hover:bg-accent transition-smooth"
                  aria-label="social link"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="font-semibold text-sm mb-4">{c.title}</h4>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row gap-4 justify-between items-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} FluentUp. All rights reserved.</p>
          <p>Made with ❤️ in Tashkent, for the world.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
