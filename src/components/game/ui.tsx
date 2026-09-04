import type { ButtonHTMLAttributes, ReactNode } from "react";

const TONES: Record<string, string> = {
  leaf: "bg-leaf shadow-[inset_0_-5px_0_rgba(0,0,0,0.18),0_6px_14px_-6px_rgba(22,101,52,0.6)]",
  sky: "bg-sky-deep shadow-[inset_0_-5px_0_rgba(0,0,0,0.18),0_6px_14px_-6px_rgba(30,58,138,0.6)]",
  berry: "bg-berry shadow-[inset_0_-5px_0_rgba(0,0,0,0.18),0_6px_14px_-6px_rgba(159,18,57,0.6)]",
  grape: "bg-grape shadow-[inset_0_-5px_0_rgba(0,0,0,0.18),0_6px_14px_-6px_rgba(88,28,135,0.6)]",
  sun: "bg-sun-deep shadow-[inset_0_-5px_0_rgba(0,0,0,0.18),0_6px_14px_-6px_rgba(180,83,9,0.6)]",
  candy: "bg-candy shadow-[inset_0_-5px_0_rgba(0,0,0,0.18),0_6px_14px_-6px_rgba(190,24,93,0.6)]",
  orange:
    "bg-gradient-to-b from-amber-400 via-orange-500 to-orange-600 shadow-[inset_0_-5px_0_#9a3412,0_6px_14px_-6px_rgba(194,65,12,0.65)]",
  wood: "bg-gradient-to-b from-amber-400 via-orange-500 to-orange-600 shadow-[inset_0_-5px_0_#9a3412,0_6px_14px_-6px_rgba(194,65,12,0.65)]",
  grass:
    "bg-grass-deep shadow-[inset_0_-5px_0_rgba(0,0,0,0.18),0_6px_14px_-6px_rgba(20,83,45,0.6)]",
};

type ToyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: keyof typeof TONES | string;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
};

export function ToyButton({
  tone = "orange",
  size = "md",
  icon,
  children,
  className = "",
  ...rest
}: ToyButtonProps) {
  const sizes = {
    sm: "text-sm px-4 py-2",
    md: "text-base sm:text-lg px-5 py-2.5",
    lg: "text-lg sm:text-2xl px-6 py-3 sm:px-8 sm:py-4",
  };
  return (
    <button
      {...rest}
      className={`toy-button ${TONES[tone] ?? TONES.orange} ${sizes[size]} ${className}`}
    >
      {icon ? <span className="text-[1.25em] leading-none">{icon}</span> : null}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Geri"
      className="toy-button bg-gradient-to-b from-amber-400 via-orange-500 to-orange-600 h-12 w-12 shrink-0 p-0 text-2xl sm:h-14 sm:w-14 shadow-[inset_0_-5px_0_#9a3412,0_6px_14px_-6px_rgba(194,65,12,0.65)]"
    >
      ←
    </button>
  );
}

export function WoodTitle({ children }: { children: ReactNode }) {
  return (
    <div className="wood-panel min-w-0 px-4 py-2 sm:px-8 sm:py-3 shadow-lg">
      <h1 className="font-display truncate text-lg font-extrabold tracking-wide text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] sm:text-2xl">
        {children}
      </h1>
    </div>
  );
}

export function StarBadge({ count }: { count: number }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-full border-4 border-white/90 bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 px-3 py-1.5 shadow-[inset_0_-4px_0_#b45309,0_4px_12px_rgba(180,83,9,0.35)] sm:px-4">
      <span className="text-xl leading-none drop-shadow">⭐</span>
      <span className="font-display text-lg font-extrabold text-amber-950 sm:text-xl">{count}</span>
    </div>
  );
}

export function Stars({
  value,
  max = 3,
  size = "text-2xl",
}: {
  value: number;
  max?: number;
  size?: string;
}) {
  return (
    <div className={`flex items-center justify-center gap-0.5 ${size}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < value ? "" : "opacity-25 grayscale"}>
          ⭐
        </span>
      ))}
    </div>
  );
}
