import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout, { Tab } from "@/components/DashboardLayout";
import AddExpenseForm from "@/components/AddExpenseForm";
import AllExpensesTable from "@/components/AllExpensesTable";
import DashboardOverview from "@/components/DashboardOverview";
import BudgetManager from "@/components/BudgetManager";
import AITipsPanel from "@/components/AITipsPanel";
import ChatInterface from "@/components/ChatInterface";
import { getExpenses, Expense } from "@/services/expenses";
import { Budget, getBudgets } from "@/services/budgets";
import { buildCsv, filterExpensesByMonth, getCategoryTotals, getDailyTrend, MONTHS } from "@/lib/finance";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [expenseData, budgetData] = await Promise.all([
        getExpenses(user.uid),
        getBudgets(user.uid),
      ]);
      setExpenses(expenseData);
      setBudgets(budgetData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthExpenses = useMemo(
    () => filterExpensesByMonth(expenses, selectedMonth, selectedYear),
    [expenses, selectedMonth, selectedYear]
  );
  const categoryTotals = useMemo(() => getCategoryTotals(monthExpenses), [monthExpenses]);
  const dailyTrend = useMemo(() => getDailyTrend(monthExpenses), [monthExpenses]);
  const monthBudgets = useMemo(
    () => budgets.filter((b) => b.month === selectedMonth && b.year === selectedYear),
    [budgets, selectedMonth, selectedYear]
  );

  const yearOptions = useMemo(() => {
    const y = now.getFullYear();
    return [y - 1, y, y + 1, y + 2];
  }, [now]);

  const handleExportCsv = () => {
    const csv = buildCsv(monthExpenses);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expenses-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported" });
  };

  const showMonthControls = tab === "dashboard" || tab === "budget" || tab === "ai-tips" || tab === "export-csv";

  return (
    <DashboardLayout activeTab={tab} onTabChange={setTab}>
      <div className="space-y-4 max-w-6xl mx-auto">
        {showMonthControls && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white/95 backdrop-blur max-w-md p-3 shadow-soft">
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={month} value={String(index + 1)}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {tab === "dashboard" && (
              <DashboardOverview
                monthName={`${MONTHS[selectedMonth - 1]} ${selectedYear}`}
                monthExpenses={monthExpenses}
                categoryTotals={categoryTotals}
                dailyTrend={dailyTrend}
                monthBudgets={monthBudgets}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onOpenAddExpense={() => setTab("add-expense")}
                onOpenAllExpenses={() => setTab("all-expenses")}
              />
            )}

            {tab === "add-expense" && <AddExpenseForm onSaved={fetchData} />}

            {tab === "all-expenses" && (
              <div className="max-w-5xl">
                <AllExpensesTable expenses={expenses} onDeleted={fetchData} />
              </div>
            )}

            {tab === "budget" && (
              <div className="max-w-5xl">
                <BudgetManager
                  budgets={budgets}
                  expenses={expenses}
                  month={selectedMonth}
                  year={selectedYear}
                  onSaved={fetchData}
                />
              </div>
            )}

            {tab === "export-csv" && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-2xl space-y-3 shadow-soft mx-auto">
                <h2 className="font-display text-xl font-bold">Export CSV</h2>
                <p className="text-sm text-muted-foreground">
                  Export expenses for {MONTHS[selectedMonth - 1]} {selectedYear}.
                </p>
                <Button className="bg-teal-700 hover:bg-teal-800 text-white" onClick={handleExportCsv}>Export CSV</Button>
              </div>
            )}

            {tab === "ai-tips" && (
              <AITipsPanel
                expenses={expenses}
                budgets={budgets}
                month={selectedMonth}
                year={selectedYear}
              />
            )}

            {tab === "chat" && (
              <div className="max-w-3xl mx-auto">
                <ChatInterface expenses={expenses} />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
