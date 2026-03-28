import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  Budget,
  Investment,
  SavingsGoal,
  Transaction,
  UserProfile,
} from "../backend";
import { useActor } from "../hooks/useActor";

interface AppData {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  investments: Investment[];
  userProfile: UserProfile | null;
  loading: boolean;
  currency: string;
  setCurrency: (c: string) => void;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppData | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching } = useActor();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const currency = "TZS";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setCurrency = (_c: string) => {};

  const refresh = useCallback(async () => {
    if (!actor || isFetching) return;
    setLoading(true);
    try {
      const [txs, buds, goals, invs, profile] = await Promise.all([
        actor.getTransactionsForCaller(),
        actor.getBudgetsForCaller(),
        actor.getSavingsGoalsForCaller(),
        actor.getInvestmentsForCaller(),
        actor.getCallerUserProfile(),
      ]);
      setTransactions(txs);
      setBudgets(buds);
      setSavingsGoals(goals);
      setInvestments(invs);
      setUserProfile(profile);
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setLoading(false);
    }
  }, [actor, isFetching]);

  useEffect(() => {
    if (actor && !isFetching) {
      refresh();
    }
  }, [actor, isFetching, refresh]);

  return (
    <AppContext.Provider
      value={{
        transactions,
        budgets,
        savingsGoals,
        investments,
        userProfile,
        loading,
        currency,
        setCurrency,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppData(): AppData {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppData must be used within AppProvider");
  return ctx;
}
