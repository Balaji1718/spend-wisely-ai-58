import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, addExpense } from "@/services/expenses";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onAdded: () => void;
}

export default function ExpenseInput({ onAdded }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"smart" | "manual">("smart");
  const [smartInput, setSmartInput] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSmartSubmit = async () => {
    if (!smartInput.trim() || !user) return;
    setLoading(true);
    try {
      // Try to parse locally with simple patterns
      const parsed = parseSmartInput(smartInput);
      if (parsed) {
        await addExpense(user.uid, parsed);
        toast({ title: "Expense added!", description: `₹${parsed.amount} for ${parsed.description}` });
        setSmartInput("");
        onAdded();
      } else {
        toast({
          title: "Couldn't parse",
          description: "Try manual entry or be more specific (e.g., 'spent 500 on lunch')",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!amount || !category || !user) return;
    setLoading(true);
    try {
      await addExpense(user.uid, {
        amount: parseFloat(amount),
        category,
        description: description || category,
      });
      toast({ title: "Expense added!" });
      setAmount("");
      setCategory("");
      setDescription("");
      onAdded();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">Add Expense</h3>
        <div className="flex bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setMode("smart")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === "smart" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
            }`}
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            Smart
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === "manual" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
            }`}
          >
            Manual
          </button>
        </div>
      </div>

      {mode === "smart" ? (
        <div className="flex gap-2">
          <Input
            placeholder='e.g. "spent 500 on groceries" or "uber 250"'
            value={smartInput}
            onChange={(e) => setSmartInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSmartSubmit()}
            disabled={loading}
            className="bg-muted/50"
          />
          <Button
            onClick={handleSmartSubmit}
            disabled={loading || !smartInput.trim()}
            className="gradient-primary text-primary-foreground shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            className="bg-muted/50"
          />
          <Select value={category} onValueChange={setCategory} disabled={loading}>
            <SelectTrigger className="bg-muted/50">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            className="bg-muted/50"
          />
          <Button
            onClick={handleManualSubmit}
            disabled={loading || !amount || !category}
            className="gradient-primary text-primary-foreground"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Add</>}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function parseSmartInput(text: string): { amount: number; category: string; description: string } | null {
  const lower = text.toLowerCase();
  // Match patterns like "500 on groceries", "spent 200 for taxi", "uber 150"
  const amountMatch = lower.match(/(\d+(?:\.\d+)?)/);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1]);

  const categoryMap: Record<string, string[]> = {
    "Food & Dining": ["food", "lunch", "dinner", "breakfast", "coffee", "restaurant", "groceries", "meal", "snack", "eat"],
    Transport: ["uber", "taxi", "cab", "bus", "train", "metro", "fuel", "petrol", "gas", "transport", "ride"],
    Shopping: ["shopping", "clothes", "amazon", "flipkart", "buy", "purchase", "shoes"],
    "Bills & Utilities": ["bill", "electricity", "water", "internet", "wifi", "phone", "rent", "emi"],
    Entertainment: ["movie", "netflix", "spotify", "game", "party", "concert", "fun"],
    Health: ["doctor", "medicine", "pharmacy", "hospital", "gym", "health"],
    Education: ["book", "course", "class", "tuition", "school", "college"],
  };

  let category = "Other";
  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      category = cat;
      break;
    }
  }

  const desc = text.replace(/\d+(?:\.\d+)?/, "").replace(/spent|on|for|at|in/gi, "").trim() || category;
  return { amount, category, description: desc.charAt(0).toUpperCase() + desc.slice(1) };
}
