export type UserRole = "student" | "alumni";
export type UserStatus = "active" | "suspended" | "pending_verification";
export type ConnectionIntent = "referral" | "mentoring";
export type ConnectionStatus = "pending" | "denied" | "accepted" | "cancelled";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          photo_url: string | null;
          status: UserStatus;
          roll_number: string | null;
          department_email: string | null;
          alumni_code: string | null;
          personal_email: string | null;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          role: UserRole;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      students: {
        Row: {
          user_id: string;
          department_id: number | null;
          department: string | null;
          semester: number | null;
          degree_program_id: number | null;
          expected_graduation_year: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          department?: string | null;
          semester?: number | null;
          degree_program_id?: number | null;
          expected_graduation_year?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
      };
      alumni_profiles: {
        Row: {
          user_id: string;
          bio: string | null;
          company_id: number | null;
          job_title: string | null;
          location: string | null;
          graduation_batch_id: number | null;
          degree_program_id: number | null;
          is_directory_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          bio?: string | null;
          company_id?: number | null;
          job_title?: string | null;
          location?: string | null;
          graduation_batch_id?: number | null;
          degree_program_id?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["alumni_profiles"]["Insert"]>;
      };
      graduation_batches: {
        Row: { id: number; year: number; allows_btech: boolean };
      };
      degree_programs: {
        Row: { id: number; code: string; display_name: string };
      };
      companies: {
        Row: { id: number; name: string; logo_url: string | null };
      };
      career_entries: {
        Row: {
          id: string;
          alumni_user_id: string;
          year: number;
          company_name: string;
          role_title: string;
          sort_order: number;
        };
        Insert: {
          alumni_user_id: string;
          year: number;
          company_name: string;
          role_title: string;
          sort_order?: number;
        };
      };
      skills: { Row: { id: number; name: string } };
      technologies: { Row: { id: number; name: string } };
      alumni_skills: {
        Row: { alumni_user_id: string; skill_id: number };
        Insert: { alumni_user_id: string; skill_id: number };
      };
      alumni_technologies: {
        Row: { alumni_user_id: string; technology_id: number };
        Insert: { alumni_user_id: string; technology_id: number };
      };
      alumni_certifications: {
        Row: { id: string; alumni_user_id: string; name: string; issued_year: number | null };
        Insert: { alumni_user_id: string; name: string; issued_year?: number | null };
      };
      connection_requests: {
        Row: {
          id: string;
          sender_user_id: string;
          recipient_user_id: string;
          intent: ConnectionIntent;
          status: ConnectionStatus;
          subject: string | null;
          message: string;
          reply_email: string;
          resume_file_id: string | null;
          denied_at: string | null;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          sender_user_id: string;
          recipient_user_id: string;
          intent: ConnectionIntent;
          message: string;
          reply_email: string;
          subject?: string | null;
          resume_file_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["connection_requests"]["Row"]>;
      };
      meetings: {
        Row: {
          id: string;
          connection_request_id: string;
          scheduled_by_user_id: string;
          meeting_date: string;
          start_time: string;
          end_time: string;
          timezone: string;
        };
        Insert: {
          connection_request_id: string;
          scheduled_by_user_id: string;
          meeting_date: string;
          start_time: string;
          end_time: string;
          timezone?: string;
        };
      };
      resume_files: {
        Row: {
          id: string;
          owner_user_id: string;
          storage_bucket: string;
          storage_path: string;
          original_filename: string;
          mime_type: string | null;
          size_bytes: number | null;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          storage_path: string;
          original_filename: string;
          mime_type?: string | null;
          size_bytes?: number | null;
        };
      };
      hero_slides: {
        Row: {
          id: number;
          title: string;
          subtitle: string;
          image_url: string;
          sort_order: number;
          is_active: boolean;
        };
      };
      alumni_registration_codes: {
        Row: {
          code: string;
          batch_year: number;
          is_used: boolean;
        };
      };
      profile_views: {
        Insert: { alumni_user_id: string; viewer_user_id?: string | null };
      };
    };
  };
};
