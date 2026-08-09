"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas-pro";
import { LAYOUTS, LayoutOption, getLayout } from "../layouts";

type Slot = { xPct: number; yPct: number; wPct: number; hPct: number };

type StickerEl = { id: string; kind: "sticker"; emoji: string; xPct: number; yPct: number; size: number };
type TextEl = {
  id: string;
  kind: "text";
  text: string;
  xPct: number;
  yPct: number;
  size: number;
  color: string;
  fontId: string;
};
type CanvasEl = StickerEl | TextEl;
type BgTab = "solid" | "gradient" | "pattern";
type BgChoice = {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  dark: boolean;
};

const SOLIDS = [
  { id: "paper", label: "Paper", css: "#FBF6EC", dark: false },
  { id: "white", label: "White", css: "#FFFFFF", dark: false },
  { id: "ink", label: "Ink", css: "#221019", dark: true },
  { id: "curtain", label: "Curtain", css: "#B3222B", dark: true },
  { id: "bubblegum", label: "Bubblegum", css: "#F2789F", dark: false },
  { id: "flashbulb", label: "Flashbulb", css: "#F4B740", dark: false },
  { id: "mint", label: "Mint", css: "#6FBFA0", dark: false },
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

const PATTERNS = [
  {
    id: "dots",
    label: "Dots",
    dark: false,
    backgroundColor: "#FBF6EC",
    backgroundImage: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="2" cy="2" r="1.5" fill="#22101933"/></svg>`
    ),
    backgroundSize: "16px 16px",
  },
  {
    id: "dots-dark",
    label: "Dots Dark",
    dark: true,
    backgroundColor: "#221019",
    backgroundImage: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="2" cy="2" r="1.5" fill="#FBF6EC33"/></svg>`
    ),
    backgroundSize: "16px 16px",
  },
  {
    id: "stripes",
    label: "Stripes",
    dark: false,
    backgroundColor: "#FBF6EC",
    backgroundImage: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M0 16L16 0" stroke="#B3222B33" stroke-width="3"/><path d="M-4 4L4 -4" stroke="#B3222B33" stroke-width="3"/><path d="M12 20L20 12" stroke="#B3222B33" stroke-width="3"/></svg>`
    ),
    backgroundSize: "16px 16px",
  },
  {
    id: "grid",
    label: "Grid",
    dark: false,
    backgroundColor: "#FFFFFF",
    backgroundImage: svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><path d="M14 0H0V14" fill="none" stroke="#22101922" stroke-width="1"/></svg>`
    ),
    backgroundSize: "14px 14px",
  },
];

const STICKER_OPTIONS = ["✨", "💖", "🎀", "🫧", "🚀", "🌈", "🦋", "⭐", "🍒", "🌸", "🔥", "👑"];

const FONT_OPTIONS = [
  { id: "display", label: "Bungee", css: "var(--font-display)" },
  { id: "script", label: "Caveat", css: "var(--font-script)" },
  { id: "body", label: "DM Sans", css: "var(--font-body)" },
  { id: "mono", label: "Mono", css: "var(--font-mono)" },
];

const TWEMOJI_BASE = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72/";

function toTwemojiCodepoint(emoji: string): string {
  return Array.from(emoji)
    .map((char) => char.codePointAt(0)!.toString(16))
    .filter((hex) => hex !== "fe0f")
    .join("-");
}

function twemojiUrl(emoji: string): string {
  return `${TWEMOJI_BASE}${toTwemojiCodepoint(emoji)}.png`;
}

function buildLayoutSlots(layout: LayoutOption, count: number): Slot[] {
  const gap = 3;
  const padding = 5;
  const footerSpace = layout.hasFooter ? 8 : 0;
  const cols = layout.cols;
  const rows = layout.rows;

  if (cols === 1) {
    const usableH = 100 - padding * 2 - footerSpace - gap * (count - 1);
    const cellH = usableH / count;
    return Array.from({ length: count }, (_, i) => ({
      xPct: padding,
      yPct: padding + i * (cellH + gap),
      wPct: 100 - padding * 2,
      hPct: cellH,
    }));
  }

  const usableW = 100 - padding * 2 - gap * (cols - 1);
  const usableH = 100 - padding * 2 - footerSpace - gap * (rows - 1);
  const cellW = usableW / cols;
  const cellH = usableH / rows;

  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      xPct: padding + col * (cellW + gap),
      yPct: padding + row * (cellH + gap),
      wPct: cellW,
      hPct: cellH,
    };
  });
}

function getIsDark(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55;
}

function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isIOS || isIPadOS;
}

export default function CustomizePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const appliedThemeRef = useRef(false);

  const [captures, setCaptures] = useState<string[]>([]);
  const [layout, setLayout] = useState<LayoutOption>(LAYOUTS[0]);

  const [bgTab, setBgTab] = useState<BgTab>("solid");
  const [background, setBackground] = useState<BgChoice>({
    backgroundColor: SOLIDS[0].css,
    dark: SOLIDS[0].dark,
  });

  const [elements, setElements] = useState<CanvasEl[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<{ id: string; type: "drag" | "resize" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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
    if (!stored) {
      router.replace("/");
      return;
    }
    setCaptures(JSON.parse(stored));
    setLayout(getLayout(storedLayoutId));
  }, [router]);

  // Auto-place theme stickers (e.g. hearts) once, the first time captures load
  useEffect(() => {
    if (appliedThemeRef.current) return;
    if (captures.length === 0) return;
    if (layout.themeOverlay !== "hearts") return;
    appliedThemeRef.current = true;

    const heartPositions = [
      { xPct: 14, yPct: 10 },
      { xPct: 86, yPct: 18 },
      { xPct: 12, yPct: 55 },
      { xPct: 88, yPct: 60 },
      { xPct: 50, yPct: 93 },
    ];
    const themedStickers: StickerEl[] = heartPositions.map((pos, i) => ({
      id: `theme-heart-${i}`,
      kind: "sticker",
      emoji: "💖",
      xPct: pos.xPct,
      yPct: pos.yPct,
      size: 30,
    }));
    setElements((prev) => [...prev, ...themedStickers]);
  }, [captures, layout]);

  const slots = useMemo(() => buildLayoutSlots(layout, captures.length), [layout, captures.length]);
  const selectedEl = elements.find((el) => el.id === selectedId) ?? null;

  const canvasHeight = isDesktop
    ? `min(66vh, calc((100vw - 460px) / ${layout.aspectValue}))`
    : `min(46vh, calc((100vw - 48px) / ${layout.aspectValue}))`;

  function addSticker(emoji: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setElements((prev) => [...prev, { id, kind: "sticker", emoji, xPct: 50, yPct: 50, size: 44 }]);
    setSelectedId(id);
  }

  function addText() {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setElements((prev) => [
      ...prev,
      { id, kind: "text", text: "your text", xPct: 50, yPct: 50, size: 28, color: "#221019", fontId: "display" },
    ]);
    setSelectedId(id);
    setEditingId(id);
  }

  function removeElement(id: string) {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId(null);
    setEditingId(null);
  }

  function updateTextField<K extends keyof TextEl>(id: string, key: K, value: TextEl[K]) {
    setElements((prev) =>
      prev.map((el) => (el.id === id && el.kind === "text" ? { ...el, [key]: value } : el))
    );
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
        const newSize = Math.min(max, Math.max(14, el.size + e.movementY));
        return { ...el, size: newSize };
      })
    );
  }

  function handleCanvasPointerUp() {
    setActiveAction(null);
  }

  function handleCanvasPointerDown() {
    setSelectedId(null);
    setEditingId(null);
  }

  async function handleDownload() {
    if (!canvasRef.current || isExporting) return;
    setSelectedId(null);
    setEditingId(null);
    setIsExporting(true);

    await new Promise((resolve) => setTimeout(resolve, 60));

    try {
      const rendered = await html2canvas(canvasRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
      });

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

  if (captures.length === 0) return null;

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center overflow-y-auto px-4 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mb-4 flex flex-col items-center sm:mb-6">
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-curtain sm:text-xs">
          step 3 of 3
        </span>
        <h1 className="mt-1 text-center font-[family-name:var(--font-display)] text-xl text-ink sm:text-3xl md:text-4xl">
          Make it yours
        </h1>
      </div>

      <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-start md:justify-center md:gap-10">
        <div
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerLeave={handleCanvasPointerUp}
          className="relative flex-shrink-0 touch-none overflow-hidden rounded-2xl shadow-2xl ring-1 ring-ink/10"
          style={{
            height: canvasHeight,
            aspectRatio: layout.aspect,
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
              className="absolute rounded-md object-cover shadow-sm"
              style={{
                left: `${slot.xPct}%`,
                top: `${slot.yPct}%`,
                width: `${slot.wPct}%`,
                height: `${slot.hPct}%`,
              }}
            />
          ))}

          {layout.hasFooter && (
            <p
              className={`absolute bottom-2 left-0 right-0 text-center font-[family-name:var(--font-mono)] text-[10px] tracking-widest ${
                background.dark ? "text-paper/50" : "text-ink/40"
              }`}
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
                  <img
                    src={twemojiUrl(el.emoji)}
                    alt=""
                    draggable={false}
                    crossOrigin="anonymous"
                    style={{ width: el.size, height: el.size }}
                    className="drop-shadow-md"
                  />
                )}

                {el.kind === "text" && !isEditing && (
                  <p
                    style={{
                      fontFamily: FONT_OPTIONS.find((f) => f.id === el.fontId)?.css,
                      color: el.color,
                      fontSize: el.size,
                    }}
                    className="whitespace-nowrap px-1 leading-tight"
                  >
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
                    style={{
                      fontFamily: FONT_OPTIONS.find((f) => f.id === el.fontId)?.css,
                      color: el.color,
                      fontSize: el.size,
                      width: `${Math.max(4, el.text.length + 2)}ch`,
                    }}
                    className="border-b-2 border-dashed border-curtain bg-transparent text-center outline-none"
                  />
                )}

                {isSelected && !isEditing && (
                  <>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeElement(el.id);
                      }}
                      className="absolute right-0 top-0 flex h-6 w-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-curtain text-xs leading-none text-paper shadow-md"
                    >
                      ×
                    </button>
                    {el.kind === "text" && (
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(el.id);
                        }}
                        className="absolute left-0 top-0 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-mint text-xs leading-none text-ink shadow-md"
                      >
                        ✎
                      </button>
                    )}
                    <div
                      onPointerDown={(e) => handleResizePointerDown(e, el.id)}
                      className="absolute bottom-0 right-0 h-5 w-5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize touch-none rounded-full bg-flashbulb shadow-md ring-2 ring-paper"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex w-full max-w-xs flex-shrink-0 flex-col items-center gap-5 pb-8 md:items-start">
          <div className="w-full">
            <div className="mb-2 flex gap-3">
              {(["solid", "gradient", "pattern"] as BgTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setBgTab(tab)}
                  className={`font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest transition-colors sm:text-xs ${
                    bgTab === tab ? "text-curtain" : "text-ink/40 hover:text-ink/70"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {bgTab === "solid" && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 md:justify-start">
                {SOLIDS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setBackground({ backgroundColor: s.css, dark: s.dark })}
                    className={`h-8 w-8 rounded-full transition-transform hover:scale-110 sm:h-10 sm:w-10 ${
                      background.backgroundColor === s.css && !background.backgroundImage
                        ? "ring-4 ring-curtain ring-offset-2 ring-offset-paper"
                        : "ring-1 ring-ink/10"
                    }`}
                    style={{ backgroundColor: s.css }}
                    aria-label={s.label}
                  />
                ))}
                <label
                  className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-ink/10 transition-transform hover:scale-110 sm:h-10 sm:w-10"
                  style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
                >
                  <input
                    type="color"
                    onChange={(e) =>
                      setBackground({ backgroundColor: e.target.value, dark: getIsDark(e.target.value) })
                    }
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Pick a custom background color"
                  />
                </label>
              </div>
            )}

            {bgTab === "gradient" && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 md:justify-start">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setBackground({ backgroundImage: g.backgroundImage, dark: g.dark })}
                    className={`h-8 w-8 rounded-full transition-transform hover:scale-110 sm:h-10 sm:w-10 ${
                      background.backgroundImage === g.backgroundImage
                        ? "ring-4 ring-curtain ring-offset-2 ring-offset-paper"
                        : "ring-1 ring-ink/10"
                    }`}
                    style={{ backgroundImage: g.backgroundImage }}
                    aria-label={g.label}
                  />
                ))}
              </div>
            )}

            {bgTab === "pattern" && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 md:justify-start">
                {PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() =>
                      setBackground({
                        backgroundColor: p.backgroundColor,
                        backgroundImage: p.backgroundImage,
                        backgroundSize: p.backgroundSize,
                        dark: p.dark,
                      })
                    }
                    className={`h-8 w-8 rounded-full transition-transform hover:scale-110 sm:h-10 sm:w-10 ${
                      background.backgroundImage === p.backgroundImage
                        ? "ring-4 ring-curtain ring-offset-2 ring-offset-paper"
                        : "ring-1 ring-ink/10"
                    }`}
                    style={{
                      backgroundColor: p.backgroundColor,
                      backgroundImage: p.backgroundImage,
                      backgroundSize: p.backgroundSize,
                    }}
                    aria-label={p.label}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-full">
            <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-ink/50 sm:text-xs">
              Stickers
            </p>
            <div className="grid grid-cols-6 gap-2 md:grid-cols-4">
              {STICKER_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addSticker(emoji)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1.5 ring-1 ring-ink/10 transition-transform hover:scale-110 active:scale-95 sm:h-10 sm:w-10"
                >
                  <img src={twemojiUrl(emoji)} alt={emoji} draggable={false} className="h-full w-full" />
                </button>
              ))}
            </div>
          </div>

          <div className="w-full">
            <button
              onClick={addText}
              className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-ink/10 transition-transform hover:scale-[1.02] active:scale-95"
            >
              + Add text
            </button>
          </div>

          {selectedEl?.kind === "text" && (
            <div className="w-full rounded-xl bg-white/60 p-3 ring-1 ring-ink/10">
              <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-ink/50">
                Text style
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => updateTextField(selectedEl.id, "fontId", f.id)}
                    style={{ fontFamily: f.css }}
                    className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                      selectedEl.fontId === f.id ? "bg-curtain text-paper" : "bg-paper text-ink ring-1 ring-ink/10"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {SOLIDS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateTextField(selectedEl.id, "color", s.css)}
                    className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                      selectedEl.color === s.css ? "ring-2 ring-curtain ring-offset-2 ring-offset-white" : "ring-1 ring-ink/10"
                    }`}
                    style={{ backgroundColor: s.css }}
                    aria-label={s.label}
                  />
                ))}
                <label
                  className="relative flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-ink/10"
                  style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
                >
                  <input
                    type="color"
                    value={selectedEl.color}
                    onChange={(e) => updateTextField(selectedEl.id, "color", e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Pick a custom text color"
                  />
                </label>
              </div>
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full rounded-full bg-flashbulb px-6 py-3.5 font-[family-name:var(--font-display)] text-base text-ink shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isExporting ? "Preparing…" : "⬇ Download"}
          </button>
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-ink/95 px-6 py-10">
          <p className="max-w-xs text-center font-[family-name:var(--font-body)] text-sm text-paper">
            Press and hold the image below, then tap <strong>Save Image</strong> to
            add it to your Photos.
          </p>
          <img
            src={previewImage}
            alt="Your Pickaboo strip"
            className="max-h-[65vh] rounded-xl shadow-2xl"
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="rounded-full bg-flashbulb px-6 py-2.5 text-sm font-medium text-ink"
          >
            Done
          </button>
        </div>
      )}
    </main>
  );
}