import { useCallback, useState, type DragEvent } from "react";

type ImageDropzoneProps = {
  onFile: (file: File) => void;
  isLoading: boolean;
};

export function ImageDropzone({ onFile, isLoading }: ImageDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files.item(0);
      if (file) {
        onFile(file);
      }
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`rounded-lg border-2 border-dashed p-6 text-center ${dragging ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}`}
    >
      <p className="mb-3 text-sm text-gray-600">Drop an image of the box/manual code or choose a file</p>
      <label className="inline-flex cursor-pointer rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isLoading}
          onChange={(event) => {
            const file = event.target.files?.item(0);
            if (file) {
              onFile(file);
            }
          }}
        />
        {isLoading ? "Analyzing..." : "Choose Image"}
      </label>
    </div>
  );
}
