import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Principal } from "@icp-sdk/core/principal";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppData } from "../context/AppContext";
import { useActor } from "../hooks/useActor";
import { CURRENCIES, formatCurrency } from "../utils/currency";

const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Shopping",
  "Savings",
  "Other",
];
const CATEGORY_EMOJI: Record<string, string> = {
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

function progressColor(pct: number) {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 80) return "bg-orange-500";
  if (pct >= 60) return "bg-yellow-500";
  return "bg-emerald-500";
}

export default function Budget() {
  const { budgets, transactions, currency, refresh } = useAppData();
  const { actor } = useActor();
  const [viewDate, setViewDate] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    category: "Food",
    limit: "",
    currency: currency,
  });
  const [saving, setSaving] = useState(false);

  const monthKey = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`;

  const monthBudgets = budgets.filter((b) => b.month === monthKey);

  const monthTx = transactions.filter((t) => {
    const d = new Date(Number(t.date));
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return mk === monthKey && t.transactionType === "expense";
  });

  const budgetData = monthBudgets.map((b) => {
    const spent = monthTx
      .filter((t) => t.category === b.category)
      .reduce((s, t) => s + t.amount, 0);
    const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
    return { ...b, spent, pct };
  });

  const totalLimit = budgetData.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);
  const totalPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  async function handleAddBudget() {
    if (!actor) return;
    const limit = Number.parseFloat(form.limit);
    if (Number.isNaN(limit) || limit <= 0) {
      toast.error("Enter a valid limit");
      return;
    }
    setSaving(true);
    try {
      await actor.setBudget({
        id: 0n,
        userId: Principal.anonymous(),
        month: monthKey,
        category: form.category,
        monthlyLimit: limit,
        currency: form.currency,
      });
      toast.success("Budget set");
      await refresh();
      setShowDialog(false);
      setForm({ category: "Food", limit: "", currency });
    } catch {
      toast.error("Failed to save budget");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: bigint) {
    if (!actor) return;
    if (!confirm("Delete this budget?")) return;
    try {
      await actor.deleteBudget(id);
      toast.success("Budget deleted");
      await refresh();
    } catch {
      toast.error("Failed to delete budget");
    }
  }

  const tips = [
    "Allocate 50% of income to needs, 30% to wants, 20% to savings.",
    "Review subscriptions monthly — cancel unused ones.",
    "Meal-prep to reduce food spending by up to 40%.",
  ];

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between bg-card rounded-xl px-4 py-2">
        <button
          type="button"
          onClick={() =>
            setViewDate(
              new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1),
            )
          }
          data-ocid="budget.pagination_prev"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {viewDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button
          type="button"
          onClick={() =>
            setViewDate(
              new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1),
            )
          }
          data-ocid="budget.pagination_next"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Summary */}
      {monthBudgets.length > 0 && (
        <div className="bg-primary rounded-2xl p-4">
          <p className="text-primary-foreground/70 text-xs">Overall Budget</p>
          <div className="flex items-end justify-between mt-1">
            <div>
              <p className="text-2xl font-bold text-primary-foreground">
                {formatCurrency(totalSpent, currency)}
              </p>
              <p className="text-primary-foreground/60 text-xs">
                of {formatCurrency(totalLimit, currency)}
              </p>
            </div>
            <p
              className={`text-lg font-bold ${totalPct >= 100 ? "text-red-300" : "text-primary-foreground"}`}
            >
              {Math.round(totalPct)}%
            </p>
          </div>
          <Progress value={Math.min(totalPct, 100)} className="mt-3 h-2" />
        </div>
      )}

      {/* Add Budget button */}
      <Button
        onClick={() => setShowDialog(true)}
        className="w-full"
        data-ocid="budget.add.button"
      >
        <Plus className="w-4 h-4 mr-2" /> Add Budget
      </Button>

      {/* Budget cards */}
      {budgetData.length === 0 ? (
        <div
          className="flex flex-col items-center py-16 text-center"
          data-ocid="budget.empty_state"
        >
          <p className="text-4xl mb-3">📊</p>
          <p className="text-muted-foreground text-sm">
            No budgets set for this month
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgetData.map((b, i) => (
            <div
              key={b.id.toString()}
              className="bg-card rounded-2xl p-4 shadow-xs"
              data-ocid={`budget.item.${i + 1}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {CATEGORY_EMOJI[b.category] || "💰"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {b.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(b.spent, b.currency)} /{" "}
                      {formatCurrency(b.monthlyLimit, b.currency)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      b.pct >= 100
                        ? "text-red-500"
                        : b.pct >= 80
                          ? "text-orange-500"
                          : "text-emerald-500"
                    }`}
                  >
                    {Math.round(b.pct)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    className="text-muted-foreground hover:text-red-500"
                    data-ocid={`budget.delete_button.${i + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${progressColor(b.pct)}`}
                  style={{ width: `${Math.min(b.pct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Remaining:{" "}
                {formatCurrency(
                  Math.max(b.monthlyLimit - b.spent, 0),
                  b.currency,
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Smart Tips */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">
          💡 Smart Tips
        </h2>
        <div className="space-y-2">
          {tips.map((tip) => (
            <div
              key={tip}
              className="bg-card rounded-xl px-4 py-3 text-sm text-foreground"
            >
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Add Budget Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="max-w-[380px] rounded-2xl"
          data-ocid="budget.dialog"
        >
          <DialogHeader>
            <DialogTitle>Set Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger data-ocid="budget.category.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_EMOJI[c]} {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monthly Limit</Label>
                <Input
                  type="number"
                  value={form.limit}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, limit: e.target.value }))
                  }
                  placeholder="0.00"
                  data-ocid="budget.limit.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}
                >
                  <SelectTrigger data-ocid="budget.currency.select">
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
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              data-ocid="budget.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddBudget}
              disabled={saving}
              data-ocid="budget.submit.button"
            >
              {saving ? "Saving..." : "Set Budget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
