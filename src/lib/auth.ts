import type { User } from "@supabase/supabase-js";

import { assertSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { UserProfile } from "@/lib/types";

export function getOAuthRedirectTo() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/auth/callback`;
}

/** @deprecated Use getOAuthRedirectTo() */
export function getGoogleSsoRedirectTo() {
  return getOAuthRedirectTo();
}

function userHasProvider(user: User, provider: string): boolean {
  const primary = user.app_metadata?.provider;
  const providers = user.app_metadata?.providers;
  if (primary === provider) return true;
  if (Array.isArray(providers) && providers.includes(provider)) return true;
  return Boolean(user.identities?.some((identity) => identity.provider === provider));
}

export function isGoogleSsoUser(user: User): boolean {
  return userHasProvider(user, "google");
}

export type OAuthCallbackResult = {
  profile: UserProfile;
  destination: "/student" | "/alumni";
};

export type OAuthIntent = "student" | "alumni";

export type StudentRegisterInput = {
  fullName: string;
  personalEmail: string;
  departmentEmail: string;
  rollNumber: string;
  batchYear: number;
  semester: number;
  password: string;
};

export type AlumniRegisterInput = {
  fullName: string;
  email: string;
  alumniCode: string;
  batchYear: number;
  location: string;
  companyName: string;
  jobTitle: string;
  password: string;
};

function mapProfile(row: {
  id: string;
  role: "student" | "alumni";
  full_name: string;
  photo_url: string | null;
  personal_email: string | null;
  roll_number: string | null;
  department_email: string | null;
  alumni_code: string | null;
}): UserProfile {
  return {
    id: row.id,
    role: row.role,
    fullName: row.full_name,
    photoUrl: row.photo_url,
    email: row.personal_email ?? row.department_email,
    rollNumber: row.roll_number,
    departmentEmail: row.department_email,
    alumniCode: row.alumni_code,
  };
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = assertSupabase();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}

async function getDegreeProgramId(displayName: "B.tech CYS" | "M.tech CYS"): Promise<number> {
  const code = displayName === "B.tech CYS" ? "btech_cys" : "mtech_cys";
  const supabase = assertSupabase();
  const { data, error } = await supabase
    .from("degree_programs")
    .select("id")
    .eq("code", code)
    .single();
  if (error) throw error;
  return data.id;
}

async function getBatchId(year: number): Promise<number> {
  const supabase = assertSupabase();
  const { data, error } = await supabase
    .from("graduation_batches")
    .select("id")
    .eq("year", year)
    .single();
  if (error) throw error;
  return data.id;
}

async function getOrCreateCompanyId(name: string): Promise<number> {
  const supabase = assertSupabase();
  const trimmed = name.trim();
  const { data: existing } = await supabase.from("companies").select("id").eq("name", trimmed).maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase.from("companies").insert({ name: trimmed }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function registerStudent(input: StudentRegisterInput) {
  const supabase = assertSupabase();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.departmentEmail.trim().toLowerCase(),
    password: input.password,
    options: {
      data: { role: "student", full_name: input.fullName },
    },
  });
  if (authError) throw authError;
  if (!authData.user) throw new Error("Sign up failed");

  const userId = authData.user.id;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role: "student",
      full_name: input.fullName,
      personal_email: input.personalEmail.trim().toLowerCase(),
      department_email: input.departmentEmail.trim().toLowerCase(),
      roll_number: input.rollNumber.trim(),
      status: "active",
    })
    .eq("id", userId);
  if (profileError) throw profileError;

  const { error: studentError } = await supabase.from("students").upsert({
    user_id: userId,
    semester: input.semester,
    expected_graduation_year: input.batchYear,
    department: "CYS",
  });
  if (studentError) throw studentError;

  return authData;
}

export async function registerAlumni(input: AlumniRegisterInput) {
  const supabase = assertSupabase();
  const code = input.alumniCode.trim().toUpperCase();

  const { data: codeRow, error: codeError } = await supabase
    .from("alumni_registration_codes")
    .select("code, is_used, batch_year")
    .eq("code", code)
    .maybeSingle();
  if (codeError) throw codeError;
  if (!codeRow) throw new Error("Invalid alumni registration code.");
  if (codeRow.is_used) throw new Error("This alumni code has already been used.");

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: { role: "alumni", full_name: input.fullName },
    },
  });
  if (authError) throw authError;
  if (!authData.user) throw new Error("Sign up failed");

  const userId = authData.user.id;
  const batchId = await getBatchId(input.batchYear);
  const companyId = await getOrCreateCompanyId(input.companyName);
  const degreeId = await getDegreeProgramId(
    input.batchYear >= 2021 ? "B.tech CYS" : "M.tech CYS",
  );

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role: "alumni",
      full_name: input.fullName,
      personal_email: input.email.trim().toLowerCase(),
      alumni_code: code,
      status: "active",
    })
    .eq("id", userId);
  if (profileError) throw profileError;

  const { error: alumniError } = await supabase.from("alumni_profiles").upsert({
    user_id: userId,
    job_title: input.jobTitle,
    location: input.location,
    graduation_batch_id: batchId,
    degree_program_id: degreeId,
    company_id: companyId,
    bio: "",
    is_directory_visible: true,
  });
  if (alumniError) throw alumniError;

  await supabase
    .from("alumni_registration_codes")
    .update({ is_used: true, used_by_user_id: userId })
    .eq("code", code);

  return authData;
}

export async function loginStudent(departmentEmail: string, password: string) {
  const supabase = assertSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: departmentEmail.trim().toLowerCase(),
    password,
  });
  if (error) throw error;

  const profile = await fetchUserProfile(data.user.id);
  if (profile?.role !== "student") {
    await supabase.auth.signOut();
    throw new Error("This account is not a student profile.");
  }
  return data;
}

/**
 * Start Google SSO for students.
 * Redirects the browser to Google; returns via /auth/callback.
 */
export async function loginStudentWithGoogle() {
  return startGoogleSso("student");
}

/**
 * Start Google SSO for alumni.
 * Redirects the browser to Google; returns via /auth/callback.
 */
export async function loginAlumniWithGoogle() {
  return startGoogleSso("alumni");
}

async function startGoogleSso(intent: OAuthIntent) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("oauth_intent", intent);
  }
  const supabase = assertSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes: "openid email profile",
      redirectTo: getOAuthRedirectTo(),
      queryParams: {
        prompt: "select_account",
        access_type: "offline",
      },
    },
  });
  if (error) throw error;
  return data;
}

function googleDisplayName(user: User, fallback: string): string {
  const email = (user.email ?? "").trim().toLowerCase();
  return (
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    (email ? email.split("@")[0] : fallback)
  );
}

/**
 * After Google SSO completes, ensure a student profile + students row exist.
 * Blocks alumni accounts from using the student Google path.
 */
export async function ensureStudentFromGoogleSso(user: User): Promise<UserProfile> {
  const supabase = assertSupabase();

  if (!isGoogleSsoUser(user)) {
    throw new Error("Not a Google sign-in.");
  }

  const email = (user.email ?? "").trim().toLowerCase();
  const fullName = googleDisplayName(user, "Student");
  const existing = await fetchUserProfile(user.id);

  if (existing?.role === "alumni") {
    await supabase.auth.signOut();
    throw new Error("This Google account is linked to an alumni profile. Use Alumni login.");
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    role: "student",
    full_name: existing?.fullName || fullName,
    department_email: email || existing?.departmentEmail || null,
    personal_email: existing?.email || email || null,
    status: "active",
  });
  if (profileError) throw profileError;

  const { error: studentError } = await supabase.from("students").upsert({
    user_id: user.id,
    department: "CYS",
  });
  if (studentError) throw studentError;

  const profile = await fetchUserProfile(user.id);
  if (!profile || profile.role !== "student") {
    throw new Error("Could not create student profile after Google sign-in.");
  }
  return profile;
}

/**
 * After Google SSO completes for alumni, ensure alumni profile + alumni_profiles row exist.
 * Blocks student accounts from using the alumni Google path.
 */
export async function ensureAlumniFromGoogleSso(user: User): Promise<UserProfile> {
  const supabase = assertSupabase();

  if (!isGoogleSsoUser(user)) {
    throw new Error("Not a Google sign-in.");
  }

  const email = (user.email ?? "").trim().toLowerCase();
  const fullName = googleDisplayName(user, "Alumni");
  const picture =
    (user.user_metadata?.picture as string | undefined) ||
    (user.user_metadata?.avatar_url as string | undefined) ||
    null;

  const existing = await fetchUserProfile(user.id);

  if (existing?.role === "student") {
    await supabase.auth.signOut();
    throw new Error("This Google account is linked to a student profile. Use Student login.");
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    role: "alumni",
    full_name: existing?.fullName || fullName,
    personal_email: existing?.email || email || null,
    photo_url: existing?.photoUrl || picture,
    status: "active",
  });
  if (profileError) throw profileError;

  const { error: alumniError } = await supabase.from("alumni_profiles").upsert({
    user_id: user.id,
    bio: "",
    is_directory_visible: true,
  });
  if (alumniError) throw alumniError;

  const profile = await fetchUserProfile(user.id);
  if (!profile || profile.role !== "alumni") {
    throw new Error("Could not create alumni profile after Google sign-in.");
  }
  return profile;
}

/** Finish PKCE OAuth redirect and bootstrap the correct role profile */
export async function completeOAuthCallback(): Promise<OAuthCallbackResult> {
  const supabase = assertSupabase();

  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (oauthError) {
    throw new Error(oauthError);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
    if (error) throw error;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Sign-in did not return a user session.");

  if (!isGoogleSsoUser(user)) {
    await supabase.auth.signOut();
    throw new Error("Expected Google sign-in.");
  }

  const intent = (
    typeof window !== "undefined" ? sessionStorage.getItem("oauth_intent") : null
  ) as OAuthIntent | null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("oauth_intent");
  }

  const existing = await fetchUserProfile(user.id);

  // Returning user: honor existing role (and reject mismatched tab)
  if (existing?.role === "alumni") {
    if (intent === "student") {
      await supabase.auth.signOut();
      throw new Error("This Google account is linked to an alumni profile. Use Alumni login.");
    }
    const profile = await ensureAlumniFromGoogleSso(user);
    return { profile, destination: "/alumni" };
  }

  if (existing?.role === "student") {
    if (intent === "alumni") {
      await supabase.auth.signOut();
      throw new Error("This Google account is linked to a student profile. Use Student login.");
    }
    const profile = await ensureStudentFromGoogleSso(user);
    return { profile, destination: "/student" };
  }

  // New Google user: role comes from which tab started SSO
  if (intent === "alumni") {
    const profile = await ensureAlumniFromGoogleSso(user);
    return { profile, destination: "/alumni" };
  }

  // Default / student tab
  const profile = await ensureStudentFromGoogleSso(user);
  return { profile, destination: "/student" };
}

/** @deprecated Use completeOAuthCallback() */
export async function completeGoogleSsoCallback(): Promise<UserProfile> {
  const result = await completeOAuthCallback();
  return result.profile;
}

export async function loginAlumni(email: string, alumniCode: string, password: string) {
  const supabase = assertSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;

  const profile = await fetchUserProfile(data.user.id);
  if (profile?.role !== "alumni") {
    await supabase.auth.signOut();
    throw new Error("This account is not an alumni profile.");
  }
  if (profile.alumniCode?.toUpperCase() !== alumniCode.trim().toUpperCase()) {
    await supabase.auth.signOut();
    throw new Error("Alumni code does not match this account.");
  }
  return data;
}

export async function logout() {
  const supabase = assertSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const supabase = assertSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/`,
  });
  if (error) throw error;
}

export function checkSupabaseConfig(): boolean {
  return isSupabaseConfigured;
}
