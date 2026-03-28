import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Principal } from "@icp-sdk/core/principal";
import { Edit, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import type { Investment } from "../backend";
import { useAppData } from "../context/AppContext";
import { useActor } from "../hooks/useActor";
import { CURRENCIES, formatCurrency } from "../utils/currency";

const INVESTMENT_TYPES = [
  "Stocks",
  "Crypto",
  "Business",
  "Real Estate",
  "Other",
];

const TYPE_COLORS: Record<string, string> = {
  Stocks: "oklch(0.6 0.22 265)",
  Crypto: "oklch(0.68 0.2 155)",
  Business: "oklch(0.75 0.18 80)",
  "Real Estate": "oklch(0.65 0.22 310)",
  Other: "oklch(0.62 0.22 25)",
};

const TYPE_BADGE_CLASS: Record<string, string> = {
  Stocks: "bg-blue-500/20 text-blue-400",
  Crypto: "bg-emerald-500/20 text-emerald-400",
  Business: "bg-yellow-500/20 text-yellow-400",
  "Real Estate": "bg-purple-500/20 text-purple-400",
  Other: "bg-red-500/20 text-red-400",
};

interface InvForm {
  name: string;
  investmentType: string;
  initialAmount: string;
  currentValue: string;
  currency: string;
  date: string;
  notes: string;
}

const defaultForm = (currency: string): InvForm => ({
  name: "",
  investmentType: "Stocks",
  initialAmount: "",
  currentValue: "",
  currency,
  date: new Date().toISOString().slice(0, 10),
  notes: "",
});

export default function Investments() {
  const { investments, currency, refresh } = useAppData();
  const { actor } = useActor();
  const [showDialog, setShowDialog] = useState(false);
  const [editInv, setEditInv] = useState<Investment | null>(null);
  const [form, setForm] = useState<InvForm>(defaultForm(currency));
  const [saving, setSaving] = useState(false);

  const totalInvested = investments.reduce((s, i) => s + i.initialAmount, 0);
  const totalValue = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalPnL = totalValue - totalInvested;
  const pnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Donut chart data by type
  const typeData = INVESTMENT_TYPES.map((type) => ({
    name: type,
    value: investments
      .filter((i) => i.investmentType === type)
      .reduce((s, i) => s + i.currentValue, 0),
  })).filter((d) => d.value > 0);

  function openAdd() {
    setEditInv(null);
    setForm(defaultForm(currency));
    setShowDialog(true);
  }

  function openEdit(inv: Investment) {
    setEditInv(inv);
    setForm({
      name: inv.name,
      investmentType: inv.investmentType,
      initialAmount: inv.initialAmount.toString(),
      currentValue: inv.currentValue.toString(),
      currency: inv.currency,
      date: new Date(Number(inv.date)).toISOString().slice(0, 10),
      notes: inv.notes,
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!actor) return;
    const initial = Number.parseFloat(form.initialAmount);
    const current = Number.parseFloat(form.currentValue);
    if (Number.isNaN(initial) || initial <= 0) {
      toast.error("Enter a valid initial amount");
      return;
    }
    setSaving(true);
    try {
      const inv: Investment = {
        id: editInv ? editInv.id : 0n,
        userId: Principal.anonymous(),
        name: form.name,
        investmentType: form.investmentType,
        initialAmount: initial,
        currentValue: Number.isNaN(current) ? initial : current,
        currency: form.currency,
        date: BigInt(new Date(form.date).getTime()),
        notes: form.notes,
      };
      if (editInv) {
        await actor.updateInvestment(inv);
        toast.success("Investment updated");
      } else {
        await actor.addInvestment(inv);
        toast.success("Investment added");
      }
      await refresh();
      setShowDialog(false);
    } catch {
      toast.error("Failed to save investment");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: bigint) {
    if (!actor) return;
    if (!confirm("Delete this investment?")) return;
    try {
      await actor.deleteInvestment(id);
      toast.success("Investment deleted");
      await refresh();
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="px-4 pt-4 space-y-4 relative min-h-[60vh]">
      {/* Portfolio Summary */}
      <div className="bg-primary rounded-2xl p-5">
        <p className="text-primary-foreground/70 text-sm">Portfolio Value</p>
        <p className="text-3xl font-bold text-primary-foreground mt-1">
          {formatCurrency(totalValue, currency)}
        </p>
        <div className="flex items-center gap-4 mt-3">
          <div>
            <p className="text-primary-foreground/60 text-[10px]">Invested</p>
            <p className="text-primary-foreground text-sm font-semibold">
              {formatCurrency(totalInvested, currency)}
            </p>
          </div>
          <div className="w-px bg-primary-foreground/20 h-6" />
          <div>
            <p className="text-primary-foreground/60 text-[10px]">P&amp;L</p>
            <p
              className={`text-sm font-bold ${totalPnL >= 0 ? "text-emerald-300" : "text-red-300"}`}
            >
              {totalPnL >= 0 ? "+" : ""}
              {formatCurrency(totalPnL, currency)} ({pnLPct.toFixed(1)}%)
            </p>
          </div>
        </div>
      </div>

      {/* Donut chart */}
      {typeData.length > 0 && (
        <div className="bg-card rounded-2xl p-4 shadow-xs">
          <h2 className="text-sm font-semibold text-foreground mb-2">
            Portfolio Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {typeData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={TYPE_COLORS[entry.name] || "oklch(0.6 0.1 260)"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => formatCurrency(val, currency)}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Investment list */}
      {investments.length === 0 ? (
        <div
          className="flex flex-col items-center py-16 text-center"
          data-ocid="investments.empty_state"
        >
          <p className="text-4xl mb-3">📈</p>
          <p className="text-muted-foreground text-sm">
            No investments tracked yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">Tap + to add one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {investments.map((inv, i) => {
            const pnl = inv.currentValue - inv.initialAmount;
            const pnlPct =
              inv.initialAmount > 0 ? (pnl / inv.initialAmount) * 100 : 0;
            return (
              <motion.div
                key={inv.id.toString()}
                className="bg-card rounded-2xl p-4 shadow-xs"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                data-ocid={`investments.item.${i + 1}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {inv.name}
                    </p>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 mt-1 border-0 ${TYPE_BADGE_CLASS[inv.investmentType] || ""}`}
                    >
                      {inv.investmentType}
                    </Badge>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(inv)}
                      className="text-muted-foreground hover:text-foreground"
                      data-ocid={`investments.edit_button.${i + 1}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(inv.id)}
                      className="text-muted-foreground hover:text-red-500"
                      data-ocid={`investments.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Invested
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      {formatCurrency(inv.initialAmount, inv.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Current</p>
                    <p className="text-xs font-semibold text-foreground">
                      {formatCurrency(inv.currentValue, inv.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">P&amp;L</p>
                    <p
                      className={`text-xs font-bold ${pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {pnl >= 0 ? "+" : ""}
                      {pnlPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
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
        data-ocid="investments.add.button"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="max-w-[390px] rounded-2xl"
          data-ocid="investments.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editInv ? "Edit Investment" : "Add Investment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Apple Stocks"
                data-ocid="investments.name.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.investmentType}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, investmentType: v }))
                  }
                >
                  <SelectTrigger data-ocid="investments.type.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}
                >
                  <SelectTrigger data-ocid="investments.currency.select">
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Initial Amount</Label>
                <Input
                  type="number"
                  value={form.initialAmount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, initialAmount: e.target.value }))
                  }
                  placeholder="0.00"
                  data-ocid="investments.initial.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Current Value</Label>
                <Input
                  type="number"
                  value={form.currentValue}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, currentValue: e.target.value }))
                  }
                  placeholder="0.00"
                  data-ocid="investments.current.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
                data-ocid="investments.date.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Optional notes"
                rows={2}
                data-ocid="investments.notes.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              data-ocid="investments.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              data-ocid="investments.submit.button"
            >
              {saving ? "Saving..." : editInv ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
