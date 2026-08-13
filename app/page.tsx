"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LAYOUTS, LayoutOption } from "./layouts";

function PrintedStrip() {
  const frames = ["bg-bubblegum/30", "bg-flashbulb/30", "bg-mint/30", "bg-curtain/20"];
  return (
    <div className="relative flex justify-center">
      <div className="absolute -top-3 h-3 w-40 rounded-full bg-ink/10" />
      <div className="animate-print-strip mt-2 flex w-40 flex-col gap-2 rounded-md bg-white p-2 shadow-xl ring-1 ring-ink/10">
        {frames.map((tint, i) => (
          <div key={i} className={`relative h-28 w-full rounded-sm ${tint} border border-ink/10`}>
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

function LayoutPreview({ layout }: { layout: LayoutOption }) {
  const tints = ["bg-bubblegum/40", "bg-flashbulb/40", "bg-mint/40", "bg-curtain/30", "bg-ink/10", "bg-bubblegum/25"];
  return (
    <div
      className="relative w-full overflow-hidden rounded-md border border-ink/10 bg-white p-1.5 shadow-sm"
      style={{ aspectRatio: layout.aspect }}
    >
      <div
        className="grid h-full w-full gap-1"
        style={{
          gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
          gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
        }}
      >
        {Array.from({ length: layout.poses }, (_, i) => (
          <div key={i} className={`rounded-sm ${tints[i % tints.length]}`} />
        ))}
      </div>
      {layout.themeOverlay === "hearts" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-around py-2 text-sm">
          <span>💖</span>
          <span>💖</span>
          <span>💖</span>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>(LAYOUTS[0].id);

  function handleStart() {
    sessionStorage.setItem("pickaboo-selected-layout", selectedLayoutId);
    router.push(`/booth?layout=${selectedLayoutId}`);
  }

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
        <p className="font-[family-name:var(--font-mono)] text-xs tracking-widest text-curtain">01</p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl text-ink">Pick a layout</h2>

        <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              onClick={() => setSelectedLayoutId(layout.id)}
              className={`flex w-32 flex-shrink-0 snap-center flex-col gap-2 rounded-xl border-2 p-2 text-left transition-all sm:w-36 ${
                selectedLayoutId === layout.id
                  ? "border-curtain bg-curtain/5 shadow-md"
                  : "border-ink/10 bg-white hover:border-curtain/40"
              }`}
            >
              <LayoutPreview layout={layout} />
              <div>
                <p className="font-[family-name:var(--font-body)] text-xs font-semibold text-ink">{layout.name}</p>
                <p className="font-[family-name:var(--font-mono)] text-[10px] text-ink/50">
                  {layout.sizeLabel} ({layout.poses} Pose)
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            className="rounded-full bg-flashbulb px-10 py-4 font-[family-name:var(--font-display)] text-lg text-ink shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-curtain focus-visible:ring-offset-2"
            onClick={handleStart}
          >
            Start Snapping
          </button>
        </div>
      </div>
     
     <footer className="mt-16 flex justify-center pb-6">
  
    <a href="/legal"
    className="font-[family-name:var(--font-mono)] text-xs text-ink/40 hover:text-curtain"
  >
    Privacy Policy & Terms of Use
  </a>
</footer>
     

    </main>
  );
}