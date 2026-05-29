import { assertSupabase } from "@/lib/supabase";
import type { ConnectionRequestRow, ScheduledMeeting } from "@/lib/types";

function mapIntent(intent: string): "Referral" | "Mentoring" {
  return intent === "mentoring" ? "Mentoring" : "Referral";
}

function mapDbIntent(intent: "Referral" | "Mentoring"): "referral" | "mentoring" {
  return intent === "Mentoring" ? "mentoring" : "referral";
}

async function enrichSender(senderUserId: string): Promise<{
  name: string;
  email: string;
  dept: string;
  semester: number;
  senderType: "student" | "alumni";
  batch?: string;
}> {
  const supabase = assertSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, personal_email, role")
    .eq("id", senderUserId)
    .single();

  if (!profile) {
    return { name: "Unknown", email: "", dept: "—", semester: 0, senderType: "student" };
  }

  if (profile.role === "alumni") {
    const { data: ap } = await supabase
      .from("alumni_profiles")
      .select("graduation_batch_id")
      .eq("user_id", senderUserId)
      .maybeSingle();
    let batch: string | undefined;
    if (ap?.graduation_batch_id) {
      const { data: gb } = await supabase
        .from("graduation_batches")
        .select("year")
        .eq("id", ap.graduation_batch_id)
        .maybeSingle();
      batch = gb?.year ? String(gb.year) : undefined;
    }
    return {
      name: profile.full_name,
      email: profile.personal_email ?? "",
      dept: "Alumni",
      semester: 0,
      senderType: "alumni",
      batch,
    };
  }

  const { data: student } = await supabase
    .from("students")
    .select("department, semester")
    .eq("user_id", senderUserId)
    .maybeSingle();

  return {
    name: profile.full_name,
    email: profile.personal_email ?? "",
    dept: student?.department ?? "—",
    semester: student?.semester ?? 0,
    senderType: "student",
  };
}

export async function createConnectionRequest(input: {
  senderUserId: string;
  recipientUserId: string;
  intent: "Referral" | "Mentoring";
  subject: string;
  message: string;
  replyEmail: string;
  resumeFileId?: string | null;
}) {
  const supabase = assertSupabase();
  const { data, error } = await supabase
    .from("connection_requests")
    .insert({
      sender_user_id: input.senderUserId,
      recipient_user_id: input.recipientUserId,
      intent: mapDbIntent(input.intent),
      subject: input.subject,
      message: input.message || input.subject,
      reply_email: input.replyEmail,
      resume_file_id: input.resumeFileId ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function fetchPendingRequestsForAlumni(
  alumniUserId: string,
): Promise<ConnectionRequestRow[]> {
  const supabase = assertSupabase();
  const { data: requests, error } = await supabase
    .from("connection_requests")
    .select("id, intent, message, subject, sender_user_id")
    .eq("recipient_user_id", alumniUserId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !requests?.length) return [];

  const rows: ConnectionRequestRow[] = [];
  for (const r of requests) {
    const sender = await enrichSender(r.sender_user_id);
    rows.push({
      id: r.id,
      name: sender.name,
      email: sender.email,
      dept: sender.dept,
      semester: sender.semester,
      intent: mapIntent(r.intent),
      message: r.message,
      senderType: sender.senderType,
      batch: sender.batch,
      subject: r.subject,
    });
  }
  return rows;
}

export async function denyConnectionRequest(requestId: string) {
  const supabase = assertSupabase();
  const { error } = await supabase
    .from("connection_requests")
    .update({ status: "denied", denied_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw error;
}

export async function acceptAndScheduleMeeting(input: {
  requestId: string;
  scheduledByUserId: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
}) {
  const supabase = assertSupabase();
  const now = new Date().toISOString();

  const { error: reqError } = await supabase
    .from("connection_requests")
    .update({ status: "accepted", accepted_at: now })
    .eq("id", input.requestId);
  if (reqError) throw reqError;

  const { error: meetError } = await supabase.from("meetings").insert({
    connection_request_id: input.requestId,
    scheduled_by_user_id: input.scheduledByUserId,
    meeting_date: input.meetingDate,
    start_time: input.startTime,
    end_time: input.endTime,
  });
  if (meetError) throw meetError;
}

export async function fetchScheduledMeetingsForAlumni(
  alumniUserId: string,
): Promise<ScheduledMeeting[]> {
  const supabase = assertSupabase();

  const { data: requests } = await supabase
    .from("connection_requests")
    .select("id")
    .eq("recipient_user_id", alumniUserId)
    .eq("status", "accepted");

  if (!requests?.length) return [];

  const requestIds = requests.map((r) => r.id);
  const { data: meetings, error } = await supabase
    .from("meetings")
    .select("id, connection_request_id, meeting_date, start_time, end_time")
    .in("connection_request_id", requestIds);

  if (error || !meetings?.length) return [];

  const results: ScheduledMeeting[] = [];
  for (const m of meetings) {
    const { data: cr } = await supabase
      .from("connection_requests")
      .select("id, intent, message, subject, sender_user_id")
      .eq("id", m.connection_request_id)
      .single();
    if (!cr) continue;
    const sender = await enrichSender(cr.sender_user_id);
    results.push({
      id: m.id,
      request: {
        id: cr.id,
        name: sender.name,
        email: sender.email,
        dept: sender.dept,
        semester: sender.semester,
        intent: mapIntent(cr.intent),
        message: cr.message,
        senderType: sender.senderType,
        batch: sender.batch,
        subject: cr.subject,
      },
      date: m.meeting_date,
      from: m.start_time.slice(0, 5),
      to: m.end_time.slice(0, 5),
    });
  }
  return results;
}

export async function countProfileViews(alumniUserId: string): Promise<number> {
  const supabase = assertSupabase();
  const { count, error } = await supabase
    .from("profile_views")
    .select("*", { count: "exact", head: true })
    .eq("alumni_user_id", alumniUserId);
  if (error) return 0;
  return count ?? 0;
}
