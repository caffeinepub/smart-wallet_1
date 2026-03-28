import { Button } from "@/components/ui/button";
import { PiggyBank, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  const features = [
    { icon: TrendingUp, text: "Track income & expenses" },
    { icon: PiggyBank, text: "Savings goals & budgets" },
    { icon: ShieldCheck, text: "Secure & private" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        className="w-full max-w-[430px] flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center shadow-lg">
            <img
              src="/assets/generated/smart-wallet-logo-transparent.dim_200x200.png"
              alt="Smart Wallet"
              className="w-16 h-16 object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Smart Wallet
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Your intelligent personal finance companion
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="w-full space-y-3">
          {features.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 shadow-xs"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="w-full space-y-3">
          <Button
            className="w-full h-12 text-base font-semibold rounded-xl"
            onClick={() => login()}
            disabled={isLoggingIn}
            data-ocid="login.primary_button"
          >
            {isLoggingIn ? "Connecting..." : "Get Started"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Secured by Internet Identity — no passwords needed
          </p>
        </div>
      </motion.div>
    </div>
  );
}
