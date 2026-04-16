import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  DollarSign,
  PieChart,
} from "lucide-react";
import { computeAnalyticsLocal } from "@/services/api";
import { Expense } from "@/services/expenses";

interface Props {
  expenses: Expense[];
}

const RISK_CONFIG: Record<string, { color: string; icon: typeof Shield; label: string }> = {
  low: { color: "text-primary", icon: Shield, label: "On Track" },
  medium: { color: "text-yellow-500", icon: TrendingUp, label: "Watch Spending" },
  high: { color: "text-orange-500", icon: TrendingDown, label: "Overspending" },
  critical: { color: "text-destructive", icon: AlertTriangle, label: "Over Budget!" },
};

export default function Analytics({ expenses }: Props) {
  const data = computeAnalyticsLocal(expenses);
  const risk = RISK_CONFIG[data.riskLevel] || RISK_CONFIG.low;
  const RiskIcon = risk.icon;

  const cards = [
    {
      title: "Total Spent",
      value: `₹${data.totalSpending.toLocaleString()}`,
      icon: DollarSign,
      accent: false,
    },
    {
      title: "Daily Average",
      value: `₹${Math.round(data.averageDaily).toLocaleString()}`,
      icon: TrendingUp,
      accent: false,
    },
    {
      title: "Remaining Budget",
      value: `₹${Math.max(0, data.remainingBudget).toLocaleString()}`,
      icon: Shield,
      accent: data.remainingBudget > 0,
    },
    {
      title: "Safe Daily Limit",
      value: `₹${Math.round(data.safeDailyLimit).toLocaleString()}`,
      icon: TrendingDown,
      accent: false,
    },
  ];

  const categories = Object.entries(data.categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCat = categories[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      {/* Risk Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card rounded-2xl border border-border p-5 shadow-card flex items-center gap-4`}
      >
        <div className={`p-3 rounded-xl bg-muted ${risk.color}`}>
          <RiskIcon className="w-6 h-6" />
        </div>
        <div>
          <p className={`font-display font-semibold ${risk.color}`}>{risk.label}</p>
          <p className="text-sm text-muted-foreground">
            {data.riskLevel === "low" && "You're managing your budget well this month."}
            {data.riskLevel === "medium" && "You're approaching your budget limit."}
            {data.riskLevel === "high" && "Consider reducing non-essential spending."}
            {data.riskLevel === "critical" && "You've exceeded your monthly budget."}
          </p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-card"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{card.title}</span>
            </div>
            <p className={`text-xl font-display font-bold ${card.accent ? "text-primary" : "text-foreground"}`}>
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-card"
      >
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-display font-semibold text-foreground">Category Breakdown</h3>
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Add expenses to see breakdown</p>
        ) : (
          <div className="space-y-3">
            {categories.map(([cat, amt]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">{cat}</span>
                  <span className="text-muted-foreground">₹{amt.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(amt / maxCat) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="h-full rounded-full gradient-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
