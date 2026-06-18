import { createFileRoute } from "@tanstack/react-router";
import { motion, useInView, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Eye, Mail, Star, Calendar, Check, X } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { PageTransition } from "@/components/PageTransition";
import { Footer } from "@/components/Footer";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { Toaster, toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
export const Route = createFileRoute("/alumni")({
  head: () => ({
    meta: [
      { title: "Alumni Dashboard — Alumni Connect" },
      { name: "description", content: "Your mentorship analytics and outreach impact." },
    ],
  }),
  component: AlumniDashboard,
});

type Accepted = {
  request: any;
  date: string;
  from: string;
  to: string;
};

function AlumniDashboard() {
  const [alumniName, setAlumniName] = useState("");
const [requests, setRequests] = useState<any[]>([]); 
 const [accepted, setAccepted] = useState<Accepted[]>([]);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [reviewedOpen, setReviewedOpen] = useState(false);
  const [scheduling, setScheduling] = useState<any | null>(null);
  const [meetDate, setMeetDate] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [view, setView] = useState<"profile" | "connect">("profile");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [careerPath, setCareerPath] = useState<any[]>([]);
  const [profileVisits, setProfileVisits] = useState(0);
  const [reviewedRequests, setReviewedRequests] = useState<any[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
useEffect(() => {
  const loadUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);

    if (user?.email) {
      const { data } = await supabase
        .from("alumni")
        .select("name")
        .eq("email", user.email)
        .single();

      if (data) {
        setAlumniName(data.name);
      }
    }
  };

  loadUser();
}, []);
useEffect(() => {
  if (!currentUser?.email) return;

  const loadRequests = async () => {
    const { data: alumniProfile } = await supabase
      .from("alumni")
      .select("id")
      .eq("email", currentUser.email)
      .single();

    if (!alumniProfile) return;

    const { data: requestsData } = await supabase
  .from("requests")
.select("*")
.eq("receiver_alumni_id", alumniProfile.id)
.eq("status", "pending")
.order("created_at", { ascending: false });

if (!requestsData) return;
const { data: reviewedData } = await supabase
  .from("requests")
  .select("*")
  .eq("receiver_alumni_id", alumniProfile.id)
  .in("status", ["accepted", "rejected"])
  .order("created_at", { ascending: false });
const enrichedRequests = await Promise.all(
  requestsData.map(async (req) => {
    if (req.sender_role === "alumni") {
      const { data: alumniSender } = await supabase
        .from("alumni")
        .select("name")
        .eq("id", req.sender_id)
        .single();

      return {
        ...req,
        student_name: alumniSender?.name || "Alumni",
        semester: null,
      };
    }

    const { data: student } = await supabase
      .from("students")
      .select("name, semester")
      .eq("id", req.sender_id)
      .single();

    return {
      ...req,
      student_name: student?.name || "Student",
      semester: student?.semester,
    };
  })
);

setRequests(enrichedRequests);
const enrichedReviewed = await Promise.all(
  (reviewedData || []).map(async (req) => {
    if (req.sender_role === "alumni") {
      const { data: alumniSender } = await supabase
        .from("alumni")
        .select("name")
        .eq("id", req.sender_id)
        .single();

      return {
        ...req,
        student_name: alumniSender?.name || "Alumni",
        semester: null,
      };
    }

    const { data: student } = await supabase
      .from("students")
      .select("name, semester")
      .eq("id", req.sender_id)
      .single();

    return {
      ...req,
      student_name: student?.name || "Student",
      semester: student?.semester,
    };
  })
);

setReviewedRequests(enrichedReviewed);
  };

  loadRequests();
}, [currentUser]);
useEffect(() => {
  if (!currentUser?.email) return;

  const loadCareerPath = async () => {
    const { data: alumniProfile } = await supabase
      .from("alumni")
      .select("id")
      .eq("email", currentUser.email)
      .single();

    if (!alumniProfile) return;

    const { data } = await supabase
      .from("career_path")
      .select("*")
      .eq("alumni_id", alumniProfile.id)
      .order("year");

    setCareerPath(data || []);
  };

  loadCareerPath();
  
}, [currentUser]);
useEffect(() => {
  if (!currentUser?.email) return;

  const loadVisitCount = async () => {
    const { data: alumniProfile } = await supabase
      .from("alumni")
      .select("id")
      .eq("email", currentUser.email)
      .single();

    if (!alumniProfile) return;

    const { count } = await supabase
      .from("profile_visits")
      .select("*", { count: "exact", head: true })
      .eq("alumni_id", alumniProfile.id);

    setProfileVisits(count || 0);
  };

  loadVisitCount();
}, [currentUser]);
  const handleDeny = async (id: string) => {
  const { error } = await supabase
    .from("requests")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    toast.error(error.message);
    return;
  }

  setRequests((rs) =>
    rs.filter((r) => r.id !== id)
  );

  toast.success("Request rejected");
};

  const handleAccept = (req: any) => {
    setScheduling(req);
  };

  const sendSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduling) return;
    setIsScheduling(true);
    const { error } = await supabase
  .from("requests")
  .update({ status: "accepted" })
  .eq("id", scheduling.id);

