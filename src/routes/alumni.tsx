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
import type { ConnectionRequestRow, ScheduledMeeting } from "@/lib/types";
import { requireAuth } from "@/lib/route-guards";
import {
  acceptAndScheduleMeeting,
  countProfileViews,
  denyConnectionRequest,
  fetchPendingRequestsForAlumni,
  fetchScheduledMeetingsForAlumni,
} from "@/lib/api/connections";

export const Route = createFileRoute("/alumni")({
  head: () => ({
    meta: [
      { title: "Alumni Dashboard — Alumni Connect" },
      { name: "description", content: "Your mentorship analytics and outreach impact." },
    ],
  }),
  beforeLoad: () => requireAuth("alumni"),
  loader: async () => {
    const { profile } = await requireAuth("alumni");
    const [pending, scheduled, profileViews] = await Promise.all([
      fetchPendingRequestsForAlumni(profile.id),
      fetchScheduledMeetingsForAlumni(profile.id),
      countProfileViews(profile.id),
    ]);
    return { profile, pending, scheduled, profileViews };
  },
  component: AlumniDashboard,
});

function AlumniDashboard() {
  const { profile, pending: initialPending, scheduled: initialScheduled, profileViews } =
    Route.useLoaderData();
  const [requests, setRequests] = useState<ConnectionRequestRow[]>(initialPending);
  const [accepted, setAccepted] = useState<ScheduledMeeting[]>(initialScheduled);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [reviewedOpen, setReviewedOpen] = useState(false);
  const [scheduling, setScheduling] = useState<ConnectionRequestRow | null>(null);
  const [meetDate, setMeetDate] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [view, setView] = useState<"profile" | "connect">("profile");

  const handleDeny = async (id: string) => {
    try {
      await denyConnectionRequest(id);
      setRequests((rs) => rs.filter((r) => r.id !== id));
      toast.message("Request denied");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not deny request");
    }
  };

  const handleAccept = (req: ConnectionRequestRow) => {
    setScheduling(req);
  };

  const sendSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduling) return;
    try {
      await acceptAndScheduleMeeting({
        requestId: scheduling.id,
        scheduledByUserId: profile.id,
        meetingDate: meetDate,
        startTime: timeFrom,
        endTime: timeTo,
      });
      setAccepted((a) => [
        ...a,
        { id: crypto.randomUUID(), request: scheduling, date: meetDate, from: timeFrom, to: timeTo },
      ]);
      setRequests((rs) => rs.filter((r) => r.id !== scheduling.id));
      toast.success(`Meeting scheduled!`, {
        description: `${scheduling.name} · ${meetDate} · ${timeFrom} – ${timeTo}`,
      });
      setScheduling(null);
      setMeetDate("");
      setTimeFrom("");
      setTimeTo("");
      if (requests.length <= 1) setInboxOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not schedule meeting");
    }
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
        <TopNav role="alumni" profile={profile} extraNav={navTabs} />

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
                  Welcome back, {profile.fullName.split(" ")[0]} 👋
                </motion.h1>
                <p className="mt-2 text-muted-foreground">
                  Here's the impact you've made this quarter.
                </p>
              </section>

              <section className="mt-8 grid gap-5 sm:grid-cols-3">
                <StatCard icon={<Eye className="h-5 w-5" />} label="Profiles Visited" value={profileViews} onClick={() => toast.info(`${profileViews} profile views recorded`)} />
                <StatCard icon={<Mail className="h-5 w-5" />} label="Requests Inbox" value={requests.length} onClick={() => setInboxOpen(true)} />
                <StatCard icon={<Star className="h-5 w-5" />} label="Reviewed" value={accepted.length} onClick={() => setReviewedOpen(true)} />
              </section>

              <section className="mt-10 grid gap-5 lg:grid-cols-2">
                <Panel title="Recent Mentees">
                  <ul className="space-y-3">
                    {["Aarav Singh — CS, Sem 5", "Diya Patel — IT, Sem 6", "Karan Roy — ECE, Sem 4"].map((m) => (
                      <li key={m} className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-sm">
                        <span>{m}</span>
                        <span className="text-xs text-primary">Active</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
                <Panel title="Your Career Path">
                  <ol className="relative ml-3 space-y-3 border-l-2 border-primary/30 pl-5 text-sm">
                    {[
                      { y: "2018", r: "SWE Intern @ Flipkart" },
                      { y: "2019", r: "SDE-1 @ Razorpay" },
                      { y: "2022", r: "SDE-2 @ Google" },
                      { y: "2024", r: "Senior SWE @ Google" },
                    ].map((c, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full gradient-bg-hero" />
                        <p className="text-xs font-semibold text-primary">{c.y}</p>
                        <p>{c.r}</p>
                      </li>
                    ))}
                  </ol>
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
                    Schedule Google Meet with {scheduling.name}
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
                    <Button type="submit" className="gradient-bg-hero text-primary-foreground">Send</Button>
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
                  <DialogTitle>Pending Student Requests</DialogTitle>
                  <DialogDescription>
                    Review and respond to student outreach.
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
                            <p className="font-semibold flex flex-wrap items-center gap-2">
                              {r.name}
                              {r.senderType === "alumni" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary/15 to-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/30">
                                  ★ Alumni · Batch {r.batch}
                                </span>
                              ) : (
                                <span className="text-xs font-normal text-muted-foreground">
                                  — {r.dept}, Sem {r.semester}
                                </span>
                              )}
                            </p>
                            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                              r.intent === "Referral" ? "bg-primary/10 text-primary" : "bg-accent/20 text-accent-foreground"
                            }`}>{r.intent}</span>
                            <p className="mt-2 text-xs text-muted-foreground">{r.message}</p>
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
            {accepted.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No scheduled meetings yet. Accept a request from your inbox to get started.
              </p>
            ) : (
              accepted.map((a) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{a.request.name}</p>
                      <span className="text-xs text-primary">{a.request.intent}</span>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p className="flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" />{a.date}</p>
                      <p>{a.from} – {a.to}</p>
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
