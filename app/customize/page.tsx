"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type RatioId = "strip" | "portrait" | "story" | "post";
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

const RATIO_CONFIG: Record<RatioId, { label: string; aspect: string; hasFooter: boolean }> = {
  strip: { label: "Classic Strip", aspect: "2 / 6", hasFooter: true },
  portrait: { label: "Portrait", aspect: "4 / 5", hasFooter: false },
  story: { label: "IG Story", aspect: "9 / 16", hasFooter: false },
  post: { label: "IG Post", aspect: "1 / 1", hasFooter: false },
};

const BACKGROUNDS = [
  { id: "paper", label: "Paper", value: "#FBF6EC" },
  { id: "white", label: "White", value: "#FFFFFF" },
  { id: "ink", label: "Ink", value: "#221019" },
  { id: "curtain", label: "Curtain", value: "#B3222B" },
  { id: "bubblegum", label: "Bubblegum", value: "#F2789F" },
  { id: "flashbulb", label: "Flashbulb", value: "#F4B740" },
  { id: "mint", label: "Mint", value: "#6FBFA0" },
];

const STICKER_OPTIONS = ["✨", "💖", "🎀", "🫧", "🚀", "🌈", "🦋", "⭐", "🍒", "🌸", "🔥", "👑"];

const FONT_OPTIONS = [
  { id: "display", label: "Bungee", css: "var(--font-display)" },
  { id: "script", label: "Caveat", css: "var(--font-script)" },
  { id: "body", label: "DM Sans", css: "var(--font-body)" },
  { id: "mono", label: "Mono", css: "var(--font-mono)" },
];

const TWEMOJI_BASE = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/";

function toTwemojiCodepoint(emoji: string): string {
  return Array.from(emoji)
    .map((char) => char.codePointAt(0)!.toString(16))
    .filter((hex) => hex !== "fe0f")
    .join("-");
}

function twemojiUrl(emoji: string): string {
  return `${TWEMOJI_BASE}${toTwemojiCodepoint(emoji)}.svg`;
}

function buildLayout(ratio: RatioId, count: number): Slot[] {
  const gap = 3;
  const padding = 5;
  const footerSpace = RATIO_CONFIG[ratio].hasFooter ? 8 : 0;

  if (ratio === "strip") {
    const usableH = 100 - padding * 2 - footerSpace - gap * (count - 1);
    const cellH = usableH / count;
    return Array.from({ length: count }, (_, i) => ({
      xPct: padding,
      yPct: padding + i * (cellH + gap),
      wPct: 100 - padding * 2,
      hPct: cellH,
    }));
  }

  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / cols);
  const usableW = 100 - padding * 2 - gap * (cols - 1);
  const usableH = 100 - padding * 2 - gap * (rows - 1);
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

export default function CustomizePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [captures, setCaptures] = useState<string[]>([]);
  const [ratio, setRatio] = useState<RatioId>("strip");
  const [background, setBackground] = useState(BACKGROUNDS[0].value);

  const [elements, setElements] = useState<CanvasEl[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<{ id: string; type: "drag" | "resize" } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("pickaboo-captures");
    const storedRatio = sessionStorage.getItem("pickaboo-ratio") as RatioId | null;
    if (!stored) {
      router.replace("/");
      return;
    }
    setCaptures(JSON.parse(stored));
    if (storedRatio && RATIO_CONFIG[storedRatio]) setRatio(storedRatio);
  }, [router]);

  const slots = useMemo(() => buildLayout(ratio, captures.length), [ratio, captures.length]);
  const isDark = getIsDark(background);
  const selectedEl = elements.find((el) => el.id === selectedId) ?? null;

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

  if (captures.length === 0) return null;

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-5xl flex-col items-center justify-center overflow-hidden px-4 py-3">
      <div className="mb-4 mt-2 flex flex-col items-center sm:mb-6 sm:mt-4">
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-curtain sm:text-xs">
          step 3 of 3
        </span>
        <h1 className="mt-1 text-center font-[family-name:var(--font-display)] text-xl text-ink sm:text-3xl md:text-4xl">
          Make it yours
        </h1>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-4 md:flex-row md:items-center md:gap-10">
        {/* Canvas preview */}
        <div
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerLeave={handleCanvasPointerUp}
          className="relative h-[54vh] flex-shrink-0 touch-none overflow-hidden rounded-2xl shadow-2xl ring-1 ring-ink/10 sm:h-[64vh] md:h-[70vh]"
          style={{ aspectRatio: RATIO_CONFIG[ratio].aspect, backgroundColor: background }}
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

          {RATIO_CONFIG[ratio].hasFooter && (
            <p
              className={`absolute bottom-2 left-0 right-0 text-center font-[family-name:var(--font-mono)] text-[10px] tracking-widest ${
                isDark ? "text-paper/50" : "text-ink/40"
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
                      className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-curtain text-xs leading-none text-paper shadow-md"
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
                        className="absolute -left-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs leading-none text-ink shadow-md"
                      >
                        ✎
                      </button>
                    )}
                    <div
                      onPointerDown={(e) => handleResizePointerDown(e, el.id)}
                      className="absolute -bottom-1.5 -right-1.5 h-5 w-5 cursor-nwse-resize touch-none rounded-full bg-flashbulb shadow-md ring-2 ring-paper"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Tools panel */}
        <div className="flex w-full max-w-xs flex-shrink-0 flex-col items-center gap-5 md:items-start">
          <div className="w-full">
            <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-ink/50 sm:text-xs">
              Background
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 md:justify-start">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setBackground(bg.value)}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 sm:h-10 sm:w-10 ${
                    background === bg.value
                      ? "ring-4 ring-curtain ring-offset-2 ring-offset-paper"
                      : "ring-1 ring-ink/10"
                  }`}
                  style={{ backgroundColor: bg.value }}
                  aria-label={bg.label}
                />
              ))}
              <label
                className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-ink/10 transition-transform hover:scale-110 sm:h-10 sm:w-10"
                style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
              >
                <input
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Pick a custom background color"
                />
              </label>
            </div>
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
                      selectedEl.fontId === f.id
                        ? "bg-curtain text-paper"
                        : "bg-paper text-ink ring-1 ring-ink/10"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => updateTextField(selectedEl.id, "color", bg.value)}
                    className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                      selectedEl.color === bg.value
                        ? "ring-2 ring-curtain ring-offset-2 ring-offset-white"
                        : "ring-1 ring-ink/10"
                    }`}
                    style={{ backgroundColor: bg.value }}
                    aria-label={bg.label}
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
        </div>
      </div>
    </main>
  );
}