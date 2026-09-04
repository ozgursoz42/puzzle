import { useCallback, useEffect, useState } from "react";
import { ACHIEVEMENTS, CATEGORIES, type Difficulty } from "./data";

export type { Difficulty };

export type GameState = {
  // key: `${difficulty}:${puzzleId}`
  // e.g. "easy:animals-1": 3, "normal:animals-1": 2
  stars: Record<string, number>;
  badges: string[];
  unlockedStickers: string[];
  settings: {
    music: boolean;
    sfx: boolean;
    animations: boolean;
    difficulty: Difficulty;
  };
};

const KEY = "puzzle-macerasi-v2";

const initial: GameState = {
  stars: {},
  badges: [],
  unlockedStickers: [],
  settings: { music: false, sfx: true, animations: true, difficulty: "normal" },
};

export function puzzleKey(puzzleId: string, difficulty: Difficulty) {
  return `${difficulty}:${puzzleId}`;
}

function load(): GameState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      // Check for legacy v1 storage
      const oldRaw = window.localStorage.getItem("puzzle-macerasi-v1");
      if (oldRaw) {
        const oldParsed = JSON.parse(oldRaw) as {
          stars?: Record<string, number>;
          badges?: string[];
          unlockedStickers?: string[];
          settings?: {
            difficulty?: Difficulty;
            music?: boolean;
            sfx?: boolean;
            animations?: boolean;
          };
        };
        const migratedStars: Record<string, number> = {};
        const d = oldParsed.settings?.difficulty ?? "normal";
        for (const [pid, s] of Object.entries(oldParsed.stars ?? {})) {
          migratedStars[`${d}:${pid}`] = s;
        }
        return {
          ...initial,
          stars: migratedStars,
          badges: oldParsed.badges ?? [],
          unlockedStickers: oldParsed.unlockedStickers ?? [],
          settings: { ...initial.settings, ...(oldParsed.settings ?? {}) },
        };
      }
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<GameState>;
    return {
      ...initial,
      ...parsed,
      settings: { ...initial.settings, ...(parsed.settings ?? {}) },
      stars: parsed.stars ?? {},
      badges: parsed.badges ?? [],
      unlockedStickers: parsed.unlockedStickers ?? [],
    };
  } catch {
    return initial;
  }
}

export function getPuzzleStars(s: GameState, puzzleId: string, difficulty: Difficulty) {
  return s.stars[puzzleKey(puzzleId, difficulty)] ?? 0;
}

export function totalStars(s: GameState, difficulty?: Difficulty) {
  if (difficulty) {
    const prefix = `${difficulty}:`;
    return Object.entries(s.stars).reduce((acc, [k, v]) => {
      return k.startsWith(prefix) ? acc + v : acc;
    }, 0);
  }
  return Object.values(s.stars).reduce((a, b) => a + b, 0);
}

export function completedCount(s: GameState, difficulty?: Difficulty) {
  if (difficulty) {
    const prefix = `${difficulty}:`;
    return Object.entries(s.stars).filter(([k, v]) => k.startsWith(prefix) && v > 0).length;
  }
  return Object.values(s.stars).filter((v) => v > 0).length;
}

export function categoryProgress(s: GameState, categoryId: string, difficulty: Difficulty) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return { done: 0, total: 0, stars: 0 };
  let done = 0;
  let stars = 0;
  for (const p of cat.puzzles) {
    const v = getPuzzleStars(s, p.id, difficulty);
    if (v > 0) {
      done++;
      stars += v;
    }
  }
  return { done, total: cat.puzzles.length, stars };
}

/**
 * A puzzle is unlocked when it's the first of its category in this difficulty,
 * or the previous puzzle was completed in this difficulty.
 */
export function isUnlocked(
  s: GameState,
  categoryId: string,
  index: number,
  difficulty: Difficulty,
) {
  if (index === 0) return true;
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return false;
  const prevPuzzle = cat.puzzles[index - 1];
  return getPuzzleStars(s, prevPuzzle.id, difficulty) > 0;
}

function computeBadges(s: GameState): string[] {
  const done = completedCount(s);
  const earned = new Set(s.badges);
  if (done >= 1) earned.add("first");
  if (done >= 5) earned.add("five");
  if (done >= 10) earned.add("ten");
  if (done >= 20) earned.add("twenty");
  for (const id of ["animals", "nature", "garden", "school"]) {
    // Check if category has at least 3 completed in any difficulty
    const cat = CATEGORIES.find((c) => c.id === id);
    if (cat) {
      let count = 0;
      for (const p of cat.puzzles) {
        if (
          getPuzzleStars(s, p.id, "easy") > 0 ||
          getPuzzleStars(s, p.id, "normal") > 0 ||
          getPuzzleStars(s, p.id, "hard") > 0
        ) {
          count++;
        }
      }
      if (count >= 3) earned.add(id);
    }
  }
  if (totalStars(s) >= 50) earned.add("champion");
  return ACHIEVEMENTS.filter((a) => earned.has(a.id)).map((a) => a.id);
}

export function useGameState() {
  const [state, setState] = useState<GameState>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);

  const recordResult = useCallback((puzzleId: string, stars: number, difficulty: Difficulty) => {
    let newBadges: string[] = [];
    setState((prev) => {
      const key = puzzleKey(puzzleId, difficulty);
      const best = Math.max(prev.stars[key] ?? 0, stars);
      const next: GameState = { ...prev, stars: { ...prev.stars, [key]: best } };
      const badges = computeBadges(next);
      newBadges = badges.filter((b) => !prev.badges.includes(b));
      return { ...next, badges };
    });
    return newBadges;
  }, []);

  const unlockSticker = useCallback((id: string) => {
    setState((prev) =>
      prev.unlockedStickers.includes(id)
        ? prev
        : { ...prev, unlockedStickers: [...prev.unlockedStickers, id] },
    );
  }, []);

  const setSettings = useCallback((patch: Partial<GameState["settings"]>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const reset = useCallback(() => setState({ ...initial, settings: initial.settings }), []);

  return { state, hydrated, recordResult, unlockSticker, setSettings, reset };
}
