const express = require("express");
const Groq = require("groq-sdk");
const router = express.Router();

router.post("/parse-expense", async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: "GROQ_API_KEY is not configured" });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const { input } = req.body;
    if (!input) return res.status(400).json({ error: "input required" });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `Extract expense data from user input. Return JSON only.
Categories: Food & Dining, Transport, Shopping, Bills & Utilities, Entertainment, Health, Education, Other.
Format: {"amount": number, "category": "string", "description": "string"}
If unclear, return: {"clarification": "what you need to know"}`,
        },
        { role: "user", content: input },
      ],
      max_tokens: 100,
      temperature: 0,
    });

    const text = completion.choices[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json({ clarification: "Could you rephrase? Include amount and what it was for." });
    }
  } catch (err) {
    console.error("Parse error:", err);
    res.status(500).json({ error: "Failed to parse input" });
  }
});

module.exports = router;
