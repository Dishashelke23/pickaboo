"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CameraStatus = "idle" | "requesting" | "ready" | "denied" | "no-camera" | "error";
type FilterOption = { id: string; label: string; css: string };

const FILTERS: FilterOption[] = [
  { id: "original", label: "Original", css: "none" },
  { id: "noir", label: "Noir", css: "grayscale(1) contrast(1.15)" },
  { id: "vintage", label: "Vintage", css: "sepia(0.35) contrast(0.9) brightness(1.05) saturate(1.3)" },
  { id: "dreamy", label: "Dreamy", css: "brightness(1.12) saturate(1.35) contrast(0.9) blur(0.3px)" },
  { id: "pop", label: "Pop", css: "saturate(1.7) contrast(1.15) brightness(1.05)" },
  { id: "cool", label: "Cool Tone", css: "hue-rotate(180deg) saturate(1.15) brightness(1.02)" },
  { id: "warm", label: "Warm Tone", css: "sepia(0.2) saturate(1.4) brightness(1.05)" },
  { id: "fade", label: "Faded", css: "contrast(0.85) brightness(1.1) saturate(0.6)" },
  { id: "highcontrast", label: "Bold B&W", css: "grayscale(1) contrast(1.5) brightness(0.95)" },
];

const PACK_TO_FILTER: Record<string, string> = {
  classic: "noir",
  pastel: "dreamy",
  vivid: "pop",
  retro: "vintage",
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function BoothContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shots = searchParams.get("shots") ?? "4";
  const ratio = searchParams.get("ratio") ?? "strip";
  const packParam = searchParams.get("filter") ?? "classic";
  const retakeParam = searchParams.get("retake");
  const retakeIndex = retakeParam !== null ? parseInt(retakeParam, 10) : null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>(
    FILTERS.find((f) => f.id === (retakeIndex !== null ? packParam : PACK_TO_FILTER[packParam])) ??
      FILTERS.find((f) => f.id === PACK_TO_FILTER[packParam]) ??
      FILTERS[0]
  );

  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captured, setCaptured] = useState<string[]>([]);

  const totalShots = retakeIndex !== null ? 1 : parseInt(shots, 10) || 4;

  useEffect(() => {
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((devices) => {
        const cams = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(cams.length > 1);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    function stopCamera() {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    async function startCamera() {
      setStatus("requesting");
      stopCamera();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("ready");
      } catch (err: any) {
        if (cancelled) return;
        if (err?.name === "NotAllowedError") setStatus("denied");
        else if (err?.name === "NotFoundError") setStatus("no-camera");
        else setStatus("error");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [facingMode, retryCount]);

  function capturePhoto(): string | null {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.save();
    ctx.filter = selectedFilter.css;

    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    return canvas.toDataURL("image/jpeg", 0.92);
  }

  async function runSession() {
    if (isCapturing || status !== "ready") return;
    setIsCapturing(true);
    const newCaptures: string[] = [];

    for (let i = 0; i < totalShots; i++) {
      for (let n = 3; n >= 1; n--) {
        setCountdown(n);
        await wait(1000);
      }
      setCountdown(null);

      setFlash(true);
      const dataUrl = capturePhoto();
      if (dataUrl) newCaptures.push(dataUrl);
      setCaptured([...newCaptures]);
      await wait(150);
      setFlash(false);

      if (i < totalShots - 1) {
        await wait(700);
      }
    }

    if (retakeIndex !== null) {
      const stored = sessionStorage.getItem("pickaboo-captures");
      const existing: string[] = stored ? JSON.parse(stored) : [];
      existing[retakeIndex] = newCaptures[0];
      sessionStorage.setItem("pickaboo-captures", JSON.stringify(existing));
    } else {
      sessionStorage.setItem("pickaboo-captures", JSON.stringify(newCaptures));
      sessionStorage.setItem("pickaboo-ratio", ratio);
      sessionStorage.setItem("pickaboo-filter", selectedFilter.id);
    }

    await wait(500);
    router.push("/review");
  }

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-6xl flex-col items-center justify-center overflow-hidden px-3 py-3 sm:px-4">
      <button
        onClick={() => router.push(retakeIndex !== null ? "/review" : "/")}
        disabled={isCapturing}
        className="absolute left-4 top-5 font-[family-name:var(--font-mono)] text-xs text-ink/60 hover:text-curtain disabled:opacity-30 sm:left-6 sm:top-6 sm:text-sm"
      >
        ← back
      </button>

      <div className="mb-4 mt-2 flex flex-col items-center sm:mb-6 sm:mt-4">
        <h1 className="font-[family-name:var(--font-display)] text-xl text-ink sm:text-2xl md:text-3xl">
          {isCapturing
            ? "Hold that pose!"
            : retakeIndex !== null
            ? "Ready to retake?"
            : "Say cheese!"}
        </h1>
      </div>

      <div className="flex h-[min(50vh,64vw)] w-full items-stretch justify-center gap-2 sm:h-[min(62vh,46vw)] sm:gap-4 md:h-[min(70vh,40vw)] md:gap-8">
  {/* Filters */}
  <div className="flex h-full min-h-0 flex-col items-center gap-2 overflow-y-auto px-1.5 py-2 sm:gap-3 sm:px-2 sm:py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {FILTERS.map((f) => {
      const isSelected = selectedFilter.id === f.id;
      return (
        <button
          key={f.id}
          onClick={() => !isCapturing && setSelectedFilter(f)}
          disabled={isCapturing}
          className="group flex flex-shrink-0 flex-col items-center gap-0.5 disabled:opacity-40"
        >
          <span
            style={{ filter: f.css }}
            className={`h-7 w-7 rounded-full bg-gradient-to-br from-bubblegum via-flashbulb to-mint transition-all duration-200 ease-out group-hover:scale-110 sm:h-9 sm:w-9 md:h-10 md:w-10 ${
              isSelected
                ? "scale-110 ring-4 ring-curtain ring-offset-2 ring-offset-paper"
                : "ring-1 ring-ink/10"
            }`}
          />
          <span
            className={`hidden font-[family-name:var(--font-mono)] text-[9px] text-ink/60 transition-opacity duration-200 md:block ${
              isSelected ? "opacity-30" : "opacity-100"
            }`}
          >
            {f.label}
          </span>
        </button>
      );
    })}
  </div>

        {/* Camera frame */}
  <div className="relative aspect-[3/4] h-full flex-shrink-0 overflow-hidden rounded-3xl border-4 border-curtain bg-ink shadow-2xl sm:border-8">
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{ filter: selectedFilter.css }}
      className={`h-full w-full object-cover transition-opacity duration-300 ${
        status === "ready" ? "opacity-100" : "opacity-0"
      } ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
    />

    {status === "requesting" && (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-paper">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-paper/30 border-t-flashbulb" />
        <p className="font-[family-name:var(--font-body)] text-sm">
          Asking for camera access…
        </p>
      </div>
    )}

    {status === "denied" && (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-paper">
        <p className="font-[family-name:var(--font-body)] text-sm">
          Camera access was denied. Enable it in your browser&apos;s site
          settings, then try again.
        </p>
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className="rounded-full bg-flashbulb px-5 py-2 text-sm font-medium text-ink"
        >
          Try again
        </button>
      </div>
    )}

    {status === "no-camera" && (
      <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-paper">
        <p className="font-[family-name:var(--font-body)] text-sm">
          No camera was found on this device.
        </p>
      </div>
    )}

    {status === "error" && (
      <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-paper">
        <p className="font-[family-name:var(--font-body)] text-sm">
          Something went wrong starting the camera.
        </p>
      </div>
    )}

    {countdown !== null && (
      <div className="absolute inset-0 flex items-center justify-center bg-ink/30">
        <span
          key={countdown}
          className="animate-[pop_0.9s_ease-out] font-[family-name:var(--font-display)] text-8xl text-paper drop-shadow-lg"
        >
          {countdown}
        </span>
      </div>
    )}

    <div
      className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-150 ${
        flash ? "opacity-90" : "opacity-0"
      }`}
    />
  </div>

  {/* Shutter */}
  <div className="flex h-full flex-shrink-0 flex-col items-center justify-center gap-2 sm:gap-3">
    <button
      onClick={runSession}
      disabled={isCapturing || status !== "ready"}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-curtain shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 sm:h-12 sm:w-12 md:h-16 md:w-16"
    >
      <span className="h-7 w-7 rounded-full border-4 border-paper sm:h-8 sm:w-8 md:h-11 md:w-11" />
    </button>
    <span className="font-[family-name:var(--font-mono)] text-[9px] text-ink/60 sm:text-[10px]">
      {isCapturing ? `${captured.length}/${totalShots}` : "start"}
    </span>

    {hasMultipleCameras && (
      <button
        onClick={() =>
          !isCapturing &&
          setFacingMode((f) => (f === "user" ? "environment" : "user"))
        }
        disabled={isCapturing}
        className="mt-1 rounded-full border-2 border-ink/10 bg-white p-2 text-xs hover:border-curtain/40 disabled:opacity-40"
      >
        🔄
      </button>
    )}
  </div>
</div>

      <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] text-ink/50 sm:text-xs">
        {retakeIndex !== null ? `Retaking shot ${retakeIndex + 1}` : `${shots} shots queued`}
      </p>

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}

export default function BoothPage() {
  return (
    <Suspense fallback={null}>
      <BoothContent />
    </Suspense>
  );
}