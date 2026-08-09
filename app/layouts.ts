export type LayoutTheme = "hearts" | null;

export type LayoutOption = {
  id: string;
  name: string;
  poses: number;
  cols: number;
  rows: number;
  aspect: string;
  aspectValue: number;
  sizeLabel: string;
  hasFooter: boolean;
  themeOverlay: LayoutTheme;
};

export const LAYOUTS: LayoutOption[] = [
  {
    id: "classic",
    name: "Classic Strip",
    poses: 4,
    cols: 1,
    rows: 4,
    aspect: "2 / 6",
    aspectValue: 2 / 6,
    sizeLabel: "6×2 Strip",
    hasFooter: true,
    themeOverlay: null,
  },
  {
    id: "trio",
    name: "Trio Strip",
    poses: 3,
    cols: 1,
    rows: 3,
    aspect: "2 / 6",
    aspectValue: 2 / 6,
    sizeLabel: "6×2 Strip",
    hasFooter: true,
    themeOverlay: null,
  },
  {
    id: "hearts",
    name: "Heart Filter Layout",
    poses: 4,
    cols: 1,
    rows: 4,
    aspect: "2 / 6",
    aspectValue: 2 / 6,
    sizeLabel: "6×2 Strip",
    hasFooter: true,
    themeOverlay: "hearts",
  },
  {
    id: "grid",
    name: "Grid Layout",
    poses: 6,
    cols: 2,
    rows: 3,
    aspect: "4 / 6",
    aspectValue: 4 / 6,
    sizeLabel: "6×4 Strip",
    hasFooter: false,
    themeOverlay: null,
  },
  {
    id: "duo",
    name: "Duo Layout",
    poses: 4,
    cols: 2,
    rows: 2,
    aspect: "1 / 1",
    aspectValue: 1,
    sizeLabel: "4×4 Strip",
    hasFooter: false,
    themeOverlay: null,
  },
  {
    id: "vintage",
    name: "Vintage Layout",
    poses: 4,
    cols: 1,
    rows: 4,
    aspect: "9 / 16",
    aspectValue: 4 / 6,
    sizeLabel: "4×6 Story",
    hasFooter: true,
    themeOverlay: null,
  },
  {
    id: "story",
    name: "Story Layout",
    poses: 4,
    cols: 1,
    rows: 4,
    aspect: "9 / 16",
    aspectValue: 9 / 16,
    sizeLabel: "9×16 Story",
    hasFooter: true,
    themeOverlay: null,
  },
];

export function getLayout(id: string | null): LayoutOption {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}