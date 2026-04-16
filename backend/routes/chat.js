const express = require("express");
const Groq = require("groq-sdk");
const router = express.Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post("/chat", async (req, res) => {
  try {
    const { message, expenses, analytics } = req.body;
    if (!message) return res.status(400).json({ error: "message required" });

    const systemPrompt = `You are SpendPilot AI, a friendly financial advisor. 
Use ONLY the provided data for answers. Never invent numbers.

User's financial data:
- Total spent: ₹${analytics?.totalSpending || 0}
- Remaining budget: ₹${analytics?.remainingBudget || 0}
- Daily average: ₹${Math.round(analytics?.averageDaily || 0)}
- Safe daily limit: ₹${Math.round(analytics?.safeDailyLimit || 0)}
- Risk level: ${analytics?.riskLevel || "unknown"}
- Top category: ${analytics?.topCategory || "N/A"}
- Category breakdown: ${JSON.stringify(analytics?.categoryBreakdown || {})}
- Total transactions: ${expenses?.length || 0}

Keep responses concise, actionable, and supportive. Use the data above for all financial references.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    res.json({
      message: completion.choices[0]?.message?.content || "I couldn't generate a response.",
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat request failed" });
  }
});

module.exports = router;
