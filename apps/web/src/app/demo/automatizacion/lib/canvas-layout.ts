/**
 * Distribución del lienzo «en serpiente»: la primera fila va de izquierda a
 * derecha, la segunda de derecha a izquierda, y así. Las flechas siguen el
 * orden de ejecución y nunca cruzan un nodo. El número de columnas depende del
 * ancho disponible (en el celular queda una sola columna).
 */

export const NODE_W = 184;
export const NODE_H = 72;
export const GAP_X = 60;
export const GAP_Y = 64;
export const PAD = 24;
/** Píldora de la rama «Si no» de una condición. */
export const BRANCH_W = 84;
export const BRANCH_H = 20;

export interface Pos {
  x: number;
  y: number;
  row: number;
  col: number;
  dir: 1 | -1;
}

export interface Layout {
  cols: number;
  nodeW: number;
  positions: Pos[];
  width: number;
  height: number;
}

export function computeLayout(count: number, available: number): Layout {
  const usable = Math.max(160, available - PAD * 2);
  const cols = Math.max(1, Math.floor((usable + GAP_X) / (Math.min(NODE_W, usable) + GAP_X)));
  // En una sola columna (celular) los nodos aprovechan el ancho.
  const nodeW = cols === 1 ? Math.min(320, usable) : NODE_W;
  const positions: Pos[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const k = i % cols;
    const dir: 1 | -1 = row % 2 === 0 ? 1 : -1;
    const col = dir === 1 ? k : cols - 1 - k;
    positions.push({ x: PAD + col * (nodeW + GAP_X), y: PAD + row * (NODE_H + GAP_Y), row, col, dir });
  }
  const rows = Math.max(1, Math.ceil(count / cols));
  const usedCols = Math.min(cols, Math.max(1, count));
  return {
    cols,
    nodeW,
    positions,
    width: PAD * 2 + usedCols * nodeW + (usedCols - 1) * GAP_X,
    height: PAD * 2 + rows * NODE_H + (rows - 1) * GAP_Y + BRANCH_H + 16,
  };
}

/** Trazo SVG de la flecha entre el nodo i y el i+1. */
export function edgePath(a: Pos, b: Pos, nodeW: number): string {
  if (a.row === b.row) {
    const y = a.y + NODE_H / 2;
    const x1 = a.dir === 1 ? a.x + nodeW : a.x;
    const x2 = a.dir === 1 ? b.x : b.x + nodeW;
    return `M ${x1} ${y} L ${x2} ${y}`;
  }
  const x = a.x + nodeW / 2;
  return `M ${x} ${a.y + NODE_H} L ${b.x + nodeW / 2} ${b.y}`;
}

/** Posición de la píldora de la rama «Si no» (abajo a la derecha del nodo). */
export function branchPos(p: Pos, nodeW: number) {
  return { x: p.x + nodeW - BRANCH_W - 2, y: p.y + NODE_H + 16 };
}

/**
 * Índice donde insertar un paso soltado en (px, py), en coordenadas del
 * contenido. Nunca antes del disparador (índice mínimo 1).
 */
export function dropIndex(layout: Layout, px: number, py: number): number {
  const n = layout.positions.length;
  if (n === 0) return 0;
  let best = 0;
  let bestD = Infinity;
  layout.positions.forEach((p, i) => {
    const cx = p.x + layout.nodeW / 2;
    const cy = p.y + NODE_H / 2;
    const d = (px - cx) ** 2 + ((py - cy) * 1.6) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  const p = layout.positions[best];
  const cx = p.x + layout.nodeW / 2;
  const cy = p.y + NODE_H / 2;
  const rowEnd = best === n - 1 || layout.positions[best + 1].row !== p.row;
  const rowStart = best === 0 || layout.positions[best - 1].row !== p.row;
  let after: boolean;
  if (layout.cols === 1) after = py > cy;
  // En el hueco entre filas manda la flecha vertical: debajo del final de una fila es «después».
  else if (py > p.y + NODE_H && rowEnd) after = true;
  else if (py < p.y && rowStart && p.row > 0) after = false;
  else after = p.dir === 1 ? px > cx : px < cx;
  return Math.max(1, Math.min(n, after ? best + 1 : best));
}
