import { assertSupabase } from "@/lib/supabase";
import { getAvatarPublicUrl } from "@/lib/storage";
import type { AlumniCard, AlumniProfile } from "@/lib/types";
import { ALUMNI } from "@/lib/mock-data";

type DegreeLabel = "B.tech CYS" | "M.tech CYS";

function degreeCode(label: DegreeLabel) {
  return label === "B.tech CYS" ? "btech_cys" : "mtech_cys";
}

export async function fetchGraduationBatchYears(): Promise<number[]> {
  const supabase = assertSupabase();
  const { data, error } = await supabase
    .from("graduation_batches")
    .select("year")
    .order("year", { ascending: false });

  if (error || !data?.length) {
    return Array.from({ length: 2023 - 2005 + 1 }, (_, i) => 2023 - i);
  }
  return data.map((b) => b.year);
}

export async function fetchAlumniDirectory(
  batchYear: string,
  degree: DegreeLabel,
): Promise<AlumniCard[]> {
  const supabase = assertSupabase();
  const year = Number(batchYear);

  const { data: batch } = await supabase
    .from("graduation_batches")
    .select("id")
    .eq("year", year)
    .maybeSingle();

  const { data: degreeRow } = await supabase
    .from("degree_programs")
    .select("id")
    .eq("code", degreeCode(degree))
    .maybeSingle();

  if (!batch || !degreeRow) {
    return ALUMNI.filter((a) => a.batch === batchYear).map(mockToCard);
  }

  const { data: rows, error } = await supabase
    .from("alumni_profiles")
    .select("user_id, job_title, location, company_id, graduation_batch_id")
    .eq("is_directory_visible", true)
    .eq("graduation_batch_id", batch.id)
    .eq("degree_program_id", degreeRow.id);

  if (error || !rows?.length) {
    return ALUMNI.filter((a) => a.batch === batchYear).map(mockToCard);
  }

  const cards: AlumniCard[] = [];
  for (const row of rows) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, photo_url, role")
      .eq("id", row.user_id)
      .single();
    if (!profile || profile.role !== "alumni") continue;

    let companyName = "—";
    if (row.company_id) {
      const { data: co } = await supabase.from("companies").select("name").eq("id", row.company_id).single();
      companyName = co?.name ?? "—";
    }

    cards.push({
      id: row.user_id,
      name: profile.full_name,
      photo: getAvatarPublicUrl(profile.photo_url, row.user_id),
      company: companyName,
      role: row.job_title ?? "—",
      batch: batchYear,
      location: row.location ?? "—",
    });
  }

  return cards;
}

function mockToCard(a: (typeof ALUMNI)[0]): AlumniCard {
  return {
    id: a.id,
    name: a.name,
    photo: a.photo,
    company: a.company,
    role: a.role,
    batch: a.batch,
    location: a.location,
  };
}

