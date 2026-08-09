"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getLayout } from "../layouts";

type CameraStatus = "idle" | "requesting" | "ready" | "denied" | "no-camera" | "error";

type FilterOp =
  | { op: "grayscale"; amount: number }
  | { op: "sepia"; amount: number }
  | { op: "saturate"; amount: number }
  | { op: "contrast"; amount: number }
  | { op: "brightness"; amount: number }
  | { op: "hueRotate"; degrees: number };

type FilterOption = { id: string; label: string; css: string; ops: FilterOp[] };

const FILTERS: FilterOption[] = [
  { id: "original", label: "Original", css: "none", ops: [] },
  { id: "noir", label: "Noir", css: "grayscale(1) contrast(1.15)", ops: [{ op: "grayscale", amount: 1 }, { op: "contrast", amount: 1.15 }] },
  { id: "vintage", label: "Vintage", css: "sepia(0.35) contrast(0.9) brightness(1.05) saturate(1.3)", ops: [{ op: "sepia", amount: 0.35 }, { op: "contrast", amount: 0.9 }, { op: "brightness", amount: 1.05 }, { op: "saturate", amount: 1.3 }] },
  { id: "dreamy", label: "Dreamy", css: "brightness(1.12) saturate(1.35) contrast(0.9) blur(0.3px)", ops: [{ op: "brightness", amount: 1.12 }, { op: "saturate", amount: 1.35 }, { op: "contrast", amount: 0.9 }] },
  { id: "pop", label: "Pop", css: "saturate(1.7) contrast(1.15) brightness(1.05)", ops: [{ op: "saturate", amount: 1.7 }, { op: "contrast", amount: 1.15 }, { op: "brightness", amount: 1.05 }] },
  { id: "cool", label: "Cool Tone", css: "hue-rotate(180deg) saturate(1.15) brightness(1.02)", ops: [{ op: "hueRotate", degrees: 180 }, { op: "saturate", amount: 1.15 }, { op: "brightness", amount: 1.02 }] },
  { id: "warm", label: "Warm Tone", css: "sepia(0.2) saturate(1.4) brightness(1.05)", ops: [{ op: "sepia", amount: 0.2 }, { op: "saturate", amount: 1.4 }, { op: "brightness", amount: 1.05 }] },
  { id: "fade", label: "Faded", css: "contrast(0.85) brightness(1.1) saturate(0.6)", ops: [{ op: "contrast", amount: 0.85 }, { op: "brightness", amount: 1.1 }, { op: "saturate", amount: 0.6 }] },
  { id: "highcontrast", label: "Bold B&W", css: "grayscale(1) contrast(1.5) brightness(0.95)", ops: [{ op: "grayscale", amount: 1 }, { op: "contrast", amount: 1.5 }, { op: "brightness", amount: 0.95 }] },
];

const TIMER_OPTIONS = [3, 5, 10];
const TWEMOJI_BASE = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72/";
const FACE_MODELS_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

