import type { Budget, Investment, SavingsGoal, Transaction } from "../backend";

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function generateInsights(
  transactions: Transaction[],
  _budgets: Budget[],
  savingsGoals: SavingsGoal[],
  investments: Investment[],
): string[] {
  const insights: string[] = [];
  const now = new Date();
  const thisMonth = getMonthKey(now);
  const lastMonth = getMonthKey(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  );

  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(Number(t.date));
    return getMonthKey(d) === thisMonth;
  });
  const lastMonthTx = transactions.filter((t) => {
    const d = new Date(Number(t.date));
    return getMonthKey(d) === lastMonth;
  });

  const thisIncome = thisMonthTx
    .filter((t) => t.transactionType === "income")
    .reduce((s, t) => s + t.amount, 0);
  const thisExpenses = thisMonthTx
    .filter((t) => t.transactionType === "expense")
    .reduce((s, t) => s + t.amount, 0);

  if (thisIncome > 0 && thisExpenses > 0) {
    const pct = Math.round((thisExpenses / thisIncome) * 100);
    if (pct >= 90) {
      insights.push(
        `\u26A0\uFE0F High spending: you've used ${pct}% of this month's income`,
      );
    } else if (thisExpenses < thisIncome) {
      insights.push("\u2705 Great job! You have a positive balance this month");
    }
  }

  // Biggest expense category
  const catSpend: Record<string, number> = {};
  for (const t of thisMonthTx.filter((t) => t.transactionType === "expense")) {
    catSpend[t.category] = (catSpend[t.category] || 0) + t.amount;
  }
  const topCat = Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0];
  if (topCat && thisExpenses > 0) {
    const pct = Math.round((topCat[1] / thisExpenses) * 100);
    insights.push(
      `Your biggest expense is ${topCat[0]} at ${pct}% of expenses`,
    );
  }

  // Category increase vs last month
  if (topCat) {
    const lastCatSpend = lastMonthTx
      .filter(
        (t) => t.transactionType === "expense" && t.category === topCat[0],
      )
      .reduce((s, t) => s + t.amount, 0);
    if (lastCatSpend > 0) {
      const inc = Math.round(((topCat[1] - lastCatSpend) / lastCatSpend) * 100);
      if (inc > 20) {
        insights.push(
          `\uD83D\uDCC8 ${topCat[0]} spending is up ${inc}% from last month`,
        );
      }
    }
  }

  // Savings goals
  if (savingsGoals.length > 0) {
    const avgProgress =
      savingsGoals.reduce(
        (s, g) =>
          s + (g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0),
        0,
      ) / savingsGoals.length;
    if (avgProgress < 0.3) {
      insights.push(
        `\uD83C\uDFAF Boost your savings - you're at ${Math.round(avgProgress * 100)}% of your goals on average`,
      );
    }
  }

  // Investments
  if (investments.length === 0) {
    insights.push("\uD83D\uDCA1 Start investing to grow your wealth over time");
  }

  if (insights.length === 0) {
    insights.push(
      "\uD83D\uDCCA Keep tracking your finances to get personalized insights",
    );
  }

  return insights;
}
