import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { HERO_SLIDES } from "@/lib/mock-data";
import { TopNav } from "@/components/TopNav";
import { PageTransition } from "@/components/PageTransition";
import { Footer } from "@/components/Footer";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { Toaster } from "sonner";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — Alumni Connect" },
      { name: "description", content: "Browse alumni profiles and find your mentor." },
    ],
  }),
  beforeLoad: () => requireAuth("student"),
  loader: async () => {
    const { profile } = await requireAuth("student");
    const [heroSlides, companies] = await Promise.all([
      fetchHeroSlides().catch(() => HERO_SLIDES.map((s) => ({ title: s.title, subtitle: s.subtitle, image: s.image }))),
      fetchCompanyNames().catch(() => COMPANIES),
    ]);
    return { profile, heroSlides, companies };
  },
  component: StudentDashboard,
});

function StudentDashboard() {
  const { profile, heroSlides, companies } = Route.useLoaderData();
  const [slide, setSlide] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studentName, setStudentName] = useState("");
  const [companyLogos, setCompanyLogos] = useState<any[]>([]);
  useEffect(() => {
    if (!slides.length) return;
    const i = setInterval(() => setSlide((s) => (s + 1) % slides.length), 3000);
    return () => clearInterval(i);
  }, [slides.length]);

  useEffect(() => {
  const loadUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);

    if (user?.email) {
      const { data } = await supabase
        .from("students")
        .select("name")
        .eq("department_email", user.email)
        .single();

      if (data) {
        setStudentName(data.name);
      }
    }
  };
  
  loadUser();
}, []);
useEffect(() => {
  const loadLogos = async () => {
    const { data } = await supabase
      .from("company_logos")
      .select("*")
      .order("company_name");

    setCompanyLogos(data || []);
  };

  loadLogos();
}, []);


  return (
    <PageTransition>
      <Toaster position="top-center" richColors />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <TopNav
  role="student"
  name={studentName || "Student"}
  avatarSeed={currentUser?.id ?? "student"}
/>

        {slides.length > 0 && (
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
                <img src={slides[slide].image} alt={slides[slide].title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                  <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl"
                  >
                    {slides[slide].title}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.6 }}
                    className="mt-3 max-w-2xl text-base text-white/90 sm:text-lg"
                  >
                    {slides[slide].subtitle}
                  </motion.p>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-4 right-6 z-10 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-white" : "w-2 bg-white/50"}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-10 overflow-hidden rounded-2xl glass py-5">
          <div className="flex w-max animate-marquee gap-12 px-6">
            {[...companyLogos, ...companyLogos].map((c, i) => (
  <div
  key={i}
className="flex h-20 w-44 items-center justify-center rounded-xl bg-white shadow-sm">
  <img
    src={c.logo_url}
    alt={c.company_name}
    className="max-h-12 max-w-32 object-contain"
  />
</div>
))}
          </div>
        </section>

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
            </p>
          </motion.div>
        </section>

        <DirectoryExplorer />
      </div>
      <Footer />
    </PageTransition>
  );
}
