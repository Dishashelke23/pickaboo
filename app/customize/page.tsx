"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RatioId = "strip" | "portrait" | "story" | "post";

type Slot = { xPct: number; yPct: number; wPct: number; hPct: number };

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

function buildLayout(ratio: RatioId, count: number): Slot[] {
  const gap = 3; // percent
  const padding = 5; // percent
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

  // Grid layout for portrait / story / post
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

export default function CustomizePage() {
  const router = useRouter();
  const [captures, setCaptures] = useState<string[]>([]);
  const [ratio, setRatio] = useState<RatioId>("strip");
  const [background, setBackground] = useState(BACKGROUNDS[0].value);

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

  const slots = useMemo(
    () => buildLayout(ratio, captures.length),
    [ratio, captures.length]
  );

  const isDark = ["#221019", "#B3222B"].includes(background);

  if (captures.length === 0) return null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col items-center px-6 py-8">
      <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-curtain">
        step 3 of 3
      </span>
      <h1 className="mb-6 mt-2 text-center font-[family-name:var(--font-display)] text-3xl text-ink sm:text-4xl">
        Make it yours
      </h1>

      <div className="flex w-full flex-col items-center gap-8 md:flex-row md:items-start md:justify-center">
        {/* Canvas preview */}
        <div
          className="relative w-full max-w-xs overflow-hidden rounded-2xl shadow-2xl ring-1 ring-ink/10"
          style={{ aspectRatio: RATIO_CONFIG[ratio].aspect, backgroundColor: background }}
        >
          {slots.map((slot, i) => (
            <img
              key={i}
              src={captures[i]}
              alt={`Shot ${i + 1}`}
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
        </div>

        {/* Tools panel */}
        <div className="w-full max-w-xs">
          <p className="mb-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-ink/50">
            Background
          </p>
          <div className="flex flex-wrap gap-3">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setBackground(bg.value)}
                className={`h-10 w-10 rounded-full transition-transform hover:scale-110 ${
                  background === bg.value
                    ? "ring-4 ring-curtain ring-offset-2 ring-offset-paper"
                    : "ring-1 ring-ink/10"
                }`}
                style={{ backgroundColor: bg.value }}
                aria-label={bg.label}
              />
            ))}
          </div>

          <p className="mt-8 font-[family-name:var(--font-mono)] text-xs text-ink/40">
            Stickers and text coming up next.
          </p>
        </div>
      </div>
    </main>
  );
}