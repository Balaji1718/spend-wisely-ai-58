const express = require("express");
const router = express.Router();

router.post("/analytics", (req, res) => {
  try {
    const { expenses } = req.body;
    if (!expenses || !Array.isArray(expenses)) {
      return res.status(400).json({ error: "expenses array required" });
    }

    const monthlyBudget = 5000;
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const catMap = {};
    expenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const remaining = monthlyBudget - total;
    const daysLeft = daysInMonth - dayOfMonth + 1;
    const avgDaily = dayOfMonth > 0 ? total / dayOfMonth : 0;
    const safeLimit = daysLeft > 0 ? remaining / daysLeft : 0;

    const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

    let riskLevel = "low";
    if (remaining < 0) riskLevel = "critical";
    else if (remaining < monthlyBudget * 0.2) riskLevel = "high";
    else if (remaining < monthlyBudget * 0.4) riskLevel = "medium";

    res.json({
      totalSpending: total,
      categoryBreakdown: catMap,
      averageDaily: avgDaily,
      remainingBudget: remaining,
      riskLevel,
      safeDailyLimit: Math.max(0, safeLimit),
      topCategory,
    });
  } catch (err) {
    res.status(500).json({ error: "Analytics computation failed" });
  }
});

module.exports = router;
