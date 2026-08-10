import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MapPin, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { fetchAlumniDirectory, fetchGraduationBatchYears } from "@/lib/api/alumni";
import type { AlumniCard } from "@/lib/types";

type Degree = "B.Tech" | "M.Tech";

export function DirectoryExplorer({
  heading = "Alumni Directory",
  onDirectoryActiveChange,
}: {
  heading?: string;
  /** Fired when both batch and degree are selected (directory view) or cleared. */
  onDirectoryActiveChange?: (active: boolean) => void;
  /** @deprecated Batches are always visible; kept so existing call sites compile. */
  openRequest?: number;
}) {
  const [batches, setBatches] = useState<string[]>([]);
  const [batch, setBatch] = useState<string | null>(null);
  const [degree, setDegree] = useState<Degree | null>(null);
  const [filtered, setFiltered] = useState<AlumniCard[]>([]);
  const [loading, setLoading] = useState(false);

  const browsing = Boolean(batch && degree);

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

  useEffect(() => {
    onDirectoryActiveChange?.(browsing);
  }, [browsing, onDirectoryActiveChange]);

const filtered = useMemo(() => {
  if (!batch || !degree) return [];

  return alumni.filter(
    (a) =>
      String(a.batch_year) === batch &&
      a.degree === degree
  );
}, [batch, degree, alumni]);

  const selectBatch = (b: string) => {
    if (batch === b) {
      setBatch(null);
      setDegree(null);
      return;
    }
    setBatch(b);
    setDegree(null);
  };

  const resetSelection = () => {
    setBatch(null);
    setDegree(null);
  };

  return (
    <>
      {/* Batch + degree picker — hidden once both are chosen */}
      <AnimatePresence>
        {!browsing && (
          <motion.section
            key="batch-picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="mt-14 flex flex-col items-start text-left"
          >
            <h3 className="text-base font-medium text-[#3D5C52] sm:text-lg">Choose a batch to connect</h3>

            <div
              className="mt-4 flex w-full flex-wrap items-center gap-3"
              role="listbox"
              aria-label="Alumni batches"
            >
              {batches.map((b, i) => {
                const active = batch === b;
                const degreesForBatch: Degree[] =
                  Number(b) >= 2021 ? ["B.tech CYS", "M.tech CYS"] : ["M.tech CYS"];

                if (active) {
                  return (
                    <motion.div
                      key={b}
                      layout
                      initial={{ opacity: 0.85 }}
                      animate={{ opacity: 1 }}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-[12px] border border-[#0F6E56]/20 bg-[#FFFDF8]/90 py-1.5 pl-1.5 pr-2 shadow-elegant"
                      aria-label={`Batch of ${b} — select a degree`}
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected
                        aria-expanded
                        onClick={() => selectBatch(b)}
                        className="lift-hover shrink-0 rounded-[10px] bg-[#0F6E56] px-5 py-2.5 text-sm font-semibold text-[#FAF6EE] shadow-elegant"
                      >
                        Batch of {b}
                      </button>

                      <InlineConnector branched={degreesForBatch.length > 1} />

                      <div
                        className={`flex shrink-0 ${
                          degreesForBatch.length > 1 ? "flex-col gap-1.5" : "flex-row"
                        }`}
                      >
                        {degreesForBatch.map((d) => (
                          <motion.button
                            key={d}
                            type="button"
                            initial={{ opacity: 0, x: 6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setDegree(d)}
                            className="lift-hover whitespace-nowrap rounded-full border-2 border-[#04342C]/60 bg-white px-4 py-1.5 text-xs font-semibold text-[#04342C] hover:border-[#0F6E56] hover:bg-[#0F6E56]/05 sm:px-5 sm:py-2 sm:text-sm"
                          >
                            {d}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.button
                    key={b}
                    type="button"
                    role="option"
                    aria-selected={false}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectBatch(b)}
                    className="lift-hover rounded-[10px] border border-[#0F6E56]/25 bg-transparent px-5 py-2.5 text-sm font-semibold text-[#04342C] hover:border-[#0F6E56]/50 hover:bg-[#0F6E56]/05"
                  >
                    Batch of {b}
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Directory results — only view once batch + degree are set */}
      <AnimatePresence>
        {browsing && batch && degree && (
          <motion.div
            key={`${batch}-${degree}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-8"
          >
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#04342C]">{heading}</h2>
                <p className="text-sm text-muted-foreground">
                  Batch of {batch} · {degree} · {loading ? "…" : `${filtered.length} mentors`}
                </p>
              </div>
              <button
                type="button"
                onClick={resetSelection}
                className="lift-hover inline-flex items-center gap-1.5 rounded-[10px] border border-[#0F6E56]/25 px-4 py-2 text-sm font-medium text-[#0F6E56] hover:bg-[#0F6E56]/05"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change batch
              </button>
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
              <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 perspective-1000">
                {filtered.map((a, idx) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, rotateX: 90, y: 30 }}
                    animate={{ opacity: 1, rotateX: 0, y: 0 }}
                    transition={{ delay: idx * 0.1, type: "spring", stiffness: 120, damping: 12, bounce: 0.5 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    style={{ transformOrigin: "bottom center" }}
                    className="group relative rounded-[12px]"
                  >
                    <span className="pointer-events-none absolute -inset-[2px] rounded-[12px] gradient-bg-hero opacity-0 blur transition-opacity duration-500 group-hover:opacity-70 group-hover:animate-pulse" />
                    <Link to="/directory/$id" params={{ id: a.id }} className="relative block h-full">
                      <div className="glass relative h-full rounded-[12px] p-5 transition-shadow duration-300 group-hover:shadow-glow">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 overflow-hidden rounded-[12px] bg-muted ring-2 ring-white">
                            <img src={a.photo} alt={a.name} className="h-full w-full object-cover" />
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

function InlineConnector({ branched }: { branched: boolean }) {
  const stroke = "#04342C";

  if (!branched) {
    return (
      <svg className="h-4 w-8 shrink-0" viewBox="0 0 32 16" fill="none" aria-hidden>
        <path d="M0 8 H24" stroke={stroke} strokeWidth="1.5" />
        <polygon points="32,8 24,4.5 24,11.5" fill={stroke} />
      </svg>
    );
  }

  return (
    <svg className="h-14 w-10 shrink-0 sm:h-16 sm:w-12" viewBox="0 0 48 64" fill="none" aria-hidden>
      <path d="M0 32 H14" stroke={stroke} strokeWidth="1.5" />
      <path d="M14 32 C24 32, 26 16, 40 16" stroke={stroke} strokeWidth="1.5" />
      <path d="M14 32 C24 32, 26 48, 40 48" stroke={stroke} strokeWidth="1.5" />
      <polygon points="48,16 40,12.5 40,19.5" fill={stroke} />
      <polygon points="48,48 40,44.5 40,51.5" fill={stroke} />
    </svg>
  );
}