function toTwemojiCodepoint(emoji: string): string {
  return Array.from(emoji).map((c) => c.codePointAt(0)!.toString(16)).filter((h) => h !== "fe0f").join("-");
}
function twemojiUrl(emoji: string): string {
  return `${TWEMOJI_BASE}${toTwemojiCodepoint(emoji)}.png`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function clamp(v: number): number {
  return Math.min(255, Math.max(0, v));
}
function grayscaleMatrix(amount: number): number[] {
  const s = 1 - amount;
  return [0.2126 + 0.7874 * s, 0.7152 - 0.7152 * s, 0.0722 - 0.0722 * s, 0.2126 - 0.2126 * s, 0.7152 + 0.2848 * s, 0.0722 - 0.0722 * s, 0.2126 - 0.2126 * s, 0.7152 - 0.7152 * s, 0.0722 + 0.9278 * s];
}
function sepiaMatrix(amount: number): number[] {
  const s = 1 - amount;
  return [0.393 + 0.607 * s, 0.769 - 0.769 * s, 0.189 - 0.189 * s, 0.349 - 0.349 * s, 0.686 + 0.314 * s, 0.168 - 0.168 * s, 0.272 - 0.272 * s, 0.534 - 0.534 * s, 0.131 + 0.869 * s];
}
function saturateMatrix(amount: number): number[] {
  return [0.213 + 0.787 * amount, 0.715 - 0.715 * amount, 0.072 - 0.072 * amount, 0.213 - 0.213 * amount, 0.715 + 0.285 * amount, 0.072 - 0.072 * amount, 0.213 - 0.213 * amount, 0.715 - 0.715 * amount, 0.072 + 0.928 * amount];
}
function hueRotateMatrix(degrees: number): number[] {
  const rad = (degrees * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928, 0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283, 0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072];
}
function applyMatrix3(data: Uint8ClampedArray, m: number[]) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    data[i] = clamp(m[0] * r + m[1] * g + m[2] * b);
    data[i + 1] = clamp(m[3] * r + m[4] * g + m[5] * b);
    data[i + 2] = clamp(m[6] * r + m[7] * g + m[8] * b);
  }
}
function applyBrightness(data: Uint8ClampedArray, amount: number) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] * amount);
    data[i + 1] = clamp(data[i + 1] * amount);
    data[i + 2] = clamp(data[i + 2] * amount);
  }
}
function applyContrast(data: Uint8ClampedArray, amount: number) {
  const intercept = 128 * (1 - amount);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] * amount + intercept);
    data[i + 1] = clamp(data[i + 1] * amount + intercept);
    data[i + 2] = clamp(data[i + 2] * amount + intercept);
  }
}
function applyFilterOps(imageData: ImageData, ops: FilterOp[]) {
  const data = imageData.data;
  for (const op of ops) {
    switch (op.op) {
      case "grayscale": applyMatrix3(data, grayscaleMatrix(op.amount)); break;
      case "sepia": applyMatrix3(data, sepiaMatrix(op.amount)); break;
      case "saturate": applyMatrix3(data, saturateMatrix(op.amount)); break;
      case "hueRotate": applyMatrix3(data, hueRotateMatrix(op.degrees)); break;
      case "contrast": applyContrast(data, op.amount); break;
      case "brightness": applyBrightness(data, op.amount); break;
    }
  }
}

function BoothContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const layoutParam = searchParams.get("layout") ??
    (typeof window !== "undefined" ? sessionStorage.getItem("pickaboo-selected-layout") : null);
  const layout = getLayout(layoutParam);

  const filterParam = searchParams.get("filter");
  const retakeParam = searchParams.get("retake");
  const retakeIndex = retakeParam !== null ? parseInt(retakeParam, 10) : null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heartImgRef = useRef<HTMLImageElement | null>(null);
  const faceBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const faceapiRef = useRef<any>(null);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>(
    FILTERS.find((f) => f.id === filterParam) ?? FILTERS.find((f) => f.id === "noir") ?? FILTERS[0]
  );
  const [timerSeconds, setTimerSeconds] = useState(3);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captured, setCaptured] = useState<string[]>([]);

  const [faceStatus, setFaceStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [facePos, setFacePos] = useState<{ xPct: number; yPct: number; widthPct: number } | null>(null);

  const totalShots = retakeIndex !== null ? 1 : layout.poses;

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices()
      .then((devices) => setHasMultipleCameras(devices.filter((d) => d.kind === "videoinput").length > 1))
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
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus("ready");
      } catch (err: any) {
        if (cancelled) return;
        if (err?.name === "NotAllowedError") setStatus("denied");
        else if (err?.name === "NotFoundError") setStatus("no-camera");
        else setStatus("error");
      }
    }
    startCamera();
    return () => { cancelled = true; stopCamera(); };
  }, [facingMode, retryCount]);

  useEffect(() => {
    if (layout.themeOverlay !== "hearts") return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = twemojiUrl("💗");
    heartImgRef.current = img;
  }, [layout.themeOverlay]);

  useEffect(() => {
    if (layout.themeOverlay !== "hearts") return;
    let cancelled = false;
    setFaceStatus("loading");
    (async () => {
      try {
        if (!faceapiRef.current) faceapiRef.current = await import("face-api.js");
        await faceapiRef.current.nets.tinyFaceDetector.loadFromUri(FACE_MODELS_URL);
        if (!cancelled) setFaceStatus("ready");
      } catch (err) {
        console.error("Face model load failed:", err);
        if (!cancelled) setFaceStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [layout.themeOverlay]);

  useEffect(() => {
    if (faceStatus !== "ready" || status !== "ready" || layout.themeOverlay !== "hearts") return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function detectLoop() {
      if (cancelled || !videoRef.current || !faceapiRef.current) return;
      try {
        const faceapi = faceapiRef.current;
        const result = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        );
        if (!cancelled && result && videoRef.current) {
          const vw = videoRef.current.videoWidth;
          const vh = videoRef.current.videoHeight;
          faceBoxRef.current = { x: result.box.x, y: result.box.y, width: result.box.width, height: result.box.height };
          setFacePos({
            xPct: ((result.box.x + result.box.width / 2) / vw) * 100,
            yPct: (result.box.y / vh) * 100,
            widthPct: (result.box.width / vw) * 100,
          });
        }
      } catch {}
      if (!cancelled) timeoutId = setTimeout(detectLoop, 150);
    }
    detectLoop();
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [faceStatus, status, layout.themeOverlay]);

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
    if (facingMode === "user") { ctx.translate(width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    if (selectedFilter.ops.length > 0) {
      const imageData = ctx.getImageData(0, 0, width, height);
      applyFilterOps(imageData, selectedFilter.ops);
      ctx.putImageData(imageData, 0, 0);
    }

    if (layout.themeOverlay === "hearts" && faceBoxRef.current && heartImgRef.current?.complete) {
      const box = faceBoxRef.current;
      const mirroredX = facingMode === "user" ? width - box.x - box.width : box.x;
      const centerX = mirroredX + box.width / 2;
      const centerY = box.y - box.height * 0.35;
      const heartSize = box.width * 0.9;
      ctx.drawImage(heartImgRef.current, centerX - heartSize / 2, centerY - heartSize / 2, heartSize, heartSize);
    }

    return canvas.toDataURL("image/jpeg", 0.92);
  }

  function finishAndProceed(newCaptures: string[]) {
    if (retakeIndex !== null) {
      const stored = sessionStorage.getItem("pickaboo-captures");
      const existing: string[] = stored ? JSON.parse(stored) : [];
      existing[retakeIndex] = newCaptures[0];
      sessionStorage.setItem("pickaboo-captures", JSON.stringify(existing));
    } else {
      sessionStorage.setItem("pickaboo-captures", JSON.stringify(newCaptures));
      sessionStorage.setItem("pickaboo-layout", layout.id);
      sessionStorage.setItem("pickaboo-filter", selectedFilter.id);
    }
    router.push("/review");
  }

  async function runSession() {
    if (isCapturing || status !== "ready") return;
    setIsCapturing(true);
    const newCaptures: string[] = [...captured];

    for (let i = newCaptures.length; i < totalShots; i++) {
      for (let n = timerSeconds; n >= 1; n--) {
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
      if (i < totalShots - 1) await wait(700);
    }

    await wait(500);
    finishAndProceed(newCaptures);
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function processFileToPhoto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const targetW = 720, targetH = 960;
        const off = document.createElement("canvas");
        off.width = targetW;
        off.height = targetH;
        const ctx = off.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));

        const srcRatio = img.width / img.height;
        const targetRatio = targetW / targetH;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (srcRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

        if (selectedFilter.ops.length > 0) {
          const imageData = ctx.getImageData(0, 0, targetW, targetH);
          applyFilterOps(imageData, selectedFilter.ops);
          ctx.putImageData(imageData, 0, 0);
        }
        resolve(off.toDataURL("image/jpeg", 0.92));
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error("image load failed"));
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const remaining = totalShots - captured.length;
    const filesToUse = files.slice(0, remaining);
    const processed: string[] = [];
    for (const file of filesToUse) {
      try {
        processed.push(await processFileToPhoto(file));
      } catch (err) {
        console.error("Upload processing failed:", err);
      }
    }

    const newCaptures = [...captured, ...processed];
    setCaptured(newCaptures);
    if (newCaptures.length >= totalShots) {
      finishAndProceed(newCaptures);
    }
  }

  const columnHeight = "min(calc((100vw - 150px) * 1.3333), calc(100dvh - 220px), 620px)";

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-6xl flex-col items-center justify-center overflow-hidden px-3 py-3 sm:px-4">
      <button
        onClick={() => router.push(retakeIndex !== null ? "/review" : "/")}
        disabled={isCapturing}
        className="absolute left-4 top-5 font-[family-name:var(--font-mono)] text-xs text-ink/60 hover:text-curtain disabled:opacity-30 sm:left-6 sm:top-6 sm:text-sm"
      >
        ← back
      </button>

      <div className="mb-3 mt-2 flex flex-col items-center sm:mb-4 sm:mt-4">
        <h1 className="font-[family-name:var(--font-display)] text-xl text-ink sm:text-2xl md:text-3xl">
          {isCapturing ? "Hold that pose!" : retakeIndex !== null ? "Ready to retake?" : "Say cheese!"}
        </h1>
        {layout.themeOverlay === "hearts" && faceStatus === "loading" && (
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[9px] text-ink/40">loading heart filter…</p>
        )}
        {layout.themeOverlay === "hearts" && faceStatus === "error" && (
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[9px] text-curtain">
            heart filter unavailable — check your connection and refresh
          </p>
        )}
      </div>

      <div className="flex w-full items-stretch justify-center gap-2 sm:gap-4 md:gap-8">
        <div
          style={{ height: columnHeight }}
          className="flex min-h-0 flex-col items-center gap-2 overflow-y-auto px-1.5 py-2 sm:gap-3 sm:px-2 sm:py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
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
                    isSelected ? "scale-110 ring-4 ring-curtain ring-offset-2 ring-offset-paper" : "ring-1 ring-ink/10"
                  }`}
                />
                <span className={`hidden font-[family-name:var(--font-mono)] text-[9px] text-ink/60 transition-opacity duration-200 md:block ${isSelected ? "opacity-30" : "opacity-100"}`}>
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>

        <div
          style={{ height: columnHeight }}
          className="relative aspect-[3/4] flex-shrink-0 overflow-hidden rounded-3xl border-4 border-curtain bg-ink shadow-2xl sm:border-8"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ filter: selectedFilter.css }}
            className={`h-full w-full object-cover transition-opacity duration-300 ${status === "ready" ? "opacity-100" : "opacity-0"} ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
          />

          {layout.themeOverlay === "hearts" && facePos && status === "ready" && (
            <img
              src={twemojiUrl("💗")}
              alt=""
              className="pointer-events-none absolute animate-bounce"
              style={{
                left: facingMode === "user" ? `${100 - facePos.xPct}%` : `${facePos.xPct}%`,
                top: `${Math.max(2, facePos.yPct - 10)}%`,
                width: `${Math.min(40, facePos.widthPct * 0.9)}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}

          {status === "requesting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-paper">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-paper/30 border-t-flashbulb" />
              <p className="font-[family-name:var(--font-body)] text-sm">Asking for camera access…</p>
            </div>
          )}
          {status === "denied" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-paper">
              <p className="font-[family-name:var(--font-body)] text-sm">
                Camera access was denied. Enable it in your browser&apos;s site settings, then try again.
              </p>
              <button onClick={() => setRetryCount((c) => c + 1)} className="rounded-full bg-flashbulb px-5 py-2 text-sm font-medium text-ink">
                Try again
              </button>
            </div>
          )}
          {status === "no-camera" && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-paper">
              <p className="font-[family-name:var(--font-body)] text-sm">No camera was found on this device.</p>
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-paper">
              <p className="font-[family-name:var(--font-body)] text-sm">Something went wrong starting the camera.</p>
            </div>
          )}

          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/30">
              <span key={countdown} className="animate-[pop_0.9s_ease-out] font-[family-name:var(--font-display)] text-8xl text-paper drop-shadow-lg">
                {countdown}
              </span>
            </div>
          )}
          <div className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-150 ${flash ? "opacity-90" : "opacity-0"}`} />
        </div>

        <div style={{ height: columnHeight }} className="flex flex-shrink-0 flex-col items-center justify-center gap-2 sm:gap-3">
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
              onClick={() => !isCapturing && setFacingMode((f) => (f === "user" ? "environment" : "user"))}
              disabled={isCapturing}
              className="rounded-full border-2 border-ink/10 bg-white p-2 text-xs hover:border-curtain/40 disabled:opacity-40"
            >
              🔄
            </button>
          )}

          <button
            onClick={handleUploadClick}
            disabled={isCapturing}
            className="rounded-full border-2 border-ink/10 bg-white px-2.5 py-2 text-[10px] font-medium text-ink hover:border-curtain/40 disabled:opacity-40"
          >
            📁 Upload
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="font-[family-name:var(--font-mono)] text-[9px] text-ink/50">timer</span>
        {TIMER_OPTIONS.map((t) => (
          <button
            key={t}
            onClick={() => !isCapturing && setTimerSeconds(t)}
            disabled={isCapturing}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors disabled:opacity-40 ${
              timerSeconds === t ? "bg-curtain text-paper" : "bg-white text-ink ring-1 ring-ink/10"
            }`}
          >
            {t}s
          </button>
        ))}
      </div>

      <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] text-ink/50 sm:text-xs">
        {retakeIndex !== null ? `Retaking shot ${retakeIndex + 1}` : `${layout.poses} shots queued`}
      </p>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesSelected} className="hidden" />
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