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
import { getI18n, ALL_LANGUAGES, type Translations } from "@/game/i18n";
import { sfx, startMusic, stopMusic } from "@/game/sound";
import { PuzzleBoard } from "./PuzzleBoard";
import { Scenery } from "./Scenery";
import { BackButton, StarBadge, Stars, ToyButton, WoodTitle } from "./ui";
import { LanguageModal } from "./LanguageModal";

type Screen =
  | { name: "menu" }
  | { name: "categories" }
  | { name: "puzzles"; categoryId: string }
  | { name: "play"; categoryId: string; puzzleIndex: number }
  | { name: "achievements" }
  | { name: "settings" };

function getDifficultyLabel(t: Translations, d: Difficulty) {
  switch (d) {
    case "easy":
      return { label: t.easy, sub: t.easySub, emoji: "👶" };
    case "normal":
      return { label: t.normal, sub: t.normalSub, emoji: "🧩" };
    case "hard":
      return { label: t.hard, sub: t.hardSub, emoji: "⭐" };
  }
}

function DifficultyTabs({
  current,
  t,
  onChange,
}: {
  current: Difficulty;
  t: Translations;
  onChange: (d: Difficulty) => void;
}) {
  const options: Difficulty[] = ["easy", "normal", "hard"];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {options.map((opt) => {
        const active = current === opt;
        const info = getDifficultyLabel(t, opt);
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
  const { state, hydrated, recordResult, unlockSticker, setSettings, resetProgress } =
    useGameState();
  const [screen, setScreen] = useState<Screen>({ name: "menu" });
  const [result, setResult] = useState<{ stars: number; newBadges: string[] } | null>(null);
  const [round, setRound] = useState(0);
  const [langModalOpen, setLangModalOpen] = useState(false);

  const lang = state.settings.language || "en";
  const t = useMemo(() => getI18n(lang), [lang]);

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

  const handleLanguageChange = (newLang: string) => {
    sfx.click(soundOn);
    setSettings({ language: newLang });
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
        <Scenery />
        <div className="cream-panel px-8 py-6 font-display text-2xl text-wood-dark">
          {t.loading}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full px-2 py-2 sm:px-6 sm:py-6 overflow-x-hidden touch-pan-y">
      <Scenery />

      {screen.name === "menu" && (
        <Menu
          stars={stars}
          allStars={allStars}
          difficulty={currentDiff}
          t={t}
          currentLang={lang}
          onOpenLang={() => setLangModalOpen(true)}
          onDifficultyChange={handleDifficultyChange}
          onGo={go}
          state={state}
        />
      )}

      {screen.name === "categories" && (
        <Categories
          stars={stars}
          difficulty={currentDiff}
          t={t}
          currentLang={lang}
          onOpenLang={() => setLangModalOpen(true)}
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
          t={t}
          currentLang={lang}
          onOpenLang={() => setLangModalOpen(true)}
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
          t={t}
          lang={lang}
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
          t={t}
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
          t={t}
          currentLang={lang}
          onOpenLang={() => setLangModalOpen(true)}
          onChange={(patch) => {
            sfx.click(soundOn);
            setSettings(patch);
          }}
          onResetProgress={() => {
            sfx.click(soundOn);
            resetProgress();
          }}
          onBack={() => go({ name: "menu" })}
        />
      )}

      {/* Language Selector Modal */}
      {langModalOpen && (
        <LanguageModal
          currentLang={lang}
          onSelect={handleLanguageChange}
          onClose={() => setLangModalOpen(false)}
        />
      )}
    </main>
  );
}

/* ---------------- Screens ---------------- */

interface WebkitDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}

interface WebkitHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    const check = () => {
      const doc = document as WebkitDocument;
      const nativeFs = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
      const pseudoFs = document.documentElement.classList.contains("pseudo-fullscreen");
      setIsFullscreen(nativeFs || pseudoFs);
    };
    document.addEventListener("fullscreenchange", check);
    document.addEventListener("webkitfullscreenchange", check);
    return () => {
      document.removeEventListener("fullscreenchange", check);
      document.removeEventListener("webkitfullscreenchange", check);
    };
  }, []);

  const togglePseudoFullscreen = () => {
    const isCurrentlyPseudo = document.documentElement.classList.contains("pseudo-fullscreen");
    const nextState = !isCurrentlyPseudo;
    document.documentElement.classList.toggle("pseudo-fullscreen", nextState);
    document.body.classList.toggle("pseudo-fullscreen", nextState);
    setIsFullscreen(nextState);

    if (nextState) {
      window.scrollTo(0, 1);
      setShowIosTip(true);
      setTimeout(() => setShowIosTip(false), 4500);
    }
  };

  const toggle = () => {
    const doc = document as WebkitDocument;
    const docEl = document.documentElement as WebkitHTMLElement;

    const hasNativeFs = Boolean(docEl.requestFullscreen || docEl.webkitRequestFullscreen);

    if (hasNativeFs) {
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => togglePseudoFullscreen());
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen().catch(() => togglePseudoFullscreen());
        }
      } else {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen().catch(() => {});
        }
      }
    } else {
      togglePseudoFullscreen();
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border-2 border-amber-300 bg-white/95 text-sm sm:text-base font-bold shadow-xs hover:bg-white active:scale-95 transition-transform"
        title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
        aria-label="Tam Ekran"
      >
        {isFullscreen ? "🗗" : "⛶"}
      </button>

      {showIosTip && (
        <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border-2 border-amber-400 bg-amber-950/95 p-3 text-xs text-white shadow-xl backdrop-blur-md animate-fade-in">
          <p className="font-bold text-yellow-300">💡 iOS Tam Ekran</p>
          <p className="mt-1 leading-snug">
            Sayfa büyütüldü! Tam uygulama görünümü için Safari&apos;de &apos;Paylaş&apos; ➔
            &apos;Ana Ekrana Ekle&apos; yapabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}

function TopBar({
  title,
  stars,
  currentLang,
  onOpenLang,
  onBack,
  children,
}: {
  title: string;
  stars: number;
  currentLang?: string;
  onOpenLang?: () => void;
  onBack?: () => void;
  children?: React.ReactNode;
}) {
  const langObj = currentLang ? ALL_LANGUAGES.find((l) => l.id === currentLang) : null;
  return (
    <header className="mx-auto mb-2 sm:mb-3 max-w-6xl">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 sm:gap-4">
        {onBack ? <BackButton onClick={onBack} /> : <span />}
        <div className="flex min-w-0 justify-center">
          <WoodTitle>{title}</WoodTitle>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <FullscreenButton />
          {onOpenLang && langObj ? (
            <button
              type="button"
              onClick={onOpenLang}
              className="flex items-center gap-1 rounded-xl border-2 border-amber-300 bg-white/95 px-2 py-1 sm:px-2.5 sm:py-1.5 font-display text-xs font-black text-amber-950 shadow-xs hover:bg-white active:scale-95"
              title="Change Language / Dil Değiştir"
            >
              <span>{langObj.flag}</span>
              <span className="hidden sm:inline">{langObj.nativeName}</span>
            </button>
          ) : null}
          <StarBadge count={stars} />
        </div>
      </div>
      {children ? <div className="mt-1.5 sm:mt-2 flex justify-center">{children}</div> : null}
    </header>
  );
}

function Menu({
  stars,
  allStars,
  difficulty,
  t,
  currentLang,
  onOpenLang,
  onDifficultyChange,
  onGo,
  state,
}: {
  stars: number;
  allStars: number;
  difficulty: Difficulty;
  t: Translations;
  currentLang: string;
  onOpenLang: () => void;
  onDifficultyChange: (d: Difficulty) => void;
  onGo: (s: Screen) => void;
  state: ReturnType<typeof useGameState>["state"];
}) {
  const diffDone = completedCount(state, difficulty);
  const diffInfo = getDifficultyLabel(t, difficulty);
  const langObj = ALL_LANGUAGES.find((l) => l.id === currentLang);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 py-3 text-center sm:gap-6 sm:py-4">
      {/* Top action row */}
      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={onOpenLang}
          className="flex items-center gap-2 rounded-2xl border-2 border-amber-300 bg-white/95 px-3 py-1.5 font-display text-xs font-extrabold text-amber-950 shadow-md transition hover:bg-white hover:scale-105 active:scale-95 sm:text-sm"
        >
          <span className="text-xl">🌐</span>
          <span>{langObj?.flag}</span>
          <span>{langObj?.nativeName || "Language"}</span>
        </button>
        <div className="flex items-center gap-2">
          <FullscreenButton />
          <StarBadge count={stars} />
        </div>
      </div>

      <div className="wood-panel animate-pop-in px-5 py-4 sm:px-10 sm:py-6">
        <p className="font-display text-sm font-extrabold tracking-widest text-amber-100 sm:text-base">
          {t.forKids}
        </p>
        <h1 className="font-display text-4xl font-extrabold leading-none text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.4)] sm:text-6xl">
          {t.puzzle}
        </h1>
        <h2 className="font-display text-2xl font-extrabold tracking-wide text-amber-300 drop-shadow-[0_3px_0_rgba(180,83,9,0.7)] sm:text-4xl">
          {t.adventure}
        </h2>
      </div>

      {/* Difficulty Selector */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="font-display text-xs font-black tracking-wider text-amber-900 drop-shadow-xs">
          {t.selectDifficulty}
        </span>
        <DifficultyTabs current={difficulty} t={t} onChange={onDifficultyChange} />
      </div>

      <div className="grid w-full max-w-sm gap-3 sm:max-w-md">
        <ToyButton tone="leaf" size="lg" icon="▶️" onClick={() => onGo({ name: "categories" })}>
          {t.play}
        </ToyButton>
        <ToyButton tone="sky" size="lg" icon="🧩" onClick={() => onGo({ name: "categories" })}>
          {t.levels}
        </ToyButton>
        <ToyButton tone="berry" size="lg" icon="⭐" onClick={() => onGo({ name: "achievements" })}>
          {t.achievements}
        </ToyButton>
        <ToyButton tone="grape" size="lg" icon="⚙️" onClick={() => onGo({ name: "settings" })}>
          {t.settings}
        </ToyButton>
      </div>

      <div className="cream-panel flex max-w-md items-center gap-3 px-4 py-3 text-left">
        <span className="text-3xl">🧩</span>
        <p className="font-display text-sm font-bold text-amber-950 sm:text-base">
          {t.completedSummary(diffInfo.label, diffDone, allStars)}
        </p>
      </div>
    </div>
  );
}

function Categories({
  stars,
  difficulty,
  t,
  currentLang,
  onOpenLang,
  onDifficultyChange,
  onBack,
  onPick,
  progressOf,
}: {
  stars: number;
  difficulty: Difficulty;
  t: Translations;
  currentLang: string;
  onOpenLang: () => void;
  onDifficultyChange: (d: Difficulty) => void;
  onBack: () => void;
  onPick: (id: string) => void;
  progressOf: (id: string) => { done: number; total: number; stars: number };
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <TopBar
        title={t.categoriesTitle}
        stars={stars}
        currentLang={currentLang}
        onOpenLang={onOpenLang}
        onBack={onBack}
      >
        <DifficultyTabs current={difficulty} t={t} onChange={onDifficultyChange} />
      </TopBar>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c: Category) => {
          const p = progressOf(c.id);
          const localizedName = t.categories[c.id as keyof typeof t.categories] || c.name;
          return (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              className="wood-panel group p-2 text-left transition-transform hover:-translate-y-1 active:translate-y-0.5"
            >
              <div className="overflow-hidden rounded-xl border-2 border-white/80 shadow-xs">
                <img
                  src={c.cover}
                  alt={localizedName}
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
                    {localizedName}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-display text-sm font-extrabold text-orange-600">
                    {t.completedRatio(p.done, p.total)}
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
  t,
  currentLang,
  onOpenLang,
  onDifficultyChange,
  starsOf,
  unlocked,
  onBack,
  onPick,
}: {
  categoryId: string;
  stars: number;
  difficulty: Difficulty;
  t: Translations;
  currentLang: string;
  onOpenLang: () => void;
  onDifficultyChange: (d: Difficulty) => void;
  starsOf: (id: string) => number;
  unlocked: (i: number) => boolean;
  onBack: () => void;
  onPick: (i: number) => void;
}) {
  const cat = findCategory(categoryId);
  if (!cat) return null;
  const categoryTitle = t.categories[categoryId as keyof typeof t.categories] || cat.name;

  return (
    <div className="mx-auto max-w-6xl">
      <TopBar
        title={categoryTitle}
        stars={stars}
        currentLang={currentLang}
        onOpenLang={onOpenLang}
        onBack={onBack}
      >
        <DifficultyTabs current={difficulty} t={t} onChange={onDifficultyChange} />
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
                open
                  ? "hover:-translate-y-1 active:translate-y-0.5 cursor-pointer"
                  : "cursor-not-allowed opacity-95 ring-1 ring-amber-400/40"
              }`}
            >
              {/* Image preview box: cleanly visible even when locked */}
              <div className="relative overflow-hidden rounded-xl border-2 border-white/80 shadow-xs bg-amber-950/20">
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className={`h-24 w-full object-cover sm:h-32 transition-all ${
                    open ? "" : "brightness-[0.85] contrast-95 saturate-[0.9]"
                  }`}
                />
                {!open && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[0.5px]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-amber-600 to-amber-900 text-lg text-white shadow-md ring-2 ring-amber-200">
                      🔒
                    </div>
                    <span className="mt-1 rounded bg-black/60 px-1.5 py-0.5 font-display text-[10px] font-extrabold text-amber-100 uppercase tracking-wider">
                      {t.locked}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-2 rounded-xl bg-white/95 px-2 py-1.5 shadow-xs">
                <div className="font-display truncate text-sm font-extrabold text-amber-950 sm:text-base">
                  {currentLang === "tr"
                    ? p.title
                    : `${t.levels.charAt(0).toUpperCase() + t.levels.slice(1).toLowerCase()} ${i + 1}`}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-extrabold text-orange-600">
                    {t.piecesCount(pieces)}
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
  t,
  lang,
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
  t: Translations;
  lang: string;
  result: { stars: number; newBadges: string[] } | null;
  onCloseResult: () => void;
  onBack: () => void;
  onComplete: (stars: number) => void;
  onNext: () => void;
}) {
  const cat = findCategory(categoryId);
  const hasNext = Boolean(cat && puzzleIndex + 1 < cat.puzzles.length);
  const diffInfo = getDifficultyLabel(t, difficulty);
  const puzzleDisplayTitle =
    lang === "tr"
      ? puzzle.title
      : `${t.levels.charAt(0).toUpperCase() + t.levels.slice(1).toLowerCase()} ${puzzleIndex + 1}`;

  return (
    <div className="mx-auto max-w-6xl">
      <TopBar title={puzzleDisplayTitle} stars={stars} onBack={onBack}>
        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 bg-white/80 px-3 py-1 rounded-full shadow-xs">
          <span>{diffInfo.label}</span>
          <span>•</span>
          <span>{t.piecesCount(cols * rows)}</span>
        </div>
      </TopBar>
      <PuzzleBoard
        puzzle={puzzle}
        cols={cols}
        rows={rows}
        animations={animations}
        soundOn={soundOn}
        lang={lang}
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
              <button
                type="button"
                onClick={onCloseResult}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-orange-900/60 text-lg font-black text-amber-100 hover:bg-orange-800 hover:text-white"
                aria-label={t.close}
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
                {t.congratsTitle}
              </h2>
              <p className="font-display text-base font-extrabold text-amber-100 sm:text-lg">
                {t.congratsSub}
              </p>
              <div className={`my-2 ${animations ? "animate-pop-in" : ""}`}>
                <Stars value={result.stars} size="text-4xl sm:text-5xl" />
              </div>

              {result.newBadges.length ? (
                <p className="font-display mb-3 text-sm font-extrabold text-amber-200">
                  {t.earnedAchievement} 🏆
                </p>
              ) : null}

              <div className="mt-4">
                {hasNext ? (
                  <ToyButton
                    tone="leaf"
                    size="lg"
                    icon="➡️"
                    className="w-full py-3.5 text-lg font-black tracking-wide sm:text-xl"
                    onClick={onNext}
                  >
                    {t.nextPuzzle}
                  </ToyButton>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-100/95 p-3 text-center shadow-xs">
                      <div className="text-3xl">🏆🎉</div>
                      <div className="font-display text-base font-black text-amber-950 sm:text-lg">
                        {t.allPuzzlesCompleted}
                      </div>
                      <p className="text-xs font-extrabold text-amber-800">
                        {t.allPuzzlesCompletedSub}
                      </p>
                    </div>
                    <ToyButton
                      tone="orange"
                      size="lg"
                      icon="✕"
                      className="w-full py-3.5 text-lg font-black tracking-wide sm:text-xl"
                      onClick={onCloseResult}
                    >
                      {t.close}
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
  t,
  onUnlock,
  onBack,
}: {
  stars: number;
  badges: string[];
  done: number;
  unlockedStickers: string[];
  t: Translations;
  onUnlock: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <TopBar title={t.achievements} stars={stars} onBack={onBack} />

      <div className="cream-panel mb-4 px-4 py-3 text-center font-display text-base font-extrabold text-amber-950 sm:text-lg">
        {done} {t.puzzle} · {stars} ⭐
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
                {earned ? t.earnedAchievement : a.desc}
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="font-display mt-6 text-center text-xl font-extrabold text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] sm:text-2xl">
        {t.stickerShop}
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
                <div className="font-display text-xs font-bold text-leaf">{t.unlockedSticker}</div>
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
  t,
  onToggle,
}: {
  label: string;
  icon: string;
  value: boolean;
  t: Translations;
  onToggle: () => void;
}) {
  return (
    <div className="cream-panel flex items-center justify-between gap-3 px-4 py-3">
      <span className="font-display flex min-w-0 items-center gap-2 text-base font-extrabold text-amber-950 sm:text-lg">
        <span className="text-2xl">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <ToyButton tone={value ? "leaf" : "berry"} size="sm" onClick={onToggle}>
        {value ? t.on : t.off}
      </ToyButton>
    </div>
  );
}

function Settings({
  stars,
  settings,
  t,
  currentLang,
  onOpenLang,
  onChange,
  onResetProgress,
  onBack,
}: {
  stars: number;
  settings: {
    music: boolean;
    sfx: boolean;
    animations: boolean;
    difficulty: Difficulty;
    language?: string;
  };
  t: Translations;
  currentLang: string;
  onOpenLang: () => void;
  onChange: (p: Partial<typeof settings>) => void;
  onResetProgress: () => void;
  onBack: () => void;
}) {
  const langObj = ALL_LANGUAGES.find((l) => l.id === currentLang);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  return (
    <div className="mx-auto max-w-2xl">
      <TopBar title={t.settings} stars={stars} onBack={onBack} />
      <div className="grid gap-3">
        {/* Language Selection Row */}
        <div className="cream-panel flex items-center justify-between gap-3 px-4 py-3">
          <span className="font-display flex min-w-0 items-center gap-2 text-base font-extrabold text-amber-950 sm:text-lg">
            <span className="text-2xl">🌐</span>
            <span className="truncate">{t.language}</span>
          </span>
          <ToyButton tone="sun" size="sm" onClick={onOpenLang}>
            {langObj?.flag} {langObj?.nativeName || "Language"}
          </ToyButton>
        </div>

        <Toggle
          label={t.music}
          icon="🎵"
          value={settings.music}
          t={t}
          onToggle={() => onChange({ music: !settings.music })}
        />
        <Toggle
          label={t.sfx}
          icon="🔊"
          value={settings.sfx}
          t={t}
          onToggle={() => onChange({ sfx: !settings.sfx })}
        />
        <Toggle
          label={t.animations}
          icon="✨"
          value={settings.animations}
          t={t}
          onToggle={() => onChange({ animations: !settings.animations })}
        />
        <div className="cream-panel px-4 py-3">
          <div className="font-display mb-2 flex items-center gap-2 text-base font-extrabold text-amber-950 sm:text-lg">
            <span className="text-2xl">🧩</span> {t.difficulty}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(["easy", "normal", "hard"] as Difficulty[]).map((d) => {
              const info = getDifficultyLabel(t, d);
              return (
                <ToyButton
                  key={d}
                  tone={settings.difficulty === d ? "leaf" : "orange"}
                  size="sm"
                  onClick={() => onChange({ difficulty: d })}
                >
                  {info.label} ({info.sub})
                </ToyButton>
              );
            })}
          </div>
        </div>

        {/* Reset Progress Section */}
        <div className="cream-panel flex flex-col gap-2 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl">🔄</span>
              <div>
                <div className="font-display text-base font-extrabold text-amber-950 sm:text-lg">
                  {t.resetProgress}
                </div>
                <div className="text-xs font-semibold text-amber-800">{t.resetProgressSub}</div>
              </div>
            </div>
            <ToyButton tone="berry" size="sm" icon="🗑️" onClick={() => setShowConfirm(true)}>
              {t.resetProgress}
            </ToyButton>
          </div>
          {resetDone && (
            <div className="mt-1 rounded-xl bg-emerald-100 border-2 border-emerald-300 px-3 py-2 text-center font-display text-xs font-black text-emerald-900 animate-pop-in shadow-xs">
              ✓{" "}
              {t.resetConfirmTitle === "Tüm İlerlemeyi Sıfırla?"
                ? "Tüm bölümler ve ilerleme başarıyla sıfırlandı! İlk hallerine geri döndü."
                : "All levels and progress have been reset to initial state!"}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="wood-panel animate-pop-in relative w-full max-w-sm p-5 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-2">⚠️</div>
            <h3 className="font-display text-xl font-extrabold text-white sm:text-2xl drop-shadow-[0_2px_0_rgba(180,83,9,0.7)]">
              {t.resetConfirmTitle}
            </h3>
            <p className="mt-2 text-xs sm:text-sm font-bold text-amber-100 leading-relaxed">
              {t.resetConfirmDesc}
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <ToyButton
                tone="berry"
                size="md"
                className="w-full py-2.5 font-black text-sm sm:text-base shadow-lg"
                onClick={() => {
                  onResetProgress();
                  setShowConfirm(false);
                  setResetDone(true);
                  setTimeout(() => setResetDone(false), 5000);
                }}
              >
                {t.resetConfirmButton}
              </ToyButton>
              <ToyButton
                tone="orange"
                size="sm"
                className="w-full py-2 font-bold text-xs sm:text-sm"
                onClick={() => setShowConfirm(false)}
              >
                {t.cancel}
              </ToyButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
