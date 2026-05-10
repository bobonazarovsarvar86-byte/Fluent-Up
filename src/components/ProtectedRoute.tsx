import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

type Props = {
  children: React.ReactNode;
  requireOnboarding?: boolean;
};

const ProtectedRoute = ({ children, requireOnboarding = true }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [checkedKey, setCheckedKey] = useState<string | null>(null);
  const currentCheckKey = user ? `${user.id}:${requireOnboarding}:${location.pathname}` : "guest";

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setOnboarded(null);
      setCheckedKey(currentCheckKey);
      setChecking(false);
      return;
    }

    setChecking(true);
    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setOnboarded(data?.onboarding_completed ?? false);
        setCheckedKey(currentCheckKey);
        setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, currentCheckKey]);

  if (loading || (user && (checking || checkedKey !== currentCheckKey))) {
    return (
      <div className="min-h-screen grid place-items-center gradient-hero">
        <div className="w-12 h-12 rounded-2xl gradient-primary grid place-items-center animate-pulse-glow">
          <Sparkles className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (requireOnboarding && onboarded === false && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (location.pathname === "/onboarding" && onboarded === true) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
