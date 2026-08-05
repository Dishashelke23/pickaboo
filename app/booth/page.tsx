"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CameraStatus = "idle" | "requesting" | "ready" | "denied" | "no-camera" | "error";

function BoothContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shots = searchParams.get("shots") ?? "4";

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

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

  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-10">
      <button
        onClick={() => router.push("/")}
        className="absolute left-6 top-6 font-[family-name:var(--font-mono)] text-sm text-ink/60 hover:text-curtain"
      >
        ← back
      </button>

      <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl text-ink">
        Say cheese!
      </h1>

      <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl border-8 border-curtain bg-ink shadow-2xl">
  <video
    ref={videoRef}
    autoPlay
    playsInline
    muted
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
</div>

      <div className="mt-6 flex items-center gap-4">
        {hasMultipleCameras && (
          <button
            onClick={() =>
              setFacingMode((f) => (f === "user" ? "environment" : "user"))
            }
            className="rounded-full border-2 border-ink/10 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-curtain/40"
          >
            🔄 Flip camera
          </button>
        )}
        <p className="font-[family-name:var(--font-mono)] text-xs text-ink/50">
          {shots} shots queued
        </p>
      </div>
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