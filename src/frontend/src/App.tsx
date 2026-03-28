import { Toaster } from "@/components/ui/sonner";
import {
  ArrowUpDown,
  Home,
  Info,
  Moon,
  PieChart,
  Sun,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import LoginScreen from "./components/LoginScreen";
import { AppProvider } from "./context/AppContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import About from "./pages/About";
import Budget from "./pages/Budget";
import Dashboard from "./pages/Dashboard";
import Investments from "./pages/Investments";
import Savings from "./pages/Savings";
import Transactions from "./pages/Transactions";
import type { Tab } from "./types";

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "transactions", label: "Wallet", icon: ArrowUpDown },
  { id: "budget", label: "Budget", icon: PieChart },
  { id: "savings", label: "Savings", icon: Target },
  { id: "investments", label: "Invest", icon: TrendingUp },
  { id: "about", label: "About", icon: Info },
];

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("smart-wallet-theme");
    return stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("smart-wallet-theme", isDark ? "dark" : "light");
  }, [isDark]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Wallet className="w-10 h-10 text-primary animate-pulse" />
          <p className="text-muted-foreground text-sm">
            Loading Smart Wallet...
          </p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    );
  }

  const pageMap: Record<Tab, React.ReactElement> = {
    dashboard: (
      <Dashboard
        onTabChange={setActiveTab}
        isDark={isDark}
        onToggleDark={() => setIsDark((p) => !p)}
      />
    ),
    transactions: <Transactions />,
    budget: <Budget />,
    savings: <Savings />,
    investments: <Investments />,
    about: <About />,
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-background flex flex-col items-center">
        <div className="w-full max-w-[430px] flex flex-col min-h-screen relative">
          {activeTab !== "dashboard" && (
            <div className="flex items-center justify-between px-4 pt-12 pb-2">
              <h1 className="text-xl font-bold text-foreground">
                {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
              </h1>
              <button
                type="button"
                onClick={() => setIsDark((p) => !p)}
                className="w-9 h-9 rounded-full bg-card flex items-center justify-center shadow-xs"
                data-ocid="nav.toggle"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-foreground" />
                ) : (
                  <Moon className="w-4 h-4 text-foreground" />
                )}
              </button>
            </div>
          )}

          <main className="flex-1 overflow-y-auto pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {pageMap[activeTab]}
              </motion.div>
            </AnimatePresence>
          </main>

          <nav
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border px-1 py-1 flex items-center justify-around z-50"
            data-ocid="nav.panel"
          >
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl transition-all ${
                  activeTab === id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid={`nav.${id}.link`}
              >
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                    activeTab === id ? "bg-primary/15" : ""
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      <Toaster />
    </AppProvider>
  );
}
