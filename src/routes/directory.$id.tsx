import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";import { ArrowLeft, Award, Briefcase, Code2, Mail, MapPin, Sparkles, Trophy } from "lucide-react";
import { ALUMNI } from "@/lib/mock-data";
import { PageTransition } from "@/components/PageTransition";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toaster, toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/directory/$id")({
  head: () => ({
    meta: [
      { title: "Alumni Profile — Alumni Connect" },
      { name: "description", content: "Deep dive into an alumnus's career, skills and tech stack." },
    ],
  }),
  beforeLoad: () => requireAuth("student"),
  loader: async ({ params }) => {
    await requireAuth("student");
    const alum = await fetchAlumniProfile(params.id);
    return { alum };
  },
  component: AlumniDetail,
});

function AlumniDetail() {
  const { id } = useParams({ from: "/directory/$id" });
  const [alum, setAlum] = useState<any>(null);
  const [viewerRole, setViewerRole] = useState<"student" | "alumni">("student");
const [skills, setSkills] = useState<any[]>([]);
const [sending, setSending] = useState(false);
const [careerPath, setCareerPath] = useState<any[]>([]);
const [certifications, setCertifications] = useState<any[]>([]);
const [techUsed, setTechUsed] = useState<any[]>([]);
const [extraCurricular, setExtraCurricular] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(profile?.email ?? "");
  const [subject, setSubject] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [intent, setIntent] = useState<"Referral" | "Mentoring">("Referral");
  useEffect(() => {
  const loadAlumni = async () => {
    const { data: alumniData } = await supabase
      .from("alumni")
      .select("*")
      .eq("id", id)
      .single();

    if (!alumniData) {
      setLoading(false);
      return;
    }

    setAlum(alumniData);

    const {
  data: { user },
} = await supabase.auth.getUser();

const { data: studentCheck } = await supabase
  .from("students")
  .select("id")
  .eq("id", user?.id)
  .single();

if (studentCheck) {
  setViewerRole("student");
} else {
  setViewerRole("alumni");
}

if (studentCheck && user) {
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("department_email", user.email)
    .single();

  if (student) {
    const { error: visitError } = await supabase
  .from("profile_visits")
  .upsert(
    {
      alumni_id: id,
      student_id: student.id,
    },
    {
      onConflict: "alumni_id,student_id",
    }
  );

console.log("PROFILE VISIT ERROR:", visitError);
  }
}

    const { data: skillsData } = await supabase
      .from("alumni_skills")
      .select("*")
      .eq("alumni_id", id);

    const { data: careerData } = await supabase
      .from("career_path")
      .select("*")
      .eq("alumni_id", id)
      .order("year");

    const { data: certData } = await supabase
      .from("alumni_certifications")
      .select("*")
      .eq("alumni_id", id);

    const { data: techData } = await supabase
  .from("alumni_tech_used")
  .select("*")
  .eq("alumni_id", id);

const { data: extraData } = await supabase
  .from("alumni_extra_curricular")
  .select("*")
  .eq("alumni_id", id);
    setSkills(skillsData || []);
    setCareerPath(careerData || []);
    setCertifications(certData || []);
    setTechUsed(techData || []);
setExtraCurricular(extraData || []);
    setLoading(false);
  };

  loadAlumni();
}, [id]);
if (loading) {
  return (
    <div className="p-10">
      Loading alumni profile...
    </div>
  );
}
  if (!alum) {
    return (
      <div className="p-10">
        <Link to="/student" className="text-primary underline">
          ← Back to Directory
        </Link>
        <p className="mt-4">Alumni not found.</p>
      </div>
    );
  }

  const sendRequest = async (e: React.FormEvent) => {
  e.preventDefault();
  setSending(true);  
  try {
const {
  data: { user },
} = await supabase.auth.getUser();
let semester = null;
if (!user) {
  toast.error("Please login first");
  return;
}

if (viewerRole === "student") {
  const { data: student } = await supabase
    .from("students")
    .select("semester")
    .eq("department_email", user.email)
    .single();

  semester = student?.semester;
}


    

    if (!resume) {
      toast.error("Please upload your resume");
      return;
    }

    // Upload resume
    const fileExt = resume.name.split(".").pop() || "pdf";

    const resumePath = `test-${Date.now()}.${fileExt}`;
const {
  data: { session },
} = await supabase.auth.getSession();

    const { data: uploadData, error: uploadError } =
  await supabase.storage
    .from("resumes")
    
    .upload(resumePath, resume, {
      upsert: true,
      contentType: resume.type,
    });

if (uploadError) {
  return;
}

    const { data: resumeData } = supabase.storage
  .from("resumes")
  .getPublicUrl(resumePath);

const resumeUrl = resumeData.publicUrl;
// Insert request
const { data: requestData, error } = await supabase
  .from("requests")
  .insert({
    sender_id: user.id,
    receiver_alumni_id: alum.id,
    sender_role: viewerRole,
    personal_email: email,
    subject,
    intent,
    semester,
    resume_path: resumeUrl,
    status: "pending",
  })
  .select();

    if (error) {
      toast.error(error.message);
      return;
    }

const { data: alumniEmailData } = await supabase
  .from("alumni")
  .select("email,name")
  .eq("id", alum.id)
  .single();

if (alumniEmailData?.email) {
  const { data, error } = await supabase.functions.invoke(
  "send-request-email",
  {
    body: {
      alumniEmail: alumniEmailData.email,
      alumniName: alumniEmailData.name,
      studentEmail: email,
      subject,
      intent,
    },
  }
);

console.log("FUNCTION DATA:", data);
console.log("FUNCTION ERROR:", error);
}
    setOpen(false);

    toast.success("Request sent successfully");

    setEmail("");
    setSubject("");
    setResume(null);
    setIntent("Referral");
  } catch (err: any) {
  console.error("REQUEST ERROR:", err);

  toast.error(
    err?.message ||
    JSON.stringify(err) ||
    "Failed to send request"
  );
}finally {
  setSending(false);
}
};

  return (
    <PageTransition>
      <Toaster position="top-center" richColors />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <motion.div whileHover={{ x: -4 }}>
          <Link
  to={viewerRole === "alumni" ? "/alumni" : "/student"}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-medium shadow-elegant"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Directory
          </Link>
        </motion.div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_2fr]">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="glass shadow-glow h-fit rounded-3xl p-6"
          >
            <div className="mx-auto h-32 w-32 overflow-hidden rounded-3xl ring-4 ring-white shadow-elegant">
              <img src={alum.avatar_path} alt={alum.name} className="h-full w-full" />
            </div>
            <h1 className="mt-5 text-center text-2xl font-bold">{alum.name}</h1>
            <p className="text-center text-primary font-medium">{alum.current_job_role}</p>
            <p className="text-center text-sm text-muted-foreground">{alum.current_company} · Batch of {alum.batch_year}</p>
            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {alum.location}
            </p>

            <p className="mt-5 rounded-xl bg-muted/60 p-3 text-center text-sm italic text-muted-foreground">
              "{alum.quote}"
            </p>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-5">
              <Button
                onClick={() => setOpen(true)}
                className="w-full gradient-bg-hero text-primary-foreground shadow-elegant"
              >
                <Mail className="mr-2 h-4 w-4" /> Request guidance
              </Button>
            </motion.div>
          </motion.div>

          <div className="space-y-6">
            <Section icon={<Sparkles className="h-4 w-4" />} title="Skills">
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
  <span
    key={s.id}
    className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
  >
    {s.skill}
  </span>
))}
              </div>
            </Section>

            <Section icon={<Code2 className="h-4 w-4" />} title="Tech Used">
  {techUsed.length === 0 ? (
    <p className="text-sm text-muted-foreground">
      No technologies added yet.
    </p>
  ) : (
    <div className="flex flex-wrap gap-2">
      {techUsed.map((t) => (
        <span
          key={t.id}
          className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
        >
          {t.technology}
        </span>
      ))}
    </div>
  )}
