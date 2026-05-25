import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Sparkles, Briefcase, ArrowLeft } from "lucide-react";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast, Toaster } from "sonner";
import { PageTransition } from "@/components/PageTransition";

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
      <div className="relative min-h-screen overflow-hidden">
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

          {/* Flip Card */}
          <div className="perspective-1000 mt-12 w-full max-w-md">
            <motion.div
              className="relative preserve-3d w-full"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front - Login */}
              <div
                className="backface-hidden"
                style={{ pointerEvents: flipped ? "none" : "auto" }}
                aria-hidden={flipped}
              >
                <AuthCard mode="login" onFlip={() => setFlipped(true)} active={!flipped} />
              </div>
              {/* Back - Register */}
              <div
                className="backface-hidden absolute inset-0"
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
  const [forgotStep, setForgotStep] = useState<0 | 1 | 2 | 3>(0);
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Welcome back, ${tab === "student" ? "Student" : "Alumni"}!`);
    navigate({ to: tab === "student" ? "/student" : "/alumni" });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Registration successful! Please log in.");
    onFlip();
  };

  const resetForgot = () => { setForgotStep(0); setOtp(""); setNewPw(""); setConfirmPw(""); };

  const submitOtp = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("OTP sent to your email!");
    setForgotStep(2);
  };
  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return toast.error("Enter the full 6-digit code");
    toast.success("OTP verified!");
    setForgotStep(3);
  };
  const finalReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPw !== confirmPw) return toast.error("Passwords do not match");
    toast.success("Password reset successful! Please log in.");
    resetForgot();
  };

  return (
    <div className="glass shadow-glow rounded-3xl p-6 sm:p-8" tabIndex={active ? undefined : -1}>
      <Tabs value={tab} onValueChange={(v) => { setTab(v as "student" | "alumni"); resetForgot(); }}>

        <TabsList className="relative grid w-full grid-cols-2 rounded-xl bg-muted p-1">
          <TabsTrigger value="student" className="relative z-10 rounded-lg">Student</TabsTrigger>
          <TabsTrigger value="alumni" className="relative z-10 rounded-lg">Alumni</TabsTrigger>
        </TabsList>

        <div className="mt-6 min-h-[300px]">
          <AnimatePresence mode="wait">
            {mode === "login" && forgotStep > 0 ? (
              <motion.div
                key={`forgot-${forgotStep}-${tab}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <button
                  type="button"
                  onClick={() => (forgotStep === 1 ? resetForgot() : setForgotStep((s) => (s - 1) as 0 | 1 | 2 | 3))}
                  className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>

                {forgotStep === 1 && (
                  <form className="space-y-4" onSubmit={submitOtp}>
                    <h2 className="text-xl font-semibold">Reset Password</h2>
                    <p className="text-sm text-muted-foreground">
                      Enter your personal email to receive a one-time code.
                    </p>
                    <Field label="Personal Email" type="email" placeholder="you@personal.com" />
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button type="submit" className="w-full gradient-bg-hero text-primary-foreground shadow-elegant">
                        Send OTP
                      </Button>
                    </motion.div>
                  </form>
                )}

                {forgotStep === 2 && (
                  <form className="space-y-4" onSubmit={verifyOtp}>
                    <h2 className="text-xl font-semibold">Enter OTP</h2>
                    <p className="text-sm text-muted-foreground">We've sent a 6-digit code to your email.</p>
                    <div className="flex justify-center pt-2">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} className="h-11 w-11 text-lg" />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button type="submit" className="w-full gradient-bg-hero text-primary-foreground shadow-elegant">
                        Verify
                      </Button>
                    </motion.div>
                  </form>
                )}

                {forgotStep === 3 && (
                  <form className="space-y-4" onSubmit={finalReset}>
                    <h2 className="text-xl font-semibold">Set a New Password</h2>
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">New Password</Label>
                      <Input type="password" required value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Confirm Password</Label>
                      <Input type="password" required value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" />
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button type="submit" className="w-full gradient-bg-hero text-primary-foreground shadow-elegant">
                        Reset Password
                      </Button>
                    </motion.div>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={`${tab}-${mode}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
              >
                {mode === "login" ? (
                  <form className="space-y-3" onSubmit={handleLogin}>
                    <h2 className="text-xl font-semibold">
                      {tab === "student" ? "Student Login" : "Alumni Login"}
                    </h2>
                    {tab === "student" ? (
                      <>
                        <Field label="Roll Number" placeholder="CS21B1042" />
                        <Field label="Department Email" type="email" placeholder="you@dept.edu" />
                        <Field label="Password" type="password" placeholder="••••••••" />
                      </>
                    ) : (
                      <>
                        <Field label="Email" type="email" placeholder="you@company.com" />
                        <Field label="Alumni Code" placeholder="ALM-2019-XXXX" />
                        <Field label="Password" type="password" placeholder="••••••••" />
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
                      <Field label="Name" placeholder="Your full name" />
                      <Field label="Email" type="email" placeholder="you@email.com" />
                      <Field label="Roll Number" placeholder="CS21B1042" />
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Batch" placeholder="2024" />
                        <Field label="Semester" placeholder="Semester 3" />
                      </div>
                      <Field label="Password" type="password" placeholder="••••••••" />
                    </>
                  ) : (
                    <>
                      <Field label="Name" placeholder="Your full name" />
                      <Field label="Email" type="email" placeholder="you@email.com" />
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Batch Year" placeholder="2018" />
                        <Field label="Location" placeholder="Bangalore" />
                      </div>
                      <Field label="Current Company" placeholder="Google" />
                      <Field label="Job Role" placeholder="Senior SWE" />
                      <Field label="Password" type="password" placeholder="••••••••" />
                    </>
                  )}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button type="submit" className="w-full gradient-bg-hero text-primary-foreground shadow-elegant">
                      Proceed
                    </Button>
                  </motion.div>
                </form>
              )}
            </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>

      <div className="mt-6 text-center text-sm text-muted-foreground">
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

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input required {...props} />
    </div>
  );
}
