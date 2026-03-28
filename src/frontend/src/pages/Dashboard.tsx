import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  ChevronRight,
  Lightbulb,
  Moon,
  Settings,
  Sun,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useAppData } from "../context/AppContext";
import { useActor } from "../hooks/useActor";
import type { Tab } from "../types";
import { CURRENCIES, formatCurrency } from "../utils/currency";
import { generateInsights } from "../utils/insights";

const CATEGORY_EMOJI: Record<string, string> = {
  Salary: "💼",
  Business: "🏢",
  "Side Hustle": "💡",
  "Investment Returns": "📈",
  Food: "🍔",
  Transport: "🚗",
  Bills: "💡",
  Entertainment: "🎮",
  Health: "🏥",
  Education: "📚",
  Shopping: "🛍️",
  Savings: "🏦",
  Other: "💰",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

interface DashboardProps {
  onTabChange: (tab: Tab) => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export default function Dashboard({
  onTabChange,
  isDark,
  onToggleDark,
}: DashboardProps) {
  const {
    transactions,
    budgets,
    savingsGoals,
    investments,
    userProfile,
    currency,
    setCurrency,
    refresh,
  } = useAppData();
  const { actor } = useActor();
  const [showSettings, setShowSettings] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const now = new Date();
  const thisMonth = getMonthKey(now);

  const thisMonthTx = transactions.filter(
    (t) => getMonthKey(new Date(Number(t.date))) === thisMonth,
  );
  const income = thisMonthTx
    .filter((t) => t.transactionType === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = thisMonthTx
    .filter((t) => t.transactionType === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  // Last 6 months chart data
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const mk = getMonthKey(d);
    const mTx = transactions.filter(
      (t) => getMonthKey(new Date(Number(t.date))) === mk,
    );
    return {
      month: d.toLocaleString("default", { month: "short" }),
      income: mTx
        .filter((t) => t.transactionType === "income")
        .reduce((s, t) => s + t.amount, 0),
      expense: mTx
        .filter((t) => t.transactionType === "expense")
        .reduce((s, t) => s + t.amount, 0),
    };
  });

  // Budget alerts (>80%)
  const budgetAlerts = budgets
    .filter((b) => b.month === thisMonth)
    .map((b) => {
      const spent = thisMonthTx
        .filter(
          (t) => t.transactionType === "expense" && t.category === b.category,
        )
        .reduce((s, t) => s + t.amount, 0);
      return {
        ...b,
        spent,
        pct: b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0,
      };
    })
    .filter((b) => b.pct >= 80);

  // Recent transactions
  const recentTx = [...transactions]
    .sort((a, b) => Number(b.date) - Number(a.date))
    .slice(0, 5);

  const insights = generateInsights(
    transactions,
    budgets,
    savingsGoals,
    investments,
  );

  async function saveProfile() {
    if (!actor) return;
    setSavingProfile(true);
    try {
      await actor.saveCallerUserProfile({ name: nameInput });
      await refresh();
      toast.success("Profile saved");
      setShowSettings(false);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="px-4 pt-12 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{getGreeting()},</p>
          <h1 className="text-xl font-bold text-foreground">
            {userProfile?.name || "Friend"} 👋
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setNameInput(userProfile?.name || "");
            setShowSettings(true);
          }}
          className="w-10 h-10 rounded-full bg-card shadow-xs flex items-center justify-center"
          data-ocid="dashboard.settings.button"
        >
          <Settings className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Balance Card */}
      <motion.div
        className="bg-primary rounded-2xl p-5 shadow-lg"
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-primary-foreground/70 text-sm font-medium">
          Total Balance
        </p>
        <p className="text-4xl font-bold text-primary-foreground mt-1 tracking-tight">
          {formatCurrency(balance, currency)}
        </p>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-foreground/15 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-primary-foreground/60 text-[10px]">Income</p>
              <p className="text-primary-foreground text-sm font-semibold">
                {formatCurrency(income, currency)}
              </p>
            </div>
          </div>
          <div className="w-px bg-primary-foreground/20" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-foreground/15 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-primary-foreground/60 text-[10px]">Expenses</p>
              <p className="text-primary-foreground text-sm font-semibold">
                {formatCurrency(expenses, currency)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Income vs Expense Chart */}
      <div className="bg-card rounded-2xl p-4 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Income vs Expenses
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={14} barGap={4}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#888" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: isDark ? "#1e2440" : "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(val: number, name: string) => [
                formatCurrency(val, currency),
                name === "income" ? "Income" : "Expenses",
              ]}
            />
            <Bar
              dataKey="income"
              fill="oklch(0.68 0.2 155)"
              radius={[4, 4, 0, 0]}
              name="income"
            />
            <Bar
              dataKey="expense"
              fill="oklch(0.62 0.22 25)"
              radius={[4, 4, 0, 0]}
              name="expense"
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Expenses</span>
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            Budget Alerts
          </h2>
          {budgetAlerts.map((b) => (
            <div
              key={b.id.toString()}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                b.pct >= 100
                  ? "bg-red-500/10 border border-red-500/20"
                  : "bg-yellow-500/10 border border-yellow-500/20"
              }`}
            >
              <AlertCircle
                className={`w-4 h-4 ${b.pct >= 100 ? "text-red-500" : "text-yellow-500"}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {b.category}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(b.pct)}% used
                </p>
              </div>
              <span
                className={`text-sm font-semibold ${b.pct >= 100 ? "text-red-500" : "text-yellow-500"}`}
              >
                {formatCurrency(b.spent, currency)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Savings Goals */}
      {savingsGoals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Savings Goals
            </h2>
            <button
              type="button"
              onClick={() => onTabChange("savings")}
              className="text-xs text-primary flex items-center gap-0.5"
              data-ocid="dashboard.savings.link"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {savingsGoals.map((g) => {
              const pct =
                g.targetAmount > 0
                  ? (g.currentAmount / g.targetAmount) * 100
                  : 0;
              return (
                <div
                  key={g.id.toString()}
                  className="bg-card rounded-2xl p-4 shadow-xs min-w-[160px] flex-shrink-0"
                >
                  <p className="text-xs font-semibold text-foreground truncate">
                    {g.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatCurrency(g.currentAmount, g.currency)} /{" "}
                    {formatCurrency(g.targetAmount, g.currency)}
                  </p>
                  <Progress value={Math.min(pct, 100)} className="h-1.5 mt-2" />
                  <p className="text-xs text-primary font-semibold mt-1">
                    {Math.round(pct)}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Recent Transactions
          </h2>
          <button
            type="button"
            onClick={() => onTabChange("transactions")}
            className="text-xs text-primary flex items-center gap-0.5"
            data-ocid="dashboard.transactions.link"
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {recentTx.length === 0 ? (
          <div
            className="bg-card rounded-2xl p-8 text-center"
            data-ocid="dashboard.transactions.empty_state"
          >
            <p className="text-muted-foreground text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl shadow-xs divide-y divide-border">
            {recentTx.map((t, i) => (
              <div
                key={t.id.toString()}
                className="flex items-center gap-3 px-4 py-3"
                data-ocid={`dashboard.transactions.item.${i + 1}`}
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-lg">
                  {CATEGORY_EMOJI[t.category] || "💰"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {t.description || t.category}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(Number(t.date)).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    t.transactionType === "income"
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                >
                  {t.transactionType === "income" ? "+" : "-"}
                  {formatCurrency(t.amount, t.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Insights */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          💡 Insights
        </h2>
        <div className="space-y-2">
          {insights.map((ins) => (
            <div
              key={ins}
              className="bg-card rounded-xl px-4 py-3 shadow-xs flex items-start gap-3"
            >
              <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">{ins}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent
          className="max-w-[380px] rounded-2xl"
          data-ocid="settings.dialog"
        >
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Your Name</Label>
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                data-ocid="settings.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger data-ocid="settings.currency.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                {isDark ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
                Dark Mode
              </Label>
              <Switch
                checked={isDark}
                onCheckedChange={onToggleDark}
                data-ocid="settings.darkmode.switch"
              />
            </div>
            <Button
              className="w-full"
              onClick={saveProfile}
              disabled={savingProfile}
              data-ocid="settings.save.button"
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
