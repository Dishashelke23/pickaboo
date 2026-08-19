export type LayoutTheme = "hearts" | null;
export type FooterSize = "none" | "small" | "normal";

export type LayoutOption = {
  id: string;
  name: string;
  poses: number;
  cols: number;
  rows: number;
  aspect: string;
  aspectValue: number;
  sizeLabel: string;
  footerSize: FooterSize;
  padding: number;
  gap: number;
  themeOverlay: LayoutTheme;
};

export const LAYOUTS: LayoutOption[] = [
  { id: "classic", name: "Classic Strip", poses: 4, cols: 1, rows: 4, aspect: "2 / 6", aspectValue: 2 / 6, sizeLabel: "6×2 Strip", footerSize: "normal", padding: 5, gap: 3, themeOverlay: null },
  { id: "mini", name: "Mini Strip", poses: 2, cols: 1, rows: 2, aspect: "2 / 3.4", aspectValue: 2 / 3.4, sizeLabel: "3.4×2 Strip", footerSize: "normal", padding: 5, gap: 3, themeOverlay: null },
  { id: "trio", name: "Trio Strip", poses: 3, cols: 1, rows: 3, aspect: "2 / 6", aspectValue: 2 / 6, sizeLabel: "6×2 Strip", footerSize: "normal", padding: 5, gap: 3, themeOverlay: null },
  { id: "hearts", name: "Hearts Layout", poses: 4, cols: 1, rows: 4, aspect: "2 / 6", aspectValue: 2 / 6, sizeLabel: "6×2 Strip", footerSize: "normal", padding: 5, gap: 3, themeOverlay: "hearts" },
  { id: "vintage", name: "Vintage Layout", poses: 4, cols: 1, rows: 4, aspect: "2 / 6", aspectValue: 2 / 6, sizeLabel: "6×2 Strip", footerSize: "small", padding: 0, gap: 0, themeOverlay: null },
  { id: "grid", name: "Grid Layout", poses: 6, cols: 2, rows: 3, aspect: "4 / 6", aspectValue: 4 / 6, sizeLabel: "6×4 Strip", footerSize: "none", padding: 4, gap: 2, themeOverlay: null },
  { id: "duo", name: "Duo Layout", poses: 4, cols: 2, rows: 2, aspect: "1 / 1", aspectValue: 1, sizeLabel: "4×4 Strip", footerSize: "none", padding: 4, gap: 3, themeOverlay: null },
  { id: "story", name: "Color Room", poses: 3, cols: 1, rows: 3, aspect: "9 / 16", aspectValue: 9 / 16, sizeLabel: "9×16 Story", footerSize: "none", padding: 4, gap: 2, themeOverlay: null },
];

export function getLayout(id: string | null): LayoutOption {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export function getSlotAspect(layout: LayoutOption): number {
  if (layout.cols === 1) return 3 / 4;

  const footerSpace =
    layout.footerSize === "normal" ? 8 : layout.footerSize === "small" ? 6 : 0;
  const usableW = 100 - layout.padding * 2 - layout.gap * (layout.cols - 1);
  const usableH = 100 - layout.padding * 2 - footerSpace - layout.gap * (layout.rows - 1);
  const cellWpct = usableW / layout.cols;
  const cellHpct = usableH / layout.rows;
  return (cellWpct * layout.aspectValue) / cellHpct;
}

