import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Wallet, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./shared/ThemeToggle";

export const LandingPage: React.FC = () => {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div
      className="h-dvh overflow-hidden bg-landing relative flex flex-col items-center justify-center px-6"
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--landing-dot) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30">
        <ThemeToggle />
      </div>

      {/* Logo + Wordmark */}
      <div className="flex items-center gap-3 mb-8 sm:mb-14 animate-fade-up">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
          <Wallet className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-display font-semibold text-foreground text-xl tracking-tight">
          TripWallet
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-center uppercase animate-fade-up-delay-1 leading-tight">
        <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight">
          <span className="font-display-serif font-normal text-heading-light">
            Track{" "}
          </span>
          <span
            className="font-display font-bold text-foreground"
            style={{ fontStretch: "75%" }}
          >
            Every Expense
          </span>
        </span>
        <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight">
          <span className="font-display-serif font-normal text-heading-light">
            Across{" "}
          </span>
          <span
            className="font-display font-bold text-foreground"
            style={{ fontStretch: "75%" }}
          >
            Every Trip
          </span>
        </span>
      </h1>

      {/* Subtitle */}
      <p className="font-display text-muted-foreground text-sm sm:text-lg max-w-md mx-auto text-center mt-5 sm:mt-8 animate-fade-up-delay-2">
        Multi-currency budgets, real-time rates, and spending insights for every
        adventure.
      </p>

      {/* CTA Button */}
      <div className="mt-6 sm:mt-10 animate-fade-up-delay-3">
        <Button
          onClick={() => login()}
          disabled={isLoggingIn}
          className="h-11 px-5 rounded-none hover:rounded-[22px] hover:bg-foreground hover:text-primary-foreground ring-1 ring-foreground hover:ring-foreground font-mono-alt text-xs uppercase leading-[14px] transition-all duration-300 ease-out"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in with Internet Identity
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Footer */}
      <footer className="font-display fixed bottom-4 sm:bottom-6 text-center text-muted-foreground text-sm">
        © 2026. Built with ❤️ using{" "}
        <a
          href="https://caffeine.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
};
