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
import { Edit, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { SavingsGoal } from "../backend";
import { useAppData } from "../context/AppContext";
import { useActor } from "../hooks/useActor";
import { CURRENCIES, formatCurrency } from "../utils/currency";

interface GoalForm {
  name: string;
  description: string;
  targetAmount: string;
  currentAmount: string;
  currency: string;
  targetDate: string;
}

const defaultForm = (currency: string): GoalForm => ({
  name: "",
  description: "",
  targetAmount: "",
  currentAmount: "0",
  currency,
  targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
});

export default function Savings() {
  const { savingsGoals, transactions, currency, refresh } = useAppData();
  const { actor } = useActor();
  const [showDialog, setShowDialog] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState<GoalForm>(defaultForm(currency));
  const [saving, setSaving] = useState(false);
  const [fundsDialog, setFundsDialog] = useState<SavingsGoal | null>(null);
  const [fundsAmount, setFundsAmount] = useState("");

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisIncome = transactions
    .filter((t) => {
      const d = new Date(Number(t.date));
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return mk === thisMonth && t.transactionType === "income";
    })
    .reduce((s, t) => s + t.amount, 0);

  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);

  function openAdd() {
    setEditGoal(null);
    setForm(defaultForm(currency));
    setShowDialog(true);
  }

  function openEdit(g: SavingsGoal) {
    setEditGoal(g);
    setForm({
      name: g.name,
      description: g.description,
      targetAmount: g.targetAmount.toString(),
      currentAmount: g.currentAmount.toString(),
      currency: g.currency,
      targetDate: new Date(Number(g.targetDate)).toISOString().slice(0, 10),
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!actor) return;
    const target = Number.parseFloat(form.targetAmount);
    const current = Number.parseFloat(form.currentAmount);
    if (Number.isNaN(target) || target <= 0) {
      toast.error("Enter a valid target amount");
      return;
    }
    setSaving(true);
    try {
      const goal: SavingsGoal = {
        id: editGoal ? editGoal.id : 0n,
        userId: Principal.anonymous(),
        name: form.name,
        description: form.description,
        targetAmount: target,
        currentAmount: Number.isNaN(current) ? 0 : current,
        currency: form.currency,
        targetDate: BigInt(new Date(form.targetDate).getTime()),
      };
      if (editGoal) {
        await actor.updateSavingsGoal(goal);
        toast.success("Goal updated");
      } else {
        await actor.addSavingsGoal(goal);
        toast.success("Goal added");
      }
      await refresh();
      setShowDialog(false);
    } catch {
      toast.error("Failed to save goal");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: bigint) {
    if (!actor) return;
    if (!confirm("Delete this savings goal?")) return;
    try {
      await actor.deleteSavingsGoal(id);
      toast.success("Goal deleted");
      await refresh();
    } catch {
      toast.error("Failed to delete goal");
    }
  }

  async function handleAddFunds() {
    if (!actor || !fundsDialog) return;
    const amount = Number.parseFloat(fundsAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      await actor.updateSavingsGoal({
        ...fundsDialog,
        currentAmount: fundsDialog.currentAmount + amount,
      });
      toast.success("Funds added");
      await refresh();
      setFundsDialog(null);
      setFundsAmount("");
    } catch {
      toast.error("Failed to add funds");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 pt-4 space-y-4 relative min-h-[60vh]">
      {/* Total saved card */}
      <div className="bg-primary rounded-2xl p-5">
        <p className="text-primary-foreground/70 text-sm">Total Saved</p>
        <p className="text-3xl font-bold text-primary-foreground mt-1">
          {formatCurrency(totalSaved, currency)}
        </p>
        <p className="text-primary-foreground/60 text-xs mt-1">
          across {savingsGoals.length} goal
          {savingsGoals.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Suggested saving tip */}
      {thisIncome > 0 && (
        <div className="bg-card rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-xl">\uD83D\uDCA1</span>
          <div>
            <p className="text-sm font-medium text-foreground">
              Suggested saving this month
            </p>
            <p className="text-xs text-muted-foreground">
              Save 20% of income:{" "}
              <span className="text-emerald-500 font-semibold">
                {formatCurrency(thisIncome * 0.2, currency)}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Goals list */}
      {savingsGoals.length === 0 ? (
        <div
          className="flex flex-col items-center py-16 text-center"
          data-ocid="savings.empty_state"
        >
          <p className="text-4xl mb-3">\uD83C\uDFAF</p>
          <p className="text-muted-foreground text-sm">No savings goals yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tap + to create one
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {savingsGoals.map((g, i) => {
            const pct =
              g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            const daysLeft = Math.ceil(
              (Number(g.targetDate) - Date.now()) / (1000 * 60 * 60 * 24),
            );
            return (
              <motion.div
                key={g.id.toString()}
                className="bg-card rounded-2xl p-4 shadow-xs"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                data-ocid={`savings.item.${i + 1}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {g.name}
                    </p>
                    {g.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {g.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 ml-2">
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      className="text-muted-foreground hover:text-foreground"
                      data-ocid={`savings.edit_button.${i + 1}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(g.id)}
                      className="text-muted-foreground hover:text-red-500"
                      data-ocid={`savings.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-foreground font-semibold">
                      {formatCurrency(g.currentAmount, g.currency)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(g.targetAmount, g.currency)}
                    </span>
                  </div>
                  <Progress value={Math.min(pct, 100)} className="h-2" />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-primary font-semibold">
                      {Math.round(pct)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {daysLeft > 0 ? `${daysLeft}d left` : "Past due"}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 text-xs"
                  onClick={() => {
                    setFundsDialog(g);
                    setFundsAmount("");
                  }}
                  data-ocid={`savings.add_button.${i + 1}`}
                >
                  + Add Funds
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={openAdd}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-40"
        data-ocid="savings.add.button"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Goal Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="max-w-[390px] rounded-2xl"
          data-ocid="savings.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editGoal ? "Edit Goal" : "New Savings Goal"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Goal Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Buy Laptop"
                data-ocid="savings.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Optional description"
                data-ocid="savings.description.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Target Amount</Label>
                <Input
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, targetAmount: e.target.value }))
                  }
                  placeholder="0.00"
                  data-ocid="savings.target.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Current Amount</Label>
                <Input
                  type="number"
                  value={form.currentAmount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, currentAmount: e.target.value }))
                  }
                  placeholder="0.00"
                  data-ocid="savings.current.input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}
                >
                  <SelectTrigger data-ocid="savings.currency.select">
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
              <div className="space-y-1.5">
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, targetDate: e.target.value }))
                  }
                  data-ocid="savings.date.input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              data-ocid="savings.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              data-ocid="savings.submit.button"
            >
              {saving ? "Saving..." : editGoal ? "Update" : "Add Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog
        open={!!fundsDialog}
        onOpenChange={(o) => !o && setFundsDialog(null)}
      >
        <DialogContent
          className="max-w-[340px] rounded-2xl"
          data-ocid="savings.funds.dialog"
        >
          <DialogHeader>
            <DialogTitle>Add Funds to {fundsDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Amount to Add</Label>
              <Input
                type="number"
                value={fundsAmount}
                onChange={(e) => setFundsAmount(e.target.value)}
                placeholder="0.00"
                data-ocid="savings.funds.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFundsDialog(null)}
              data-ocid="savings.funds.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFunds}
              disabled={saving}
              data-ocid="savings.funds.confirm.button"
            >
              {saving ? "Adding..." : "Add Funds"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