</Section>

            <Section icon={<Briefcase className="h-4 w-4" />} title="Career Path">
  {careerPath.length === 0 ? (
    <p className="text-sm text-muted-foreground">
      No career milestones added yet.
    </p>
  ) : (
    <ol className="relative ml-3 space-y-4 border-l-2 border-primary/30 pl-5">
      {careerPath.map((c, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 * i }}
          className="relative"
        >
          <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full gradient-bg-hero shadow-glow" />
          <p className="text-xs font-semibold text-primary">{c.year}</p>
          <p className="font-medium">{c.job_role}</p>
          <p className="text-sm text-muted-foreground">{c.company}</p>
        </motion.li>
      ))}
    </ol>
  )}
</Section>

            <Section icon={<Award className="h-4 w-4" />} title="Certifications">
  {certifications.length === 0 ? (
    <p className="text-sm text-muted-foreground">
      No certifications added yet.
    </p>
  ) : (
    <ul className="space-y-2">
      {certifications.map((c) => (
        <li key={c.id} className="flex items-center gap-2 text-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {c.certification}
        </li>
      ))}
    </ul>
  )}
</Section>

            <Section
  icon={<Trophy className="h-4 w-4" />}
  title="Extra Curricular"
>
  {extraCurricular.length === 0 ? (
    <p className="text-sm text-muted-foreground">
      No extracurricular activities added yet.
    </p>
  ) : (
    <ul className="space-y-2">
      {extraCurricular.map((e) => (
        <li
          key={e.id}
          className="flex items-center gap-2 text-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {e.activity}
        </li>
      ))}
    </ul>
  )}
</Section>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request to {alum.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={sendRequest} className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label>Your Personal Email</Label>
                <Input
                  type="email"
                  required
                  placeholder="you@personal.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Input
                  required
                  placeholder="Referral request for SDE-1 role"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Upload Resume</Label>
                <label
                  htmlFor="resume-upload"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center transition-all hover:border-primary hover:bg-primary/10"
                >
                  <span className="text-sm font-medium text-primary">
                    {resume ? `📎 ${resume.name}` : "Click to browse or drop your PDF"}
                  </span>
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <div className="grid gap-2">
                <Label>Choose your intent</Label>
                <RadioGroup
                  value={intent}
                  onValueChange={(v) => setIntent(v as "Referral" | "Mentoring")}
                  className="grid grid-cols-2 gap-3"
                >
                  {(["Referral", "Mentoring"] as const).map((opt) => (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                        intent === opt
                          ? "border-primary bg-primary/5 shadow-elegant"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={opt} />
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={sending} className="gradient-bg-hero text-primary-foreground">{sending ? "Sending Request..." : "Send Request"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </PageTransition>
  );
}

function Section({
  icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass rounded-2xl p-5"
    >
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        {title}
      </h2>
      {children}
    </motion.section>
  );
}
