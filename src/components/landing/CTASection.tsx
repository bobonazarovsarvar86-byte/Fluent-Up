import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 sm:py-32">
      <div className="container">
        <div className="relative overflow-hidden rounded-[2.5rem] gradient-primary p-12 sm:p-16 text-center">
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="relative max-w-2xl mx-auto text-primary-foreground">
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Start your fluency journey today
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Join 50,000+ learners building their English confidence with
              FluentUp.
            </p>
            <Button
              variant="secondary"
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
            >
              Start Free
              <ArrowRight />
            </Button>
            <p className="text-xs opacity-80 mt-4">
              No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
