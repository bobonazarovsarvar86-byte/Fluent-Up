import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Req = { plan: string; status: string; created_at: string; admin_note: string | null };
type Profile = { plan: string; plan_expires_at: string | null };

const SubscriptionStatus = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [latest, setLatest] = useState<Req | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("plan, plan_expires_at").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as any));
    supabase.from("subscription_requests").select("plan, status, created_at, admin_note")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setLatest(data as any));
  }, [user]);

  const expiresAt = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : null;
  const isPaid = profile?.plan === "pro" || profile?.plan === "premium";
  const isPending = latest?.status === "pending";

  if (!isPaid && !isPending && latest?.status !== "rejected") return null;

  return (
    <section className={cn(
      "rounded-3xl border-2 p-5 sm:p-6 flex items-center gap-4",
      isPaid ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30" :
      isPending ? "bg-warning/10 border-warning/30" : "bg-destructive/5 border-destructive/30",
    )}>
      <div className={cn(
        "w-12 h-12 rounded-2xl grid place-items-center shrink-0",
        isPaid ? "gradient-primary shadow-glow" : isPending ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground",
      )}>
        {isPaid ? <Crown className="w-6 h-6 text-primary-foreground" /> :
         isPending ? <Clock className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
      </div>
      <div className="flex-1 min-w-0">
        {isPaid ? (
          <>
            <h3 className="font-bold capitalize flex items-center gap-2">
              {profile?.plan} reja faol
              <CheckCircle2 className="w-4 h-4 text-success" />
            </h3>
            <p className="text-sm text-muted-foreground">
              {daysLeft !== null ? `${daysLeft} kun qoldi` : "Cheksiz"}
              {expiresAt && ` · ${expiresAt.toLocaleDateString("uz-UZ")}`}
            </p>
          </>
        ) : isPending ? (
          <>
            <h3 className="font-bold">To'lov tasdiqlanmoqda...</h3>
            <p className="text-sm text-muted-foreground">
              {latest?.plan?.toUpperCase()} so'rovingiz admin tomonidan ko'rib chiqilmoqda. 24 soat ichida javob beramiz.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-bold">So'rov rad etildi</h3>
            <p className="text-sm text-muted-foreground">
              {latest?.admin_note || "Iltimos, qaytadan to'lov qiling yoki admin bilan bog'laning."}
            </p>
          </>
        )}
      </div>
    </section>
  );
};

export default SubscriptionStatus;
