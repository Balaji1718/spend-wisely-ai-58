import { useAuth } from "@/contexts/AuthContext";
import Login from "./Login";
import Dashboard from "./Dashboard";
import { Loader2 } from "lucide-react";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}
