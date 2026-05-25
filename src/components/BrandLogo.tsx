import { motion } from "framer-motion";

/** Combined academic book + graduation cap mark. */
export function BrandLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <motion.div
      className={`relative grid place-items-center ${className}`}
      animate={{ scale: [1, 1.06, 1], rotate: [0, -2, 2, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Pulsing glow */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-xl gradient-bg-hero blur-md"
        animate={{ opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg
        viewBox="0 0 48 48"
        className="relative h-full w-full text-primary-foreground drop-shadow"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="brandGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary-glow)" />
          </linearGradient>
        </defs>
        {/* Rounded background */}
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#brandGrad)" />
        {/* Book base */}
        <path
          d="M11 30c4-2 9-2 13 0 4-2 9-2 13 0v6c-4-2-9-2-13 0-4-2-9-2-13 0v-6Z"
          fill="white"
          opacity="0.95"
        />
        <path d="M24 30v6" stroke="var(--primary)" strokeWidth="1.2" />
        {/* Graduation cap */}
        <path
          d="M24 10 8 17l16 7 16-7-16-7Z"
          fill="white"
        />
        <path
          d="M14 20.5V26c0 1.5 4.5 3.5 10 3.5S34 27.5 34 26v-5.5"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tassel */}
        <path d="M39 17v6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="39" cy="24.5" r="1.4" fill="white" />
      </svg>
    </motion.div>
  );
}
