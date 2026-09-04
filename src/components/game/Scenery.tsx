import bgScene from "@/assets/bg-scene.jpg";

/** Full-screen cartoon nature backdrop with a few animated decorations. */
export function Scenery({ animations = true }: { animations?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <img
        src={bgScene}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover saturate-[1.28] contrast-[1.08] brightness-[1.02]"
        width={1920}
        height={1200}
      />
      {/* Warm vivid sunny overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-400/15 via-orange-300/10 to-emerald-500/15" />

      {/* smiling sun */}
      <div
        className={`absolute right-[6%] top-[4%] text-6xl sm:text-7xl ${animations ? "animate-float-soft" : ""}`}
      >
        <span className="drop-shadow-[0_8px_16px_rgba(245,158,11,0.5)]">🌞</span>
      </div>

      {/* butterflies & friends */}
      <span
        className={`absolute left-[8%] top-[28%] text-3xl sm:text-4xl ${animations ? "animate-float-soft" : ""}`}
        style={{ animationDelay: "0.8s" }}
      >
        🦋
      </span>
      <span
        className={`absolute right-[18%] top-[38%] text-3xl ${animations ? "animate-float-soft" : ""}`}
        style={{ animationDelay: "1.6s" }}
      >
        🦋
      </span>
      <span className="absolute bottom-[3%] left-[4%] text-4xl sm:text-5xl">🦔</span>
      <span className="absolute bottom-[4%] right-[5%] text-4xl sm:text-5xl">🐰</span>
      <span className="absolute bottom-[2%] left-[38%] hidden text-3xl sm:block">🌷</span>
      <span className="absolute bottom-[6%] right-[32%] hidden text-3xl sm:block">🐦</span>
    </div>
  );
}
