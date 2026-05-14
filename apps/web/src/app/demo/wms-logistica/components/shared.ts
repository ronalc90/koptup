export type Bin = {
  id: string;
  zone: 'A' | 'B' | 'C' | 'Q';
  rotation: 'high' | 'medium' | 'low' | 'quarantine' | 'empty';
  sku?: string;
  stock?: number;
  lastMove?: string;
};

export type PickingMode = 'wave' | 'batch' | 'zone' | 'cluster';

export const ROTATION_STYLES: Record<Bin['rotation'], string> = {
  high: 'bg-emerald-500/80 hover:bg-emerald-400 border-emerald-300',
  medium: 'bg-sky-500/70 hover:bg-sky-400 border-sky-300',
  low: 'bg-slate-400/70 hover:bg-slate-300 border-slate-300 dark:bg-slate-500/70',
  quarantine: 'bg-amber-500/80 hover:bg-amber-400 border-amber-300',
  empty:
    'bg-secondary-200 dark:bg-secondary-700 hover:bg-secondary-300 dark:hover:bg-secondary-600 border-secondary-300 dark:border-secondary-600',
};

export const STATUS_TONE: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default' | 'primary'> = {
  expected: 'info',
  arrived: 'warning',
  checking: 'warning',
  completed: 'success',
  discrepancy: 'danger',
  pending: 'default',
  inProgress: 'warning',
  picked: 'success',
  scheduled: 'info',
  done: 'success',
  requested: 'info',
  approved: 'warning',
  received: 'primary',
  refunded: 'success',
  rejected: 'danger',
  arrivedDriver: 'warning',
  delivered: 'success',
  failed: 'danger',
  inTransit: 'info',
  outForDelivery: 'warning',
  exception: 'danger',
};

export function buildBins(seed: number): Bin[] {
  const zones: Bin['zone'][] = ['A', 'B', 'C'];
  const out: Bin[] = [];
  let counter = 0;
  zones.forEach((zone) => {
    for (let row = 1; row <= 4; row++) {
      for (let col = 1; col <= 8; col++) {
        counter++;
        const r = (counter * 9301 + seed * 49297) % 233280;
        const rng = r / 233280;
        let rotation: Bin['rotation'] = 'empty';
        if (rng > 0.92) rotation = 'empty';
        else if (zone === 'A') rotation = rng > 0.35 ? 'high' : 'medium';
        else if (zone === 'B') rotation = rng > 0.5 ? 'medium' : 'low';
        else rotation = rng > 0.6 ? 'low' : 'medium';
        const filled = rotation !== 'empty';
        out.push({
          id: `${zone}-${row.toString().padStart(2, '0')}-${col.toString().padStart(2, '0')}`,
          zone,
          rotation,
          sku: filled ? `SKU-${(8000 + counter + seed * 17).toString()}` : undefined,
          stock: filled ? Math.round(40 + rng * 320) : undefined,
          lastMove: filled ? `${Math.round(1 + rng * 12)}h` : undefined,
        });
      }
    }
  });
  for (let col = 1; col <= 4; col++) {
    counter++;
    out.push({
      id: `Q-01-${col.toString().padStart(2, '0')}`,
      zone: 'Q',
      rotation: 'quarantine',
      sku: `SKU-${(7000 + col + seed).toString()}`,
      stock: 12 + col * 3,
      lastMove: `${col + 2}d`,
    });
  }
  return out;
}

export const WAREHOUSES: { id: 'bog01' | 'mde02' | 'bar03'; occupancy: number; picksDay: number; accuracy: number; skus: number }[] = [
  { id: 'bog01', occupancy: 82, picksDay: 4820, accuracy: 99.6, skus: 12450 },
  { id: 'mde02', occupancy: 67, picksDay: 2980, accuracy: 99.2, skus: 6800 },
  { id: 'bar03', occupancy: 41, picksDay: 1560, accuracy: 98.7, skus: 2150 },
];
