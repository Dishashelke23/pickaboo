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
type FrameStyle = { id: string; label: string; photoRadius: number; photoBorder: boolean };

const FRAME_STYLES: FrameStyle[] = [
  { id: "sharp", label: "Sharp", photoRadius: 0, photoBorder: false },
  { id: "rounded", label: "Rounded", photoRadius: 10, photoBorder: false },
  { id: "soft", label: "Soft", photoRadius: 20, photoBorder: false },
  { id: "film", label: "Film Edge", photoRadius: 0, photoBorder: true },
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



type StickerDef = { id: string; label: string; ext?: "png" | "webp" };

const STICKERS: StickerDef[] = [
  { id: "bow", label: "Bow", ext: "webp"  },
  { id: "heart", label: "Heart", ext: "webp"  },
  { id: "teddy", label: "Teddy", ext: "webp"  },
  { id: "star", label: "Star", ext: "webp" },
  { id: "sparkle", label: "Sparkle"},
  { id: "cutecat", label: "Cutecat"},
  { id: "modiji", label: "modiji"},
  { id: "rizzmoji", label: "Rizz"},
  { id: "clockit", label: "ClockIT"},
  { id: "monkey", label: "Monkey"},
  { id: "flower", label: "Flower", ext: "webp"  },
  { id: "ribbon", label: "Ribbon" },
  { id: "rabbit", label: "Rabbit", ext: "webp"  },
  { id: "clover", label: "Clover", ext: "webp" },
  { id: "kiss", label: "Kiss", ext: "webp" },
  { id: "chick", label: "Chick", ext: "webp" },
  { id: "cat", label: "Cat", ext: "webp" },
  { id: "dog", label: "Dog", ext: "webp" },
  { id: "strawberry", label: "Strawberry" },
  { id: "luvme", label: "<3" },
  { id: "mario", label: "mario", ext: "webp"  },
  { id: "dollar", label: "dollar", ext: "webp"  },
  
];

function stickerImageUrl(s: StickerDef): string {
  return `/stickers/${s.id}.${s.ext ?? "png"}`;
}

const FONT_OPTIONS = [
  { id: "display", label: "Bungee", css: "var(--font-display)" },
  { id: "script", label: "Caveat", css: "var(--font-script)" },
  { id: "body", label: "DM Sans", css: "var(--font-body)" },
  { id: "mono", label: "Mono", css: "var(--font-mono)" },
];

function buildLayoutSlots(layout: LayoutOption, count: number): Slot[] {
  // Pickaboo's vertical photo-strip photos are landscape.
  // This matches the original strip appearance.
  const photoAspect = 1.65;

  const { padding, gap, cols, rows } = layout;

  const footerSpace =
    layout.footerSize === "normal"
      ? 8
      : layout.footerSize === "small"
      ? 6
      : 0;

  // Vertical photo-strip layouts
  if (cols === 1) {
  const availableWidth =
    100 - padding * 2;

  const usableHeight =
    100 -
    padding * 2 -
    footerSpace;

  const stripGap =
  layout.id === "vintage" ||
  layout.id === "story"
    ? 0
    : gap;

const totalGaps =
  stripGap * (count - 1);

  // Trio gets larger photo areas so the three
  // photographs occupy much more of the strip.
  //
  // Keep a small amount of breathing room at the top,
  // with slightly more room reserved at the bottom for
  // the Pickaboo footer.
 const isFullStrip =
  layout.id === "trio" ||
  layout.id === "mini" ||
  layout.id === "vintage"||
  layout.id === "story";

const topSpace =
  isFullStrip
    ? 3
    : padding;

const bottomSpace =
  isFullStrip
    ? 6
    : padding + footerSpace;

  const photoHeight =
  isFullStrip
    ? (
        100 -
        topSpace -
        bottomSpace -
        totalGaps
      ) / count
    : (
        availableWidth *
        layout.aspectValue
      ) / photoAspect;

  const totalPhotosHeight =
    photoHeight * count;

  const totalUsedHeight =
    totalPhotosHeight +
    totalGaps;

  const startY =
  isFullStrip
    ? topSpace
    : padding +
      Math.max(
        0,
        (
          usableHeight -
          totalUsedHeight
        ) / 2
      );

  return Array.from(
    { length: count },
    (_, i) => ({
      xPct: padding,

      yPct:
  startY +
  i *
    (
      photoHeight +
      stripGap
    ),

      wPct:
        availableWidth,

      hPct:
        photoHeight,
    })
  );
}

  // Grid / non-strip layouts
  const cellWidth =
    (100 - padding * 2 - gap * (cols - 1)) / cols;

  const cellHeight =
    (100 -
      padding * 2 -
      footerSpace -
      gap * (rows - 1)) /
    rows;

  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    return {
      xPct: padding + col * (cellWidth + gap),
      yPct: padding + row * (cellHeight + gap),
      wPct: cellWidth,
      hPct: cellHeight,
    };
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

function roundCanvasCorners(source: HTMLCanvasElement, radiusPx: number): HTMLCanvasElement {
  const output = document.createElement("canvas");
  output.width = source.width;
  output.height = source.height;
  const ctx = output.getContext("2d");
  if (!ctx) return source;

  const r = Math.min(radiusPx, output.width / 2, output.height / 2);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(output.width, 0, output.width, output.height, r);
  ctx.arcTo(output.width, output.height, 0, output.height, r);
  ctx.arcTo(0, output.height, 0, 0, r);
  ctx.arcTo(0, 0, output.width, 0, r);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(source, 0, 0);
  return output;
}

export default function CustomizePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [captures, setCaptures] = useState<string[]>([]);
  const [layout, setLayout] = useState<LayoutOption>(LAYOUTS[0]);
  const [background, setBackground] = useState<BgChoice>({ backgroundColor: SOLIDS[0].backgroundColor, dark: SOLIDS[0].dark });
  const [frameStyle, setFrameStyle] = useState<FrameStyle>(FRAME_STYLES[0]);

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
            containerType: "inline-size",
            backgroundColor: background.backgroundColor ?? "transparent",
            backgroundImage: background.backgroundImage ?? "none",
            backgroundSize: background.backgroundSize ?? "auto",
            backgroundRepeat: background.backgroundImage ? "repeat" : "no-repeat",
          }}
        >
          {slots.map((slot, i) => (
  <div
    key={i}
    className="absolute overflow-hidden"
    style={{
      left: `${slot.xPct}%`,
      top: `${slot.yPct}%`,
      width: `${slot.wPct}%`,
      height: `${slot.hPct}%`,
    }}
  >
    <img
  src={captures[i]}
  alt={`Shot ${i + 1}`}
  draggable={false}
  className={`h-full w-full object-cover ${
    frameStyle.photoBorder ? "ring-1 ring-ink/15" : ""
  }`}
  style={{
    borderRadius:
      layout.id === "story"
        ? i === 0
          ? `${frameStyle.photoRadius}px ${frameStyle.photoRadius}px 0 0`
          : i === captures.length - 1
          ? `0 0 ${frameStyle.photoRadius}px ${frameStyle.photoRadius}px`
          : "0"
        : `${frameStyle.photoRadius}px`,
  }}
/>
  </div>
))}

          {layout.footerSize !== "none" && (
            <p
              style={{ fontSize: "clamp(6px, 2.6cqw, 12px)" }}
              className={`absolute bottom-1 left-[8%] right-[8%] text-center font-[family-name:var(--font-mono)] tracking-widest ${
                background.dark ? "text-paper/50" : "text-ink/40"
              }`}
            >
              PICKABOO
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
                {el.kind === "sticker" && (() => {
  const stickerDef = STICKERS.find((s) => s.id === el.stickerId);
  return stickerDef ? (
    <img src={stickerImageUrl(stickerDef)} alt="" draggable={false} style={{ width: el.size, height: "auto" }} className="drop-shadow-md" />
  ) : null;
})()}
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

        <div className="flex w-full max-w-xs flex-shrink-0 flex-col items-center gap-5 pb-8 md:max-w-md lg:max-w-lg">
          <div className="w-full">
            <p className="mb-2 text-center font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-ink/50 sm:text-xs">Frame Style</p>
            <div className="flex flex-wrap justify-center gap-2">
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
            <p className="mb-2 text-center font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-ink/50 sm:text-xs">Colors &amp; Patterns</p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
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
            <p className="mb-2 text-center font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-ink/50 sm:text-xs">Stickers</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(64px,1fr))] sm:gap-3">
             {STICKERS.map((s) => (
  <button key={s.id} onClick={() => addSticker(s.id)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1.5 ring-1 ring-ink/10 transition-transform hover:scale-110 active:scale-95 sm:h-12 sm:w-12" title={s.label}>
    <img src={stickerImageUrl(s)} alt={s.label} draggable={false} className="h-full w-full object-contain" />
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