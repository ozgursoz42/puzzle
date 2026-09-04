import { useEffect, useMemo, useState } from "react";
import {
  ACHIEVEMENTS,
  CATEGORIES,
  STICKERS,
  findCategory,
  getGridForDifficulty,
  getPieceCount,
  type Category,
  type Difficulty,
  type Puzzle,
} from "@/game/data";
import {
  categoryProgress,
  completedCount,
  getPuzzleStars,
  isUnlocked,
  totalStars,
  useGameState,
} from "@/game/store";
import { sfx, startMusic, stopMusic } from "@/game/sound";
import { PuzzleBoard } from "./PuzzleBoard";
import { Scenery } from "./Scenery";
import { BackButton, StarBadge, Stars, ToyButton, WoodTitle } from "./ui";

type Screen =
  | { name: "menu" }
  | { name: "categories" }
  | { name: "puzzles"; categoryId: string }
  | { name: "play"; categoryId: string; puzzleIndex: number }
  | { name: "achievements" }
  | { name: "settings" };

const DIFFICULTY_LABEL: Record<Difficulty, { label: string; sub: string; emoji: string }> = {
  easy: { label: "Kolay", sub: "2 Parça", emoji: "👶" },
  normal: { label: "Normal", sub: "4-12 Parça", emoji: "🧩" },
  hard: { label: "Zor", sub: "16+ Parça", emoji: "⭐" },
};

