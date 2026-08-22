"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LAYOUTS, LayoutOption } from "./layouts";

type FeaturedFrame = {
  id: string;
  layout: string;
  image: string;
  caption?: string;
};

const FEATURED_FRAMES: FeaturedFrame[] = [
  {
    id: "classic-01",
    layout: "CLASSIC",
    image: "/frames/classic-01.jpg",
    caption: "A little chaos.",
  },
  {
    id: "duo-01",
    layout: "DUO",
    image: "/frames/duo-01.jpg",
    caption: "Double trouble.",
  },
  {
    id: "trio-01",
    layout: "TRIO",
    image: "/frames/trio-01.jpg",
    caption: "Three moments.",
  },
  {
    id: "mini-01",
    layout: "MINI",
    image: "/frames/mini-01.jpg",
    caption: "Small strip. Big energy.",
  },
  {
    id: "vintage-01",
    layout: "VINTAGE",
    image: "/frames/vintage-01.jpg",
    caption: "Caught on film.",
  },
  {
    id: "grid-01",
    layout: "GRID",
    image: "/frames/grid-01.jpg",
    caption: "Six looks.",
  },
  {
    id: "story-01",
    layout: "COLOR ROOM",
    image: "/frames/story-01.jpg",
    caption: "Colour changed everything.",
  },
];

function FrameCard({
  frame,
  index,
}: {
  frame: FeaturedFrame;
  index: number;
}) {
  const rotations = [-3, 2, -1.5, 3, -2, 1.5, -2.5];

  return (
    <div
      className="frames-card group relative flex-shrink-0"
      style={{
        ["--frame-rotation" as string]:
          `${rotations[index % rotations.length]}deg`,
      }}
    >
      <div className="relative overflow-hidden rounded-[3px] bg-white p-2 shadow-[0_18px_45px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:-translate-y-3 group-hover:rotate-0">
        <img
          src={frame.image}
          alt={`${frame.layout} Pickaboo frame`}
          draggable={false}
          className="block h-auto w-[150px] object-contain sm:w-[175px] md:w-[190px]"
        />

        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-black/80 px-3 py-2 text-center transition-transform duration-300 group-hover:translate-y-0">
          <p className="font-[family-name:var(--font-mono)] text-[8px] tracking-[0.25em] text-white/50">
            {frame.layout}
          </p>

          {frame.caption && (
            <p className="mt-0.5 text-[10px] text-white">
              {frame.caption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FrameLane({
  frames,
  direction,
  duration,
}: {
  frames: FeaturedFrame[];
  direction: "left" | "right";
  duration: number;
}) {
  const repeated = [...frames, ...frames];

  return (
    <div className="frames-lane">
      <div
        className={`frames-track ${
          direction === "left"
            ? "frames-track-left"
            : "frames-track-right"
        }`}
        style={{
          ["--frames-duration" as string]:
            `${duration}s`,
        }}
      >
        {repeated.map((frame, index) => (
          <FrameCard
            key={`${frame.id}-${index}`}
            frame={frame}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}


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
     

      {/* =========================
          FRAMES — COMMUNITY WALL
          ========================= */}

      <section className="frames-section relative -mx-6 mt-24 overflow-hidden px-6 py-24 md:-mx-10 md:px-10 md:py-32">
        {/* subtle cinematic grain */}
        <div className="frames-noise pointer-events-none absolute inset-0" />

        {/* top cinematic text */}
        <div className="relative z-10 mx-auto mb-16 max-w-6xl text-center">
          <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.45em] text-curtain">
            PICKABOO PRESENTS
          </p>

          <h2 className="mt-3 font-[family-name:var(--font-display)] text-6xl leading-none tracking-tight text-white sm:text-8xl md:text-[9rem]">
            FRAMES
          </h2>

          <p className="mx-auto mt-6 max-w-md font-[family-name:var(--font-body)] text-sm leading-6 text-white/50">
            A wall of moments captured by the Pickaboo community.
          </p>
        </div>

        {/* moving wall */}
        <div className="relative z-10 flex flex-col gap-8">
          <FrameLane
            frames={FEATURED_FRAMES}
            direction="left"
            duration={38}
          />

          <FrameLane
            frames={[
              ...FEATURED_FRAMES.slice().reverse(),
            ]}
            direction="right"
            duration={46}
          />

          <FrameLane
            frames={[
              FEATURED_FRAMES[3],
              FEATURED_FRAMES[0],
              FEATURED_FRAMES[5],
              FEATURED_FRAMES[2],
              FEATURED_FRAMES[6],
              FEATURED_FRAMES[1],
              FEATURED_FRAMES[4],
            ]}
            direction="left"
            duration={52}
          />
        </div>

        {/* bottom CTA */}
        <div className="relative z-10 mx-auto mt-24 max-w-2xl text-center">
          <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.4em] text-white/40">
            THINK YOURS BELONGS HERE?
          </p>

          <h3 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-none text-white sm:text-6xl">
            PUT YOUR FRAME
            <br />
            ON THE WALL.
          </h3>

          <a
            href="https://forms.gle/7aMQgHf7S41VJW3t9"
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex rounded-full border border-white/30 px-8 py-4 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-[0.25em] text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-ink"
          >
            Submit your frame ↗
          </a>

          <p className="mt-4 font-[family-name:var(--font-mono)] text-[9px] tracking-wider text-white/30">
            SELECTED FRAMES MAY BE FEATURED ON PICKABOO
          </p>
        </div>
      </section>


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