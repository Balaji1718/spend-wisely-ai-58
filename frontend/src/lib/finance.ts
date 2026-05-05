import { Budget } from "@/services/budgets";
import { Expense } from "@/services/expenses";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function parseExpenseDate(dateValue: string): Date {
  const parsed = new Date(dateValue);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  return new Date();
}

export function filterExpensesByMonth(expenses: Expense[], month: number, year: number): Expense[] {
  return expenses.filter((exp) => {
    const d = parseExpenseDate(exp.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });
}

export function getCategoryTotals(expenses: Expense[]): Record<string, number> {
  return expenses.reduce<Record<string, number>>((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});
}

export function getDailyTrend(expenses: Expense[]) {
  const byDate = expenses.reduce<Record<string, number>>((acc, exp) => {
    acc[exp.date] = (acc[exp.date] || 0) + exp.amount;
    return acc;
  }, {});

  return Object.entries(byDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getMonthBudgets(budgets: Budget[], month: number, year: number): Budget[] {
  return budgets.filter((b) => b.month === month && b.year === year);
}

export interface BudgetLeakageItem {
  category: string;
  spent: number;
  limit: number;
  leakage: number;
}

export interface BudgetLeakageSummary {
  totalBudget: number;
  totalSpent: number;
  totalLeakage: number;
  balanceAfterLeakage: number;
  topLeakageCategory: BudgetLeakageItem | null;
  leakageByCategory: BudgetLeakageItem[];
}

export function getBudgetLeakageSummary(
  monthBudgets: Budget[],
  categoryTotals: Record<string, number>
): BudgetLeakageSummary {
  const leakageByCategory = monthBudgets
    .map((budget) => {
      const spent = categoryTotals[budget.category] || 0;
      const leakage = Math.max(0, spent - budget.limit);
      return {
        category: budget.category,
        spent,
        limit: budget.limit,
        leakage,
      };
    })
    .filter((item) => item.leakage > 0)
    .sort((a, b) => b.leakage - a.leakage);

  const totalBudget = monthBudgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
  const totalLeakage = leakageByCategory.reduce((sum, item) => sum + item.leakage, 0);

  return {
    totalBudget,
    totalSpent,
    totalLeakage,
    balanceAfterLeakage: Math.max(0, totalBudget - totalSpent),
    topLeakageCategory: leakageByCategory[0] || null,
    leakageByCategory,
  };
}

export function buildBalancePlan(balanceAmount: number): string[] {
  if (balanceAmount <= 0) {
    return [
      "No balance is left after leakage. Pause non-essential spending and rebuild your buffer before adding new expenses.",
      "If you need to spend again, keep it limited to essentials until your next budget cycle.",
    ];
  }

  const essentials = balanceAmount * 0.5;
  const savings = balanceAmount * 0.3;
  const flexible = balanceAmount - essentials - savings;

  return [
    `Set aside Rs.${Math.round(essentials).toLocaleString()} for essentials and fixed needs.`,
    `Reserve Rs.${Math.round(savings).toLocaleString()} as a savings buffer to absorb future leakage.`,
    `Keep Rs.${Math.round(flexible).toLocaleString()} for flexible spending so you stay in control.`,
  ];
}

export function getDailyLeakageTrend(
  expenses: Expense[],
  monthBudgets: Budget[],
  month: number,
  year: number
) {
  const totalBudget = monthBudgets.reduce((sum, budget) => sum + budget.limit, 0);
  const daysInMonth = new Date(year, month, 0).getDate();
  const budgetPerDay = daysInMonth > 0 ? totalBudget / daysInMonth : 0;

  return getDailyTrend(expenses).map((entry, index) => {
    const dailyLeakage = Math.max(0, entry.amount - budgetPerDay);
    const dayNumber = index + 1;
    const budgetToDate = budgetPerDay * dayNumber;
    return {
      ...entry,
      leakage: dailyLeakage,
      budgetToDate,
    };
  });
}

export function getExceededBudgetMessages(
  monthBudgets: Budget[],
  categoryTotals: Record<string, number>
): string[] {
  return monthBudgets
    .map((budget) => {
      const spent = categoryTotals[budget.category] || 0;
      if (spent <= budget.limit) {
        return null;
      }
      const overBy = Math.round((spent - budget.limit) * 100) / 100;
      return `${budget.category}: Rs.${spent.toLocaleString()} / Rs.${budget.limit.toLocaleString()} (Rs.${overBy.toLocaleString()} over)`;
    })
    .filter((value): value is string => Boolean(value));
}

export function buildAiTips(
  expenses: Expense[],
  monthBudgets: Budget[],
  categoryTotals: Record<string, number>
): string[] {
  if (expenses.length === 0) {
    return ["Add your first expense to unlock personalized tips."];
  }

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  const tips: string[] = [];

  if (topCategories.length > 0) {
    tips.push(`Your largest spend is ${topCategories[0][0]} (Rs.${topCategories[0][1].toLocaleString()}). Set a weekly cap for this category.`);
  }

  if (topCategories.length > 1) {
    tips.push(`Second highest category is ${topCategories[1][0]}. Small reductions there can improve monthly savings quickly.`);
  }

  const exceeded = getExceededBudgetMessages(monthBudgets, categoryTotals);
  if (exceeded.length > 0) {
    tips.push(`You exceeded ${exceeded.length} budget category${exceeded.length > 1 ? "ies" : ""}. Rebalance budgets for next month.`);
  } else if (monthBudgets.length > 0) {
    tips.push("Great progress. You are currently within the set category budgets.");
  } else {
    tips.push("Set category budgets to get over-spend alerts and safer daily limits.");
  }

  return tips;
}

export function buildCsv(expenses: Expense[]): string {
  const headers = ["Title", "Category", "Amount", "Date", "Note"];
  const rows = expenses.map((exp) => [
    sanitizeCsvValue(exp.title || exp.description),
    sanitizeCsvValue(exp.category),
    exp.amount.toString(),
    sanitizeCsvValue(exp.date),
    sanitizeCsvValue(exp.note || ""),
  ]);
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

function sanitizeCsvValue(value: string): string {
  if (!value.includes(",") && !value.includes("\"") && !value.includes("\n")) {
    return value;
  }
  return `"${value.replace(/\"/g, "\"\"")}"`;
}
