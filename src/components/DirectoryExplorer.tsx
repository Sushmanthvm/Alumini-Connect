import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { GraduationCap, MapPin, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
// Batches 2005 .. 2023 (descending)
const BATCHES = Array.from({ length: 2023 - 2005 + 1 }, (_, i) => String(2023 - i));

type Degree = "B.Tech" | "M.Tech";

export function DirectoryExplorer({ heading = "Alumni Directory" }: { heading?: string }) {
  const [batches, setBatches] = useState<string[]>([]);
  const [showBatches, setShowBatches] = useState(false);
  const [batch, setBatch] = useState<string | null>(null);
  const [degree, setDegree] = useState<Degree | null>(null);
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
  const loadAlumni = async () => {
    const { data, error } = await supabase
      .from("alumni")
      .select("*");

    if (!error && data) {
      setAlumni(data);
    }

    setLoading(false);
  };

  loadAlumni();
}, []);
  const allowsBtech = batch !== null && Number(batch) >= 2021;
  const degreeOptions: Degree[] =
  allowsBtech
    ? ["B.Tech", "M.Tech"]
    : ["M.Tech"];

const filtered = useMemo(() => {
  if (!batch || !degree) return [];

  return alumni.filter(
    (a) =>
      String(a.batch_year) === batch &&
      a.degree === degree
  );
}, [batch, degree, alumni]);

  const selectBatch = (b: string) => {
    setBatch(b);
    setDegree(null);
  };

  return (
    <>
      <section className="mt-16 flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          {!showBatches && (
            <motion.div
              key="cap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 2.2, rotateX: -45, transition: { duration: 0.7, ease: "easeOut" } }}
              className="flex flex-col items-center"
            >
              <motion.p
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mb-6 text-lg font-medium text-muted-foreground sm:text-xl"
              >
                Click here to connect your future
              </motion.p>
              <motion.button
                onClick={() => setShowBatches(true)}
                whileHover={{ scale: 1.08, rotate: -4 }}
                whileTap={{ scale: 0.92 }}
                animate={{ y: [0, -8, 0] }}
                transition={{ y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }}
                className="relative grid h-40 w-40 place-items-center rounded-full gradient-bg-hero shadow-glow"
                aria-label="Reveal alumni batches"
              >
                <GraduationCap className="h-20 w-20 text-white drop-shadow-lg" strokeWidth={1.8} />
                <span className="absolute inset-0 -z-10 rounded-full gradient-bg-hero blur-2xl opacity-50" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBatches && (
            <motion.div
              key="batches"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col items-center gap-5"
            >
              <div className="glass rounded-3xl px-8 py-6 shadow-elegant">
                <p className="text-center text-sm font-medium text-muted-foreground">Choose an Alumni Batch</p>
                <div className="mt-4 flex max-h-[340px] flex-col items-stretch gap-2 overflow-y-auto pr-1 min-w-[240px]">
                  {batches.map((b, i) => {
                    const active = batch === b;
                    return (
                      <motion.button
                        key={b}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.03 }}
                        whileHover={{ scale: 1.03, x: 4 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => selectBatch(b)}
                        className={`rounded-2xl px-6 py-2.5 text-left font-semibold transition-all ${
                          active
                            ? "gradient-bg-hero text-primary-foreground shadow-glow"
                            : "glass text-foreground hover:shadow-elegant"
                        }`}
                      >
                        Batch of {b}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence>
                {batch && (
                  <motion.div
                    key={`degree-${batch}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="glass rounded-2xl px-6 py-4 shadow-elegant"
                  >
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Select Degree Program
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {degreeOptions.map((d) => {
                        const active = degree === d;
                        return (
                          <motion.button
                            key={d}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setDegree(d)}
                            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                              active
                                ? "gradient-bg-hero text-primary-foreground shadow-glow"
                                : "border border-primary/30 text-primary hover:bg-primary/5"
                            }`}
                          >
                            {d}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {batch && degree && (
          <motion.div
            key={`${batch}-${degree}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mt-12 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
                <p className="text-sm text-muted-foreground">
                  Batch of {batch} · {degree} · {loading ? "…" : `${filtered.length} mentors`}
                </p>
              </div>
            </div>

            {loading ? (
              <p className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading alumni…
              </p>
            ) : filtered.length === 0 ? (
              <p className="mt-8 text-center text-muted-foreground">
                No alumni in the directory for this batch yet. Alumni can register and appear here.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 perspective-1000">
                {filtered.map((a, idx) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, rotateX: 90, y: 30 }}
                    animate={{ opacity: 1, rotateX: 0, y: 0 }}
                    transition={{ delay: idx * 0.1, type: "spring", stiffness: 120, damping: 12, bounce: 0.5 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    style={{ transformOrigin: "bottom center" }}
                    className="group relative rounded-2xl"
                  >
                    <span className="pointer-events-none absolute -inset-[2px] rounded-2xl gradient-bg-hero opacity-0 blur transition-opacity duration-500 group-hover:opacity-70 group-hover:animate-pulse" />
                    <Link to="/directory/$id" params={{ id: a.id }} className="relative block h-full">
                      <div className="glass relative h-full rounded-2xl p-5 transition-shadow duration-300 group-hover:shadow-glow">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 overflow-hidden rounded-2xl bg-muted ring-2 ring-white">
                            <img
  src={
    a.avatar_path ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.name}`
  }
  alt={a.name}
  className="h-full w-full"
/>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold">{a.name}</h3>
                            <p className="truncate text-sm text-muted-foreground">
  {a.current_job_role}
</p>
<p className="truncate text-xs text-muted-foreground">
  {a.degree} • Batch {a.batch_year}
</p>
                            <p className="truncate text-sm font-medium text-primary">{a.current_company}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {a.location}
                          </span>
                          <span className="inline-flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                            View <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
