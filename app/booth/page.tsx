"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getLayout, getSlotAspect  } from "../layouts";

type CameraStatus = "idle" | "requesting" | "ready" | "denied" | "no-camera" | "error";

type FilterOp =
  | { op: "grayscale"; amount: number }
  | { op: "sepia"; amount: number }
  | { op: "saturate"; amount: number }
  | { op: "contrast"; amount: number }
  | { op: "brightness"; amount: number }
  | { op: "hueRotate"; degrees: number };

type FilterOption = {
  id: string;
  label: string;
  css: string;
  ops: FilterOp[];
  preview: string;
};

const FILTERS: FilterOption[] = [
  {
    id: "original",
    label: "Original",
    css: "none",
    ops: [],
    preview: "/filters/original.jpg",
  },

  
  {
    id: "noir",
    label: "Noir",
    css: "grayscale(1) contrast(1.15)",
    ops: [
      { op: "grayscale", amount: 1 },
      { op: "contrast", amount: 1.15 },
    ],
    preview: "/filters/noir.jpg",
  },

  {
    id: "film",
    label: "Film",
    css: "sepia(0.12) contrast(2.4) brightness(1.0) saturate(1.5)",
    ops: [
      { op: "sepia", amount: 0.12 },
      { op: "contrast", amount: 2.4 },
      { op: "brightness", amount: 1.0 },
      { op: "saturate", amount: 1.5 },
    ],
    preview: "/filters/film.jpg",
  },

  {
    id: "dreamy",
    label: "Dreamy",
    css: "brightness(1.8) saturate(1.12) contrast(0.88) blur(1px)",
    ops: [
      { op: "brightness", amount: 1.8 },
      { op: "saturate", amount: 1.12 },
      { op: "contrast", amount: 0.88 },
    ],
    preview: "/filters/dreamy.jpg",
  },

  {
    id: "flash",
    label: "Flash",
    css: "brightness(2.08) contrast(1.12) saturate(1.05)",
    ops: [
      { op: "brightness", amount: 2.08 },
      { op: "contrast", amount: 1.12 },
      { op: "saturate", amount: 1.05 },
    ],
    preview: "/filters/flash.jpg",
  },

  {
    id: "retro",
    label: "Retro",
    css: "sepia(0.7) contrast(1.90) brightness(1.06) saturate(1.82)",
    ops: [
      { op: "sepia", amount: 0.7 },
      { op: "contrast", amount: 1.90 },
      { op: "brightness", amount: 1.06 },
      { op: "saturate", amount: 1.82 },
    ],
    preview: "/filters/retro.jpg",
  },


  {
    id: "polaroid",
    label: "Polaroid",
    css: "sepia(0.3) saturate(1.90) contrast(1.92) brightness(1.2) hue-rotate(10deg)",
    ops: [
      { op: "sepia", amount: 0.3 },
      { op: "saturate", amount: 1.90 },
      { op: "contrast", amount: 1.92 },
      { op: "brightness", amount: 1.2 },
      { op: "hueRotate", degrees: 10 },
    ],
    preview: "/filters/polaroid.jpg",
  },


  {
    id: "cool",
    label: "Cool",
    css: "hue-rotate(15deg) saturate(1.08) brightness(1.03) contrast(0.96)",
    ops: [
      { op: "hueRotate", degrees: 25 },
      { op: "saturate", amount: 1.08 },
      { op: "brightness", amount: 1.03 },
      { op: "contrast", amount: 0.96 },
    ],
    preview: "/filters/cool.jpg",
  },

  
];

type LightOption = {
  id: string;
  label: string;
  color: string;
  opacity: number;
};

