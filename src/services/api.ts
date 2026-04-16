// Backend API service - configure this URL to point to your Express backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface Expense {
  id?: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface AnalyticsData {
  totalSpending: number;
  categoryBreakdown: Record<string, number>;
  averageDaily: number;
  remainingBudget: number;
  riskLevel: string;
  safeDailyLimit: number;
  topCategory: string;
}

interface ChatResponse {
  message: string;
  suggestions?: string[];
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export async function getAnalytics(userId: string, expenses: Expense[]): Promise<AnalyticsData> {
  return apiCall("/analytics", {
    method: "POST",
    body: JSON.stringify({ userId, expenses }),
  });
}

export async function parseExpenseInput(
  userId: string,
  input: string
): Promise<{ amount: number; category: string; description: string } | { clarification: string }> {
  return apiCall("/parse-expense", {
    method: "POST",
    body: JSON.stringify({ userId, input }),
  });
}

export async function sendChatMessage(
  userId: string,
  message: string,
  expenses: Expense[],
  analytics: AnalyticsData | null
): Promise<ChatResponse> {
  return apiCall("/chat", {
    method: "POST",
    body: JSON.stringify({ userId, message, expenses, analytics }),
  });
}

// Fallback: compute analytics locally when backend is unavailable
export function computeAnalyticsLocal(expenses: Expense[], monthlyBudget = 5000): AnalyticsData {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const catMap: Record<string, number> = {};
  expenses.forEach((e) => {
    catMap[e.category] = (catMap[e.category] || 0) + e.amount;
  });

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const remaining = monthlyBudget - total;
  const daysLeft = daysInMonth - dayOfMonth + 1;

  const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
  const avgDaily = dayOfMonth > 0 ? total / dayOfMonth : 0;
  const safeLimit = daysLeft > 0 ? remaining / daysLeft : 0;

  let riskLevel = "low";
  if (remaining < 0) riskLevel = "critical";
  else if (remaining < monthlyBudget * 0.2) riskLevel = "high";
  else if (remaining < monthlyBudget * 0.4) riskLevel = "medium";

  return {
    totalSpending: total,
    categoryBreakdown: catMap,
    averageDaily: avgDaily,
    remainingBudget: remaining,
    riskLevel,
    safeDailyLimit: Math.max(0, safeLimit),
    topCategory,
  };
}
