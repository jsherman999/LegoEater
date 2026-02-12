import { useState } from "react";

type BarcodeScannerProps = {
  onLookup: (barcode: string) => void;
  isLoading: boolean;
};

export function BarcodeScanner({ onLookup, isLoading }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  async function checkCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      stream.getTracks().forEach((track) => track.stop());
      setCameraError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Camera permission denied";
      setCameraError(message);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-600">
        Barcode decoding is supported through backend lookup. If camera scanning is unavailable, type or paste the UPC/EAN.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={checkCameraPermission}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
        >
          Check Camera
        </button>
      </div>
      {cameraError ? <p className="text-sm text-red-600">{cameraError}</p> : null}
      <div className="flex gap-2">
        <input
          value={barcode}
          onChange={(event) => setBarcode(event.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2"
          placeholder="Enter UPC/EAN"
        />
        <button
          type="button"
          onClick={() => onLookup(barcode)}
          disabled={isLoading || barcode.trim().length === 0}
          className="rounded bg-red-600 px-3 py-2 font-semibold text-white disabled:opacity-50"
        >
          {isLoading ? "Looking up..." : "Lookup"}
        </button>
      </div>
    </div>
  );
}
