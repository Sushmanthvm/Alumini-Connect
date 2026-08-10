import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Sparkles, Briefcase, ArrowLeft } from "lucide-react";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import {
  loginAlumni,
  loginAlumniWithGoogle,
  loginStudent,
  loginStudentWithGoogle,
  registerAlumni,
  registerStudent,
  resetPassword,
} from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alumni Connect — From Academic to Corporate" },
      { name: "description", content: "A bridge between students and alumni. Discover mentors, careers, and connections." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [flipped, setFlipped] = useState(false);

  return (
    <PageTransition>
      <Toaster position="top-center" richColors />
      <div className="relative min-h-screen overflow-x-hidden">
        {/* Ambient blobs */}
        <motion.div
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-40 gradient-bg-hero"
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-30 gradient-bg-hero"
          animate={{ scale: [1, 1.2, 1], x: [0, -40, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating decorative icons */}
        <FloatingIcon className="left-[6%] top-[18%]" delay={0}>
          <GraduationCap className="h-10 w-10 text-primary/70" />
        </FloatingIcon>
        <FloatingIcon className="right-[8%] top-[26%]" delay={1.2}>
          <Briefcase className="h-9 w-9 text-accent" />
        </FloatingIcon>
        <FloatingIcon className="left-[12%] bottom-[14%]" delay={2.4}>
          <Sparkles className="h-8 w-8 text-primary-glow" />
        </FloatingIcon>
        <FloatingIcon className="right-[10%] bottom-[20%]" delay={0.6}>
          <GraduationCap className="h-12 w-12 text-primary/50" />
        </FloatingIcon>

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-12 pb-24">
          {/* Hero graduation cap badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180, y: -40 }}
            animate={{ scale: 1, rotate: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }}
            className="mb-6 grid h-20 w-20 place-items-center rounded-2xl gradient-bg-hero shadow-glow"
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.5 }}
            >
              <GraduationCap className="h-10 w-10 text-primary-foreground" strokeWidth={2.2} />
            </motion.div>
          </motion.div>

          <h1 className="animate-blur-focus text-center text-5xl font-extrabold tracking-tight sm:text-7xl">
            <span className="gradient-text">ALUMNI CONNECT</span>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.7 }}
            className="mt-5 text-center text-lg text-muted-foreground sm:text-xl"
          >
            A bridge from <span className="text-foreground font-medium">Academic</span> to{" "}
            <span className="text-foreground font-medium">Corporate</span>.
          </motion.p>

          {/* Flip Card — taller min-height when register side is active */}
          <div
            className={`perspective-1000 mt-12 w-full max-w-md transition-[min-height] duration-500 ${
              flipped ? "min-h-[min(640px,78vh)]" : "min-h-[min(420px,62vh)]"
            }`}
          >
            <motion.div
              className="relative preserve-3d h-full w-full"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front - Login */}
              <div
                className="backface-hidden h-full"
                style={{ pointerEvents: flipped ? "none" : "auto" }}
                aria-hidden={flipped}
              >
                <AuthCard mode="login" onFlip={() => setFlipped(true)} active={!flipped} />
              </div>
              {/* Back - Register */}
              <div
                className="backface-hidden absolute top-0 left-0 h-full w-full"
                style={{ transform: "rotateY(180deg)", pointerEvents: flipped ? "auto" : "none" }}
                aria-hidden={!flipped}
              >
                <AuthCard mode="register" onFlip={() => setFlipped(false)} active={flipped} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

    </PageTransition>
  );
}

function FloatingIcon({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={`pointer-events-none absolute hidden md:block ${className ?? ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: [0, -14, 0] }}
      transition={{
        opacity: { duration: 0.8, delay },
        y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
      }}
    >
      <div className="glass rounded-2xl p-3 shadow-elegant">{children}</div>
    </motion.div>
  );
}

function AuthCard({ mode, onFlip, active }: { mode: "login" | "register"; onFlip: () => void; active: boolean }) {
  const [tab, setTab] = useState<"student" | "alumni">("student");
  const [forgotStep, setForgotStep] = useState<0 | 1>(0);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
const [studentLoginRoll, setStudentLoginRoll] = useState("");
const [studentLoginEmail, setStudentLoginEmail] = useState("");
const [studentLoginPassword, setStudentLoginPassword] = useState("");
const [studentName, setStudentName] = useState("");
const [studentEmail, setStudentEmail] = useState("");
const [studentRollNumber, setStudentRollNumber] = useState("");
const [studentBatch, setStudentBatch] = useState("");
const [studentSemester, setStudentSemester] = useState("");
const [studentPassword, setStudentPassword] = useState("");
const [alumniName, setAlumniName] = useState("");
const [alumniEmail, setAlumniEmail] = useState("");
const [alumniBatchYear, setAlumniBatchYear] = useState("");
const [alumniLocation, setAlumniLocation] = useState("");
const [alumniCompany, setAlumniCompany] = useState("");
const [alumniJobRole, setAlumniJobRole] = useState("");
const [alumniPassword, setAlumniPassword] = useState("");
const [alumniLoginEmail, setAlumniLoginEmail] = useState("");
const [alumniLoginCode, setAlumniLoginCode] = useState("");
const [alumniLoginPassword, setAlumniLoginPassword] = useState("");
const [alumniDegree, setAlumniDegree] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    if (tab === "student") {
      const { data: studentRecord, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("roll_number", studentLoginRoll)
        .eq("department_email", studentLoginEmail)
        .single();

      if (studentError || !studentRecord) {
        toast.error("Invalid Roll Number or Email");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: studentLoginEmail,
        password: studentLoginPassword,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Welcome back, Student!");
      navigate({ to: "/student" });
      return;
    }

    const { data: alumni } = await supabase
  .from("alumni")
  .select("alumni_code")
  .eq("email", alumniLoginEmail)
  .single();

if (!alumni) {
  toast.error("Alumni account not found");
  return;
}

if (alumni.alumni_code !== alumniLoginCode) {
  toast.error("Invalid Alumni Code");
  return;
}

const { error } = await supabase.auth.signInWithPassword({
  email: alumniLoginEmail,
  password: alumniLoginPassword,
});

if (error) {
  toast.error(error.message);
  return;
}

toast.success("Welcome back, Alumni!");
navigate({ to: "/alumni" });
return;
  } catch (err) {
    console.error(err);
    toast.error("Something went wrong");
  }
};

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    if (tab === "student") {
      const { data, error } = await supabase.auth.signUp({
        email: studentEmail,
        password: studentPassword,
      });

      if (error) {
  console.error(error);
  toast.error(error.message);
  return;
}

      if (!data.user) {
        toast.error("User creation failed");
        return;
      }

      const { error: studentError } = await supabase
        .from("students")
        .insert({
          id: data.user.id,
          name: studentName,
          roll_number: studentRollNumber,
          department_email: studentEmail,
          batch: Number(studentBatch),
          semester: Number(studentSemester),
        });

      if (studentError) {
        toast.error(studentError.message);
        return;
      }

      toast.success("Student registration successful!");
      onFlip();
      return;
    }

const { data, error } = await supabase.auth.signUp({
  email: alumniEmail,
  password: alumniPassword,
});

if (error) {
  toast.error(error.message);
  return;
}

if (!data.user) {
  toast.error("User creation failed");
  return;
}
const alumniCode = `ALM-${Date.now().toString().slice(-4)}`;
const { error: alumniError } = await supabase
  .from("alumni")
  .insert({
    id: data.user.id,
    name: alumniName,
    email: alumniEmail,
    alumni_code: alumniCode,
    batch_year: Number(alumniBatchYear),
    degree: alumniDegree,
    location: alumniLocation,
    current_company: alumniCompany,
    current_job_role: alumniJobRole,
  });

if (alumniError) {
  toast.error(alumniError.message);
  return;
}

toast.success("Alumni registration successful!");
onFlip();  } catch (err) {
    console.error(err);
    toast.error("Something went wrong");
  }
};

  const resetForgot = () => {
    setForgotStep(0);
    setResetEmail("");
  };

  const submitResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return toast.error("Supabase is not configured.");
    setBusy(true);
    try {
      await resetPassword(resetEmail);
      toast.success("Check your email for a password reset link.");
      resetForgot();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async (role: "student" | "alumni") => {
    if (!isSupabaseConfigured) return toast.error("Supabase is not configured.");
    setBusy(true);
    try {
      if (role === "alumni") {
        await loginAlumniWithGoogle();
      } else {
        await loginStudentWithGoogle();
      }
      // Browser redirects to Google; callback finishes the session.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div
      className="glass shadow-glow flex h-full max-h-[min(640px,78vh)] flex-col rounded-3xl p-6 sm:p-8"
      tabIndex={active ? undefined : -1}
    >
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as "student" | "alumni");
          resetForgot();
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="relative grid w-full shrink-0 grid-cols-2 rounded-xl bg-muted p-1">
          <TabsTrigger value="student" className="relative z-10 rounded-lg">Student</TabsTrigger>
          <TabsTrigger value="alumni" className="relative z-10 rounded-lg">Alumni</TabsTrigger>
        </TabsList>

        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <AnimatePresence mode="wait">
            {mode === "login" && forgotStep === 1 ? (
              <motion.div
                key={`forgot-${tab}`}
                className="flex min-h-0 flex-1 flex-col"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <button
                  type="button"
                  onClick={resetForgot}
                  className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
                <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitResetEmail}>
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
                    <h2 className="text-xl font-semibold">Reset Password</h2>
                    <p className="text-sm text-muted-foreground">
                      We&apos;ll email you a secure link to reset your password.
                    </p>
                    <Field
                      label="Email"
                      type="email"
                      placeholder="you@dept.edu"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                  <AuthFormFooter>
                    <Button
                      type="submit"
                      disabled={busy}
                      className="w-full gradient-bg-hero text-primary-foreground shadow-elegant"
                    >
                      {busy ? "Sending…" : "Send reset link"}
                    </Button>
                  </AuthFormFooter>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key={`${tab}-${mode}`}
                className="flex min-h-0 flex-1 flex-col"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
              >
                {mode === "login" ? (
                  <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleLogin}>
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
                      <h2 className="text-xl font-semibold">
                        {tab === "student" ? "Student Login" : "Alumni Login"}
                      </h2>
                      {tab === "student" ? (
                        <>
                          <Field
                            label="Department Email"
                            type="email"
                            placeholder="you@dept.edu"
                            value={loginDeptEmail}
                            onChange={(e) => setLoginDeptEmail(e.target.value)}
                          />
                          <Field
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                          />
                        </>
                      ) : (
                        <>
                          <Field
                            label="Email"
                            type="email"
                            placeholder="you@company.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                          />
                          <Field
                            label="Alumni Code"
                            placeholder="ALM-2019-DEMO"
                            value={loginAlumniCode}
                            onChange={(e) => setLoginAlumniCode(e.target.value)}
                          />
                          <Field
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                          />
                        </>
                      )}
                      <div className="flex justify-end pb-1">
                        <button
                          type="button"
                          onClick={() => setForgotStep(1)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                    <AuthFormFooter>
                      <Button
                        type="submit"
                        disabled={busy}
                        className="w-full gradient-bg-hero text-primary-foreground shadow-elegant"
                      >
                        {busy ? "Signing in…" : "Sign in"}
                      </Button>
                      <AuthDivider label="or continue with Google" />
                      <GoogleButton
                        busy={busy}
                        onClick={() => void handleGoogleSignIn(tab)}
                        label="Continue with Google"
                      />
                    </AuthFormFooter>
                  </form>
                ) : (
                <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleRegister}>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
                    <h2 className="text-xl font-semibold">
                      {tab === "student" ? "Student Signup" : "Alumni Signup"}
                    </h2>
                    {tab === "student" ? (
                      <>
                        <Field
  label="Roll Number"
  placeholder="CB.SC.U4CYSXXXXX"
  value={studentLoginRoll}
  onChange={(e) => setStudentLoginRoll(e.target.value)}
/>

<Field
  label="Department Email"
  type="email"
  placeholder="cb.sc.u4cysxxxxx@cb.students.amrita.edu"
  value={studentLoginEmail}
  onChange={(e) => setStudentLoginEmail(e.target.value)}
/>

<Field
  label="Password"
  type="password"
  placeholder="••••••••"
  value={studentLoginPassword}
  onChange={(e) => setStudentLoginPassword(e.target.value)}
/>
                      </>
                    ) : (
                      <>
                        <Field
  label="Email"
  type="email"
  placeholder="you@company.com"
  value={alumniLoginEmail}
  onChange={(e) => setAlumniLoginEmail(e.target.value)}
/>

<Field
  label="Alumni Code"
  placeholder="********"
  value={alumniLoginCode}
  onChange={(e) => setAlumniLoginCode(e.target.value)}
/>

<Field
  label="Password"
  type="password"
  placeholder="••••••••"
  value={alumniLoginPassword}
  onChange={(e) => setAlumniLoginPassword(e.target.value)}
/>
                      </>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button type="submit" className="w-full gradient-bg-hero text-primary-foreground shadow-elegant">
                        Sign in
                      </Button>
                    </motion.div>
                  </form>
                ) : (
                <form className="space-y-3" onSubmit={handleRegister}>
                  <h2 className="text-xl font-semibold">
                    {tab === "student" ? "Student Signup" : "Alumni Signup"}
                  </h2>
                  {tab === "student" ? (
                    <>
  <Field
    label="Name"
    placeholder="Your full name"
    value={studentName}
    onChange={(e) => setStudentName(e.target.value)}
  />

  <Field
    label="Email"
    type="email"
    placeholder="cb.sc.u4cysxxxxx@cb.students.amrita.edu"
    value={studentEmail}
    onChange={(e) => setStudentEmail(e.target.value)}
  />

  <Field
    label="Roll Number"
    placeholder="CB.SC.U4CYSXXXXX"
    value={studentRollNumber}
    onChange={(e) => setStudentRollNumber(e.target.value)}
  />

  <div className="grid grid-cols-2 gap-3">
    <Field
      label="Batch"
      placeholder="20XX"
      value={studentBatch}
      onChange={(e) => setStudentBatch(e.target.value)}
    />

    <Field
      label="Semester"
      placeholder="Semester Number"
      value={studentSemester}
      onChange={(e) => setStudentSemester(e.target.value)}
    />
  </div>

  <Field
    label="Password"
    type="password"
    placeholder="••••••••"
    value={studentPassword}
    onChange={(e) => setStudentPassword(e.target.value)}
  />
</>
                  ) : (
                    <>
  <Field
    label="Name"
    placeholder="Your full name"
    value={alumniName}
    onChange={(e) => setAlumniName(e.target.value)}
  />

  <Field
    label="Email"
    type="email"
    placeholder="you@email.com"
    value={alumniEmail}
    onChange={(e) => setAlumniEmail(e.target.value)}
  />

  <div className="grid grid-cols-2 gap-3">
  <Field
    label="Batch Year"
    placeholder="2018"
    value={alumniBatchYear}
    onChange={(e) => setAlumniBatchYear(e.target.value)}
  />

  <Field
    label="Location"
    placeholder="Bangalore"
    value={alumniLocation}
    onChange={(e) => setAlumniLocation(e.target.value)}
  />
</div>

<div className="grid gap-1.5">
  <Label className="text-xs font-medium text-muted-foreground">
    Degree Program
  </Label>

  <select
  required
  value={alumniDegree}
  onChange={(e) => setAlumniDegree(e.target.value)}
  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-muted-foreground shadow-sm appearance-none"
>
  <option value="" hidden>
    Select Degree
  </option>
  <option value="B.Tech">B.Tech</option>
  <option value="M.Tech">M.Tech</option>
</select>
</div>

  <Field
    label="Current Company"
    placeholder="Google"
    value={alumniCompany}
    onChange={(e) => setAlumniCompany(e.target.value)}
  />

  <Field
    label="Job Role"
    placeholder="Senior SWE"
    value={alumniJobRole}
    onChange={(e) => setAlumniJobRole(e.target.value)}
  />

  <Field
    label="Password"
    type="password"
    placeholder="••••••••"
    value={alumniPassword}
    onChange={(e) => setAlumniPassword(e.target.value)}
  />
</>
                  )}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button type="submit" className="w-full gradient-bg-hero text-primary-foreground shadow-elegant">
                      Proceed
                    </Button>
                    <AuthDivider label="or continue with Google" />
                    <GoogleButton
                      busy={busy}
                      onClick={() => void handleGoogleSignIn(tab)}
                      label="Sign up with Google"
                    />
                  </AuthFormFooter>
                </form>
              )}
            </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>

      <div className="mt-4 shrink-0 text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>Not signed up?{" "}
            <button onClick={onFlip} className="font-medium text-primary underline-offset-4 hover:underline">
              Register here.
            </button>
          </>
        ) : (
          <>Already have an account?{" "}
            <button onClick={onFlip} className="font-medium text-primary underline-offset-4 hover:underline">
              Back to login.
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Keeps Sign in / Proceed (+ Google) visible while form fields scroll above */
function AuthFormFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 mt-3 shrink-0 space-y-3 border-t border-white/10 bg-gradient-to-t from-background via-background/95 to-background/80 pt-3 shadow-[0_-12px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md">
      {children}
    </div>
  );
}

function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-1 flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function GoogleButton({
  busy,
  onClick,
  label,
}: {
  busy: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={busy}
      onClick={onClick}
      className="w-full gap-2 border-border bg-background/80 font-medium shadow-sm hover:bg-muted/60"
    >
      <GoogleLogo className="h-4 w-4 shrink-0" />
      {busy ? "Redirecting…" : label}
    </Button>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input required {...props} />
    </div>
  );
}
