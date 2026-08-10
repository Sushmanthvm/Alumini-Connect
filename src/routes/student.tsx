import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { IconMessageCircle2, IconBriefcase } from "@tabler/icons-react";
import { TopNav } from "@/components/TopNav";
import { PageTransition } from "@/components/PageTransition";
import { Footer } from "@/components/Footer";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { Toaster } from "sonner";
import { requireAuth } from "@/lib/route-guards";
import { fetchCompanyNames } from "@/lib/api/content";
import { COMPANIES } from "@/lib/mock-data";

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
    const companies = await fetchCompanyNames().catch(() => COMPANIES);
    return { profile, companies };
  },
  component: StudentDashboard,
});

const STATS = [
  { value: "89%", label: "placed within 6 months" },
  { value: "2,400+", label: "alumni mentors" },
  { value: "340+", label: "companies represented" },
] as const;

const FEATURES = [
  {
    title: "1:1 mentorship",
    description: "Book a call with an alum in your target role.",
    icon: IconMessageCircle2,
    tone: "teal" as const,
  },
  {
    title: "Referral requests",
    description: "One tap to ask for a referral at their company.",
    icon: IconBriefcase,
    tone: "amber" as const,
  },
] as const;

function StudentDashboard() {
  const { profile, companies } = Route.useLoaderData();
  const batchSectionRef = useRef<HTMLDivElement>(null);
  const [directoryActive, setDirectoryActive] = useState(false);

  const onDirectoryActiveChange = useCallback((active: boolean) => {
    setDirectoryActive(active);
    if (active) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const goToBatches = () => {
    batchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

        {!directoryActive && (
          <>
            {/* Hero — deep teal bookend */}
            <section className="relative mt-8 overflow-hidden rounded-[12px] shadow-glow gradient-bg-hero">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 60% at 85% 20%, rgb(250 199 117 / 0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 10% 90%, rgb(20 143 110 / 0.45), transparent 50%)",
                }}
              />
              <div className="relative flex min-h-[360px] flex-col justify-center px-8 py-12 sm:min-h-[420px] sm:px-12 sm:py-16">
                <motion.span
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="mb-5 inline-flex w-fit items-center rounded-full bg-[#FAC775] px-3.5 py-1 text-xs font-semibold tracking-wide text-[#04342C] shadow-sm"
                >
                  2,400+ alumni ready to help
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.5 }}
                  className="max-w-2xl text-3xl font-extrabold tracking-tight text-[#FAF6EE] sm:text-5xl"
                >
                  Alumni Connect
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, duration: 0.5 }}
                  className="mt-4 max-w-xl text-base text-[#FAEEDA]/90 sm:text-lg"
                >
                  Find mentors, ask for referrals, and build the network that turns ambition into a career.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24, duration: 0.5 }}
                  className="mt-8 flex flex-wrap gap-3"
                >
                  <button
                    type="button"
                    onClick={goToBatches}
                    className="lift-hover inline-flex items-center justify-center rounded-[12px] bg-[#EF9F27] px-6 py-3 text-sm font-semibold text-[#04342C] shadow-elegant hover:bg-[#FAC775]"
                  >
                    Find a mentor
                  </button>
                  <button
                    type="button"
                    onClick={goToBatches}
                    className="lift-hover inline-flex items-center justify-center rounded-[12px] border-2 border-[#FAEEDA]/80 bg-transparent px-6 py-3 text-sm font-semibold text-[#FAF6EE] hover:border-[#FAC775] hover:bg-white/5"
                  >
                    Browse batches
                  </button>
                </motion.div>
              </div>
            </section>

            {/* Stats bar */}
            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                  className="rounded-[12px] border border-[#0F6E56]/15 bg-[#FFFDF8] px-5 py-6 shadow-elegant"
                >
                  <p className="text-3xl font-extrabold tracking-tight text-[#0F6E56] sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-[#3D5C52]">{stat.label}</p>
                </motion.div>
              ))}
            </section>

            {/* Company logos strip */}
            <section className="mt-8 overflow-hidden rounded-[12px] border border-[#0F6E56]/10 bg-[#FFFDF8]/80 py-5">
              <div className="flex w-max animate-marquee gap-12 px-6">
                {[...companies, ...companies].map((c, i) => (
                  <span
                    key={i}
                    className="whitespace-nowrap text-2xl font-bold tracking-tight text-[#0F6E56]/45 transition-colors hover:text-[#0F6E56]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </section>

            {/* Why Alumni Connect */}
            <section className="mt-14">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mb-8 text-center"
              >
                <h2 className="text-3xl font-extrabold tracking-tight text-[#04342C] sm:text-4xl">
                  Why Alumni Connect
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-[#3D5C52] sm:text-base">
                  Two ways to turn your network into real opportunity.
                </p>
              </motion.div>

              <div className="grid gap-5 sm:grid-cols-2">
                {FEATURES.map((feature, i) => {
                  const Icon = feature.icon;
                  const isTeal = feature.tone === "teal";
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.45 }}
                      className={`rounded-[12px] border p-7 sm:p-8 ${
                        isTeal
                          ? "border-[#0F6E56]/15 bg-[#E8F5F0] text-[#0F6E56]"
                          : "border-[#D4A574]/25 bg-[#F5E6D3] text-[#6B4423]"
                      }`}
                    >
                      <div className="mb-4">
                        <Icon className="h-6 w-6" stroke={1.5} />
                      </div>
                      <h3 className="text-lg font-bold">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed opacity-90">{feature.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        <div ref={batchSectionRef} id="batch-explorer">
          <DirectoryExplorer onDirectoryActiveChange={onDirectoryActiveChange} />
        </div>
      </div>
      <Footer />
    </PageTransition>
  );
}
