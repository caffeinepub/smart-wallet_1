import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Principal } from "@icp-sdk/core/principal";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Transaction } from "../backend";
import { useAppData } from "../context/AppContext";
import { useActor } from "../hooks/useActor";
import { CURRENCIES, formatCurrency } from "../utils/currency";

const INCOME_CATEGORIES = [
  "Salary",
  "Business",
  "Side Hustle",
  "Investment Returns",
  "Other",
];
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
  Salary: "\uD83D\uDCBC",
  Business: "\uD83C\uDFE2",
  "Side Hustle": "\uD83D\uDCA1",
  "Investment Returns": "\uD83D\uDCC8",
  Food: "\uD83C\uDF54",
  Transport: "\uD83D\uDE97",
  Bills: "\uD83D\uDCA1",
  Entertainment: "\uD83C\uDFAE",
  Health: "\uD83C\uDFE5",
  Education: "\uD83D\uDCDA",
  Shopping: "\uD83D\uDECD\uFE0F",
  Savings: "\uD83C\uDFE6",
  Other: "\uD83D\uDCB0",
};

type TxFilter = "all" | "income" | "expense";

interface FormState {
  type: "income" | "expense";
  amount: string;
  currency: string;
  category: string;
  description: string;
  date: string;
  isRecurring: boolean;
  recurringPeriod: string;
}

const defaultForm = (currency: string): FormState => ({
  type: "expense",
  amount: "",
  currency,
  category: "Food",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  isRecurring: false,
  recurringPeriod: "monthly",
});

function groupByDate(txs: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  for (const t of txs) {
    const key = new Date(Number(t.date)).toLocaleDateString("en", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return groups;
}

export default function Transactions() {
  const { transactions, currency, refresh } = useAppData();
  const { actor } = useActor();
  const [filter, setFilter] = useState<TxFilter>("all");
  const [viewDate, setViewDate] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm(currency));
  const [saving, setSaving] = useState(false);

  const monthKey = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`;

  const filtered = transactions
    .filter((t) => {
      const d = new Date(Number(t.date));
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return (
        mk === monthKey && (filter === "all" || t.transactionType === filter)
      );
    })
    .sort((a, b) => Number(b.date) - Number(a.date));

  const groups = groupByDate(filtered);

  function openAdd() {
    setEditTx(null);
    setForm(defaultForm(currency));
    setShowDialog(true);
  }

  function openEdit(tx: Transaction) {
    setEditTx(tx);
    setForm({
      type: tx.transactionType as "income" | "expense",
      amount: tx.amount.toString(),
      currency: tx.currency,
      category: tx.category,
      description: tx.description,
      date: new Date(Number(tx.date)).toISOString().slice(0, 10),
      isRecurring: tx.isRecurring,
      recurringPeriod: tx.recurringPeriod || "monthly",
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!actor) return;
    const amount = Number.parseFloat(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const tx: Transaction = {
        id: editTx ? editTx.id : 0n,
        userId: Principal.anonymous(),
        transactionType: form.type,
        amount,
        currency: form.currency,
        category: form.category,
        description: form.description,
        date: BigInt(new Date(form.date).getTime()),
        isRecurring: form.isRecurring,
        recurringPeriod: form.isRecurring ? form.recurringPeriod : undefined,
      };
      if (editTx) {
        await actor.updateTransaction(tx);
        toast.success("Transaction updated");
      } else {
        await actor.addTransaction(tx);
        toast.success("Transaction added");
      }
      await refresh();
      setShowDialog(false);
    } catch {
      toast.error("Failed to save transaction");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: bigint) {
    if (!actor) return;
    if (!confirm("Delete this transaction?")) return;
    try {
      await actor.deleteTransaction(id);
      toast.success("Deleted");
      await refresh();
    } catch {
      toast.error("Failed to delete");
    }
  }

  const cats = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="px-4 pt-4 relative min-h-[60vh]">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "income", "expense"] as TxFilter[]).map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground"
            }`}
            data-ocid={`transactions.${f}.tab`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between bg-card rounded-xl px-4 py-2 mb-4">
        <button
          type="button"
          onClick={() =>
            setViewDate(
              new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1),
            )
          }
          data-ocid="transactions.pagination_prev"
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
          data-ocid="transactions.pagination_next"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Transaction groups */}
      {Object.keys(groups).length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="transactions.empty_state"
        >
          <p className="text-4xl mb-3">\uD83D\uDCED</p>
          <p className="text-muted-foreground text-sm">
            No transactions this month
          </p>
          <p className="text-xs text-muted-foreground mt-1">Tap + to add one</p>
        </div>
      ) : (
        <AnimatePresence>
          {Object.entries(groups).map(([date, txs]) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <p className="text-xs text-muted-foreground font-medium mb-2">
                {date}
              </p>
              <div className="bg-card rounded-2xl shadow-xs divide-y divide-border">
                {txs.map((t, i) => (
                  <div
                    key={t.id.toString()}
                    className="flex items-center gap-3 px-4 py-3"
                    data-ocid={`transactions.item.${i + 1}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-lg">
                      {CATEGORY_EMOJI[t.category] || "\uD83D\uDCB0"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {t.description || t.category}
                      </p>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 mt-0.5"
                      >
                        {t.category}
                      </Badge>
                    </div>
                    <span
                      className={`text-sm font-semibold mr-2 ${
                        t.transactionType === "income"
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      {t.transactionType === "income" ? "+" : "-"}
                      {formatCurrency(t.amount, t.currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="text-muted-foreground hover:text-foreground"
                      data-ocid={`transactions.edit_button.${i + 1}`}
                    >
                      \u270F\uFE0F
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="text-muted-foreground hover:text-red-500"
                      data-ocid={`transactions.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={openAdd}
        className="fixed bottom-24 right-4 max-w-[430px] w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-40"
        data-ocid="transactions.add.button"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="max-w-[390px] rounded-2xl"
          data-ocid="transactions.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editTx ? "Edit Transaction" : "Add Transaction"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Type toggle */}
            <div className="flex gap-2">
              {(["expense", "income"] as const).map((tp) => (
                <button
                  type="button"
                  key={tp}
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      type: tp,
                      category: tp === "income" ? "Salary" : "Food",
                    }))
                  }
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    form.type === tp
                      ? tp === "income"
                        ? "bg-emerald-500 text-white"
                        : "bg-red-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                  data-ocid={`transactions.${tp}.toggle`}
                >
                  {tp.charAt(0).toUpperCase() + tp.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  placeholder="0.00"
                  data-ocid="transactions.amount.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}
                >
                  <SelectTrigger data-ocid="transactions.currency.select">
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

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger data-ocid="transactions.category.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cats.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_EMOJI[c]} {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="What was this for?"
                data-ocid="transactions.description.input"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
                data-ocid="transactions.date.input"
              />
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="recurring"
                checked={form.isRecurring}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, isRecurring: !!v }))
                }
                data-ocid="transactions.recurring.checkbox"
              />
              <Label htmlFor="recurring">Recurring transaction</Label>
            </div>

            {form.isRecurring && (
              <div className="space-y-1.5">
                <Label>Recurring Period</Label>
                <Select
                  value={form.recurringPeriod}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, recurringPeriod: v }))
                  }
                >
                  <SelectTrigger data-ocid="transactions.period.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              data-ocid="transactions.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              data-ocid="transactions.submit.button"
            >
              {saving ? "Saving..." : editTx ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
