import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const FOOTER_QUOTES = [
  "Empowering the next generation.",
  "Your network is your net worth.",
  "Mentorship: the shortcut nobody talks about.",
  "Behind every great career is a community that believed first.",
  "One conversation can change a lifetime.",
];

export function Footer() {
  const [quote, setQuote] = useState(FOOTER_QUOTES[0]);

  useEffect(() => {
    setQuote(FOOTER_QUOTES[Math.floor(Math.random() * FOOTER_QUOTES.length)]);
    const i = setInterval(() => {
      setQuote(FOOTER_QUOTES[Math.floor(Math.random() * FOOTER_QUOTES.length)]);
    }, 5000);
    return () => clearInterval(i);
  }, []);

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/30 bg-gradient-to-b from-transparent to-primary/5">
      <div className="relative mx-auto max-w-7xl px-4 py-16">
        {/* Marquee background typography */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none overflow-hidden"
        >
          <div className="flex w-max animate-marquee gap-16 whitespace-nowrap">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="gradient-text text-[18vw] font-black leading-none tracking-tighter opacity-20 sm:text-[14vw]"
              >
                ALUMNI CONNECT ·
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <motion.p
            key={quote}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass rounded-full px-5 py-2 text-sm italic text-muted-foreground shadow-elegant"
          >
            "{quote}"
          </motion.p>

          <p className="font-sans text-base font-medium tracking-wide text-foreground/80">
            Developed by Students
          </p>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Alumni Connect · Bridging students & alumni.
          </p>
        </div>
      </div>
    </footer>
  );
}