function DifficultyTabs({
  current,
  onChange,
}: {
  current: Difficulty;
  onChange: (d: Difficulty) => void;
}) {
  const options: Difficulty[] = ["easy", "normal", "hard"];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {options.map((opt) => {
        const active = current === opt;
        const info = DIFFICULTY_LABEL[opt];
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-display text-xs font-extrabold transition-all shadow-md active:translate-y-0.5 sm:text-sm ${
              active
                ? "scale-105 bg-gradient-to-b from-amber-400 via-orange-500 to-orange-600 text-white shadow-orange-900/30 ring-2 ring-white"
                : "bg-white/95 text-amber-950 hover:bg-white hover:text-orange-600 hover:scale-102"
            }`}
          >
            <span>{info.emoji}</span>
            <span>{info.label}</span>
            <span className={`text-[11px] ${active ? "text-amber-100" : "text-orange-700/80"}`}>
              ({info.sub})
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function GameApp() {
  const { state, hydrated, recordResult, unlockSticker, setSettings } = useGameState();
  const [screen, setScreen] = useState<Screen>({ name: "menu" });
  const [result, setResult] = useState<{ stars: number; newBadges: string[] } | null>(null);
  const [round, setRound] = useState(0);

  const soundOn = state.settings.sfx;
  const animations = state.settings.animations;
  const currentDiff = state.settings.difficulty;
  const stars = totalStars(state, currentDiff);
  const allStars = totalStars(state);

  useEffect(() => {
    if (state.settings.music) startMusic();
    else stopMusic();
    return () => stopMusic();
  }, [state.settings.music]);

  const go = (s: Screen) => {
    sfx.click(soundOn);
    setResult(null);
    setScreen(s);
  };

  const handleDifficultyChange = (d: Difficulty) => {
    sfx.click(soundOn);
    setSettings({ difficulty: d });
  };

  const activePuzzle: { puzzle: Puzzle; cols: number; rows: number } | null = useMemo(() => {
    if (screen.name !== "play") return null;
    const cat = findCategory(screen.categoryId);
    const p = cat?.puzzles[screen.puzzleIndex];
    if (!p) return null;
    const [cols, rows] = getGridForDifficulty(screen.puzzleIndex, currentDiff);
    return { puzzle: p, cols, rows };
  }, [screen, currentDiff]);

  if (!hydrated) {
    return (
      <main className="grid min-h-screen place-items-center">
        <Scenery animations={false} />
        <div className="cream-panel px-8 py-6 font-display text-2xl text-wood-dark">
          Yükleniyor… 🧩
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-6">
      <Scenery animations={animations} />

      {screen.name === "menu" && (
        <Menu
          stars={stars}
          allStars={allStars}
          difficulty={currentDiff}
          onDifficultyChange={handleDifficultyChange}
          onGo={go}
          state={state}
        />
      )}

      {screen.name === "categories" && (
        <Categories
          stars={stars}
          difficulty={currentDiff}
          onDifficultyChange={handleDifficultyChange}
          onBack={() => go({ name: "menu" })}
          onPick={(id) => go({ name: "puzzles", categoryId: id })}
          progressOf={(id) => categoryProgress(state, id, currentDiff)}
        />
      )}

      {screen.name === "puzzles" && (
        <PuzzleList
          categoryId={screen.categoryId}
          stars={stars}
          difficulty={currentDiff}
          onDifficultyChange={handleDifficultyChange}
          starsOf={(pid) => getPuzzleStars(state, pid, currentDiff)}
          unlocked={(i) => isUnlocked(state, screen.categoryId, i, currentDiff)}
          onBack={() => go({ name: "categories" })}
          onPick={(i) => {
            setRound((r) => r + 1);
            go({ name: "play", categoryId: screen.categoryId, puzzleIndex: i });
          }}
        />
      )}

      {screen.name === "play" && activePuzzle && (
        <PlayScreen
          key={`${activePuzzle.puzzle.id}-${round}-${currentDiff}`}
          categoryId={screen.categoryId}
          puzzleIndex={screen.puzzleIndex}
          puzzle={activePuzzle.puzzle}
          cols={activePuzzle.cols}
          rows={activePuzzle.rows}
          stars={stars}
          difficulty={currentDiff}
          animations={animations}
          soundOn={soundOn}
          result={result}
          onCloseResult={() => setResult(null)}
          onBack={() => go({ name: "puzzles", categoryId: screen.categoryId })}
          onComplete={(s) => {
            const newBadges = recordResult(activePuzzle.puzzle.id, s, currentDiff);
            if (newBadges.length) sfx.badge(soundOn);
            setResult({ stars: s, newBadges });
          }}
          onNext={() => {
            const cat = findCategory(screen.categoryId);
            const next = screen.puzzleIndex + 1;
            if (cat && next < cat.puzzles.length) {
              setRound((r) => r + 1);
              go({ name: "play", categoryId: screen.categoryId, puzzleIndex: next });
            } else {
              go({ name: "puzzles", categoryId: screen.categoryId });
            }
          }}
        />
      )}

      {screen.name === "achievements" && (
        <Achievements
          stars={allStars}
          badges={state.badges}
          done={completedCount(state)}
          unlockedStickers={state.unlockedStickers}
          onUnlock={(id) => {
            sfx.badge(soundOn);
            unlockSticker(id);
          }}
          onBack={() => go({ name: "menu" })}
        />
      )}

      {screen.name === "settings" && (
        <Settings
          stars={stars}
          settings={state.settings}
          onChange={(patch) => {
            sfx.click(soundOn);
            setSettings(patch);
          }}
          onBack={() => go({ name: "menu" })}
        />
      )}
    </main>
  );
}

/* ---------------- Screens ---------------- */

function TopBar({
  title,
  stars,
  onBack,
  children,
}: {
  title: string;
  stars: number;
  onBack?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <header className="mx-auto mb-3 max-w-6xl">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-4">
        {onBack ? <BackButton onClick={onBack} /> : <span />}
        <div className="flex min-w-0 justify-center">
          <WoodTitle>{title}</WoodTitle>
        </div>
        <StarBadge count={stars} />
      </div>
      {children ? <div className="mt-2 flex justify-center">{children}</div> : null}
    </header>
  );
}

function Menu({
  stars,
  allStars,
  difficulty,
  onDifficultyChange,
  onGo,
  state,
}: {
  stars: number;
  allStars: number;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onGo: (s: Screen) => void;
  state: ReturnType<typeof useGameState>["state"];
}) {
  const diffDone = completedCount(state, difficulty);
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 py-3 text-center sm:gap-6 sm:py-4">
      <div className="flex w-full justify-end">
        <StarBadge count={stars} />
      </div>

      <div className="wood-panel animate-pop-in px-5 py-4 sm:px-10 sm:py-6">
        <p className="font-display text-sm font-extrabold tracking-widest text-amber-100 sm:text-base">
          ÇOCUKLAR İÇİN
        </p>
        <h1 className="font-display text-4xl font-extrabold leading-none text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.4)] sm:text-6xl">
          PUZZLE
        </h1>
        <h2 className="font-display text-2xl font-extrabold tracking-wide text-amber-300 drop-shadow-[0_3px_0_rgba(180,83,9,0.7)] sm:text-4xl">
          MACERASI
        </h2>
      </div>

      {/* Difficulty Selector */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="font-display text-xs font-black tracking-wider text-amber-200 drop-shadow-sm">
          ZORLUK SEVİYESİ SEÇ:
        </span>
        <DifficultyTabs current={difficulty} onChange={onDifficultyChange} />
      </div>

      <div className="grid w-full max-w-sm gap-3 sm:max-w-md">
        <ToyButton tone="leaf" size="lg" icon="▶️" onClick={() => onGo({ name: "categories" })}>
          OYNA
        </ToyButton>
        <ToyButton tone="sky" size="lg" icon="🧩" onClick={() => onGo({ name: "categories" })}>
          BÖLÜMLER
        </ToyButton>
        <ToyButton tone="berry" size="lg" icon="⭐" onClick={() => onGo({ name: "achievements" })}>
          KAZANIMLAR
        </ToyButton>
        <ToyButton tone="grape" size="lg" icon="⚙️" onClick={() => onGo({ name: "settings" })}>
          AYARLAR
        </ToyButton>
      </div>

      <div className="cream-panel flex max-w-md items-center gap-3 px-4 py-3 text-left">
        <span className="text-4xl">🦔</span>
        <p className="font-display text-sm font-bold text-amber-950 sm:text-base">
          {DIFFICULTY_LABEL[difficulty].label} seviyesinde {diffDone} puzzle tamamladın. Toplam{" "}
          {allStars} yıldızın var!
        </p>
      </div>
    </div>
  );
}

function Categories({
  stars,
  difficulty,
  onDifficultyChange,
  onBack,
  onPick,
  progressOf,
}: {
  stars: number;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onBack: () => void;
  onPick: (id: string) => void;
  progressOf: (id: string) => { done: number; total: number; stars: number };
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <TopBar title="BÖLÜMLER" stars={stars} onBack={onBack}>
        <DifficultyTabs current={difficulty} onChange={onDifficultyChange} />
      </TopBar>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c: Category) => {
          const p = progressOf(c.id);
          return (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              className="wood-panel group p-2 text-left transition-transform hover:-translate-y-1 active:translate-y-0.5"
            >
              <div className="overflow-hidden rounded-xl border-2 border-white/80 shadow-xs">
                <img
                  src={c.cover}
                  alt={c.name}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-40"
                />
              </div>
              <div className="mt-2 rounded-xl bg-white/95 px-3 py-2 shadow-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-2xl">{c.emoji}</span>
                  <span className="font-display truncate text-base font-extrabold text-amber-950 sm:text-lg">
                    {c.name.toLocaleUpperCase("tr-TR")}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-display text-sm font-extrabold text-orange-600">
                    {p.done} / {p.total} Tamamlandı
                  </span>
                  <span className="text-base">
                    {"⭐".repeat(Math.min(3, Math.ceil(p.stars / 3))) || "☆"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PuzzleList({
  categoryId,
  stars,
  difficulty,
  onDifficultyChange,
  starsOf,
  unlocked,
  onBack,
  onPick,
}: {
  categoryId: string;
  stars: number;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  starsOf: (id: string) => number;
  unlocked: (i: number) => boolean;
  onBack: () => void;
  onPick: (i: number) => void;
}) {
  const cat = findCategory(categoryId);
  if (!cat) return null;
  return (
    <div className="mx-auto max-w-6xl">
      <TopBar title={cat.name.toLocaleUpperCase("tr-TR")} stars={stars} onBack={onBack}>
        <DifficultyTabs current={difficulty} onChange={onDifficultyChange} />
      </TopBar>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cat.puzzles.map((p, i) => {
          const open = unlocked(i);
          const s = starsOf(p.id);
          const grid = getGridForDifficulty(i, difficulty);
          const pieces = getPieceCount(grid);
          return (
            <button
              key={p.id}
              disabled={!open}
              onClick={() => onPick(i)}
              className={`wood-panel p-2 text-left transition-transform ${
                open ? "hover:-translate-y-1 active:translate-y-0.5" : "opacity-70"
              }`}
            >
              <div className="relative overflow-hidden rounded-xl border-2 border-white/80 shadow-xs">
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className={`h-24 w-full object-cover sm:h-32 ${open ? "" : "grayscale"}`}
                />
                {!open ? (
                  <div className="absolute inset-0 grid place-items-center bg-orange-950/65 text-3xl">
                    🔒
                  </div>
                ) : null}
              </div>
              <div className="mt-2 rounded-xl bg-white/95 px-2 py-1.5 shadow-xs">
                <div className="font-display truncate text-sm font-extrabold text-amber-950 sm:text-base">
                  {p.title}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-extrabold text-orange-600">
                    {pieces} parça
                  </span>
                  <Stars value={s} size="text-sm" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Confetti() {
  const bits = Array.from({ length: 40 }, (_, i) => i);
  const colors = ["#ffd23f", "#ff6f91", "#4ec3f7", "#7bd66c", "#b98cf0", "#ff9f45"];
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {bits.map((i) => (
        <span
          key={i}
          className="absolute block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 2.5) % 100}%`,
            backgroundColor: colors[i % colors.length],
            animation: `confetti-fall ${2 + (i % 5) * 0.4}s linear ${(i % 10) * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function PlayScreen({
  categoryId,
  puzzleIndex,
  puzzle,
  cols,
  rows,
  stars,
  difficulty,
  animations,
  soundOn,
  result,
  onCloseResult,
  onBack,
  onComplete,
  onNext,
}: {
  categoryId: string;
  puzzleIndex: number;
  puzzle: Puzzle;
  cols: number;
  rows: number;
  stars: number;
  difficulty: Difficulty;
  animations: boolean;
  soundOn: boolean;
  result: { stars: number; newBadges: string[] } | null;
  onCloseResult: () => void;
  onBack: () => void;
  onComplete: (stars: number) => void;
  onNext: () => void;
}) {
  const cat = findCategory(categoryId);
  const hasNext = Boolean(cat && puzzleIndex + 1 < cat.puzzles.length);

  return (
    <div className="mx-auto max-w-6xl">
      <TopBar title={puzzle.title.toLocaleUpperCase("tr-TR")} stars={stars} onBack={onBack}>
        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-200">
          <span>Seviye: {DIFFICULTY_LABEL[difficulty].label}</span>
          <span>•</span>
          <span>{cols * rows} Parça</span>
        </div>
      </TopBar>
      <PuzzleBoard
        puzzle={puzzle}
        cols={cols}
        rows={rows}
        animations={animations}
        soundOn={soundOn}
        onComplete={onComplete}
      />

      {/* Victory Modal with click-outside-to-close */}
      {result ? (
        <>
          {animations ? <Confetti /> : null}
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-orange-950/70 p-4 backdrop-blur-xs transition-opacity"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onCloseResult();
              }
            }}
          >
            <div
              className="wood-panel animate-pop-in relative w-full max-w-md p-5 text-center shadow-2xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Optional close 'x' on top corner */}
              <button
                type="button"
                onClick={onCloseResult}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-orange-900/60 text-lg font-black text-amber-100 hover:bg-orange-800 hover:text-white"
                aria-label="Kapat"
              >
                ✕
              </button>

              <img
                src={puzzle.image}
                alt={puzzle.title}
                width={1024}
                height={768}
                className="mx-auto h-36 w-full rounded-2xl border-4 border-white/90 object-cover shadow-md sm:h-44"
              />
              <h2 className="font-display mt-3 text-3xl font-extrabold text-white drop-shadow-[0_3px_0_rgba(180,83,9,0.7)] sm:text-4xl">
                HARİKA! 🎉
              </h2>
              <p className="font-display text-base font-extrabold text-amber-100 sm:text-lg">
                Resmi başarıyla tamamladın!
              </p>
              <div className={`my-2 ${animations ? "animate-pop-in" : ""}`}>
                <Stars value={result.stars} size="text-4xl sm:text-5xl" />
              </div>

              {result.newBadges.length ? (
                <p className="font-display mb-3 text-sm font-extrabold text-amber-200">
                  Yeni rozet kazandın! 🏆
                </p>
              ) : null}

              {/* Redesigned modal buttons based on user requirements:
                  - Tekrar ve Bölümler butonları KALDIRILDI.
                  - Sadece geniş ve büyük şekilde SONRAKİ butonu.
                  - Tüm bölümler oynandıysa: "Tebrikler tüm bölümleri tamamladınız" ve KAPAT butonu.
              */}
              <div className="mt-4">
                {hasNext ? (
                  <ToyButton
                    tone="leaf"
                    size="lg"
                    icon="➡️"
                    className="w-full py-3.5 text-lg font-black tracking-wide sm:text-xl"
                    onClick={onNext}
                  >
                    SONRAKİ BÖLÜM
                  </ToyButton>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-100/95 p-3 text-center shadow-xs">
                      <div className="text-3xl">🏆🎉</div>
                      <div className="font-display text-base font-black text-amber-950 sm:text-lg">
                        Tebrikler, tüm bölümleri tamamladınız!
                      </div>
                      <p className="text-xs font-extrabold text-amber-800">
                        Bu kategorideki bütün puzzle&apos;ları bitirdin!
                      </p>
                    </div>
                    <ToyButton
                      tone="orange"
                      size="lg"
                      icon="✕"
                      className="w-full py-3.5 text-lg font-black tracking-wide sm:text-xl"
                      onClick={onCloseResult}
                    >
                      KAPAT
                    </ToyButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Achievements({
  stars,
  badges,
  done,
  unlockedStickers,
  onUnlock,
  onBack,
}: {
  stars: number;
  badges: string[];
  done: number;
  unlockedStickers: string[];
  onUnlock: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <TopBar title="KAZANIMLAR" stars={stars} onBack={onBack} />

      <div className="cream-panel mb-4 px-4 py-3 text-center font-display text-base font-extrabold text-amber-950 sm:text-lg">
        {done} puzzle tamamlandı · {stars} yıldız toplandı
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACHIEVEMENTS.map((a) => {
          const earned = badges.includes(a.id);
          return (
            <div
              key={a.id}
              className={`cream-panel p-3 text-center ${earned ? "" : "opacity-60 grayscale"}`}
            >
              <div className="text-4xl">{a.icon}</div>
              <div className="font-display text-sm font-extrabold text-amber-950 sm:text-base">
                {a.title}
              </div>
              <div className="text-xs font-extrabold text-orange-600">
                {earned ? "Kazanıldı!" : a.desc}
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="font-display mt-6 text-center text-xl font-extrabold text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] sm:text-2xl">
        ÇIKARTMA DÜKKANI
      </h3>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {STICKERS.map((s) => {
          const owned = unlockedStickers.includes(s.id);
          const affordable = stars >= s.cost;
          return (
            <div key={s.id} className="cream-panel p-3 text-center">
              <div className={`text-4xl ${owned ? "" : "opacity-60 grayscale"}`}>{s.icon}</div>
              <div className="font-display text-sm font-extrabold text-amber-950">{s.name}</div>
              {owned ? (
                <div className="font-display text-xs font-bold text-leaf">AÇILDI ✓</div>
              ) : (
                <ToyButton
                  tone={affordable ? "sun" : "orange"}
                  size="sm"
                  className="mt-1 w-full"
                  disabled={!affordable}
                  onClick={() => onUnlock(s.id)}
                >
                  ⭐ {s.cost}
                </ToyButton>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({
  label,
  icon,
  value,
  onToggle,
}: {
  label: string;
  icon: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="cream-panel flex items-center justify-between gap-3 px-4 py-3">
      <span className="font-display flex min-w-0 items-center gap-2 text-base font-extrabold text-amber-950 sm:text-lg">
        <span className="text-2xl">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <ToyButton tone={value ? "leaf" : "berry"} size="sm" onClick={onToggle}>
        {value ? "AÇIK" : "KAPALI"}
      </ToyButton>
    </div>
  );
}

function Settings({
  stars,
  settings,
  onChange,
  onBack,
}: {
  stars: number;
  settings: { music: boolean; sfx: boolean; animations: boolean; difficulty: Difficulty };
  onChange: (p: Partial<typeof settings>) => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <TopBar title="AYARLAR" stars={stars} onBack={onBack} />
      <div className="grid gap-3">
        <Toggle
          label="Müzik"
          icon="🎵"
          value={settings.music}
          onToggle={() => onChange({ music: !settings.music })}
        />
        <Toggle
          label="Ses Efektleri"
          icon="🔊"
          value={settings.sfx}
          onToggle={() => onChange({ sfx: !settings.sfx })}
        />
        <Toggle
          label="Animasyonlar"
          icon="✨"
          value={settings.animations}
          onToggle={() => onChange({ animations: !settings.animations })}
        />
        <div className="cream-panel px-4 py-3">
          <div className="font-display mb-2 flex items-center gap-2 text-base font-extrabold text-amber-950 sm:text-lg">
            <span className="text-2xl">🧩</span> Zorluk Seviyesi
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(["easy", "normal", "hard"] as Difficulty[]).map((d) => (
              <ToyButton
                key={d}
                tone={settings.difficulty === d ? "leaf" : "orange"}
                size="sm"
                onClick={() => onChange({ difficulty: d })}
              >
                {DIFFICULTY_LABEL[d].label} ({DIFFICULTY_LABEL[d].sub})
              </ToyButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
