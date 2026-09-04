export type JigsawEdges = {
  vEdges: number[][]; // [cols - 1][rows]  (+1 means tab points from col to col+1, -1 means tab points from col+1 to col)
  hEdges: number[][]; // [cols][rows - 1]  (+1 means tab points from row to row+1, -1 means tab points from row+1 to row)
};

/**
 * Computes deterministic jigsaw edge orientations for a given grid.
 * For 2x1: a single clean tab between left and right pieces.
 * For 2x2: matches the classic interlocking pattern in the user's diagram.
 */
export function getJigsawEdges(cols: number, rows: number): JigsawEdges {
  const vEdges: number[][] = [];
  for (let c = 0; c < cols - 1; c++) {
    vEdges[c] = [];
    for (let r = 0; r < rows; r++) {
      if (cols === 2 && rows === 1) {
        vEdges[c][r] = 1; // Left piece has tab pointing right into right piece
      } else if (cols === 2 && rows === 2) {
        // Match user's 2x2 diagram exactly
        vEdges[c][r] = r === 0 ? 1 : -1;
      } else {
        vEdges[c][r] = (c + r) % 2 === 0 ? 1 : -1;
      }
    }
  }

  const hEdges: number[][] = [];
  for (let c = 0; c < cols; c++) {
    hEdges[c] = [];
    for (let r = 0; r < rows - 1; r++) {
      if (cols === 2 && rows === 2) {
        // Match user's 2x2 diagram exactly
        hEdges[c][r] = c === 0 ? -1 : 1;
      } else {
        hEdges[c][r] = (c + r) % 2 === 1 ? 1 : -1;
      }
    }
  }

  return { vEdges, hEdges };
}

/**
 * Draws a single jigsaw edge between (x1, y1) and (x2, y2).
 * If tabDir === 0: draws a straight line.
 * If tabDir !== 0: draws the classic bulbous jigsaw tab with narrow neck and rounded head.
 */
export function drawJigsawEdge(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tabDir: number,
  cellW: number,
  cellH: number,
): string {
  if (tabDir === 0) {
    return `L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return `L ${x2.toFixed(2)} ${y2.toFixed(2)}`;

  const tx = dx / len;
  const ty = dy / len;
  // Left normal vector (points outward when traversing clockwise)
  const nx = -ty * tabDir;
  const ny = tx * tabDir;
  const tabHeight = 0.2 * Math.min(cellW, cellH);

  const pt = (u: number, v: number): string => {
    const px = x1 + u * dx + v * tabHeight * nx;
    const py = y1 + u * dy + v * tabHeight * ny;
    return `${px.toFixed(2)} ${py.toFixed(2)}`;
  };

  return [
    `L ${pt(0.35, 0)}`,
    `C ${pt(0.36, 0.05)} ${pt(0.4, 0.1)} ${pt(0.4, 0.15)}`,
    `C ${pt(0.31, 0.2)} ${pt(0.31, 0.9)} ${pt(0.42, 0.98)}`,
    `C ${pt(0.47, 1.02)} ${pt(0.53, 1.02)} ${pt(0.58, 0.98)}`,
    `C ${pt(0.69, 0.9)} ${pt(0.69, 0.2)} ${pt(0.6, 0.15)}`,
    `C ${pt(0.6, 0.1)} ${pt(0.64, 0.05)} ${pt(0.65, 0)}`,
    `L ${pt(1.0, 0)}`,
  ].join(" ");
}

/**
 * Builds the complete closed SVG path for a single jigsaw piece (col, row).
 */
export function buildPiecePath(
  c: number,
  r: number,
  cols: number,
  rows: number,
  W: number,
  H: number,
  edges: JigsawEdges,
): string {
  const cellW = W / cols;
  const cellH = H / rows;

  const tlX = c * cellW;
  const tlY = r * cellH;
  const trX = (c + 1) * cellW;
  const trY = r * cellH;
  const brX = (c + 1) * cellW;
  const brY = (r + 1) * cellH;
  const blX = c * cellW;
  const blY = (r + 1) * cellH;

  // Top edge: TL -> TR
  const topTab = r === 0 ? 0 : edges.hEdges[c][r - 1] === 1 ? -1 : 1;
  const topCmd = drawJigsawEdge(tlX, tlY, trX, trY, topTab, cellW, cellH);

  // Right edge: TR -> BR
  const rightTab = c === cols - 1 ? 0 : edges.vEdges[c][r];
  const rightCmd = drawJigsawEdge(trX, trY, brX, brY, rightTab, cellW, cellH);

  // Bottom edge: BR -> BL
  const bottomTab = r === rows - 1 ? 0 : edges.hEdges[c][r] === 1 ? 1 : -1;
  const bottomCmd = drawJigsawEdge(brX, brY, blX, blY, bottomTab, cellW, cellH);

  // Left edge: BL -> TL
  const leftTab = c === 0 ? 0 : edges.vEdges[c - 1][r] === 1 ? -1 : 1;
  const leftCmd = drawJigsawEdge(blX, blY, tlX, tlY, leftTab, cellW, cellH);

  return `M ${tlX.toFixed(2)} ${tlY.toFixed(2)} ${topCmd} ${rightCmd} ${bottomCmd} ${leftCmd} Z`;
}

/**
 * Calculates the bounding box of a piece including padding for protruding tabs.
 */
export function buildPieceBBox(
  c: number,
  r: number,
  cols: number,
  rows: number,
  W: number,
  H: number,
) {
  const cellW = W / cols;
  const cellH = H / rows;
  const pad = Math.ceil(0.24 * Math.min(cellW, cellH));

  const minX = Math.max(0, c * cellW - pad);
  const minY = Math.max(0, r * cellH - pad);
  const maxX = Math.min(W, (c + 1) * cellW + pad);
  const maxY = Math.min(H, (r + 1) * cellH + pad);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    pad,
    cellW,
    cellH,
    center: {
      x: (c + 0.5) * cellW,
      y: (r + 0.5) * cellH,
    },
  };
}

/**
 * Returns SVG path containing all internal jigsaw cut lines for the board outline guide.
 */
export function buildInternalLinesPath(
  cols: number,
  rows: number,
  W: number,
  H: number,
  edges: JigsawEdges,
): string {
  const cellW = W / cols;
  const cellH = H / rows;
  const paths: string[] = [];

  // Vertical cut lines
  for (let c = 0; c < cols - 1; c++) {
    const x = (c + 1) * cellW;
    for (let r = 0; r < rows; r++) {
      const y1 = r * cellH;
      const y2 = (r + 1) * cellH;
      const tabDir = edges.vEdges[c][r];
      paths.push(
        `M ${x.toFixed(2)} ${y1.toFixed(2)} ${drawJigsawEdge(x, y1, x, y2, tabDir, cellW, cellH)}`,
      );
    }
  }

  // Horizontal cut lines
  for (let r = 0; r < rows - 1; r++) {
    const y = (r + 1) * cellH;
    for (let c = 0; c < cols; c++) {
      const x1 = c * cellW;
      const x2 = (c + 1) * cellW;
      const tabDir = edges.hEdges[c][r] === 1 ? -1 : 1; // Left normal pointing down
      paths.push(
        `M ${x1.toFixed(2)} ${y.toFixed(2)} ${drawJigsawEdge(x1, y, x2, y, tabDir, cellW, cellH)}`,
      );
    }
  }

  return paths.join(" ");
}
