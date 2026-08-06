"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewPage() {
  const router = useRouter();
  const [captures, setCaptures] = useState<string[]>([]);
  const [ratio, setRatio] = useState("strip");
  const [filter, setFilter] = useState("classic");

  useEffect(() => {
    const stored = sessionStorage.getItem("pickaboo-captures");
    const storedRatio = sessionStorage.getItem("pickaboo-ratio");
    const storedFilter = sessionStorage.getItem("pickaboo-filter");
    if (stored) setCaptures(JSON.parse(stored));
    if (storedRatio) setRatio(storedRatio);
    if (storedFilter) setFilter(storedFilter);
  }, []);

  function handleRetake(index: number) {
    router.push(`/booth?retake=${index}&ratio=${ratio}&filter=${filter}`);
  }

  function handleStartOver() {
    sessionStorage.removeItem("pickaboo-captures");
    sessionStorage.removeItem("pickaboo-ratio");
    sessionStorage.removeItem("pickaboo-filter");
    router.push("/");
  }

  function handleContinue() {
    router.push("/customize");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 py-10">
      <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-curtain">
        step 2 of 3
      </span>
      <h1 className="mb-8 mt-2 text-center font-[family-name:var(--font-display)] text-3xl text-ink sm:text-4xl">
        Loving these?
      </h1>

      <div className="grid w-full grid-cols-2 gap-5 sm:grid-cols-3">
        {captures.map((src, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl border-4 border-curtain bg-ink shadow-lg"
          >
            <img
              src={src}
              alt={`Shot ${i + 1}`}
              className="aspect-[3/4] w-full object-cover"
            />
            <span className="absolute bottom-2 left-2 rounded-full bg-ink/60 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-paper">
              {i + 1}
            </span>
            <button
              onClick={() => handleRetake(i)}
              className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-paper/95 px-3 py-1.5 text-xs font-medium text-ink shadow-md active:scale-95"
            >
              🔄 Retake
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <button
          onClick={handleStartOver}
          className="font-[family-name:var(--font-mono)] text-sm text-ink/50 hover:text-curtain"
        >
          start over
        </button>
        <button
          onClick={handleContinue}
          disabled={captures.length === 0}
          className="rounded-full bg-flashbulb px-10 py-4 font-[family-name:var(--font-display)] text-lg text-ink shadow-lg transition-transform hover:scale-105 disabled:opacity-40"
        >
          Looks good →
        </button>
      </div>
    </main>
  );
}