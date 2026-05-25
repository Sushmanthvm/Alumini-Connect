import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { HERO_SLIDES, COMPANIES } from "@/lib/mock-data";
import { TopNav } from "@/components/TopNav";
import { PageTransition } from "@/components/PageTransition";
import { Footer } from "@/components/Footer";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { Toaster } from "sonner";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — Alumni Connect" },
      { name: "description", content: "Browse alumni profiles and find your mentor." },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 3000);
    return () => clearInterval(i);
  }, []);

  return (
    <PageTransition>
      <Toaster position="top-center" richColors />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <TopNav role="student" name="Aarav" avatarSeed="Aarav" />

        {/* Hero Slider */}
        <section className="relative mt-8 overflow-hidden rounded-3xl shadow-glow h-[360px] sm:h-[440px]">
          <AnimatePresence mode="sync">
            <motion.div
              key={slide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img src={HERO_SLIDES[slide].image} alt={HERO_SLIDES[slide].title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl"
                >
                  {HERO_SLIDES[slide].title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.6 }}
                  className="mt-3 max-w-2xl text-base text-white/90 sm:text-lg"
                >
                  {HERO_SLIDES[slide].subtitle}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-4 right-6 z-10 flex gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-white" : "w-2 bg-white/50"}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Company Marquee */}
        <section className="mt-10 overflow-hidden rounded-2xl glass py-5">
          <div className="flex w-max animate-marquee gap-12 px-6">
            {[...COMPANIES, ...COMPANIES].map((c, i) => (
              <span
                key={i}
                className="whitespace-nowrap text-2xl font-bold tracking-tight text-muted-foreground/70 hover:text-primary transition-colors"
              >
                {c}
              </span>
            ))}
          </div>
        </section>

        {/* Info sections */}
        <section className="mt-12 grid gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass shadow-elegant rounded-3xl p-8 sm:p-10"
          >
            <h2 className="gradient-text text-3xl font-extrabold tracking-tight sm:text-4xl">
              WHY ALUMNI CONNECT
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Alumni Connect bridges the gap between aspiring students and accomplished alumni.
              We curate a trusted, intimate network where mentorship flows naturally — turning
              years of hard-earned experience into a guiding compass for the next generation.
              Whether you're chasing a referral, exploring a career pivot, or simply seeking
              perspective, the right alumnus is just one click away.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass shadow-elegant rounded-3xl p-8 sm:p-10"
          >
            <h2 className="gradient-text text-3xl font-extrabold tracking-tight sm:text-4xl">
              WHAT ISSUES IS SOLVED
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Students often struggle with cold outreach, scattered LinkedIn pings, and the
              uncertainty of who to ask. Alumni want to give back but lack a focused channel
              to do so. Alumni Connect solves this with verified profiles, intent-based
              requests (Referrals vs Mentoring), and built-in scheduling — replacing chaos
              with a clean, two-way conversation.
            </p>
          </motion.div>
        </section>

        <DirectoryExplorer />
      </div>
      <Footer />
    </PageTransition>
  );
}