if (error) {
  setIsScheduling(true);
  toast.error(error.message);
  return;
}

const { error: meetingError } = await supabase
  .from("meetings")
  .insert({
    request_id: scheduling.id,
    meeting_date: meetDate,
    start_time: timeFrom,
    end_time: timeTo,
    alumni_id: scheduling.receiver_alumni_id,
    requester_id: scheduling.sender_id,
    status: "scheduled",
  });

if (meetingError) {
  setIsScheduling(true);
  toast.error(meetingError.message);
  return;
}

const { data: studentData } = await supabase
  .from("students")
  .select("name, department_email")
  .eq("id", scheduling.sender_id)
  .single();

if (studentData) {
  const { data, error } = await supabase.functions.invoke(
    "send-meeting-email",
    {
      body: {
        studentEmail: studentData.department_email,
        studentName: studentData.name,
        meetingDate: meetDate,
        startTime: timeFrom,
        endTime: timeTo,
      },
    }
  );

  console.log("MEETING EMAIL DATA:", data);
  console.log("MEETING EMAIL ERROR:", error);
}

    setAccepted((a) => [...a, { request: scheduling, date: meetDate, from: timeFrom, to: timeTo }]);
    setRequests((rs) => rs.filter((r) => r.id !== scheduling.id));
    toast.success(`Meeting scheduled! Event automatically added to both Student and Alumni Google Calendars.`, {
      description: `${scheduling.student_name} · ${meetDate} · ${timeFrom} – ${timeTo}`,
    });
    setIsScheduling(false);
    setScheduling(null);
    setMeetDate(""); setTimeFrom(""); setTimeTo("");
    if (requests.length <= 1) setInboxOpen(false);
  };

  const navTabs = (
    <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
      {(["profile", "connect"] as const).map((t) => (
        <button
          key={t}
          onClick={() => setView(t)}
          className={`relative rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
            view === t ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {view === t && (
            <motion.span
              layoutId="alumni-nav-pill"
              className="absolute inset-0 rounded-lg gradient-bg-hero shadow-glow"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{t === "profile" ? "Profile" : "Connect"}</span>
        </button>
      ))}
    </div>
  );

  return (
    <PageTransition>
      <Toaster position="top-center" richColors />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <TopNav
  role="alumni"
  name={alumniName || "Alumni"}
  avatarSeed={currentUser?.id ?? "alumni"}
  extraNav={navTabs}
/>

        <AnimatePresence mode="wait">
          {view === "profile" ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <section className="mt-10">
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold tracking-tight sm:text-4xl"
                >
                 Welcome back, {alumniName || "Alumni"} 👋
                </motion.h1>
                <p className="mt-2 text-muted-foreground">
                  Manage student requests and mentorship opportunities.
                </p>
              </section>

              <section className="mt-8 grid gap-5 sm:grid-cols-3">
                <StatCard
  icon={<Eye className="h-5 w-5" />}
  label="Profiles Visited"
  value={profileVisits}
/>
                <StatCard icon={<Mail className="h-5 w-5" />} label="Requests Inbox" value={requests.length} onClick={() => setInboxOpen(true)} />
                <StatCard icon={<Star className="h-5 w-5" />} label="Reviewed" value={reviewedRequests.length} onClick={() => setReviewedOpen(true)} />
              </section>

              <section className="mt-10 grid gap-5 lg:grid-cols-2">
                <Panel title="Recent Requests">
  <ul className="space-y-3">
    {requests.slice(0, 3).map((r) => (
      <li
        key={r.id}
        className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-sm"
      >
        <div>
          <p className="font-medium">{r.student_name}</p>
          <p className="text-xs text-muted-foreground">
  {r.semester
  ? `Sem ${r.semester} • ${r.intent}`
  : `Alumni • ${r.intent}`}
</p>
        </div>

        <span
          className={`text-xs px-2 py-1 rounded-full ${
            r.status === "accepted"
              ? "bg-green-100 text-green-700"
              : r.status === "rejected"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {r.status}
        </span>
      </li>
    ))}
  </ul>
</Panel>
                <Panel title="Your Career Path">
  {careerPath.length === 0 ? (
    <p className="text-sm text-muted-foreground">
      No career milestones added yet.
    </p>
  ) : (
    <ol className="space-y-3">
      {careerPath.map((c) => (
        <li
          key={c.id}
          className="rounded-xl bg-muted/50 p-3"
        >
          <p className="font-medium">
            {c.job_role}
          </p>
          <p className="text-sm text-muted-foreground">
            {c.company}
          </p>
          <p className="text-xs text-primary">
            {c.year}
          </p>
        </li>
      ))}
    </ol>
  )}
</Panel>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="connect"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <DirectoryExplorer heading="Browse Fellow Alumni" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Requests Inbox / Scheduling Dialog */}
      <Dialog open={inboxOpen} onOpenChange={(o) => { setInboxOpen(o); if (!o) setScheduling(null); }}>
        <DialogContent className="max-w-xl">
          <AnimatePresence mode="wait">
            {scheduling ? (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Schedule Google Meet with {scheduling.student_name}
                  </DialogTitle>
                  <DialogDescription>
                    Intent: <span className="font-medium text-primary">{scheduling.intent}</span>
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={sendSchedule} className="space-y-4 pt-4">
                  <div className="grid gap-2">
                    <Label>Date</Label>
                    <Input type="date" required value={meetDate} onChange={(e) => setMeetDate(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Time From</Label>
                      <Input type="time" required value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Time To</Label>
                      <Input type="time" required value={timeTo} onChange={(e) => setTimeTo(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setScheduling(null)}>Back</Button>
                    <Button
  type="submit"
  disabled={isScheduling}
  className="gradient-bg-hero text-primary-foreground"
>
  {isScheduling ? "Scheduling..." : "Send"}
</Button>
                  </DialogFooter>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="inbox"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader>
                  <DialogTitle>Pending Requests</DialogTitle>
                  <DialogDescription>
                    Review and respond to incoming requests.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 max-h-[400px] space-y-3 overflow-y-auto pr-1">
                  {requests.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">No pending requests 🎉</p>
                  ) : (
                    requests.map((r) => (
                      <motion.div
                        key={r.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">
  {r.student_name}
</p>

<p className="text-xs text-muted-foreground mt-1">
  {r.sender_role === "student"
    ? `Student • Sem ${r.semester}`
    : "Alumni"}
</p>

<span
  className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
    r.intent === "Referral"
      ? "bg-primary/10 text-primary"
      : "bg-accent/20 text-accent-foreground"
  }`}
>
  {r.intent}
</span>

<p className="mt-2 text-sm">
  {r.subject}
</p>

<p className="mt-1 text-xs text-muted-foreground">
  Status: {r.status}
</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" onClick={() => handleAccept(r)} className="gradient-bg-hero text-primary-foreground">
                              <Check className="h-4 w-4 mr-1" /> Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeny(r.id)}>
                              <X className="h-4 w-4 mr-1" /> Deny
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Reviewed / Accepted Dialog */}
      <Dialog open={reviewedOpen} onOpenChange={setReviewedOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Accepted & Scheduled</DialogTitle>
            <DialogDescription>
              Students you've accepted and scheduled a Google Meet with.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[400px] space-y-3 overflow-y-auto pr-1">
            {reviewedRequests.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No scheduled meetings yet. Accept a request from your inbox to get started.
              </p>
            ) : (
              reviewedRequests.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{r.student_name}</p>

<p className="text-xs text-muted-foreground">
  {r.sender_role === "student"
    ? `Student • Sem ${r.semester}`
    : "Alumni"}
</p>

<span className="text-xs ...">
  {r.intent}
</span>
                    </div>
                    <div className="text-right">
  <span
    className={`text-xs px-2 py-1 rounded-full ${
      r.status === "accepted"
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
    }`}
  >
    {r.status}
  </span>
</div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </PageTransition>
  );
}

function StatCard({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: number; onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
      className="glass shadow-elegant rounded-2xl p-6 text-left cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="grid h-9 w-9 place-items-center rounded-lg gradient-bg-hero text-primary-foreground">
          {icon}
        </span>
      </div>
      <Counter value={value} />
    </motion.button>
  );
}

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, value, { duration: 1.6, ease: [0.2, 0.8, 0.2, 1] });
      return controls.stop;
    }
  }, [inView, mv, value]);

  useEffect(() => {
    return rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
  }, [rounded]);

  return <p ref={ref} className="mt-3 text-4xl font-extrabold tracking-tight gradient-text">0</p>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      {children}
    </motion.div>
  );
}
