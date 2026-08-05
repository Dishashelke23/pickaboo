"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Ratio = { id: string; label: string; hint: string };
type FilterPack = { id: string; label: string };

const RATIOS: Ratio[] = [
  { id: "strip", label: "Classic Strip", hint: "2×6" },
  { id: "portrait", label: "Portrait", hint: "4×5" },
  { id: "story", label: "IG Story", hint: "9×16" },
  { id: "post", label: "IG Post", hint: "1×1" },
];

const SHOT_COUNTS: number[] = [3, 4, 6];

const FILTER_PACKS: FilterPack[] = [
  { id: "classic", label: "Classic B&W" },
  { id: "pastel", label: "Dreamy Pastel" },
  { id: "vivid", label: "Vivid Pop" },
  { id: "retro", label: "Retro Film" },
];

function PrintedStrip() {
  const frames = ["bg-bubblegum/30", "bg-flashbulb/30", "bg-mint/30", "bg-curtain/20"];
  return (
    <div className="relative flex justify-center">
      <div className="absolute -top-3 h-3 w-40 rounded-full bg-ink/10" />
      <div className="animate-print-strip mt-2 flex w-40 flex-col gap-2 rounded-md bg-white p-2 shadow-xl ring-1 ring-ink/10">
        {frames.map((tint, i) => (
          <div
            key={i}
            className={`relative h-28 w-full rounded-sm ${tint} border border-ink/10`}
          >
            <div className="absolute left-0 top-1/2 -ml-1 flex -translate-y-1/2 flex-col gap-1.5">
              {[...Array(3)].map((_, j) => (
                <span key={j} className="block h-1.5 w-1.5 rounded-full bg-paper ring-1 ring-ink/10" />
              ))}
            </div>
          </div>
        ))}
        <p className="pt-1 text-center font-[family-name:var(--font-mono)] text-[10px] tracking-widest text-ink/40">
          PICKABOO • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-curtain focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
        selected
          ? "border-curtain bg-curtain text-paper shadow-md"
          : "border-ink/10 bg-white text-ink hover:border-curtain/40"
      }`}
    >
      {children}
    </button>
  );
}

export default function Home() {
  const [ratio, setRatio] = useState<string>("strip");
  const [shots, setShots] = useState<number>(4);
  const [filterPack, setFilterPack] = useState<string>("classic");
  const router = useRouter();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12 md:py-20">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-curtain">
            free • no sign-up
          </span>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl leading-[1.05] text-ink md:text-6xl">
            Strike a
            <br />
            pose.
          </h1>
          <p className="mt-4 max-w-sm font-[family-name:var(--font-body)] text-lg text-ink/70">
            A real photobooth, right in your browser. Snap a few shots, pick
            a filter, decorate your strip, and take it home.
          </p>
        </div>

        <PrintedStrip />
      </div>

      <div className="mt-16 rounded-3xl bg-white/60 p-6 ring-1 ring-ink/10 md:p-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-xs tracking-widest text-curtain">
              01
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl text-ink">
              Pick a shape
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {RATIOS.map((r) => (
                <OptionCard
                  key={r.id}
                  selected={ratio === r.id}
                  onClick={() => setRatio(r.id)}
                >
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="block text-xs opacity-70">{r.hint}</span>
                </OptionCard>
              ))}
            </div>
          </div>

          <div>
            <p className="font-[family-name:var(--font-mono)] text-xs tracking-widest text-curtain">
              02
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl text-ink">
              How many shots?
            </h2>
            <div className="mt-4 flex gap-2">
              {SHOT_COUNTS.map((n) => (
                <OptionCard key={n} selected={shots === n} onClick={() => setShots(n)}>
                  <span className="block text-sm font-medium">{n}</span>
                </OptionCard>
              ))}
            </div>
          </div>

          <div>
            <p className="font-[family-name:var(--font-mono)] text-xs tracking-widest text-curtain">
              03
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl text-ink">
              Choose a filter pack
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {FILTER_PACKS.map((f) => (
                <OptionCard
                  key={f.id}
                  selected={filterPack === f.id}
                  onClick={() => setFilterPack(f.id)}
                >
                  <span className="block text-sm font-medium">{f.label}</span>
                </OptionCard>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            className="rounded-full bg-flashbulb px-10 py-4 font-[family-name:var(--font-display)] text-lg text-ink shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-curtain focus-visible:ring-offset-2"
            onClick={() =>
  router.push(`/booth?ratio=${ratio}&shots=${shots}&filter=${filterPack}`)
}
          >
            Start Snapping
          </button>
        </div>
      </div>
    </main>
  );
}