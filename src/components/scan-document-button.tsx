import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { extractFormFromImage, type ScannedFormData } from "~/lib/server-fns.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog.js";
import { Button } from "~/components/ui/button.js";

function canvasToJpegBase64(canvas: HTMLCanvasElement): { data: string; mediaType: string } {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  return { data: dataUrl.split(",")[1]!, mediaType: "image/jpeg" };
}

function imageToJpegBase64(file: File): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
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
      URL.revokeObjectURL(url);
      resolve(canvasToJpegBase64(canvas));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function WebcamCapture({
  onCapture,
  onClose,
}: {
  onCapture: (payload: { data: string; mediaType: string }) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [camError, setCamError] = useState("");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 } } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setCamError("Could not access camera. Check permissions.");
      });
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [stopStream]);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    stopStream();
    onCapture(canvasToJpegBase64(canvas));
  }

  if (camError) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-destructive">{camError}</p>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full"
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <Button onClick={capture} disabled={!ready} className="gap-2">
          <Camera className="h-4 w-4" />
          Capture
        </Button>
      </div>
    </div>
  );
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
  const [showCamera, setShowCamera] = useState(false);

  async function processImage(payload: { data: string; mediaType: string }) {
    setShowCamera(false);
    setError("");
    setScanning(true);
    try {
      const result = await extractFormFromImage({ data: { image: payload.data, mediaType: payload.mediaType } });
      if (Object.keys(result).length === 0) {
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

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    const payload = await imageToJpegBase64(file);
    await processImage(payload);
  }

  const cameraDialog = (
    <Dialog open={showCamera} onOpenChange={setShowCamera}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Capture Document</DialogTitle>
        </DialogHeader>
        <WebcamCapture
          onCapture={processImage}
          onClose={() => setShowCamera(false)}
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex-1 border-t" />
          or
          <span className="flex-1 border-t" />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setShowCamera(false);
            inputRef.current?.click();
          }}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload from file
        </Button>
      </DialogContent>
    </Dialog>
  );

  if (variant === "member") {
    return (
      <div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {cameraDialog}
        <button
          type="button"
          disabled={scanning}
          onClick={() => setShowCamera(true)}
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
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {cameraDialog}
      <button
        type="button"
        disabled={scanning}
        onClick={() => setShowCamera(true)}
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
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
