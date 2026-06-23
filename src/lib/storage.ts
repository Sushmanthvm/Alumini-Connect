import { assertSupabase } from "@/lib/supabase";

const AVATAR_BUCKET = "avatars";
const RESUME_BUCKET = "resumes";

export function getAvatarPublicUrl(pathOrUrl: string | null | undefined, userId?: string): string {
  if (!pathOrUrl) {
    if (userId) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userId)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4`;
  }
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const supabase = assertSupabase();
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(pathOrUrl);
  return data.publicUrl;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = assertSupabase();
  const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ photo_url: path })
    .eq("id", userId);
  if (profileError) throw profileError;

  return path;
}

export async function uploadResume(
  userId: string,
  file: File,
): Promise<{ resumeFileId: string; storagePath: string }> {
  const supabase = assertSupabase();
  const resumeFileId = crypto.randomUUID();
  const storagePath = `${userId}/${resumeFileId}/${file.name}`;

  const { error: uploadError } = await supabase.storage.from(RESUME_BUCKET).upload(storagePath, file, {
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;

  const { error: rowError } = await supabase.from("resume_files").insert({
    id: resumeFileId,
    owner_user_id: userId,
    storage_bucket: RESUME_BUCKET,
    storage_path: storagePath,
    original_filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  });
  if (rowError) throw rowError;

  return { resumeFileId, storagePath };
}
