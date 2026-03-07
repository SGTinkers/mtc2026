import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { extractFormFromImage, type ScannedFormData } from "~/lib/server-fns.js";

function imageToJpegBase64(file: File): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      // Cap the longest side at 2048px to keep payload reasonable
      const maxDim = 2048;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      URL.revokeObjectURL(url);
      const base64 = dataUrl.split(",")[1]!;
      resolve({ data: base64, mediaType: "image/jpeg" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export function ScanDocumentButton({
  onExtracted,
  variant = "admin",
}: {
  onExtracted: (data: ScannedFormData) => void;
  variant?: "admin" | "member";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    setError("");
    setScanning(true);

    try {
      const { data, mediaType } = await imageToJpegBase64(file);
      const result = await extractFormFromImage({ data: { image: data, mediaType } });

      const hasData = Object.keys(result).length > 0;
      if (!hasData) {
        setError("Could not extract information from this image. Try a clearer photo.");
      } else {
        onExtracted(result);
      }
    } catch {
      setError("Scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  if (variant === "member") {
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
        <button
          type="button"
          disabled={scanning}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-g1/20 bg-g1/5 py-3 text-sm font-semibold text-g1 transition-all hover:bg-g1/10 disabled:opacity-50"
        >
          {scanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Scan NRIC / Form
            </>
          )}
        </button>
        {error && (
          <p className="mt-2 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        disabled={scanning}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
      >
        {scanning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            Scan Form
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
