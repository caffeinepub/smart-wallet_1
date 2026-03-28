import Map "mo:core/Map";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Float "mo:core/Float";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  // Types
  type Transaction = {
    id : Nat;
    userId : Principal;
    transactionType : Text;
    amount : Float;
    currency : Text;
    category : Text;
    description : Text;
    date : Int;
    isRecurring : Bool;
    recurringPeriod : ?Text;
  };

  type Budget = {
    id : Nat;
    userId : Principal;
    category : Text;
    monthlyLimit : Float;
    currency : Text;
    month : Text;
  };

  type SavingsGoal = {
    id : Nat;
    userId : Principal;
    name : Text;
    targetAmount : Float;
    currentAmount : Float;
    currency : Text;
    targetDate : Int;
    description : Text;
  };

  type Investment = {
    id : Nat;
    userId : Principal;
    name : Text;
    investmentType : Text;
    initialAmount : Float;
    currentValue : Float;
    currency : Text;
    date : Int;
    notes : Text;
  };

  module Transaction {
    public func compare(t1 : Transaction, t2 : Transaction) : Order.Order {
      Nat.compare(t1.id, t2.id);
    };

    public func filterByDateRange(from : Time.Time, to : Time.Time) : (Transaction) -> Bool {
      func(tx : Transaction) : Bool {
        tx.date >= from and tx.date <= to
      };
    };
  };

  // State
  var nextTransactionId = 1;
  var nextBudgetId = 1;
  var nextGoalId = 1;
  var nextInvestmentId = 1;

  let userProfiles = Map.empty<Principal, UserProfile>();
  let transactions = Map.empty<Nat, Transaction>();
  let budgets = Map.empty<Nat, Budget>();
  let savingsGoals = Map.empty<Nat, SavingsGoal>();
  let investments = Map.empty<Nat, Investment>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  func getTransactionInternal(id : Nat) : Transaction {
    switch (transactions.get(id)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?transaction) { transaction };
    };
  };

  func getBudgetInternal(id : Nat) : Budget {
    switch (budgets.get(id)) {
      case (null) { Runtime.trap("Budget not found") };
      case (?budget) { budget };
    };
  };

  func getSavingsGoalInternal(id : Nat) : SavingsGoal {
    switch (savingsGoals.get(id)) {
      case (null) { Runtime.trap("Savings goal not found") };
      case (?goal) { goal };
    };
  };

  func getInvestmentInternal(id : Nat) : Investment {
    switch (investments.get(id)) {
      case (null) { Runtime.trap("Investment not found") };
      case (?investment) { investment };
    };
  };

  // Transaction Functions
  public shared ({ caller }) func addTransaction(transaction : Transaction) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("addTransaction: Only users can add transactions");
    };
    let newId = nextTransactionId;
    nextTransactionId += 1;
    let newTransaction : Transaction = {
      transaction with
      id = newId;
      userId = caller;
      date = Time.now();
    };
    transactions.add(newId, newTransaction);
    newId;
  };

  public shared ({ caller }) func updateTransaction(transaction : Transaction) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("updateTransaction: Only users can update transactions");
    };
    let existing = getTransactionInternal(transaction.id);
    if (existing.userId != caller) { Runtime.trap("Unauthorized") };
    transactions.add(transaction.id, transaction);
  };

  public shared ({ caller }) func deleteTransaction(transactionId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("deleteTransaction: Only users can delete transactions");
    };
    let transaction = getTransactionInternal(transactionId);
    if (transaction.userId != caller) { Runtime.trap("Unauthorized") };
    transactions.remove(transactionId);
  };

  public query ({ caller }) func getTransactionsForCaller() : async [Transaction] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("getTransactions: Only users can get transactions");
    };
    transactions.values().toArray().filter(func(tx) { tx.userId == caller }).sort();
  };

  public query ({ caller }) func getTransactionById(id : Nat) : async ?Transaction {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("getTransactions: Only users can get transactions");
    };
    let transaction = getTransactionInternal(id);
    if (transaction.userId != caller) { return null };
    ?transaction;
  };

  public query ({ caller }) func getTransactionsByDateRange(from : Int, to : Int) : async [Transaction] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("getTransactions: Only users can get transactions");
    };
    transactions.values().toArray().filter(func(tx) { tx.userId == caller }).filter(Transaction.filterByDateRange(from, to)).sort();
  };

  // Budget Functions
  public shared ({ caller }) func setBudget(budget : Budget) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("setBudget: Only users can set budgets");
    };
    let newId = nextBudgetId;
    nextBudgetId += 1;
    let newBudget : Budget = {
      budget with
      id = newId;
      userId = caller;
    };
    budgets.add(newId, newBudget);
    newId;
  };

  public shared ({ caller }) func deleteBudget(budgetId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("deleteBudget: Only users can delete budgets");
    };
    let budget = getBudgetInternal(budgetId);
    if (budget.userId != caller) { Runtime.trap("Unauthorized") };
    budgets.remove(budgetId);
  };

  public query ({ caller }) func getBudgetsForCaller() : async [Budget] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("getBudgets: Only users can get budgets");
    };
    budgets.values().toArray().filter(func(b) { b.userId == caller });
  };

  public query ({ caller }) func getBudgetsByMonth(month : Text) : async [Budget] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("getBudgets: Only users can get budgets");
    };
    budgets.values().toArray().filter(func(b) { b.userId == caller and b.month == month });
  };

  // Savings Goal Functions
  public shared ({ caller }) func addSavingsGoal(goal : SavingsGoal) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("addSavingsGoal: Only users can add savings goals");
    };
    let newId = nextGoalId;
    nextGoalId += 1;
    let newGoal : SavingsGoal = {
      goal with
      id = newId;
      userId = caller;
    };
    savingsGoals.add(newId, newGoal);
    newId;
  };

  public shared ({ caller }) func updateSavingsGoal(goal : SavingsGoal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("updateSavingsGoal: Only users can update savings goals");
    };
    let existing = getSavingsGoalInternal(goal.id);
    if (existing.userId != caller) { Runtime.trap("Unauthorized") };
    savingsGoals.add(goal.id, goal);
  };

  public shared ({ caller }) func deleteSavingsGoal(goalId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("deleteSavingsGoal: Only users can delete savings goals");
    };
    let goal = getSavingsGoalInternal(goalId);
    if (goal.userId != caller) { Runtime.trap("Unauthorized") };
    savingsGoals.remove(goalId);
  };

  public query ({ caller }) func getSavingsGoalsForCaller() : async [SavingsGoal] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("getSavingsGoals: Only users can get savings goals");
    };
    savingsGoals.values().toArray().filter(func(g) { g.userId == caller });
  };

  public query ({ caller }) func getSavingsGoalById(id : Nat) : async ?SavingsGoal {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("getSavingsGoals: Only users can get savings goals");
    };
    let goal = getSavingsGoalInternal(id);
    if (goal.userId != caller) { return null };
    ?goal;
  };

  // Investment Functions
  public shared ({ caller }) func addInvestment(investment : Investment) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("addInvestment: Only users can add investments");
    };
    let newId = nextInvestmentId;
    nextInvestmentId += 1;
    let newInvestment : Investment = {
      investment with
      id = newId;
      userId = caller;
    };
    investments.add(newId, newInvestment);
    newId;
  };

  public shared ({ caller }) func updateInvestment(investment : Investment) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("updateInvestment: Only users can update investments");
    };
    let existing = getInvestmentInternal(investment.id);
    if (existing.userId != caller) { Runtime.trap("Unauthorized") };
    investments.add(investment.id, investment);
  };

  public shared ({ caller }) func deleteInvestment(investmentId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("deleteInvestment: Only users can delete investments");
    };
    let investment = getInvestmentInternal(investmentId);
    if (investment.userId != caller) { Runtime.trap("Unauthorized") };
    investments.remove(investmentId);
  };

  public query ({ caller }) func getInvestmentsForCaller() : async [Investment] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("getInvestments: Only users can get investments");
    };
    investments.values().toArray().filter(func(i) { i.userId == caller });
  };

  public query ({ caller }) func getInvestmentById(id : Nat) : async ?Investment {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("getInvestments: Only users can get investments");
    };
    let investment = getInvestmentInternal(id);
    if (investment.userId != caller) { return null };
    ?investment;
  };
};
