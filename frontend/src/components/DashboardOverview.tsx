import { Expense } from "@/services/expenses";
import { Budget } from "@/services/budgets";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, TrendingUp } from "lucide-react";
import { buildAiTips, getExceededBudgetMessages, getBudgetLeakageSummary, buildBalancePlan, getDailyLeakageTrend } from "@/lib/finance";

interface Props {
  monthName: string;
  monthExpenses: Expense[];
  categoryTotals: Record<string, number>;
  dailyTrend: { date: string; amount: number }[];
  monthBudgets: Budget[];
  selectedMonth?: number;
  selectedYear?: number;
  onOpenAddExpense: () => void;
  onOpenAllExpenses: () => void;
}

const PIE_COLORS = ["#0f766e", "#0284c7", "#f59e0b", "#7c3aed", "#14b8a6", "#ef4444", "#0891b2", "#334155", "#dc2626"];

export default function DashboardOverview({
  monthName,
  monthExpenses,
  categoryTotals,
  dailyTrend,
  monthBudgets,
  selectedMonth = 1,
  selectedYear = 2026,
  onOpenAddExpense,
  onOpenAllExpenses,
}: Props) {
  const totalSpent = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const activeBudgets = monthBudgets.length;
  const warnings = getExceededBudgetMessages(monthBudgets, categoryTotals);
  const tips = buildAiTips(monthExpenses, monthBudgets, categoryTotals);
  const leakageSummary = getBudgetLeakageSummary(monthBudgets, categoryTotals);
  const balancePlan = buildBalancePlan(leakageSummary.balanceAfterLeakage);

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  
  // Add leakage ring to pie chart if there is any leakage
  let pieDataWithLeakage = pieData;
  if (leakageSummary.totalLeakage > 0) {
    pieDataWithLeakage = [...pieData, { name: "Leakage", value: leakageSummary.totalLeakage }];
  }

  // Compute daily trend with leakage when budgets exist
  const dailyTrendWithLeakage = monthBudgets.length > 0 
    ? getDailyLeakageTrend(monthExpenses, monthBudgets, selectedMonth, selectedYear)
    : dailyTrend;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Financial Workspace</h1>
          <p className="text-sm text-muted-foreground">Month: {monthName}</p>
        </div>
        <button
          onClick={onOpenAddExpense}
          className="rounded-lg px-4 py-2 text-sm font-medium bg-teal-700 hover:bg-teal-800 text-white shadow-soft"
        >
          + New Expense
        </button>
      </motion.div>

      {warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.2 }}
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <div className="font-medium inline-flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Budget exceeded in {warnings.length} categor{warnings.length > 1 ? "ies" : "y"}
          </div>
          <p className="mt-1">{warnings[0]}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.2 }}
        className="rounded-xl border border-teal-100 bg-gradient-to-br from-white to-teal-50 p-4"
      >
        <h3 className="font-display font-semibold text-sm mb-2 text-teal-800">Weekly Guidance</h3>
        <ul className="space-y-1 text-sm text-slate-600">
          {tips.slice(0, 2).map((tip) => (
            <li key={tip}>- {tip}</li>
          ))}
        </ul>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <StatCard
          title="Total This Month"
          value={`Rs.${Math.round(totalSpent).toLocaleString()}`}
          className="bg-white border border-slate-200 text-slate-900"
          delay={0.12}
        />
        <StatCard
          title="Expenses Logged"
          value={monthExpenses.length.toString()}
          className="bg-white border border-slate-200 text-slate-900"
          delay={0.16}
        />
        <StatCard
          title="Active Budgets"
          value={activeBudgets.toString()}
          className="bg-white border border-slate-200 text-slate-900"
          delay={0.2}
        />
        {leakageSummary.totalLeakage > 0 && (
          <StatCard
            title="Expense Leakage"
            value={`Rs.${Math.round(leakageSummary.totalLeakage).toLocaleString()}`}
            className="bg-red-50 border border-red-200 text-red-900"
            delay={0.24}
          />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.2 }}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <h3 className="font-display font-semibold mb-3">Spending by Category</h3>
          {pieDataWithLeakage.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add expenses to view category insights.</p>
          ) : (
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieDataWithLeakage} dataKey="value" nameKey="name" innerRadius={58} outerRadius={95}>
                    {pieDataWithLeakage.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `Rs.${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {leakageSummary.totalLeakage > 0 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              <p className="font-semibold">Leakage Breakdown:</p>
              {leakageSummary.leakageByCategory.slice(0, 3).map((item) => (
                <p key={item.category} className="mt-1">
                  {item.category}: Rs.{Math.round(item.leakage).toLocaleString()}
                </p>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.2 }}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <h3 className="font-display font-semibold mb-3">Daily Spending Trend</h3>
          {dailyTrendWithLeakage.length === 0 ? (
            <p className="text-sm text-muted-foreground">No spend data for selected month.</p>
          ) : (
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrendWithLeakage} margin={{ left: 6, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(8)} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `Rs.${value.toLocaleString()}`} />
                  {monthBudgets.length > 0 && <Legend />}
                  <Line type="monotone" dataKey="amount" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} name="Actual Spend" />
                  {monthBudgets.length > 0 && "leakage" in dailyTrendWithLeakage[0] && (
                    <Line type="monotone" dataKey="leakage" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Daily Leakage" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {leakageSummary.totalLeakage > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.2 }}
          className="rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-display font-semibold text-red-900">How to spend the balance after leakage?</h3>
          </div>
          <div className="space-y-2 text-sm text-red-800">
            <p className="font-semibold">Remaining Balance: Rs.{Math.round(leakageSummary.balanceAfterLeakage).toLocaleString()}</p>
            {balancePlan.map((plan, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="font-semibold min-w-fit">Tip {idx + 1}:</span>
                <p>{plan}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.2 }}
        className="rounded-xl border border-slate-200 bg-white p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-semibold">Recent Expenses</h3>
          <button
            onClick={onOpenAllExpenses}
            className="text-xs text-teal-700 hover:text-teal-800 underline underline-offset-2"
          >
            View All
          </button>
        </div>
        {monthExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expenses found for {monthName}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-2">Title</th>
                  <th className="py-2 pr-2">Category</th>
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {monthExpenses.slice(0, 5).map((expense) => (
                  <tr key={expense.id} className="border-b border-border/60">
                    <td className="py-2 pr-2">{expense.title || expense.description}</td>
                    <td className="py-2 pr-2">{expense.category}</td>
                    <td className="py-2 pr-2">{expense.date}</td>
                    <td className="py-2 text-right font-medium text-teal-700">Rs.{expense.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({
  title,
  value,
  className,
  delay,
}: {
  title: string;
  value: string;
  className: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      className={`rounded-xl p-4 shadow-soft ${className}`}
    >
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-3xl font-display font-bold mt-2">{value}</p>
    </motion.div>
  );
}
