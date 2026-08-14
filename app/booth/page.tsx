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
const FACE_MODELS_URL = "/models";

// Photo Booth-style crown geometry.
// Coordinates are relative to the detected head width/height.
// The crown is intentionally wide, tightly clustered and slightly overlapping.
const CROWN_OFFSETS = [
  // Deliberately irregular: the reference is NOT a neat side-by-side arch.
  // Each heart has its own depth, opacity and vertical motion.
 
  { dx: -0.32, dy: -0.055, scale: 0.62, rotate: -8, opacity: 0.42, amp: 0.045, phase: 2.30, speed: 0.86 },
  { dx: -0.25, dy: -0.125, scale: 0.83, rotate: -5, opacity: 0.62, amp: 0.038, phase: 4.10, speed: 1.08 },
  { dx: -0.105, dy: -0.165, scale: 0.85, rotate: -2, opacity: 0.90, amp: 0.052, phase: 1.05, speed: 0.92 },
  { dx: 0.030, dy: -0.135, scale: 0.94, rotate: 2, opacity: 0.86, amp: 0.040, phase: 3.20, speed: 1.15 },
  { dx: 0.120, dy: -0.175, scale: 0.58, rotate: 5, opacity: 0.76, amp: 0.050, phase: 5.10, speed: 0.82 },
  { dx: 0.185, dy: -0.090, scale: 0.78, rotate: 8, opacity: 0.50, amp: 0.034, phase: 0.90, speed: 1.03 },
  { dx: 0.300, dy: 0.000, scale: 0.66, rotate: 12, opacity: 0.66, amp: 0.048, phase: 3.85, speed: 0.88 },
 
];

const HEART_EMOJI = "💗";
const HEART_FONT_FAMILY = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const HEART_ASSET_SRC = "/ios-pink-heart.png";