const LIGHTS: LightOption[] = [
  {
    id: "natural",
    label: "Natural",
    color: "#FFFFFF",
    opacity: 0,
  },
  {
    id: "red",
    label: "Red",
    color: "#D71920",
    opacity: 0.48,
  },
  {
    id: "blue",
    label: "Blue",
    color: "#3157D5",
    opacity: 0.42,
  },
  {
    id: "purple",
    label: "Purple",
    color: "#7A3DB8",
    opacity: 0.42,
  },
  {
    id: "pink",
    label: "Pink",
    color: "#E84C8A",
    opacity: 0.40,
  },
  {
    id: "orange",
    label: "Orange",
    color: "#E87524",
    opacity: 0.42,
  },
  {
    id: "green",
    label: "Green",
    color: "#248A5A",
    opacity: 0.40,
  },
  {
    id: "yellow",
    label: "Warm",
    color: "#F0A51A",
    opacity: 0.32,
  },
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

  // Default fallback: face-box center.
  let cx = box.x + box.width / 2;
  let cy = box.y + box.height * 0.30;

  let roll = 0;

  if (landmarks?.positions?.length >= 48) {
    const points = landmarks.positions;

    // --------------------------------------------------
    // 1. Find the center of both eyes.
    // --------------------------------------------------

    const leftEye = points.slice(36, 42);
    const rightEye = points.slice(42, 48);

    const lx =
      leftEye.reduce(
        (sum: number, p: any) => sum + p.x,
        0
      ) / leftEye.length;

    const ly =
      leftEye.reduce(
        (sum: number, p: any) => sum + p.y,
        0
      ) / leftEye.length;

    const rx =
      rightEye.reduce(
        (sum: number, p: any) => sum + p.x,
        0
      ) / rightEye.length;

    const ry =
      rightEye.reduce(
        (sum: number, p: any) => sum + p.y,
        0
      ) / rightEye.length;

    cx = (lx + rx) / 2;
    cy = (ly + ry) / 2;

    // --------------------------------------------------
    // 2. Eye-line angle.
    //
    // This controls the rotation of the heart crown.
    // --------------------------------------------------

    roll = Math.atan2(
      ry - ly,
      rx - lx
    );

    // --------------------------------------------------
    // 3. Find the nose.
    //
    // Face-api landmark #30 is the nose tip.
    // The direction from the eyes -> nose is the
    // "down" direction of the person's face.
    //
    // Therefore the opposite direction is ALWAYS
    // the actual "top of the head".
    //
    // This is what makes landscape work.
    // --------------------------------------------------

    const nose = points[30];

    let upX = Math.sin(roll);
    let upY = -Math.cos(roll);

    if (nose) {
      const faceDownX = nose.x - cx;
      const faceDownY = nose.y - cy;

      const length = Math.sqrt(
        faceDownX * faceDownX +
        faceDownY * faceDownY
      );

      if (length > 0.001) {
        // Reverse the eye -> nose direction.
        upX = -faceDownX / length;
        upY = -faceDownY / length;
      }
    }

    // --------------------------------------------------
    // 4. Move from the eyes toward the actual top
    //    of the head.
    // --------------------------------------------------

    const headSize = Math.max(
      box.width,
      box.height
    );

    const crownDistance =
      headSize * 0.52;

    const anchorX =
      cx + upX * crownDistance;

    const anchorY =
      cy + upY * crownDistance;

    return {
      cx: anchorX,
      anchorY,
      headWidth: headSize,
      headHeight: headSize,
      roll,
    };
  }

  // --------------------------------------------------
  // Fallback if landmarks aren't available.
  // --------------------------------------------------

  return {
    cx,
    anchorY:
      box.y -
      box.height * 0.10,
    headWidth: Math.max(
      box.width,
      box.height
    ),
    headHeight: Math.max(
      box.width,
      box.height
    ),
    roll: 0,
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
const slotAspect = getSlotAspect(layout);

// Camera viewport is intentionally independent of the final strip.
// This is the same camera/capture behavior used by the working
// Grid/Duo flow.
const CAMERA_ASPECT = 4 / 3;

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

const lightParam = searchParams.get("light");

const [selectedLight, setSelectedLight] =
  useState<LightOption>(
    LIGHTS.find(
      (l) => l.id === lightParam
    ) ?? LIGHTS[0]
  );

  const [timerSeconds, setTimerSeconds] = useState(3);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captured, setCaptured] = useState<string[]>([]);

  const [faceStatus, setFaceStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const totalShots = retakeIndex !== null ? 1 : layout.poses;

  

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
        navigator.mediaDevices.enumerateDevices()
          .then((devices) => setHasMultipleCameras(devices.filter((d) => d.kind === "videoinput").length > 1))
          .catch(() => {});
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

    
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    // Always use the bundled heart asset for consistency across every
    // device — no native emoji fallback, on iOS or anywhere else.
    useNativeAppleEmojiRef.current = false;

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
    inputSize: 320,
    scoreThreshold: 0.08,
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

  if (crownMissesRef.current > 8) {
  crownVisibleRef.current = false;
  crownTargetRef.current = null;
  crownCurrentRef.current = null;
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

// -------------------------------------------------------
// Map face-api coordinates -> visible video coordinates.
// This matches the video's CSS object-cover behavior.
// -------------------------------------------------------

const videoAspect = vw / vh;
const displayAspect = rect.width / rect.height;

// object-cover scale
const scale =
  displayAspect > videoAspect
    ? rect.width / vw
    : rect.height / vh;

const renderedW = vw * scale;
const renderedH = vh * scale;

// Amount cropped from each side by object-cover
const cropX = (renderedW - rect.width) / 2;
const cropY = (renderedH - rect.height) / 2;

// Face position in displayed coordinates
let centerX = c.cx * scale - cropX;
const anchorY = c.anchorY * scale - cropY;
const headW = c.headWidth * scale;

// The <video> is mirrored for the front camera.
// We mirror the coordinates here instead of relying on
// the canvas CSS transform.
if (facingMode === "user") {
  centerX = rect.width - centerX;
}

            // The reference has individual hearts drifting independently.
            // They do NOT move as one group: some rise while others fall.
            const heartW = Math.max(
  24,
  Math.min(94, headW * 0.220)
);

const now =
  performance.now() / 1000;

// Calculate the crown rotation ONCE,
// before drawing the individual hearts.
const roll =
  facingMode === "user"
    ? -c.roll
    : c.roll;

ctx.globalCompositeOperation =
  "source-over";

ctx.imageSmoothingEnabled = true;
ctx.textAlign = "center";
ctx.textBaseline = "middle";

for (const item of CROWN_OFFSETS) {
  const independentY =
    Math.sin(
      now * item.speed +
      item.phase
    ) *
    item.amp *
    headW;

  // Convert the small floating animation into the
  // person's local coordinate system.
  const localDX = item.dx;

  const localDY =
    item.dy +
    independentY / headW;

  // Rotate the crown with the face.
  const rotatedDX =
    localDX * Math.cos(roll) -
    localDY * Math.sin(roll);

  const rotatedDY =
    localDX * Math.sin(roll) +
    localDY * Math.cos(roll);

  const x =
    centerX +
    rotatedDX * headW;

  const y =
    anchorY +
    rotatedDY * headW;

  const w =
    heartW * item.scale;

  ctx.save();

  ctx.translate(x, y);

  ctx.rotate(
    roll +
    (item.rotate * Math.PI) / 180
  );

  ctx.globalAlpha =
    item.opacity;

  if (
    useNativeAppleEmojiRef.current
  ) {
    ctx.font =
      `${Math.round(w)}px ${HEART_FONT_FAMILY}`;

    ctx.fillText(
      HEART_EMOJI,
      0,
      0
    );
  } else if (heart) {
    const h = w * 1.02;

    ctx.drawImage(
      heart,
      -w / 2,
      -h / 2,
      w,
      h
    );
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

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  if (!vw || !vh) return null;

  // ---------------------------------------------------------
  // The camera preview is ALWAYS 4:3.
  // Capture exactly that same 4:3 area.
  // ---------------------------------------------------------

  const targetAspect = CAMERA_ASPECT;
  const sourceAspect = vw / vh;

  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;

  if (sourceAspect > targetAspect) {
    // Camera source is wider than the visible 4:3 frame.
    sw = vh * targetAspect;
    sx = (vw - sw) / 2;
  } else if (sourceAspect < targetAspect) {
    // Camera source is taller than the visible 4:3 frame.
    sh = vw / targetAspect;
    sy = (vh - sh) / 2;
  }

  // Keep a high-resolution 4:3 image.
  const OUTPUT_H = 1440;
  const OUTPUT_W = Math.round(
    OUTPUT_H * targetAspect
  );

  const scale =
    OUTPUT_W / sw;

  canvas.width = OUTPUT_W;
  canvas.height = OUTPUT_H;

  const ctx =
    canvas.getContext("2d", {
      willReadFrequently: true,
    });

  if (!ctx) return null;

  // ---------------------------------------------------------
  // Mirror selfie camera exactly like the live preview.
  // ---------------------------------------------------------

  ctx.save();

  if (facingMode === "user") {
    ctx.translate(
      OUTPUT_W,
      0
    );

    ctx.scale(-1, 1);
  }

  ctx.drawImage(
    video,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    OUTPUT_W,
    OUTPUT_H
  );

  ctx.restore();

  // ---------------------------------------------------------
  // Apply filter to the exact captured frame.
  // ---------------------------------------------------------

  if (
  layout.id !== "story" &&
  selectedFilter.ops.length > 0
) {
  const imageData = ctx.getImageData(
    0,
    0,
    OUTPUT_W,
    OUTPUT_H
  );

  applyFilterOps(
    imageData,
    selectedFilter.ops
  );

  ctx.putImageData(
    imageData,
    0,
    0
  );
}


  // Apply Colour Room lighting directly to the captured image.
if (
  layout.id === "story" &&
  selectedLight.opacity > 0
) {
  ctx.save();

  ctx.globalCompositeOperation = "color";
  ctx.globalAlpha = selectedLight.opacity;
  ctx.fillStyle = selectedLight.color;

  ctx.fillRect(
    0,
    0,
    OUTPUT_W,
    OUTPUT_H
  );

  ctx.restore();

  // Add a subtle darker ambient layer so the
  // result feels like coloured room lighting,
  // rather than a flat colour placed over the photo.
  ctx.save();

  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = selectedLight.opacity * 0.18;
  ctx.fillStyle = selectedLight.color;

  ctx.fillRect(
    0,
    0,
    OUTPUT_W,
    OUTPUT_H
  );

  ctx.restore();
}
  // ---------------------------------------------------------
  // Heart filter.
  // Coordinates are still in the original camera
  // coordinate system, so map them into this exact crop.
  // ---------------------------------------------------------

  if (
    layout.themeOverlay === "hearts" &&
    crownCurrentRef.current &&
    (
      useNativeAppleEmojiRef.current ||
      (
        heartImgRef.current?.complete &&
        heartImgRef.current?.naturalWidth
      )
    )
  ) {
    const c =
      crownCurrentRef.current;

    const outCx =
      (c.cx - sx) * scale;

    const outAnchorY =
      (c.anchorY - sy) * scale;

    const outHeadW =
      c.headWidth * scale;

    const mirrorX =
      (x: number) =>
        facingMode === "user"
          ? OUTPUT_W - x
          : x;

    const headW =
      outHeadW;

    const heartW =
      Math.max(
        30,
        Math.min(
          150,
          headW * 0.235
        )
      );

    const now =
      performance.now() / 1000;

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";

    ctx.imageSmoothingEnabled =
      true;

    const roll =
      facingMode === "user"
        ? -c.roll
        : c.roll;

    for (
      const item of CROWN_OFFSETS
    ) {
      const independentY =
        Math.sin(
          now *
            item.speed +
          item.phase
        ) *
        item.amp *
        headW;

      const localDX =
        item.dx;

      const localDY =
        item.dy +
        independentY /
          headW;

      const rotatedDX =
        localDX *
          Math.cos(roll) -
        localDY *
          Math.sin(roll);

      const rotatedDY =
        localDX *
          Math.sin(roll) +
        localDY *
          Math.cos(roll);

      const rawX =
        outCx +
        rotatedDX *
          headW;

      const x =
        mirrorX(rawX);

      const y =
        outAnchorY +
        rotatedDY *
          headW;

      const w =
        heartW *
        item.scale;

      ctx.save();

      ctx.translate(
        x,
        y
      );

      ctx.rotate(
        roll +
        (
          item.rotate *
          Math.PI /
          180
        )
      );

      ctx.globalAlpha =
        item.opacity;

      if (
        useNativeAppleEmojiRef.current
      ) {
        ctx.font =
          `${Math.round(w)}px ${HEART_FONT_FAMILY}`;

        ctx.fillText(
          HEART_EMOJI,
          0,
          0
        );
      } else if (
        heartImgRef.current
      ) {
        const h =
          w * 1.02;

        ctx.drawImage(
          heartImgRef.current,
          -w / 2,
          -h / 2,
          w,
          h
        );
      }

      ctx.restore();
    }

    ctx.globalAlpha = 1;
  }

  return canvas.toDataURL(
    "image/jpeg",
    0.95
  );
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

      sessionStorage.setItem(
          "pickaboo-light",
           selectedLight.id
           );
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

  async function drawHeartCrownOnImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  outputWidth: number,
  outputHeight: number
) {
  if (
    layout.themeOverlay !== "hearts" ||
    !faceapiRef.current
  ) {
    return;
  }

  const faceapi = faceapiRef.current;

  try {
    const detection = await faceapi
      .detectSingleFace(
        image,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.08,
        })
      );

    if (!detection) {
      console.log("Heart filter: no face detected in uploaded photo.");
      return;
    }

    let target: CrownTarget = {
      cx:
        detection.box.x +
        detection.box.width / 2,

      anchorY:
        detection.box.y -
        detection.box.height * 0.08,

      headWidth: detection.box.width,
      headHeight: detection.box.height,
      roll: 0,
    };

    try {
      const landmarkResult =
        await detection.withFaceLandmarks();

      if (landmarkResult) {
        const landmarkTarget =
          getCrownTarget(landmarkResult);

        if (landmarkTarget) {
          target = landmarkTarget;
        }
      }
    } catch {
      // Face box is still usable without landmarks.
    }

    // The detection coordinates are based on the original image.
    // Scale them to the canvas we are actually exporting.
    const scaleX =
      outputWidth / image.naturalWidth;

    const scaleY =
      outputHeight / image.naturalHeight;

    const centerX =
      target.cx * scaleX;

    const anchorY =
      target.anchorY * scaleY;

    const headW =
      target.headWidth * scaleX;

    const heartW = Math.max(
      30,
      Math.min(150, headW * 0.235)
    );

    const now =
      performance.now() / 1000;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.imageSmoothingEnabled = true;

    for (const item of CROWN_OFFSETS) {
      const independentY =
        Math.sin(
          now * item.speed +
          item.phase
        ) *
        item.amp *
        headW;

      const x =
        centerX +
        item.dx * headW;

      const y =
        anchorY +
        item.dy * headW +
        independentY;

      const w =
        heartW * item.scale;

      ctx.save();

      ctx.translate(x, y);

      ctx.rotate(
        (
          target.roll +
          item.rotate
        ) *
        Math.PI /
        180
      );

      ctx.globalAlpha =
        item.opacity;

      if (
        heartImgRef.current &&
        heartImgRef.current.complete &&
        heartImgRef.current.naturalWidth
      ) {
        const h = w * 1.02;

        ctx.drawImage(
          heartImgRef.current,
          -w / 2,
          -h / 2,
          w,
          h
        );
      }

      ctx.restore();
    }

    ctx.globalAlpha = 1;
  } catch (error) {
    console.warn(
      "Heart filter failed on uploaded photo:",
      error
    );
  }
}

  function processFileToPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const OUTPUT_W = img.width;
      const OUTPUT_H = img.height;

      const off = document.createElement("canvas");

      off.width = OUTPUT_W;
      off.height = OUTPUT_H;

      const ctx = off.getContext("2d", {
        willReadFrequently: true,
      });

      if (!ctx) {
        reject(new Error("no ctx"));
        return;
      }

      // Keep the COMPLETE uploaded image.
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        0,
        0,
        OUTPUT_W,
        OUTPUT_H
      );

      if (
  layout.id !== "story" &&
  selectedFilter.ops.length > 0
) {
  const imageData = ctx.getImageData(
    0,
    0,
    OUTPUT_W,
    OUTPUT_H
  );

  applyFilterOps(
    imageData,
    selectedFilter.ops
  );

  ctx.putImageData(
    imageData,
    0,
    0
  );
}

if (
  layout.id === "story" &&
  selectedLight.opacity > 0
) {
  ctx.save();

  ctx.globalCompositeOperation =
    "color";

  ctx.globalAlpha =
    selectedLight.opacity;

  ctx.fillStyle =
    selectedLight.color;

  ctx.fillRect(
    0,
    0,
    OUTPUT_W,
    OUTPUT_H
  );

  ctx.restore();

  // Slightly darken the room-light effect so it feels
  // like colored ambient lighting rather than a flat overlay.
  ctx.save();

  ctx.globalCompositeOperation =
    "multiply";

  ctx.globalAlpha =
    selectedLight.opacity * 0.18;

  ctx.fillStyle =
    selectedLight.color;

  ctx.fillRect(
    0,
    0,
    OUTPUT_W,
    OUTPUT_H
  );

  ctx.restore();
}

if (
  layout.id === "story" &&
  selectedLight.opacity > 0
) {
  ctx.save();

  ctx.globalCompositeOperation =
    "color";

  ctx.globalAlpha =
    selectedLight.opacity;

  ctx.fillStyle =
    selectedLight.color;

  ctx.fillRect(
    0,
    0,
    OUTPUT_W,
    OUTPUT_H
  );

  ctx.restore();

  ctx.save();

  ctx.globalCompositeOperation =
    "multiply";

  ctx.globalAlpha =
    selectedLight.opacity * 0.18;

  ctx.fillStyle =
    selectedLight.color;

  ctx.fillRect(
    0,
    0,
    OUTPUT_W,
    OUTPUT_H
  );

  ctx.restore();
}

      resolve(
        off.toDataURL(
          "image/jpeg",
          0.92
        )
      );

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () =>
      reject(
        new Error("image load failed")
      );

    img.src =
      URL.createObjectURL(file);
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

      <div className="relative flex w-full flex-col items-center justify-start gap-5 lg:grid lg:grid-cols-[180px_minmax(0,1fr)_180px] lg:items-center lg:gap-0">
        {/* Filters: normal horizontal-scroll row above the frame on mobile/tablet,
            tall vertical column beside the frame at desktop — no absolute
            positioning, so nothing can ever overlap or hide behind the frame. */}
        <div className="flex w-full max-w-[420px] flex-row items-center gap-3 overflow-x-auto overflow-y-hidden px-2 py-1 lg:col-start-1 lg:h-[min(calc((100vw-150px)*1.3333),calc(100dvh-220px),620px)] lg:w-full lg:max-w-none lg:flex-col lg:items-center lg:justify-start lg:gap-3 lg:overflow-x-visible lg:overflow-y-auto lg:px-2 lg:py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
  {layout.id === "story"
    ? LIGHTS.map((light) => {
        const isSelected =
          selectedLight.id === light.id;

        return (
          <button
            key={light.id}
            onClick={() =>
              !isCapturing &&
              setSelectedLight(light)
            }
            disabled={isCapturing}
            className="group flex flex-shrink-0 flex-col items-center gap-0.5 disabled:opacity-40"
          >
            <span
              className={`h-7 w-7 rounded-full transition-all duration-200 ease-out group-hover:scale-110 sm:h-9 sm:w-9 md:h-10 md:w-10 ${
                isSelected
                  ? "scale-110 ring-4 ring-curtain ring-offset-2 ring-offset-paper"
                  : "ring-1 ring-ink/10"
              }`}
              style={{
                backgroundColor:
                  light.color,
                boxShadow:
                  light.id === "natural"
                    ? "inset 0 0 0 3px #FBF6EC"
                    : undefined,
              }}
            />

            <span
              className={`hidden font-[family-name:var(--font-mono)] text-[9px] text-ink/60 md:block ${
                isSelected
                  ? "opacity-30"
                  : "opacity-100"
              }`}
            >
              {light.label}
            </span>
          </button>
        );
      })
    : FILTERS.map((f) => {
        const isSelected =
          selectedFilter.id === f.id;

        return (
          <button
            key={f.id}
            onClick={() =>
              !isCapturing &&
              setSelectedFilter(f)
            }
            disabled={isCapturing}
            className="group flex flex-shrink-0 flex-col items-center gap-0.5 disabled:opacity-40"
          >
            <img
             src={f.preview}
             alt={`${f.label} filter preview`}
             draggable={false}
             className={`h-7 w-7 rounded-full object-cover transition-all duration-200 ease-out group-hover:scale-110 sm:h-9 sm:w-9 md:h-10 md:w-10 ${
             isSelected
             ? "scale-110 ring-4 ring-curtain ring-offset-2 ring-offset-paper"
             : "ring-1 ring-ink/10"
            }`}
           />

            <span
              className={`hidden font-[family-name:var(--font-mono)] text-[9px] text-ink/60 md:block ${
                isSelected
                  ? "opacity-30"
                  : "opacity-100"
              }`}
            >
              {f.label}
            </span>
          </button>
        );
      })}
</div>

        <div className="relative flex w-full items-center justify-center lg:col-start-2 lg:w-full">
        <div
          style={{ aspectRatio: CAMERA_ASPECT }}
          className="relative h-auto w-[min(92vw,calc(100dvh-280px))] max-w-full flex-shrink-0 overflow-hidden rounded-3xl border-4 border-curtain bg-ink shadow-2xl sm:border-8 lg:h-[min(calc((100vw-150px)*0.75),calc(100dvh-220px),620px)] lg:w-auto"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              filter:
               layout.id === "story"
               ? "none"
               : selectedFilter.css,
              }}
            className={`h-full w-full object-cover transition-opacity duration-300 ${status === "ready" ? "opacity-100" : "opacity-0"} ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
          />

          {layout.id === "story" &&
  selectedLight.opacity > 0 && (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        backgroundColor: selectedLight.color,
        opacity: selectedLight.opacity,
        mixBlendMode: "color",
      }}
    />
  )}

          {layout.id === "story" &&
  selectedLight.opacity > 0 && (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        backgroundColor:
          selectedLight.color,
        opacity:
          selectedLight.opacity,
        mixBlendMode: "color",
      }}
    />
  )}

          {layout.themeOverlay === "hearts" && (
            <canvas
              ref={overlayCanvasRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 h-full w-full"
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
    </div>

        <div className="flex w-full flex-shrink-0 flex-col items-center justify-center gap-3 lg:col-start-3 lg:w-full lg:gap-3">
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

      {(captured.length > 0 || retakeIndex === null) && (
        <div className="mt-4 flex w-full max-w-md items-center justify-center gap-2 overflow-x-auto px-2 py-1 sm:mt-5 lg:mt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {captured.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Shot ${i + 1}`}
              className="h-14 w-11 flex-shrink-0 rounded-md border-2 border-curtain object-cover shadow-sm sm:h-16 sm:w-12"
            />
          ))}
          {Array.from({ length: Math.max(0, totalShots - captured.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="h-14 w-11 flex-shrink-0 rounded-md border-2 border-dashed border-ink/15 bg-white/40 sm:h-16 sm:w-12"
            />
          ))}
        </div>
      )}

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