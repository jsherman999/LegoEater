import { useEffect, useRef, useState } from "react";

type PhotoCaptureProps = {
  onCapture: (file: File) => void;
  isLoading: boolean;
};

export function PhotoCapture({ onCapture, isLoading }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      if (!videoRef.current) {
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStreaming(true);
      setError(null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to access camera";
      setError(message);
    }
  }

  function captureFrame() {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
    }, "image/jpeg");
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={startCamera}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
        >
          Start Camera
        </button>
        <button
          type="button"
          onClick={captureFrame}
          disabled={!streaming || isLoading}
          className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isLoading ? "Analyzing..." : "Capture & Analyze"}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <video ref={videoRef} className="aspect-video w-full rounded bg-black" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
