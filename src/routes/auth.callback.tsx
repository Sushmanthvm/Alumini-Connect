import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";

import { completeOAuthCallback } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Signing in — Alumni Connect" }],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!isSupabaseConfigured) {
        toast.error("Supabase is not configured.");
        navigate({ to: "/" });
        return;
      }

      try {
        const { destination } = await completeOAuthCallback();
        if (cancelled) return;
        await refreshProfile();
        toast.success("Signed in with Google");
        navigate({ to: destination });
      } catch (err) {
        if (cancelled) return;
        const text = err instanceof Error ? err.message : "Sign-in failed";
        setMessage(text);
        toast.error(text);
        setTimeout(() => navigate({ to: "/" }), 2200);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate, refreshProfile]);

  return (
    <PageTransition>
      <Toaster position="top-center" richColors />
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass max-w-md rounded-3xl p-8 text-center shadow-glow">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </PageTransition>
  );
}
