const PALETTE = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#3b82f6', // blue
  '#ef4444', // red
  '#14b8a6', // teal
];

export function getBookingColor(bookingId: string): string {
  let h = 0;
  for (const c of bookingId) h = (h * 31 + c.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export const STANDALONE_COLOR = '#94a3b8';
