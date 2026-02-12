import { useMemo, useState } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "../__root";
import { BarcodeScanner } from "../../components/scanner/BarcodeScanner";
import { PhotoCapture } from "../../components/scanner/PhotoCapture";
import { ImageDropzone } from "../../components/scanner/ImageDropzone";
import { SetForm } from "../../components/sets/SetForm";
import { useBarcodeLookup, useOcrLookup, useSetLookup } from "../../hooks/useLookup";

const tabs = [
  { key: "barcode", label: "Scan Barcode" },
  { key: "photo", label: "Take Photo" },
  { key: "upload", label: "Upload Image" },
  { key: "manual", label: "Enter Number" }
] as const;

type TabKey = (typeof tabs)[number]["key"];

function AddPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("barcode");
  const [manualSetNum, setManualSetNum] = useState("");
  const navigate = useNavigate();

  const barcodeLookup = useBarcodeLookup();
  const ocrLookup = useOcrLookup();
  const setLookup = useSetLookup();

  const setResult = useMemo(() => {
    return setLookup.data?.set ?? barcodeLookup.data?.set ?? ocrLookup.data?.set ?? null;
  }, [barcodeLookup.data?.set, ocrLookup.data?.set, setLookup.data?.set]);

  const activeError = useMemo(() => {
    const error = setLookup.error ?? barcodeLookup.error ?? ocrLookup.error;
    if (!error) {
      return null;
    }
    return error instanceof Error ? error.message : "Lookup failed";
  }, [barcodeLookup.error, ocrLookup.error, setLookup.error]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">Add Set</h2>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded px-3 py-2 text-sm font-semibold ${
              activeTab === tab.key ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "barcode" ? (
        <BarcodeScanner
          onLookup={(barcode) => barcodeLookup.mutate(barcode)}
          isLoading={barcodeLookup.isPending}
        />
      ) : null}

      {activeTab === "photo" ? (
        <PhotoCapture onCapture={(file) => ocrLookup.mutate(file)} isLoading={ocrLookup.isPending} />
      ) : null}

      {activeTab === "upload" ? (
        <ImageDropzone onFile={(file) => ocrLookup.mutate(file)} isLoading={ocrLookup.isPending} />
      ) : null}

      {activeTab === "manual" ? (
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
          <label className="text-sm font-semibold text-gray-700" htmlFor="manual-set">
            LEGO Set Number
          </label>
          <div className="flex gap-2">
            <input
              id="manual-set"
              value={manualSetNum}
              onChange={(event) => setManualSetNum(event.target.value)}
              placeholder="e.g. 75192"
              className="flex-1 rounded border border-gray-300 px-3 py-2"
            />
            <button
              type="button"
              onClick={() => setLookup.mutate(manualSetNum)}
              disabled={setLookup.isPending || manualSetNum.trim().length === 0}
              className="rounded bg-red-600 px-3 py-2 font-semibold text-white disabled:opacity-50"
            >
              {setLookup.isPending ? "Looking up..." : "Lookup"}
            </button>
          </div>
        </div>
      ) : null}

      {activeError ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{activeError}</p> : null}

      {setResult ? (
        <article className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-bold">Set Preview</h3>
          <div className="flex items-start gap-4">
            {setResult.setImgUrl ? (
              <img src={setResult.setImgUrl} alt={setResult.name} className="h-28 w-28 rounded object-cover" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded bg-gray-100 text-xs text-gray-500">
                No Image
              </div>
            )}
            <div className="space-y-1">
              <p className="text-lg font-semibold">{setResult.name}</p>
              <p className="text-sm text-gray-600">Set {setResult.setNum}</p>
              <p className="text-sm text-gray-600">Year: {setResult.year ?? "Unknown"}</p>
              <p className="text-sm text-gray-600">Theme: {setResult.themeName ?? "Unknown"}</p>
              <p className="text-sm text-gray-600">Parts: {setResult.numParts ?? "Unknown"}</p>
            </div>
          </div>
          <SetForm
            setNum={setResult.setNum}
            onCreated={(id) => {
              navigate({ to: "/inventory/$setId", params: { setId: String(id) } });
            }}
          />
        </article>
      ) : null}
    </section>
  );
}

export const addRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/add",
  component: AddPage
});
