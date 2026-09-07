import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Puzzle } from "@/game/data";
import { sfx } from "@/game/sound";
import {
  buildInternalLinesPath,
  buildPieceBBox,
  buildPiecePath,
  getJigsawEdges,
} from "@/game/jigsaw";
import { ToyButton } from "./ui";
import { getI18n } from "@/game/i18n";

type Props = {
  puzzle: Puzzle;
  cols: number;
  rows: number;
  animations: boolean;
  soundOn: boolean;
  lang?: string;
  onComplete: (stars: number) => void;
};

const W = 600;
const H = 450;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type DragState = {
  index: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  fromLoose: boolean;
};

type LoosePiece = {
  x: number;
  y: number;
};

export function PuzzleBoard({
  puzzle,
  cols,
  rows,
  animations,
  soundOn,
  lang = "en",
  onComplete,
}: Props) {
  const total = cols * rows;
  const boardRef = useRef<SVGSVGElement>(null);
  const t = getI18n(lang);

  // States
  const [locked, setLocked] = useState<boolean[]>(() => Array(total).fill(false));
  const [loosePieces, setLoosePieces] = useState<Record<number, LoosePiece>>({});
  const [tray, setTray] = useState<number[]>(() =>
    shuffle(Array.from({ length: total }, (_, i) => i)),
  );
  const [drag, setDrag] = useState<DragState | null>(null);
  const [yellowSnapPiece, setYellowSnapPiece] = useState<number | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [mistakes, setMistakes] = useState(0);

  const doneRef = useRef(false);

  // Reset when puzzle changes
  useEffect(() => {
    setLocked(Array(total).fill(false));
    setLoosePieces({});
    setTray(shuffle(Array.from({ length: total }, (_, i) => i)));
    setDrag(null);
    setYellowSnapPiece(null);
    setSelectedPiece(null);
    setHint(false);
    setHintsLeft(3);
    setMistakes(0);
    doneRef.current = false;
  }, [puzzle.id, total]);

  // Jigsaw geometry
  const edges = useMemo(() => getJigsawEdges(cols, rows), [cols, rows]);

  const piecePaths = useMemo(() => {
    return Array.from({ length: total }, (_, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      return buildPiecePath(c, r, cols, rows, W, H, edges);
    });
  }, [cols, rows, total, edges]);

  const bboxes = useMemo(() => {
    return Array.from({ length: total }, (_, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      return buildPieceBBox(c, r, cols, rows, W, H);
    });
  }, [cols, rows, total]);

  const internalLines = useMemo(
    () => buildInternalLinesPath(cols, rows, W, H, edges),
    [cols, rows, edges],
  );

  const lockedCount = locked.filter(Boolean).length;

  const toSvgCoords = useCallback((clientX: number, clientY: number) => {
    const el = boardRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * W;
    const y = ((clientY - r.top) / r.height) * H;
    const inside =
      clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
    return { x, y, inside };
  }, []);

  const finish = useCallback(
    (missCount: number) => {
      if (doneRef.current) return;
      doneRef.current = true;
      const stars = missCount <= 1 ? 3 : missCount <= 4 ? 2 : 1;
      sfx.win(soundOn);
      setTimeout(() => onComplete(stars), 750);
    },
    [onComplete, soundOn],
  );

  // Check magnetic snap or loose placement
  const handlePlacement = useCallback(
    (index: number, clientX: number, clientY: number) => {
      const coords = toSvgCoords(clientX, clientY);
      const targetCenter = bboxes[index].center;
      const cellW = W / cols;
      const cellH = H / rows;

      // Magnetic snap threshold: generous for 2-year-olds
      const snapThreshold = Math.max(cellW * 0.48, 65);

      if (coords && coords.inside) {
        const dist = Math.hypot(coords.x - targetCenter.x, coords.y - targetCenter.y);

        // Also check if cursor dropped directly inside the correct cell bounds (plus tab margins)
        const inCell =
          coords.x >= bboxes[index].minX &&
          coords.x <= bboxes[index].maxX &&
          coords.y >= bboxes[index].minY &&
          coords.y <= bboxes[index].maxY;

        if (dist <= snapThreshold || inCell) {
          // CORRECT: SARI IŞIK + MAGNET SNAP!
          sfx.snap(soundOn);
          setYellowSnapPiece(index);
          setTimeout(() => setYellowSnapPiece(null), 900);

          // Lock piece
          setLocked((prev) => {
            const next = [...prev];
            next[index] = true;
            if (next.every(Boolean)) {
              finish(mistakes);
            }
            return next;
          });

          // Remove from loose and tray
          setLoosePieces((prev) => {
            const next = { ...prev };
            delete next[index];
            return next;
          });
          setTray((prev) => prev.filter((i) => i !== index));
          setSelectedPiece(null);
          return;
        }

        // WRONG SPOT on board: Place loosely (parça oturmasın!)
        sfx.place(soundOn);
        setMistakes((m) => m + 1);

        // Clamp loose position slightly inside board borders so child can always re-grab it
        const clampedX = Math.max(cellW * 0.35, Math.min(W - cellW * 0.35, coords.x));
        const clampedY = Math.max(cellH * 0.35, Math.min(H - cellH * 0.35, coords.y));

        setLoosePieces((prev) => ({
          ...prev,
          [index]: { x: clampedX, y: clampedY },
        }));
        setTray((prev) => prev.filter((i) => i !== index));
        setSelectedPiece(null);
        return;
      }

      // Dropped outside board: return to tray if it was from loose
      sfx.place(soundOn);
      setLoosePieces((prev) => {
        if (!prev[index]) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setTray((prev) => (prev.includes(index) ? prev : [...prev, index]));
      setSelectedPiece(null);
    },
    [toSvgCoords, bboxes, cols, rows, soundOn, finish, mistakes],
  );

  // Drag handlers
  const startDrag = (index: number, fromLoose: boolean) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setSelectedPiece(null);
    setDrag({
      index,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      fromLoose,
    });
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    e.preventDefault();
    setDrag((prev) => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null));
  };

  const onUp = (e: React.PointerEvent) => {
    if (!drag) return;
    const currentDrag = drag;
    setDrag(null);

    // If drag distance was very small, treat as a tap/click selection (toddler friendly)
    const movedDist = Math.hypot(e.clientX - currentDrag.startX, e.clientY - currentDrag.startY);
    if (movedDist < 8 && !currentDrag.fromLoose) {
      // Toggle select
      sfx.click(soundOn);
      setSelectedPiece((prev) => (prev === currentDrag.index ? null : currentDrag.index));
      return;
    }

    handlePlacement(currentDrag.index, e.clientX, e.clientY);
  };

  // Tap on board to place selected piece
  const handleBoardClick = (e: React.MouseEvent) => {
    if (selectedPiece === null) return;
    handlePlacement(selectedPiece, e.clientX, e.clientY);
  };

  // Collect loose pieces back to tray
  const collectToTray = () => {
    const looseIndices = Object.keys(loosePieces).map(Number);
    if (looseIndices.length === 0) return;
    sfx.click(soundOn);
    setTray((prev) => [...prev, ...looseIndices]);
    setLoosePieces({});
  };

  const useHint = () => {
    if (hintsLeft <= 0) return;
    sfx.click(soundOn);
    setHintsLeft((h) => h - 1);
    setHint(true);
    setTimeout(() => setHint(false), 2400);
  };

  // Check if currently dragged piece is hovering near its correct snap target
  const isHoveringSnap = useMemo(() => {
    if (!drag) return false;
    const coords = toSvgCoords(drag.currentX, drag.currentY);
    if (!coords || !coords.inside) return false;
    const targetCenter = bboxes[drag.index].center;
    const cellW = W / cols;
    const snapThreshold = Math.max(cellW * 0.48, 65);
    const dist = Math.hypot(coords.x - targetCenter.x, coords.y - targetCenter.y);
    return dist <= snapThreshold;
  }, [drag, toSvgCoords, bboxes, cols]);

  const hasLoosePieces = Object.keys(loosePieces).length > 0;

  return (
    <div
      className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:gap-5"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => setDrag(null)}
    >
      {/* Board */}
      <div className="wood-panel min-w-0 flex-1 p-2 sm:p-4">
        <div className="relative w-full overflow-hidden rounded-2xl bg-amber-50 shadow-inner">
          <svg
            ref={boardRef}
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full touch-none select-none"
            onClick={handleBoardClick}
          >
            <defs>
              {/* Piece clip paths */}
              {piecePaths.map((d, i) => (
                <clipPath key={`clip-${i}`} id={`clip-${puzzle.id}-${i}`}>
                  <path d={d} />
                </clipPath>
              ))}

              {/* Glow filter for yellow snap effect */}
              <filter id="yellow-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComponentTransfer in="blur" result="boost">
                  <feFuncA type="linear" slope="2.5" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode in="boost" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background: Black and white illustration showing where pieces belong */}
            <image
              href={puzzle.image}
              x="0"
              y="0"
              width={W}
              height={H}
              preserveAspectRatio="xMidYMid slice"
              style={{
                filter: hint ? "none" : "grayscale(100%) contrast(1.15) brightness(0.92)",
                opacity: hint ? 0.88 : 0.48,
                transition: "opacity 0.4s ease, filter 0.4s ease",
              }}
            />

            {/* Black-and-white slot guides & jigsaw cutlines */}
            <path
              d={internalLines}
              fill="none"
              stroke="rgba(194, 65, 12, 0.45)"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />

            {/* Outer border of puzzle board */}
            <rect
              x="0"
              y="0"
              width={W}
              height={H}
              fill="none"
              stroke="rgba(234, 88, 12, 0.55)"
              strokeWidth="3.5"
            />

            {/* Correct slot hover glow when dragging near right spot */}
            {isHoveringSnap && drag && (
              <g className="pointer-events-none">
                <path
                  d={piecePaths[drag.index]}
                  fill="rgba(250, 204, 21, 0.35)"
                  stroke="#eab308"
                  strokeWidth="4"
                  strokeDasharray="8 4"
                  className="animate-pulse"
                />
              </g>
            )}

            {/* Locked pieces (correctly snapped) */}
            {Array.from({ length: total }, (_, i) => {
              if (!locked[i]) return null;
              const isSnapping = yellowSnapPiece === i;
              return (
                <g key={`locked-${i}`} className={isSnapping ? "animate-yellow-snap" : ""}>
                  <g clipPath={`url(#clip-${puzzle.id}-${i})`}>
                    <image
                      href={puzzle.image}
                      x="0"
                      y="0"
                      width={W}
                      height={H}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                  {/* Subtle edge highlight for 3D jigsaw feel */}
                  <path
                    d={piecePaths[i]}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="1.6"
                  />
                  <path
                    d={piecePaths[i]}
                    fill="none"
                    stroke="rgba(40, 25, 10, 0.25)"
                    strokeWidth="0.8"
                  />
                </g>
              );
            })}

            {/* Yellow light flash on successful magnetic snap */}
            {yellowSnapPiece !== null && (
              <g className="pointer-events-none">
                {/* Golden burst overlay */}
                <path
                  d={piecePaths[yellowSnapPiece]}
                  fill="rgba(254, 240, 138, 0.55)"
                  stroke="#facc15"
                  strokeWidth="8"
                  filter="url(#yellow-glow)"
                  className="animate-yellow-ring"
                />
                {/* Sparkle starbursts */}
                <text
                  x={bboxes[yellowSnapPiece].center.x}
                  y={bboxes[yellowSnapPiece].center.y - 12}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-4xl animate-pop-in"
                >
                  ✨
                </text>
                <text
                  x={bboxes[yellowSnapPiece].center.x + 28}
                  y={bboxes[yellowSnapPiece].center.y + 16}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-3xl animate-pop-in"
                >
                  🌟
                </text>
                <text
                  x={bboxes[yellowSnapPiece].center.x - 28}
                  y={bboxes[yellowSnapPiece].center.y + 16}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-3xl animate-pop-in"
                >
                  ⭐
                </text>
              </g>
            )}

            {/* Loose pieces placed on the board (wrong place, not snapped!) */}
            {Object.entries(loosePieces).map(([idxStr, pos]) => {
              const i = Number(idxStr);
              if (drag?.index === i) return null; // currently being dragged
              const center = bboxes[i].center;
              const dx = pos.x - center.x;
              const dy = pos.y - center.y;

              return (
                <g
                  key={`loose-${i}`}
                  transform={`translate(${dx}, ${dy})`}
                  className="cursor-grab active:cursor-grabbing hover:brightness-105"
                  onPointerDown={startDrag(i, true)}
                >
                  {/* Floating shadow */}
                  <path d={piecePaths[i]} fill="rgba(0, 0, 0, 0.22)" transform="translate(4, 7)" />
                  {/* The piece image */}
                  <g clipPath={`url(#clip-${puzzle.id}-${i})`}>
                    <image
                      href={puzzle.image}
                      x="0"
                      y="0"
                      width={W}
                      height={H}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                  {/* Dashed colored border indicating it is loose / not locked */}
                  <path
                    d={piecePaths[i]}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeDasharray="5 3"
                  />
                  <path d={piecePaths[i]} fill="none" stroke="#ffffff" strokeWidth="1.2" />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tray & Controls */}
      <div className="wood-panel w-full shrink-0 p-3 sm:p-4 lg:w-64">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-display text-sm font-extrabold text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] sm:text-base">
            PARÇALAR · {tray.length}
          </div>
          <div className="rounded-full border-2 border-white/90 bg-gradient-to-b from-amber-400 to-orange-600 px-2.5 py-0.5 font-display text-xs font-extrabold text-white shadow-xs">
            {lockedCount}/{total}
          </div>
        </div>

        {/* Piece tray */}
        <div className="flex max-h-48 flex-wrap justify-center gap-3 overflow-y-auto rounded-2xl bg-orange-950/25 p-3 sm:max-h-56 lg:max-h-[28rem]">
          {tray.map((i) => {
            const bbox = bboxes[i];
            const isSelected = selectedPiece === i;
            const isDragging = drag?.index === i;

            return (
              <div
                key={`tray-${i}`}
                role="button"
                tabIndex={0}
                aria-label={`Parça ${i + 1}`}
                onPointerDown={startDrag(i, false)}
                className={`relative flex h-20 w-24 shrink-0 cursor-grab items-center justify-center rounded-xl bg-amber-100/20 p-1 shadow-md transition-transform hover:scale-105 active:cursor-grabbing sm:h-24 sm:w-28 ${
                  isDragging ? "opacity-25" : ""
                } ${isSelected ? "ring-4 ring-yellow-400 scale-105" : ""}`}
              >
                <svg
                  viewBox={`${bbox.minX} ${bbox.minY} ${bbox.width} ${bbox.height}`}
                  className="h-full w-full drop-shadow-sm pointer-events-none"
                >
                  <g clipPath={`url(#clip-${puzzle.id}-${i})`}>
                    <image
                      href={puzzle.image}
                      x="0"
                      y="0"
                      width={W}
                      height={H}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                  <path
                    d={piecePaths[i]}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.7)"
                    strokeWidth="2"
                  />
                  <path
                    d={piecePaths[i]}
                    fill="none"
                    stroke="rgba(40, 25, 10, 0.4)"
                    strokeWidth="1"
                  />
                </svg>

                {isSelected && (
                  <span className="absolute -top-1 -right-1 text-base animate-bounce">👆</span>
                )}
              </div>
            );
          })}

          {tray.length === 0 && !hasLoosePieces && (
            <div className="p-4 text-center font-display text-base text-cream">
              {t.congratsTitle} 🎉
            </div>
          )}

          {tray.length === 0 && hasLoosePieces && (
            <div className="p-3 text-center font-display text-xs text-amber-200">
              {t.dragLooseGuide}
            </div>
          )}
        </div>

        {/* Loose pieces notice and collect button */}
        {hasLoosePieces && (
          <div className="mt-2.5 flex items-center justify-between rounded-xl bg-amber-500/25 px-2.5 py-1.5 text-xs text-cream">
            <span>{t.loosePiecesNotice(Object.keys(loosePieces).length)}</span>
            <button
              type="button"
              onClick={collectToTray}
              className="rounded-lg bg-amber-600 px-2 py-0.5 font-display text-xs text-white hover:bg-amber-500 active:scale-95"
            >
              {t.collectToTray}
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <ToyButton tone="grass" size="sm" icon="💡" onClick={useHint} disabled={hintsLeft === 0}>
            {t.hint(hintsLeft)}
          </ToyButton>
          <div className="text-right text-xs font-display text-cream/90">
            {t.piecesCount(total)}
          </div>
        </div>
      </div>

      {/* Floating dragged piece follows cursor / finger */}
      {drag && (
        <div
          className="pointer-events-none fixed z-50 transition-transform"
          style={{
            left: drag.currentX,
            top: drag.currentY,
            transform: "translate(-50%, -50%) scale(1.08)",
            filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.45))",
            width: `${Math.min(140, Math.max(90, bboxes[drag.index].width * 0.28))}px`,
            aspectRatio: `${bboxes[drag.index].width} / ${bboxes[drag.index].height}`,
          }}
        >
          <svg
            viewBox={`${bboxes[drag.index].minX} ${bboxes[drag.index].minY} ${bboxes[drag.index].width} ${bboxes[drag.index].height}`}
            className="h-full w-full"
          >
            <g clipPath={`url(#clip-${puzzle.id}-${drag.index})`}>
              <image
                href={puzzle.image}
                x="0"
                y="0"
                width={W}
                height={H}
                preserveAspectRatio="xMidYMid slice"
              />
            </g>
            <path d={piecePaths[drag.index]} fill="none" stroke="#ffffff" strokeWidth="2.5" />
            <path
              d={piecePaths[drag.index]}
              fill="none"
              stroke="rgba(40, 25, 10, 0.5)"
              strokeWidth="1.2"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
