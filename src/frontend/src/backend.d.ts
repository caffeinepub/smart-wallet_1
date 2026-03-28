import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SavingsGoal {
    id: bigint;
    userId: Principal;
    name: string;
    description: string;
    targetAmount: number;
    currency: string;
    targetDate: bigint;
    currentAmount: number;
}
export interface Investment {
    id: bigint;
    userId: Principal;
    date: bigint;
    name: string;
    currentValue: number;
    currency: string;
    initialAmount: number;
    notes: string;
    investmentType: string;
}
export interface Budget {
    id: bigint;
    month: string;
    userId: Principal;
    monthlyLimit: number;
    currency: string;
    category: string;
}
export interface UserProfile {
    name: string;
}
export interface Transaction {
    id: bigint;
    transactionType: string;
    isRecurring: boolean;
    userId: Principal;
    date: bigint;
    description: string;
    recurringPeriod?: string;
    currency: string;
    category: string;
    amount: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addInvestment(investment: Investment): Promise<bigint>;
    addSavingsGoal(goal: SavingsGoal): Promise<bigint>;
    addTransaction(transaction: Transaction): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteBudget(budgetId: bigint): Promise<void>;
    deleteInvestment(investmentId: bigint): Promise<void>;
    deleteSavingsGoal(goalId: bigint): Promise<void>;
    deleteTransaction(transactionId: bigint): Promise<void>;
    getBudgetsByMonth(month: string): Promise<Array<Budget>>;
    getBudgetsForCaller(): Promise<Array<Budget>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getInvestmentById(id: bigint): Promise<Investment | null>;
    getInvestmentsForCaller(): Promise<Array<Investment>>;
    getSavingsGoalById(id: bigint): Promise<SavingsGoal | null>;
    getSavingsGoalsForCaller(): Promise<Array<SavingsGoal>>;
    getTransactionById(id: bigint): Promise<Transaction | null>;
    getTransactionsByDateRange(from: bigint, to: bigint): Promise<Array<Transaction>>;
    getTransactionsForCaller(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setBudget(budget: Budget): Promise<bigint>;
    updateInvestment(investment: Investment): Promise<void>;
    updateSavingsGoal(goal: SavingsGoal): Promise<void>;
    updateTransaction(transaction: Transaction): Promise<void>;
}
