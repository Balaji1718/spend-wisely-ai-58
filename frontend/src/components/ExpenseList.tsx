import { motion } from "framer-motion";
import { Trash2, Calendar, Tag } from "lucide-react";
import { Expense, deleteExpense } from "@/services/expenses";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  expenses: Expense[];
  loading: boolean;
  onDeleted: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "bg-orange-100 text-orange-700",
  Transport: "bg-blue-100 text-blue-700",
  Shopping: "bg-purple-100 text-purple-700",
  "Bills & Utilities": "bg-green-100 text-green-700",
  Entertainment: "bg-pink-100 text-pink-700",
  Health: "bg-red-100 text-red-700",
  Education: "bg-indigo-100 text-indigo-700",
  Other: "bg-gray-100 text-gray-700",
};

export default function ExpenseList({ expenses, loading, onDeleted }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteExpense(user.uid, id);
      toast({ title: "Expense deleted" });
      onDeleted();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <h3 className="font-display font-semibold text-foreground mb-4">Recent Expenses</h3>
      {expenses.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          No expenses yet. Start tracking your spending!
        </p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {expenses.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{exp.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other}`}>
                    <Tag className="w-3 h-3 inline mr-1" />
                    {exp.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {exp.date}
                  </span>
                </div>
              </div>
              <span className="font-display font-semibold text-foreground">
                ₹{exp.amount.toLocaleString()}
              </span>
              <button
                onClick={() => handleDelete(exp.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
