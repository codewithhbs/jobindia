import { useRef, useState, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";
import { resolveFileUrl } from "@/lib/utils";

export function ImageUploadField({ value, onChange, existingUrl, label = "Image" }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(existingUrl ? resolveFileUrl(existingUrl) : null);
  }, [value, existingUrl]);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">Click to upload</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </div>
  );
}