export async function fetchAlumniProfile(userId: string): Promise<AlumniProfile | null> {
  const supabase = assertSupabase();

  const { data: row, error } = await supabase
    .from("alumni_profiles")
    .select("user_id, bio, job_title, location, company_id, graduation_batch_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !row) {
    const mock = ALUMNI.find((a) => a.id === userId);
    return mock ?? null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, photo_url")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  let companyName = "—";
  if (row.company_id) {
    const { data: co } = await supabase.from("companies").select("name").eq("id", row.company_id).single();
    companyName = co?.name ?? "—";
  }

  let batchYear = "";
  if (row.graduation_batch_id) {
    const { data: b } = await supabase
      .from("graduation_batches")
      .select("year")
      .eq("id", row.graduation_batch_id)
      .single();
    batchYear = b?.year ? String(b.year) : "";
  }

  const [{ data: careers }, { data: skillRows }, { data: techRows }, { data: certs }] =
    await Promise.all([
      supabase
        .from("career_entries")
        .select("year, company_name, role_title, sort_order")
        .eq("alumni_user_id", userId)
        .order("sort_order"),
      supabase.from("alumni_skills").select("skill_id, skills ( name )").eq("alumni_user_id", userId),
      supabase
        .from("alumni_technologies")
        .select("technology_id, technologies ( name )")
        .eq("alumni_user_id", userId),
      supabase.from("alumni_certifications").select("name").eq("alumni_user_id", userId),
    ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profile_views").insert({
      alumni_user_id: userId,
      viewer_user_id: user.id,
    });
  }

  return {
    id: userId,
    name: profile.full_name,
    photo: getAvatarPublicUrl(profile.photo_url, userId),
    company: companyName,
    role: row.job_title ?? "—",
    batch: batchYear,
    location: row.location ?? "—",
    bio: row.bio ?? "",
    skills:
      skillRows
        ?.map((s) => {
          const sk = s.skills as unknown as { name: string } | { name: string }[] | null;
          if (Array.isArray(sk)) return sk[0]?.name;
          return sk?.name;
        })
        .filter((n): n is string => Boolean(n)) ?? [],
    tech:
      techRows
        ?.map((t) => {
          const tk = t.technologies as unknown as { name: string } | { name: string }[] | null;
          if (Array.isArray(tk)) return tk[0]?.name;
          return tk?.name;
        })
        .filter((n): n is string => Boolean(n)) ?? [],
    careerPath:
      careers?.map((c) => ({
        year: String(c.year),
        role: c.role_title,
        company: c.company_name,
      })) ?? [],
    certifications: certs?.map((c) => c.name) ?? [],
  };
}

export async function updateAlumniProfile(
  userId: string,
  payload: {
    fullName: string;
    location: string;
    jobTitle: string;
    companyName: string;
    bio: string;
    skills: string[];
    tech: string[];
    certifications: string[];
    careerPath: { year: string; company: string; role: string }[];
  },
) {
  const supabase = assertSupabase();

  let companyId: number | null = null;
  const trimmedCompany = payload.companyName.trim();
  if (trimmedCompany) {
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .eq("name", trimmedCompany)
      .maybeSingle();
    if (existing) {
      companyId = existing.id;
    } else {
      const { data: created } = await supabase
        .from("companies")
        .insert({ name: trimmedCompany })
        .select("id")
        .single();
      companyId = created?.id ?? null;
    }
  }

  await supabase.from("profiles").update({ full_name: payload.fullName }).eq("id", userId);
  await supabase
    .from("alumni_profiles")
    .update({
      location: payload.location,
      job_title: payload.jobTitle,
      company_id: companyId,
      bio: payload.bio,
    })
    .eq("user_id", userId);

  await supabase.from("career_entries").delete().eq("alumni_user_id", userId);
  if (payload.careerPath.length) {
    await supabase.from("career_entries").insert(
      payload.careerPath.map((c, i) => ({
        alumni_user_id: userId,
        year: Number(c.year) || 0,
        company_name: c.company,
        role_title: c.role,
        sort_order: i,
      })),
    );
  }

  const syncTags = async (
    table: "skills" | "technologies",
    junction: "alumni_skills" | "alumni_technologies",
    fk: "skill_id" | "technology_id",
    names: string[],
  ) => {
    await supabase.from(junction).delete().eq("alumni_user_id", userId);
    for (const name of names) {
      const { data: tag } = await supabase.from(table).select("id").eq("name", name).maybeSingle();
      const tagId =
        tag?.id ?? (await supabase.from(table).insert({ name }).select("id").single()).data?.id;
      if (tagId) {
        await supabase.from(junction).insert({ alumni_user_id: userId, [fk]: tagId });
      }
    }
  };

  await syncTags("skills", "alumni_skills", "skill_id", payload.skills);
  await syncTags("technologies", "alumni_technologies", "technology_id", payload.tech);

  await supabase.from("alumni_certifications").delete().eq("alumni_user_id", userId);
  if (payload.certifications.length) {
    await supabase.from("alumni_certifications").insert(
      payload.certifications.map((name) => ({ alumni_user_id: userId, name })),
    );
  }
}
