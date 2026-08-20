"use client";

import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Camera, CameraOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ScannerCameraProps {
  active: boolean;
  onDetected: (token: string) => void;
}

export function ScannerCamera({ active, onDetected }: ScannerCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onDetectedRef = useRef(onDetected);
  const [error, setError] = useState("");

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (!active || !videoRef.current) return;

    const video = videoRef.current;
    let cancelled = false;
    const reader = new BrowserQRCodeReader(undefined, {
      delayBetweenScanAttempts: 200,
      delayBetweenScanSuccess: 1_500,
    });

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        video,
        (result) => {
          if (result && !cancelled) onDetectedRef.current(result.getText());
        },
      )
      .then((controls) => {
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Camera access is unavailable. Allow camera permission or use manual entry.",
          );
        }
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      const stream = video.srcObject;
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [active]);

  return (
    <div className="overflow-hidden rounded-3xl border bg-black shadow-sm">
      <div className="relative aspect-[3/4] max-h-[58vh] w-full bg-slate-950 sm:aspect-video">
        <video
          ref={videoRef}
          muted
          playsInline
          className="size-full object-cover"
        />

        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="size-56 rounded-3xl border-4 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]" />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/65 px-4 py-3 text-sm font-medium text-white">
          {error ? (
            <CameraOff className="size-4" />
          ) : (
            <Camera className="size-4" />
          )}
          {error || "Hold the Ticket QR code inside the frame"}
        </div>
      </div>
    </div>
  );
}
