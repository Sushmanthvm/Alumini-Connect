import { redirect } from "@tanstack/react-router";

import { fetchUserProfile } from "@/lib/auth";
import { assertSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { UserProfile } from "@/lib/types";

export async function requireAuth(requiredRole?: "student" | "alumni"): Promise<{
  profile: UserProfile;
}> {
  if (!isSupabaseConfigured) {
    throw redirect({ to: "/" });
  }

  const supabase = assertSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw redirect({ to: "/" });
  }

  const profile = await fetchUserProfile(session.user.id);
  if (!profile) {
    throw redirect({ to: "/" });
  }

  if (requiredRole && profile.role !== requiredRole) {
    throw redirect({ to: profile.role === "alumni" ? "/alumni" : "/student" });
  }

  return { profile };
}
