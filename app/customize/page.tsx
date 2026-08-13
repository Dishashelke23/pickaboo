"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas-pro";
import { LAYOUTS, LayoutOption, getLayout } from "../layouts";

type Slot = { xPct: number; yPct: number; wPct: number; hPct: number };
type StickerEl = { id: string; kind: "sticker"; stickerId: string; xPct: number; yPct: number; size: number };
type TextEl = { id: string; kind: "text"; text: string; xPct: number; yPct: number; size: number; color: string; fontId: string };
type CanvasEl = StickerEl | TextEl;
type BgChoice = { backgroundColor?: string; backgroundImage?: string; backgroundSize?: string; dark: boolean };
type FrameStyle = { id: string; label: string; outerRadius: number; photoRadius: number; photoBorder: boolean };

const FRAME_STYLES: FrameStyle[] = [
  { id: "sharp", label: "Sharp", outerRadius: 4, photoRadius: 0, photoBorder: false },
  { id: "rounded", label: "Rounded", outerRadius: 24, photoRadius: 8, photoBorder: false },
  { id: "soft", label: "Soft", outerRadius: 36, photoRadius: 16, photoBorder: false },
  { id: "film", label: "Film Edge", outerRadius: 4, photoRadius: 0, photoBorder: true },
];

const SOLIDS = [
  { id: "paper", label: "Paper", backgroundColor: "#FBF6EC", dark: false },
  { id: "white", label: "White", backgroundColor: "#FFFFFF", dark: false },
  { id: "ink", label: "Ink", backgroundColor: "#221019", dark: true },
  { id: "curtain", label: "Curtain", backgroundColor: "#B3222B", dark: true },
  { id: "bubblegum", label: "Bubblegum", backgroundColor: "#F2789F", dark: false },
  { id: "flashbulb", label: "Flashbulb", backgroundColor: "#F4B740", dark: false },
  { id: "mint", label: "Mint", backgroundColor: "#6FBFA0", dark: false },
];

const GRADIENTS = [
  { id: "sunset", label: "Sunset", backgroundImage: "linear-gradient(135deg, #F2789F, #F4B740)", dark: false },
  { id: "dusk", label: "Dusk", backgroundImage: "linear-gradient(135deg, #221019, #B3222B)", dark: true },
  { id: "ocean", label: "Ocean", backgroundImage: "linear-gradient(135deg, #6FBFA0, #221019)", dark: true },
  { id: "candy", label: "Candy", backgroundImage: "linear-gradient(135deg, #F2789F, #F4B740, #6FBFA0)", dark: false },
  { id: "peach", label: "Peach", backgroundImage: "linear-gradient(160deg, #FBF6EC, #F2789F)", dark: false },
  { id: "midnight", label: "Midnight", backgroundImage: "linear-gradient(160deg, #221019, #7C171F)", dark: true },
];

function svgToDataUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
function svgToImgSrc(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const PATTERNS = [
  { id: "dots", label: "Dots", dark: false, backgroundColor: "#FBF6EC", backgroundImage: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="2" cy="2" r="1.5" fill="#22101933"/></svg>`), backgroundSize: "16px 16px" },
  { id: "dots-dark", label: "Dots Dark", dark: true, backgroundColor: "#221019", backgroundImage: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="2" cy="2" r="1.5" fill="#FBF6EC33"/></svg>`), backgroundSize: "16px 16px" },
  { id: "stripes", label: "Stripes", dark: false, backgroundColor: "#FBF6EC", backgroundImage: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M0 16L16 0" stroke="#B3222B33" stroke-width="3"/><path d="M-4 4L4 -4" stroke="#B3222B33" stroke-width="3"/><path d="M12 20L20 12" stroke="#B3222B33" stroke-width="3"/></svg>`), backgroundSize: "16px 16px" },
  { id: "grid", label: "Grid", dark: false, backgroundColor: "#FFFFFF", backgroundImage: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><path d="M14 0H0V14" fill="none" stroke="#22101922" stroke-width="1"/></svg>`), backgroundSize: "14px 14px" },
  { id: "checker", label: "Checkered", dark: false, backgroundColor: "#FFFFFF", backgroundImage: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="10" height="10" fill="#22101922"/><rect x="10" y="10" width="10" height="10" fill="#22101922"/></svg>`), backgroundSize: "20px 20px" },
  { id: "gingham", label: "Gingham", dark: false, backgroundColor: "#FBF6EC", backgroundImage: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="10" height="10" fill="#B3222B22"/><rect x="10" y="10" width="10" height="10" fill="#B3222B22"/><rect x="5" y="5" width="10" height="10" fill="#B3222B33"/></svg>`), backgroundSize: "20px 20px" },
  { id: "plaid", label: "Plaid", dark: false, backgroundColor: "#FBF6EC", backgroundImage: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect y="4" width="24" height="3" fill="#22101922"/><rect y="16" width="24" height="3" fill="#22101922"/><rect x="4" width="3" height="24" fill="#B3222B22"/><rect x="16" width="3" height="24" fill="#B3222B22"/></svg>`), backgroundSize: "24px 24px" },
  {
    id: "leopard",
    label: "Leopard",
    dark: false,
    backgroundColor: "#E8C39E",
    backgroundImage: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><g fill="none" stroke="#6B4226" stroke-width="2"><path d="M8 10 q3 -4 7 -1 q3 3 -1 6 q-4 2 -6 -2 q-1 -2 0 -3z"/><path d="M25 6 q3 -3 6 0 q2 3 -1 5 q-3 2 -5 -1 q-1 -2 0 -4z"/><path d="M14 25 q3 -3 6 0 q2 3 -1 5 q-3 2 -5 -1 q-1 -2 0 -4z"/><path d="M30 22 q3 -3 6 0 q2 3 -1 5 q-3 2 -5 -1 q-1 -2 0 -4z"/><path d="M4 30 q2 -2 4 0 q1 2 -1 3 q-2 1 -3 -1 q-1 -1 0 -2z"/></g></svg>`
    ),
    backgroundSize: "40px 40px",
  },
  {
    id: "cow",
    label: "Cow Print",
    dark: false,
    backgroundColor: "#FFFFFF",
    backgroundImage: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><path d="M4 6 q6 -6 12 -2 q4 3 0 8 q-5 4 -10 0 q-4 -3 -2 -6z" fill="#221019"/><path d="M26 20 q7 -5 13 0 q3 4 -2 8 q-6 4 -11 -1 q-3 -3 0 -7z" fill="#221019"/><path d="M8 28 q5 -4 10 0 q3 3 -1 6 q-4 3 -8 -1 q-2 -2 -1 -5z" fill="#221019"/></svg>`
    ),
    backgroundSize: "44px 44px",
  },
  {
    id: "galaxy",
    label: "Galaxy",
    dark: true,
    backgroundColor: "#221019",
    backgroundImage: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><g fill="#FBF6EC"><circle cx="5" cy="6" r="0.8"/><circle cx="18" cy="4" r="0.6"/><circle cx="24" cy="14" r="1"/><circle cx="10" cy="20" r="0.7"/><circle cx="22" cy="24" r="0.6"/><circle cx="2" cy="16" r="0.5"/></g></svg>`
    ),
    backgroundSize: "30px 30px",
  },
];

const STICKERS = [
  { id: "bow", label: "Bow", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32"><path d="M24 16 C24 16 18 4 8 4 C2 4 0 9 0 12 C0 17 6 20 12 20 C18 20 24 16 24 16 Z" fill="#F2789F" stroke="#B3222B" stroke-width="1.5"/><path d="M24 16 C24 16 30 4 40 4 C46 4 48 9 48 12 C48 17 42 20 36 20 C30 20 24 16 24 16 Z" fill="#F2789F" stroke="#B3222B" stroke-width="1.5"/><circle cx="24" cy="16" r="4" fill="#B3222B"/></svg>` },
  { id: "heart", label: "Heart", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 28"><path d="M16 26 C4 18 0 11 0 6.5 C0 2 3.5 0 7 0 C10 0 13 1.5 16 6 C19 1.5 22 0 25 0 C28.5 0 32 2 32 6.5 C32 11 28 18 16 26 Z" fill="#F2789F" stroke="#B3222B" stroke-width="1"/></svg>` },
  { id: "star", label: "Star", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 1 L15 9 L23 9 L16.5 14 L19 22 L12 17 L5 22 L7.5 14 L1 9 L9 9 Z" fill="#F4B740" stroke="#B3222B" stroke-width="1"/></svg>` },
  { id: "sparkle", label: "Sparkle", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 0 C12 6 14 10 24 12 C14 14 12 18 12 24 C12 18 10 14 0 12 C10 10 12 6 12 0 Z" fill="#FBF6EC" stroke="#F4B740" stroke-width="1"/></svg>` },
  { id: "flower", label: "Flower", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><g fill="#F2789F" stroke="#B3222B" stroke-width="1"><circle cx="20" cy="8" r="7"/><circle cx="32" cy="16" r="7"/><circle cx="27" cy="30" r="7"/><circle cx="13" cy="30" r="7"/><circle cx="8" cy="16" r="7"/></g><circle cx="20" cy="20" r="6" fill="#F4B740"/></svg>` },
  { id: "cloud", label: "Cloud", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 28"><path d="M12 22 C4 22 0 17 4 12 C2 5 12 2 16 7 C20 1 32 2 32 10 C40 8 44 16 38 20 C40 24 34 26 30 24 C26 27 14 27 12 22 Z" fill="#FFFFFF" stroke="#221019" stroke-width="1.2"/></svg>` },
  { id: "butterfly", label: "Butterfly", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 32"><g stroke="#221019" stroke-width="1"><path d="M20 6 C14 -2 2 0 4 10 C5 16 14 16 20 10 Z" fill="#6FBFA0"/><path d="M20 6 C26 -2 38 0 36 10 C35 16 26 16 20 10 Z" fill="#6FBFA0"/><path d="M20 10 C14 18 4 20 6 27 C8 32 16 26 20 18 Z" fill="#F2789F"/><path d="M20 10 C26 18 36 20 34 27 C32 32 24 26 20 18 Z" fill="#F2789F"/></g><line x1="20" y1="4" x2="20" y2="20" stroke="#221019" stroke-width="1.5"/></svg>` },
  { id: "crown", label: "Crown", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 28"><path d="M2 26 L2 12 L10 18 L20 6 L30 18 L38 12 L38 26 Z" fill="#F4B740" stroke="#B3222B" stroke-width="1.2"/><circle cx="2" cy="10" r="3" fill="#F2789F"/><circle cx="20" cy="4" r="3" fill="#F2789F"/><circle cx="38" cy="10" r="3" fill="#F2789F"/></svg>` },
  { id: "ribbon", label: "Ribbon", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 24"><path d="M4 2 L36 2 L36 18 L20 24 L4 18 Z" fill="#B3222B"/><path d="M4 18 L4 24 L10 20 Z" fill="#7C171F"/><path d="M36 18 L36 24 L30 20 Z" fill="#7C171F"/></svg>` },
  { id: "moon", label: "Moon", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 3 C11 3 6 8 6 14 C6 20 11 21 15 19 C10 18 7 14 8 9 C9 5 13 3 17 3 Z" fill="#F4B740" stroke="#B3222B" stroke-width="0.8"/></svg>` },
  { id: "rabbit", label: "Rabbit", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 44"><ellipse cx="12" cy="8" rx="4" ry="12" fill="#FFFFFF" stroke="#221019" stroke-width="1"/><ellipse cx="28" cy="8" rx="4" ry="12" fill="#FFFFFF" stroke="#221019" stroke-width="1"/><ellipse cx="12" cy="9" rx="1.8" ry="8" fill="#F2789F"/><ellipse cx="28" cy="9" rx="1.8" ry="8" fill="#F2789F"/><circle cx="20" cy="28" r="14" fill="#FFFFFF" stroke="#221019" stroke-width="1"/><circle cx="15" cy="26" r="1.6" fill="#221019"/><circle cx="25" cy="26" r="1.6" fill="#221019"/><ellipse cx="20" cy="31" rx="1.8" ry="1.3" fill="#F2789F"/></svg>` },
  { id: "clover", label: "Clover", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="#6FBFA0" stroke="#3F7A5C" stroke-width="1"><path d="M16 16 C16 8 8 6 6 12 C4 18 12 18 16 16Z"/><path d="M16 16 C24 8 26 16 20 18 C14 20 12 18 16 16Z"/><path d="M16 16 C24 20 22 28 16 26 C10 24 12 18 16 16Z"/><path d="M16 16 C8 20 6 26 12 28 C18 30 18 20 16 16Z"/></g><line x1="16" y1="16" x2="16" y2="30" stroke="#3F7A5C" stroke-width="1.5"/></svg>` },
  { id: "lips", label: "Lips", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 24"><path d="M20 4 C14 0 4 4 2 10 C1 13 4 14 8 12 C13 10 17 9 20 12 C23 9 27 10 32 12 C36 14 39 13 38 10 C36 4 26 0 20 4Z" fill="#B3222B" stroke="#7C171F" stroke-width="1"/><path d="M8 12 C13 15 27 15 32 12 C29 18 11 18 8 12Z" fill="#7C171F"/></svg>` },
  { id: "seal", label: "Seal", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 32"><ellipse cx="18" cy="18" rx="16" ry="12" fill="#D8D3C8" stroke="#221019" stroke-width="1"/><path d="M30 22 C36 22 38 28 32 28 C28 28 26 24 30 22Z" fill="#D8D3C8" stroke="#221019" stroke-width="1"/><circle cx="12" cy="16" r="1.5" fill="#221019"/><circle cx="20" cy="16" r="1.5" fill="#221019"/><ellipse cx="16" cy="21" rx="2" ry="1.3" fill="#221019"/></svg>` },
  { id: "chick", label: "Chick", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="20" r="11" fill="#F4B740" stroke="#B3222B" stroke-width="1"/><circle cx="16" cy="9" r="7" fill="#F4B740" stroke="#B3222B" stroke-width="1"/><circle cx="13" cy="8" r="1.2" fill="#221019"/><circle cx="19" cy="8" r="1.2" fill="#221019"/><path d="M14 11 L18 11 L16 14Z" fill="#B3222B"/></svg>` },
  { id: "bear", label: "Bear", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="9" cy="8" r="6" fill="#C99866" stroke="#7C5A3A" stroke-width="1"/><circle cx="31" cy="8" r="6" fill="#C99866" stroke="#7C5A3A" stroke-width="1"/><circle cx="20" cy="22" r="16" fill="#C99866" stroke="#7C5A3A" stroke-width="1"/><ellipse cx="20" cy="27" rx="7" ry="5" fill="#E8CBA6"/><circle cx="14" cy="19" r="1.6" fill="#221019"/><circle cx="26" cy="19" r="1.6" fill="#221019"/><ellipse cx="20" cy="24" rx="1.6" ry="1.2" fill="#221019"/></svg>` },
  { id: "cat", label: "Cat", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 36"><path d="M4 4 L14 12 L6 16Z" fill="#FBF6EC" stroke="#221019" stroke-width="1"/><path d="M36 4 L26 12 L34 16Z" fill="#FBF6EC" stroke="#221019" stroke-width="1"/><circle cx="20" cy="20" r="14" fill="#FBF6EC" stroke="#221019" stroke-width="1"/><circle cx="15" cy="18" r="1.6" fill="#221019"/><circle cx="25" cy="18" r="1.6" fill="#221019"/><path d="M18 23 Q20 25 22 23" stroke="#221019" stroke-width="1" fill="none"/></svg>` },
  { id: "dog", label: "Dog", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 36"><path d="M6 6 Q0 18 8 24 Q10 14 14 10Z" fill="#C99866" stroke="#7C5A3A" stroke-width="1"/><path d="M34 6 Q40 18 32 24 Q30 14 26 10Z" fill="#C99866" stroke="#7C5A3A" stroke-width="1"/><circle cx="20" cy="20" r="13" fill="#E8CBA6" stroke="#7C5A3A" stroke-width="1"/><circle cx="15" cy="18" r="1.6" fill="#221019"/><circle cx="25" cy="18" r="1.6" fill="#221019"/><ellipse cx="20" cy="24" rx="2.4" ry="1.6" fill="#221019"/></svg>` },
  { id: "strawberry", label: "Strawberry", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 36"><path d="M16 34 C4 24 2 12 16 12 C30 12 28 24 16 34Z" fill="#B3222B" stroke="#7C171F" stroke-width="1"/><g fill="#F4B740"><circle cx="11" cy="18" r="1"/><circle cx="16" cy="16" r="1"/><circle cx="21" cy="18" r="1"/><circle cx="9" cy="24" r="1"/><circle cx="16" cy="23" r="1"/><circle cx="23" cy="24" r="1"/><circle cx="13" cy="29" r="1"/><circle cx="19" cy="29" r="1"/></g><path d="M16 12 L10 4 L16 8 L22 4Z" fill="#6FBFA0"/></svg>` },
  { id: "donut", label: "Donut", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#E8B896" stroke="#B3222B" stroke-width="1"/><circle cx="20" cy="20" r="6" fill="#FBF6EC"/><path d="M20 4 A16 16 0 0 1 36 20" fill="none" stroke="#F2789F" stroke-width="7"/><g fill="#6FBFA0"><circle cx="14" cy="7" r="1"/><circle cx="26" cy="6" r="1"/><circle cx="31" cy="12" r="1"/></g></svg>` },
  { id: "mushroom", label: "Mushroom", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 36"><path d="M4 16 C4 4 28 4 28 16 Z" fill="#B3222B" stroke="#7C171F" stroke-width="1"/><g fill="#FFFFFF"><circle cx="10" cy="10" r="2"/><circle cx="20" cy="8" r="2"/><circle cx="16" cy="13" r="1.5"/></g><rect x="10" y="16" width="12" height="16" rx="4" fill="#FBF6EC" stroke="#221019" stroke-width="1"/></svg>` },
  { id: "gem", label: "Gem", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 28"><path d="M4 10 L10 2 L22 2 L28 10 L16 26Z" fill="#6FBFA0" stroke="#3F7A5C" stroke-width="1"/><path d="M4 10 L28 10 L16 26Z" fill="#8FD6B8"/><path d="M10 2 L16 10 L22 2" fill="none" stroke="#3F7A5C" stroke-width="0.8"/></svg>` },
  { id: "cactus", label: "Cactus", svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40"><rect x="6" y="26" width="20" height="10" rx="2" fill="#E8C39E" stroke="#B3222B" stroke-width="1"/><rect x="12" y="8" width="8" height="22" rx="4" fill="#6FBFA0" stroke="#3F7A5C" stroke-width="1"/><path d="M12 16 C4 16 4 10 8 8 C10 7 12 9 12 12Z" fill="#6FBFA0" stroke="#3F7A5C" stroke-width="1"/><path d="M20 20 C28 20 28 14 24 12 C22 11 20 13 20 16Z" fill="#6FBFA0" stroke="#3F7A5C" stroke-width="1"/></svg>` },
];

function getStickerSrc(stickerId: string): string {
  const found = STICKERS.find((s) => s.id === stickerId);
  return svgToImgSrc(found ? found.svg : STICKERS[0].svg);
}

const FONT_OPTIONS = [
  { id: "display", label: "Bungee", css: "var(--font-display)" },
  { id: "script", label: "Caveat", css: "var(--font-script)" },
  { id: "body", label: "DM Sans", css: "var(--font-body)" },
  { id: "mono", label: "Mono", css: "var(--font-mono)" },
];

function buildLayoutSlots(layout: LayoutOption, count: number): Slot[] {
  const gap = layout.gap;
  const padding = layout.padding;
  const footerSpace = layout.footerSize === "normal" ? 8 : layout.footerSize === "small" ? 6 : 0;
  const cols = layout.cols;
  const rows = layout.rows;

  if (cols === 1) {
    const usableH = 100 - padding * 2 - footerSpace - gap * (count - 1);
    const cellH = usableH / count;
    return Array.from({ length: count }, (_, i) => ({ xPct: padding, yPct: padding + i * (cellH + gap), wPct: 100 - padding * 2, hPct: cellH }));
  }

  const usableW = 100 - padding * 2 - gap * (cols - 1);
  const usableH = 100 - padding * 2 - footerSpace - gap * (rows - 1);
  const cellW = usableW / cols;
  const cellH = usableH / rows;

  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return { xPct: padding + col * (cellW + gap), yPct: padding + row * (cellH + gap), wPct: cellW, hPct: cellH };
  });
}

function getIsDark(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
}

function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function CustomizePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [captures, setCaptures] = useState<string[]>([]);
  const [layout, setLayout] = useState<LayoutOption>(LAYOUTS[0]);
  const [background, setBackground] = useState<BgChoice>({ backgroundColor: SOLIDS[0].backgroundColor, dark: SOLIDS[0].dark });
  const [frameStyle, setFrameStyle] = useState<FrameStyle>(FRAME_STYLES[1]);

  const [elements, setElements] = useState<CanvasEl[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<{ id: string; type: "drag" | "resize" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingGif, setIsExportingGif] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [gifPreviewUrl, setGifPreviewUrl] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("pickaboo-captures");
    const storedLayoutId = sessionStorage.getItem("pickaboo-layout");
    if (!stored) { router.replace("/"); return; }
    setCaptures(JSON.parse(stored));
    setLayout(getLayout(storedLayoutId));
  }, [router]);

  const slots = useMemo(() => buildLayoutSlots(layout, captures.length), [layout, captures.length]);
  const selectedEl = elements.find((el) => el.id === selectedId) ?? null;

  const canvasHeight = isDesktop
    ? `min(66vh, calc((100vw - 460px) / ${layout.aspectValue}))`
    : `min(46vh, calc((100vw - 48px) / ${layout.aspectValue}))`;

  function addSticker(stickerId: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setElements((prev) => [...prev, { id, kind: "sticker", stickerId, xPct: 50, yPct: 50, size: 44 }]);
    setSelectedId(id);
  }
  function addText() {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setElements((prev) => [...prev, { id, kind: "text", text: "your text", xPct: 50, yPct: 50, size: 28, color: "#221019", fontId: "display" }]);
    setSelectedId(id);
    setEditingId(id);
  }
  function removeElement(id: string) {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId(null);
    setEditingId(null);
  }
  function updateTextField<K extends keyof TextEl>(id: string, key: K, value: TextEl[K]) {
    setElements((prev) => prev.map((el) => (el.id === id && el.kind === "text" ? { ...el, [key]: value } : el)));
  }
  function handleElementPointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveAction({ id, type: "drag" });
    setSelectedId(id);
  }
  function handleResizePointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveAction({ id, type: "resize" });
    setSelectedId(id);
  }
  function handleCanvasPointerMove(e: React.PointerEvent) {
    if (!activeAction || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== activeAction.id) return el;
        if (activeAction.type === "drag") {
          const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
          const yPct = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
          return { ...el, xPct, yPct };
        }
        const max = el.kind === "text" ? 72 : 160;
        return { ...el, size: Math.min(max, Math.max(14, el.size + e.movementY)) };
      })
    );
  }
  function handleCanvasPointerUp() { setActiveAction(null); }
  function handleCanvasPointerDown() { setSelectedId(null); setEditingId(null); }

  async function handleDownload() {
    if (!canvasRef.current || isExporting) return;
    setSelectedId(null);
    setEditingId(null);
    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 60));
    try {
      const rendered = await html2canvas(canvasRef.current, { backgroundColor: null, scale: 3, useCORS: true });
      if (isIOSDevice()) {
        setPreviewImage(rendered.toDataURL("image/png"));
      } else {
        rendered.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "pickaboo-strip.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, "image/png");
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDownloadGif() {
    if (isExportingGif || captures.length === 0) return;
    setIsExportingGif(true);
    try {
      const GIFModule: any = await import("gif.js");
      const GIFCtor = GIFModule.default ?? GIFModule;

      const gif = new GIFCtor({
        workers: 2,
        quality: 10,
        workerScript: "/gif.worker.js",
      });

      for (const src of captures) {
        const img = await loadImageEl(src);
        gif.addFrame(img, { delay: 600 });
      }

      const blob: Blob = await new Promise((resolve) => {
        gif.on("finished", (b: Blob) => resolve(b));
        gif.render();
      });

      const url = URL.createObjectURL(blob);
      if (isIOSDevice()) {
        setGifPreviewUrl(url);
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = "pickaboo-strip.gif";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
    } catch (err) {
      console.error("GIF export failed:", err);
    } finally {
      setIsExportingGif(false);
    }
  }

  if (captures.length === 0) return null;

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center overflow-y-auto px-4 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mb-4 flex flex-col items-center sm:mb-6">
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-curtain sm:text-xs">step 3 of 3</span>
        <h1 className="mt-1 text-center font-[family-name:var(--font-display)] text-xl text-ink sm:text-3xl md:text-4xl">Make it yours</h1>
      </div>

      <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-start md:justify-center md:gap-10">
        <div
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerLeave={handleCanvasPointerUp}
          className="relative flex-shrink-0 touch-none overflow-hidden shadow-2xl ring-1 ring-ink/10"
          style={{
            height: canvasHeight,
            aspectRatio: layout.aspect,
            borderRadius: frameStyle.outerRadius,
            backgroundColor: background.backgroundColor ?? "transparent",
            backgroundImage: background.backgroundImage ?? "none",
            backgroundSize: background.backgroundSize ?? "auto",
            backgroundRepeat: background.backgroundImage ? "repeat" : "no-repeat",
          }}
        >
          {slots.map((slot, i) => (
            <img
              key={i}
              src={captures[i]}
              alt={`Shot ${i + 1}`}
              draggable={false}
              className={`absolute object-cover shadow-sm ${frameStyle.photoBorder ? "ring-1 ring-ink/15" : ""}`}
              style={{ left: `${slot.xPct}%`, top: `${slot.yPct}%`, width: `${slot.wPct}%`, height: `${slot.hPct}%`, borderRadius: frameStyle.photoRadius }}
            />
          ))}

          {layout.footerSize !== "none" && (
            <p
              className={`absolute bottom-1 left-0 right-0 text-center font-[family-name:var(--font-mono)] tracking-widest ${
                layout.footerSize === "small" ? "text-[7px]" : "text-[10px]"
              } ${background.dark ? "text-paper/50" : "text-ink/40"}`}
            >
              PICKABOO • {new Date().getFullYear()}
            </p>
          )}

          {elements.map((el) => {
            const isSelected = selectedId === el.id;
            const isEditing = editingId === el.id;
            return (
              <div
                key={el.id}
                onPointerDown={(e) => !isEditing && handleElementPointerDown(e, el.id)}
                style={{ left: `${el.xPct}%`, top: `${el.yPct}%`, transform: "translate(-50%, -50%)" }}
                className={`absolute z-10 select-none ${isEditing ? "" : "touch-none cursor-grab active:cursor-grabbing"} ${
                  isSelected ? "outline-dashed outline-2 outline-curtain outline-offset-4" : ""
                }`}
              >
                {el.kind === "sticker" && (
                  <img src={getStickerSrc(el.stickerId)} alt="" draggable={false} style={{ width: el.size, height: el.size }} className="drop-shadow-md" />
                )}
                {el.kind === "text" && !isEditing && (
                  <p style={{ fontFamily: FONT_OPTIONS.find((f) => f.id === el.fontId)?.css, color: el.color, fontSize: el.size }} className="whitespace-nowrap px-1 leading-tight">
                    {el.text || "double-tap ✎"}
                  </p>
                )}
                {el.kind === "text" && isEditing && (
                  <input
                    autoFocus
                    value={el.text}
                    onChange={(e) => updateTextField(el.id, "text", e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    style={{ fontFamily: FONT_OPTIONS.find((f) => f.id === el.fontId)?.css, color: el.color, fontSize: el.size, width: `${Math.max(4, el.text.length + 2)}ch` }}
                    className="border-b-2 border-dashed border-curtain bg-transparent text-center outline-none"
                  />
                )}
                {isSelected && !isEditing && (
                  <>
                    <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeElement(el.id); }} className="absolute right-0 top-0 flex h-6 w-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-curtain text-xs leading-none text-paper shadow-md">×</button>
                    {el.kind === "text" && (
                      <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setEditingId(el.id); }} className="absolute left-0 top-0 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-mint text-xs leading-none text-ink shadow-md">✎</button>
                    )}
                    <div onPointerDown={(e) => handleResizePointerDown(e, el.id)} className="absolute bottom-0 right-0 h-5 w-5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize touch-none rounded-full bg-flashbulb shadow-md ring-2 ring-paper" />
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex w-full max-w-xs flex-shrink-0 flex-col items-center gap-5 pb-8 md:items-start">
          <div className="w-full">
            <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-ink/50 sm:text-xs">Frame Style</p>
            <div className="flex flex-wrap gap-2">
              {FRAME_STYLES.map((fs) => (
                <button
                  key={fs.id}
                  onClick={() => setFrameStyle(fs)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    frameStyle.id === fs.id ? "bg-curtain text-paper" : "bg-white text-ink ring-1 ring-ink/10 hover:ring-curtain/40"
                  }`}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full">
            <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-ink/50 sm:text-xs">Colors &amp; Patterns</p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 md:justify-start">
              {SOLIDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setBackground({ backgroundColor: s.backgroundColor, dark: s.dark })}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 sm:h-10 sm:w-10 ${
                    background.backgroundColor === s.backgroundColor && !background.backgroundImage ? "ring-4 ring-curtain ring-offset-2 ring-offset-paper" : "ring-1 ring-ink/10"
                  }`}
                  style={{ backgroundColor: s.backgroundColor }}
                  aria-label={s.label}
                />
              ))}
              {GRADIENTS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setBackground({ backgroundImage: g.backgroundImage, dark: g.dark })}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 sm:h-10 sm:w-10 ${
                    background.backgroundImage === g.backgroundImage ? "ring-4 ring-curtain ring-offset-2 ring-offset-paper" : "ring-1 ring-ink/10"
                  }`}
                  style={{ backgroundImage: g.backgroundImage }}
                  aria-label={g.label}
                />
              ))}
              {PATTERNS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setBackground({ backgroundColor: p.backgroundColor, backgroundImage: p.backgroundImage, backgroundSize: p.backgroundSize, dark: p.dark })}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 sm:h-10 sm:w-10 ${
                    background.backgroundImage === p.backgroundImage ? "ring-4 ring-curtain ring-offset-2 ring-offset-paper" : "ring-1 ring-ink/10"
                  }`}
                  style={{ backgroundColor: p.backgroundColor, backgroundImage: p.backgroundImage, backgroundSize: p.backgroundSize }}
                  aria-label={p.label}
                />
              ))}
              <label
                className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-ink/10 transition-transform hover:scale-110 sm:h-10 sm:w-10"
                style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
              >
                <input type="color" onChange={(e) => setBackground({ backgroundColor: e.target.value, dark: getIsDark(e.target.value) })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Pick a custom background color" />
              </label>
            </div>
          </div>

          <div className="w-full">
            <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-ink/50 sm:text-xs">Stickers</p>
            <div className="grid grid-cols-6 gap-2 md:grid-cols-4">
              {STICKERS.map((s) => (
                <button key={s.id} onClick={() => addSticker(s.id)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1.5 ring-1 ring-ink/10 transition-transform hover:scale-110 active:scale-95 sm:h-10 sm:w-10" title={s.label}>
                  <img src={svgToImgSrc(s.svg)} alt={s.label} draggable={false} className="h-full w-full" />
                </button>
              ))}
            </div>
          </div>

          <div className="w-full">
            <button onClick={addText} className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-ink/10 transition-transform hover:scale-[1.02] active:scale-95">
              + Add text
            </button>
          </div>

          {selectedEl?.kind === "text" && (
            <div className="w-full rounded-xl bg-white/60 p-3 ring-1 ring-ink/10">
              <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-ink/50">Text style</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {FONT_OPTIONS.map((f) => (
                  <button key={f.id} onClick={() => updateTextField(selectedEl.id, "fontId", f.id)} style={{ fontFamily: f.css }} className={`rounded-full px-3 py-1.5 text-xs transition-colors ${selectedEl.fontId === f.id ? "bg-curtain text-paper" : "bg-paper text-ink ring-1 ring-ink/10"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {SOLIDS.map((s) => (
                  <button key={s.id} onClick={() => updateTextField(selectedEl.id, "color", s.backgroundColor)} className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${selectedEl.color === s.backgroundColor ? "ring-2 ring-curtain ring-offset-2 ring-offset-white" : "ring-1 ring-ink/10"}`} style={{ backgroundColor: s.backgroundColor }} aria-label={s.label} />
                ))}
                <label className="relative flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-ink/10" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}>
                  <input type="color" value={selectedEl.color} onChange={(e) => updateTextField(selectedEl.id, "color", e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Pick a custom text color" />
                </label>
              </div>
            </div>
          )}

          <button onClick={handleDownload} disabled={isExporting} className="w-full rounded-full bg-flashbulb px-6 py-3.5 font-[family-name:var(--font-display)] text-base text-ink shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50">
            {isExporting ? "Preparing…" : "⬇ Download PNG"}
          </button>

          <button onClick={handleDownloadGif} disabled={isExportingGif} className="w-full rounded-full bg-mint px-6 py-3.5 font-[family-name:var(--font-display)] text-base text-ink shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50">
            {isExportingGif ? "Building GIF…" : "🎞 Download GIF"}
          </button>
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-ink/95 px-6 py-10">
          <p className="max-w-xs text-center font-[family-name:var(--font-body)] text-sm text-paper">
            Press and hold the image below, then tap <strong>Save Image</strong> to add it to your Photos.
          </p>
          <img src={previewImage} alt="Your Pickaboo strip" className="max-h-[65vh] rounded-xl shadow-2xl" />
          <button onClick={() => setPreviewImage(null)} className="rounded-full bg-flashbulb px-6 py-2.5 text-sm font-medium text-ink">Done</button>
        </div>
      )}

      {gifPreviewUrl && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-ink/95 px-6 py-10">
          <p className="max-w-xs text-center font-[family-name:var(--font-body)] text-sm text-paper">
            Press and hold the GIF below, then tap <strong>Save Image</strong> to add it to your Photos.
          </p>
          <img src={gifPreviewUrl} alt="Your Pickaboo GIF" className="max-h-[65vh] rounded-xl shadow-2xl" />
          <button onClick={() => setGifPreviewUrl(null)} className="rounded-full bg-flashbulb px-6 py-2.5 text-sm font-medium text-ink">Done</button>
        </div>
      )}
    </main>
  );
}