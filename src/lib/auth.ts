import { assertSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { UserProfile } from "@/lib/types";

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
