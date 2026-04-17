import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import ExpenseInput from "@/components/ExpenseInput";
import ExpenseList from "@/components/ExpenseList";
import Analytics from "@/components/Analytics";
import ChatInterface from "@/components/ChatInterface";
import { getExpenses, Expense } from "@/services/expenses";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"dashboard" | "chat" | "analytics">("dashboard");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getExpenses(user.uid);
      setExpenses(data);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return (
    <DashboardLayout activeTab={tab} onTabChange={setTab}>
      {tab === "dashboard" && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Welcome{user?.displayName ? `, ${user.displayName}` : ""}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Track and manage your expenses</p>
          </div>
          <ExpenseInput onAdded={fetchExpenses} />
          <ExpenseList expenses={expenses} loading={loading} onDeleted={fetchExpenses} />
        </div>
      )}
      {tab === "analytics" && (
        <div className="max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground text-sm mt-1">Your spending insights</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Analytics expenses={expenses} />
          )}
        </div>
      )}
      {tab === "chat" && (
        <div className="max-w-3xl">
          <ChatInterface expenses={expenses} />
        </div>
      )}
    </DashboardLayout>
  );
}
