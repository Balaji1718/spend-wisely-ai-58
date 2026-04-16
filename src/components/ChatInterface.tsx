import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Expense } from "@/services/expenses";
import { sendChatMessage, computeAnalyticsLocal } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  expenses: Expense[];
}

export default function ChatInterface({ expenses }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your SpendPilot AI assistant. Ask me about your spending habits, budget advice, or financial tips!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const analytics = computeAnalyticsLocal(expenses);
      const res = await sendChatMessage(user.uid, userMsg, expenses, analytics);
      setMessages((prev) => [...prev, { role: "assistant", content: res.message }]);
    } catch {
      // Fallback response when backend is unavailable
      const analytics = computeAnalyticsLocal(expenses);
      const fallback = generateFallbackResponse(userMsg, analytics, expenses);
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground text-sm">AI Financial Advisor</h3>
          <p className="text-xs text-muted-foreground">Powered by your spending data</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === "assistant" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                }`}
              >
                {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "gradient-primary text-primary-foreground"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-muted rounded-2xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your finances..."
            disabled={loading}
            className="bg-muted/50"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="gradient-primary text-primary-foreground shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function generateFallbackResponse(
  query: string,
  analytics: ReturnType<typeof computeAnalyticsLocal>,
  expenses: Expense[]
): string {
  const lower = query.toLowerCase();
  if (lower.includes("total") || lower.includes("spent"))
    return `You've spent a total of ₹${analytics.totalSpending.toLocaleString()} this month. Your top category is ${analytics.topCategory}.`;
  if (lower.includes("budget") || lower.includes("remain"))
    return `Your remaining budget is ₹${Math.max(0, analytics.remainingBudget).toLocaleString()}. Your safe daily limit is ₹${Math.round(analytics.safeDailyLimit).toLocaleString()}.`;
  if (lower.includes("category") || lower.includes("breakdown"))
    return `Here's your breakdown:\n${Object.entries(analytics.categoryBreakdown).map(([c, a]) => `• ${c}: ₹${a.toLocaleString()}`).join("\n")}`;
  if (lower.includes("save") || lower.includes("tip") || lower.includes("advice"))
    return `Based on your spending, try limiting ${analytics.topCategory} expenses. Your daily average is ₹${Math.round(analytics.averageDaily).toLocaleString()} — aim to keep it under ₹${Math.round(analytics.safeDailyLimit).toLocaleString()}.`;
  return `You've spent ₹${analytics.totalSpending.toLocaleString()} across ${expenses.length} transactions. Top category: ${analytics.topCategory}. Risk level: ${analytics.riskLevel}. Ask me anything specific about your budget!`;
}
