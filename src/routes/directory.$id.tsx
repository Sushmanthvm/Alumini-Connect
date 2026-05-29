import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, Award, Briefcase, Code2, Mail, MapPin, Sparkles, Trophy, Loader2 } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toaster, toast } from "sonner";
import { requireAuth } from "@/lib/route-guards";
import { fetchAlumniProfile } from "@/lib/api/alumni";
import { createConnectionRequest } from "@/lib/api/connections";
import { uploadResume } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";

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
  const { alum } = Route.useLoaderData();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(profile?.email ?? "");
  const [subject, setSubject] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [intent, setIntent] = useState<"Referral" | "Mentoring">("Referral");
  const [sending, setSending] = useState(false);

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
    if (!profile) return;
    setSending(true);
    try {
      let resumeFileId: string | null = null;
      if (resume) {
        const uploaded = await uploadResume(profile.id, resume);
        resumeFileId = uploaded.resumeFileId;
      }
      await createConnectionRequest({
        senderUserId: profile.id,
        recipientUserId: id,
        intent,
        subject,
        message: subject,
        replyEmail: email,
        resumeFileId,
      });
      setOpen(false);
      toast.success(`${intent} request sent to ${alum.name}!`, {
        description: `Subject: "${subject}" · Resume: ${resume?.name ?? "none"}`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  return (
    <PageTransition>
      <Toaster position="top-center" richColors />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <motion.div whileHover={{ x: -4 }}>
          <Link
            to="/student"
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
              <img src={alum.photo} alt={alum.name} className="h-full w-full object-cover" />
            </div>
            <h1 className="mt-5 text-center text-2xl font-bold">{alum.name}</h1>
            <p className="text-center text-primary font-medium">{alum.role}</p>
            <p className="text-center text-sm text-muted-foreground">
              {alum.company} · Batch of {alum.batch}
            </p>
            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {alum.location}
            </p>

            <p className="mt-5 rounded-xl bg-muted/60 p-3 text-center text-sm italic text-muted-foreground">
              &ldquo;{alum.bio}&rdquo;
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
                {alum.skills.length ? (
                  alum.skills.map((s) => (
                    <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Not listed yet</span>
                )}
              </div>
            </Section>

            <Section icon={<Code2 className="h-4 w-4" />} title="Tech Used">
              <div className="flex flex-wrap gap-2">
                {alum.tech.length ? (
                  alum.tech.map((t) => (
                    <span key={t} className="rounded-full border border-border bg-card px-3 py-1 text-sm">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Not listed yet</span>
                )}
              </div>
            </Section>

            <Section icon={<Briefcase className="h-4 w-4" />} title="Career Path">
              {alum.careerPath.length ? (
                <ol className="relative ml-3 space-y-4 border-l-2 border-primary/30 pl-5">
                  {alum.careerPath.map((c, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="relative"
                    >
                      <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full gradient-bg-hero shadow-glow" />
                      <p className="text-xs font-semibold text-primary">{c.year}</p>
                      <p className="font-medium">{c.role}</p>
                      <p className="text-sm text-muted-foreground">{c.company}</p>
                    </motion.li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">Not listed yet</p>
              )}
            </Section>

            <Section icon={<Award className="h-4 w-4" />} title="Certifications" delay={0.3}>
              <ul className="space-y-2">
                {alum.certifications.length ? (
                  alum.certifications.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {c}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">Not listed yet</li>
                )}
              </ul>
            </Section>

            <Section icon={<Trophy className="h-4 w-4" />} title="Extra Curricular" delay={0.4}>
              <p className="text-sm text-muted-foreground">Ask this alumnus during your mentoring session.</p>
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
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sending}
                  className="gradient-bg-hero text-primary-foreground"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    "Send Request"
                  )}
                </Button>
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
