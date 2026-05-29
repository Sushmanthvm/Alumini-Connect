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
  loginStudent,
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
      {!isSupabaseConfigured && (
        <div className="relative z-50 mx-auto max-w-6xl px-4 pt-4">
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-900 dark:text-amber-100">
            Add <code className="font-mono">VITE_SUPABASE_URL</code> and{" "}
            <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to{" "}
            <code className="font-mono">.env.local</code> to enable auth and database.
          </p>
        </div>
      )}
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
  const { refreshProfile } = useAuth();

  const [loginDeptEmail, setLoginDeptEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginAlumniCode, setLoginAlumniCode] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  const [regName, setRegName] = useState("");
  const [regPersonalEmail, setRegPersonalEmail] = useState("");
  const [regDeptEmail, setRegDeptEmail] = useState("");
  const [regRoll, setRegRoll] = useState("");
  const [regBatch, setRegBatch] = useState("");
  const [regSemester, setRegSemester] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regAlumniCode, setRegAlumniCode] = useState("");
  const [regLocation, setRegLocation] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regJobRole, setRegJobRole] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return toast.error("Supabase is not configured.");
    setBusy(true);
    try {
      if (tab === "student") {
        await loginStudent(loginDeptEmail, loginPassword);
      } else {
        await loginAlumni(loginEmail, loginAlumniCode, loginPassword);
      }
      await refreshProfile();
      toast.success(`Welcome back!`);
      navigate({ to: tab === "student" ? "/student" : "/alumni" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return toast.error("Supabase is not configured.");
    setBusy(true);
    try {
      if (tab === "student") {
        const semester = parseInt(regSemester.replace(/\D/g, ""), 10) || 1;
        const batchYear = parseInt(regBatch, 10) || new Date().getFullYear();
        await registerStudent({
          fullName: regName,
          personalEmail: regPersonalEmail,
          departmentEmail: regDeptEmail,
          rollNumber: regRoll,
          batchYear,
          semester,
          password: regPassword,
        });
      } else {
        await registerAlumni({
          fullName: regName,
          email: regPersonalEmail,
          alumniCode: regAlumniCode,
          batchYear: parseInt(regBatch, 10) || 2018,
          location: regLocation,
          companyName: regCompany,
          jobTitle: regJobRole,
          password: regPassword,
        });
      }
      toast.success("Account created! You can sign in now.");
      onFlip();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
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
                        <Field label="Name" placeholder="Your full name" value={regName} onChange={(e) => setRegName(e.target.value)} />
                        <Field label="Personal Email" type="email" placeholder="you@email.com" value={regPersonalEmail} onChange={(e) => setRegPersonalEmail(e.target.value)} />
                        <Field label="Department Email (login)" type="email" placeholder="you@dept.edu" value={regDeptEmail} onChange={(e) => setRegDeptEmail(e.target.value)} />
                        <Field label="Roll Number" placeholder="CS21B1042" value={regRoll} onChange={(e) => setRegRoll(e.target.value)} />
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Batch Year" placeholder="2024" value={regBatch} onChange={(e) => setRegBatch(e.target.value)} />
                          <Field label="Semester" placeholder="5" value={regSemester} onChange={(e) => setRegSemester(e.target.value)} />
                        </div>
                        <Field label="Password" type="password" placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                      </>
                    ) : (
                      <>
                        <Field label="Name" placeholder="Your full name" value={regName} onChange={(e) => setRegName(e.target.value)} />
                        <Field label="Email" type="email" placeholder="you@email.com" value={regPersonalEmail} onChange={(e) => setRegPersonalEmail(e.target.value)} />
                        <Field label="Alumni Code" placeholder="ALM-2019-DEMO" value={regAlumniCode} onChange={(e) => setRegAlumniCode(e.target.value)} />
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Batch Year" placeholder="2018" value={regBatch} onChange={(e) => setRegBatch(e.target.value)} />
                          <Field label="Location" placeholder="Bangalore" value={regLocation} onChange={(e) => setRegLocation(e.target.value)} />
                        </div>
                        <Field label="Current Company" placeholder="Google" value={regCompany} onChange={(e) => setRegCompany(e.target.value)} />
                        <Field label="Job Role" placeholder="Senior SWE" value={regJobRole} onChange={(e) => setRegJobRole(e.target.value)} />
                        <Field label="Password" type="password" placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                      </>
                    )}
                  </div>
                  <AuthFormFooter>
                    <Button type="submit" disabled={busy} className="w-full gradient-bg-hero text-primary-foreground shadow-elegant">
                      {busy ? "Creating account…" : "Proceed"}
                    </Button>
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

/** Keeps Sign in / Proceed visible while form fields scroll above */
function AuthFormFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 mt-3 shrink-0 border-t border-white/10 bg-gradient-to-t from-background via-background/95 to-background/80 pt-3 shadow-[0_-12px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md">
      {children}
    </div>
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