type CrownTarget = {
  cx: number;
  anchorY: number;
  headWidth: number;
  headHeight: number;
  roll: number;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getCrownTarget(result: any): CrownTarget | null {
  if (!result?.box) return null;

  const box = result.box;
  const landmarks = result.landmarks;
  let cx = box.x + box.width / 2;
  let browY = box.y + box.height * 0.30;

  // 68-point landmarks give us a much better "hairline" proxy than the
  // top edge of the face detector box. Eyebrows are points 17..26.
  if (landmarks?.positions?.length >= 27) {
    const brows = landmarks.positions.slice(17, 27);
    if (brows.length) {
  const landmarkCx =
    brows.reduce((sum: number, p: any) => sum + p.x, 0) / brows.length;

  const landmarkY =
    Math.min(...brows.map((p: any) => p.y));

  // Blend landmarks with the detector box.
  // This keeps tracking stable during strong head tilts.
  cx = lerp(
    box.x + box.width / 2,
    landmarkCx,
    0.65
  );

  browY = lerp(
    box.y + box.height * 0.30,
    landmarkY,
    0.65
  );
}
  }

  // Move above the eyebrows into the hair/crown area.
  const anchorY = browY - box.height * 0.48;

  let roll = 0;
  if (landmarks?.positions?.length >= 48) {
    const leftEye = landmarks.positions.slice(36, 42);
    const rightEye = landmarks.positions.slice(42, 48);
    if (leftEye.length && rightEye.length) {
      const lx = leftEye.reduce((s: number, p: any) => s + p.x, 0) / leftEye.length;
      const ly = leftEye.reduce((s: number, p: any) => s + p.y, 0) / leftEye.length;
      const rx = rightEye.reduce((s: number, p: any) => s + p.x, 0) / rightEye.length;
      const ry = rightEye.reduce((s: number, p: any) => s + p.y, 0) / rightEye.length;
      roll = Math.atan2(ry - ly, rx - lx);
    }
  }

  return {
    cx,
    anchorY,
    headWidth: box.width,
    headHeight: box.height,
    roll,
  };
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
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const heartImgRef = useRef<HTMLImageElement | null>(null);
  const useNativeAppleEmojiRef = useRef(false);
  const crownTargetRef = useRef<CrownTarget | null>(null);
  const crownCurrentRef = useRef<CrownTarget | null>(null);
  const crownVisibleRef = useRef(false);
  const crownMissesRef = useRef(0);
  const overlayRafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

    // Use Apple's actual system emoji artwork when the app is running on an
    // Apple device. On Windows/Linux we use the bundled reference-derived
    // transparent heart so the site does not fall back to a random emoji set.
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    useNativeAppleEmojiRef.current =
      /Macintosh|Mac OS X|iPhone|iPad|iPod/.test(ua) ||
      /Mac/.test(platform);

    const img = new Image();
    img.decoding = "async";
    img.src = HEART_ASSET_SRC;
    heartImgRef.current = img;
  }, [layout.themeOverlay]);

  useEffect(() => {
    if (layout.themeOverlay !== "hearts") return;
    let cancelled = false;
    setFaceStatus("loading");

    (async () => {
      try {
        if (!faceapiRef.current) faceapiRef.current = await import("face-api.js");
        const faceapi = faceapiRef.current;

        // Keep the existing tiny detector, but add the 68-point landmark
        // model. Landmarks let us anchor the crown above the eyebrows instead
        // of incorrectly pinning it to the forehead/top of the box.
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODELS_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODELS_URL),
        ]);

        if (!cancelled) setFaceStatus("ready");
      } catch (err) {
        console.error("Face model load failed:", err);
        if (!cancelled) setFaceStatus("error");
      }
    })();

    return () => { cancelled = true; };
  }, [layout.themeOverlay]);

  useEffect(() => {
  if (
    faceStatus !== "ready" ||
    status !== "ready" ||
    layout.themeOverlay !== "hearts"
  ) {
    return;
  }

  let cancelled = false;
  let detectionTimer: ReturnType<typeof setTimeout> | null = null;
  let detecting = false;

  async function detectLoop() {
    if (
      cancelled ||
      !videoRef.current ||
      !faceapiRef.current ||
      videoRef.current.readyState < 2
    ) {
      if (!cancelled) {
        detectionTimer = setTimeout(detectLoop, 100);
      }
      return;
    }

    if (!detecting) {
      detecting = true;

      try {
        const faceapi = faceapiRef.current;

        // FIRST: reliable face-box detection.
        // This alone is enough to show the crown.
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.15,
          })
        );

        if (cancelled) return;

        if (detection) {
          // Guaranteed fallback target.
          let target: CrownTarget = {
            cx: detection.box.x + detection.box.width / 2,
            anchorY:
              detection.box.y -
              detection.box.height * 0.08,
            headWidth: detection.box.width,
            headHeight: detection.box.height,
            roll: 0,
          };

          // Try landmarks separately.
          // If landmarks fail for ANY reason, we keep the
          // reliable face-box target above.
          try {
            const landmarkResult = await detection.withFaceLandmarks();

            if (!cancelled && landmarkResult) {
              const landmarkTarget = getCrownTarget(landmarkResult);

              if (landmarkTarget) {
                target = landmarkTarget;
              }
            }
          } catch {
            // Ignore landmark failures.
            // Face-box tracking continues.
          }

          crownTargetRef.current = target;
          crownVisibleRef.current = true;
          crownMissesRef.current = 0;
        } else {
  crownMissesRef.current += 1;

  if (crownMissesRef.current > 45) {
    crownVisibleRef.current = false;
  }
}
      } catch (error) {
        console.warn("Heart tracking frame failed:", error);
      } finally {
        detecting = false;
      }
    }

    if (!cancelled) {
      detectionTimer = setTimeout(detectLoop, 70);
    }
  }

  detectLoop();

  return () => {
    cancelled = true;

    if (detectionTimer) {
      clearTimeout(detectionTimer);
    }
  };
}, [faceStatus, status, layout.themeOverlay]);

  
  useEffect(() => {
    if (layout.themeOverlay !== "hearts") return;

    let cancelled = false;

    function resizeOverlay() {
      const canvas = overlayCanvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const rect = video.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }

    function drawCrown() {
      if (cancelled) return;

      const canvas = overlayCanvasRef.current;
      const video = videoRef.current;
      const heart = heartImgRef.current;

      if (
        canvas &&
        video &&
        video.videoWidth &&
        video.videoHeight &&
        (useNativeAppleEmojiRef.current ||
          (heart && heart.complete && heart.naturalWidth > 0))
      ) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const rect = video.getBoundingClientRect();
          const dpr = Math.min(window.devicePixelRatio || 1, 2);

          if (
            canvas.width !== Math.round(rect.width * dpr) ||
            canvas.height !== Math.round(rect.height * dpr)
          ) {
            resizeOverlay();
          }

          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, rect.width, rect.height);

          const target = crownTargetRef.current;
          if (target && crownVisibleRef.current) {
            if (!crownCurrentRef.current) {
              crownCurrentRef.current = { ...target };
            } else {
              // Exponential smoothing: fast enough to follow movement but
              // slow enough to eliminate detector jitter.
              const s = 0.18;
              crownCurrentRef.current.cx = lerp(crownCurrentRef.current.cx, target.cx, s);
              crownCurrentRef.current.anchorY = lerp(crownCurrentRef.current.anchorY, target.anchorY, s);
              crownCurrentRef.current.headWidth = lerp(crownCurrentRef.current.headWidth, target.headWidth, s);
              crownCurrentRef.current.headHeight = lerp(crownCurrentRef.current.headHeight, target.headHeight, s);
              crownCurrentRef.current.roll = lerp(crownCurrentRef.current.roll, target.roll, s);
            }

            const c = crownCurrentRef.current;

            // Convert intrinsic camera coordinates to the visible CSS
            // rectangle using the exact same object-cover crop as <video>.
            const vw = video.videoWidth;
            const vh = video.videoHeight;
            const scale = Math.max(rect.width / vw, rect.height / vh);
            const renderedW = vw * scale;
            const renderedH = vh * scale;
            const cropX = (renderedW - rect.width) / 2;
            const cropY = (renderedH - rect.height) / 2;

            const centerX = c.cx * scale - cropX;
            const anchorY = c.anchorY * scale - cropY;
            const headW = c.headWidth * scale;

            // The reference has individual hearts drifting independently.
            // They do NOT move as one group: some rise while others fall.
            const heartW = Math.max(24, Math.min(94, headW * 0.220));
            const now = performance.now() / 1000;

            ctx.globalCompositeOperation = "source-over";
            ctx.imageSmoothingEnabled = true;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            for (const item of CROWN_OFFSETS) {
              const independentY =
                Math.sin(now * item.speed + item.phase) *
                item.amp *
                headW;

              const x = centerX + item.dx * headW;
              const y = anchorY + item.dy * headW + independentY;
              const w = heartW * item.scale;

              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(c.roll + (item.rotate * Math.PI) / 180);
              ctx.globalAlpha = item.opacity;

              if (useNativeAppleEmojiRef.current) {
                ctx.font = `${Math.round(w)}px ${HEART_FONT_FAMILY}`;
                ctx.fillText(HEART_EMOJI, 0, 0);
              } else if (heart) {
                const h = w * 1.02;
                ctx.drawImage(heart, -w / 2, -h / 2, w, h);
              }

              ctx.restore();
            }

            ctx.globalAlpha = 1;
          }
        }
      }

      overlayRafRef.current = requestAnimationFrame(drawCrown);
    }

    resizeOverlay();
    window.addEventListener("resize", resizeOverlay);
    overlayRafRef.current = requestAnimationFrame(drawCrown);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", resizeOverlay);
      if (overlayRafRef.current !== null) cancelAnimationFrame(overlayRafRef.current);
      overlayRafRef.current = null;
    };
  }, [layout.themeOverlay, status]);

  function capturePhoto(): string | null {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
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

    if (
      layout.themeOverlay === "hearts" &&
      crownCurrentRef.current &&
      (useNativeAppleEmojiRef.current ||
        (heartImgRef.current?.complete && heartImgRef.current?.naturalWidth))
    ) {
      const c = crownCurrentRef.current;

      const mirrorX = (x: number) =>
        facingMode === "user" ? width - x : x;

      const centerX = mirrorX(c.cx);
      const headW = c.headWidth;
      const heartW = Math.max(30, Math.min(150, headW * 0.235));
      const now = performance.now() / 1000;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.imageSmoothingEnabled = true;

      for (const item of CROWN_OFFSETS) {
        const independentY =
          Math.sin(now * item.speed + item.phase) *
          item.amp *
          headW;

        const rawX = c.cx + item.dx * headW;
        const x = mirrorX(rawX);
        const y = c.anchorY + item.dy * headW + independentY;
        const w = heartW * item.scale;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(
          (c.roll +
            (facingMode === "user" ? -item.rotate : item.rotate)) *
            Math.PI /
            180
        );
        ctx.globalAlpha = item.opacity;

        if (useNativeAppleEmojiRef.current) {
          ctx.font = `${Math.round(w)}px ${HEART_FONT_FAMILY}`;
          ctx.fillText(HEART_EMOJI, 0, 0);
        } else if (heartImgRef.current) {
          const h = w * 1.02;
          ctx.drawImage(heartImgRef.current, -w / 2, -h / 2, w, h);
        }

        ctx.restore();
      }

      ctx.globalAlpha = 1;
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
        const ctx = off.getContext("2d", { willReadFrequently: true });
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
    <main className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-center justify-start overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-4 lg:h-dvh lg:justify-center lg:overflow-hidden lg:py-3">
      <button
        onClick={() => router.push(retakeIndex !== null ? "/review" : "/")}
        disabled={isCapturing}
        className="absolute left-4 top-5 font-[family-name:var(--font-mono)] text-xs text-ink/60 hover:text-curtain disabled:opacity-30 sm:left-6 sm:top-6 sm:text-sm"
      >
        ← back
      </button>

      <div className="mb-5 mt-16 flex w-full flex-col items-center text-center sm:mb-6 sm:mt-16 lg:mb-4 lg:mt-4">
        <h1 className="font-[family-name:var(--font-display)] text-xl text-ink sm:text-2xl md:text-3xl">
          {isCapturing ? "Hold that pose!" : retakeIndex !== null ? "Ready to retake?" : "Say cheese!"}
        </h1>
        {layout.themeOverlay === "hearts" && faceStatus === "loading" && (
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[9px] text-ink/40">loading heart filter…</p>
        )}
        {layout.themeOverlay === "hearts" && faceStatus === "error" && (
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[9px] text-curtain">
            heart filter unavailable — check the console for details
          </p>
        )}
      </div>

      <div className="flex w-full flex-col items-center justify-start gap-4 lg:flex-row lg:items-stretch lg:justify-center lg:gap-8">
        <div
          style={{ height: columnHeight }}
          className="hidden min-h-0 flex-col items-center gap-2 overflow-y-auto px-1.5 py-2 sm:px-2 sm:py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex"
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
          
          className="relative aspect-[3/4] h-[min(58dvh,118vw)] w-auto flex-shrink-0 overflow-hidden rounded-3xl border-4 border-curtain bg-ink shadow-2xl sm:border-8 lg:h-[min(calc((100vw-150px)*1.3333),calc(100dvh-220px),620px)]"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ filter: selectedFilter.css }}
            className={`h-full w-full object-cover transition-opacity duration-300 ${status === "ready" ? "opacity-100" : "opacity-0"} ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
          />

          {layout.themeOverlay === "hearts" && (
            <canvas
              ref={overlayCanvasRef}
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 z-20 h-full w-full ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
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

        <div className="flex w-full flex-shrink-0 flex-col items-center justify-center gap-3 lg:w-auto lg:gap-3">
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
            className="rounded-full border-2 border-ink/10 bg-white px-4 py-2.5 text-xs font-medium text-ink hover:border-curtain/40 disabled:opacity-40 sm:px-5 sm:py-3 sm:text-sm"
          >
            📁Upload from device
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 sm:mt-6 lg:mt-3">
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

      <p className="mb-4 mt-2 font-[family-name:var(--font-mono)] text-center text-[10px] text-ink/50 sm:text-xs lg:mb-0">
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