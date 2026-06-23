/** Matches the frontend mock Alumni shape for directory & profile pages */
export type AlumniProfile = {
  id: string;
  name: string;
  photo: string;
  company: string;
  role: string;
  batch: string;
  location: string;
  skills: string[];
  tech: string[];
  careerPath: { year: string; role: string; company: string }[];
  certifications: string[];
  bio: string;
};

export type AlumniCard = Pick<
  AlumniProfile,
  "id" | "name" | "photo" | "company" | "role" | "batch" | "location"
>;

export type HeroSlide = {
  title: string;
  subtitle: string;
  image: string;
};

export type UserProfile = {
  id: string;
  role: "student" | "alumni";
  fullName: string;
  photoUrl: string | null;
  email: string | null;
  rollNumber: string | null;
  departmentEmail: string | null;
  alumniCode: string | null;
};

export type ConnectionRequestRow = {
  id: string;
  name: string;
  email: string;
  dept: string;
  semester: number;
  intent: "Referral" | "Mentoring";
  message: string;
  senderType?: "student" | "alumni";
  batch?: string;
  subject?: string | null;
};

export type ScheduledMeeting = {
  id: string;
  request: ConnectionRequestRow;
  date: string;
  from: string;
  to: string;
};
