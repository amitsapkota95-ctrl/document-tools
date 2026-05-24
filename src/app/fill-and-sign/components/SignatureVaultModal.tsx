"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Dancing_Script, Merriweather, Pacifico } from "next/font/google";
import SignatureCanvas from "react-signature-canvas";
import { Upload, X } from "lucide-react";
import { ToolButton } from "@/components/tools/ToolButton";
import {
  SIGNATURE_COLORS,
  STAMP_PRESETS,
  createStampDataUrl,
  rasterizeTypedSignature,
  type SignatureColorId,
} from "@/app/fill-and-sign/sign-assets";
import { INPUT_CLASS, TAB_ACTIVE, TAB_INACTIVE } from "@/lib/ui/classes";
import { useSignatureVaultStore } from "@/stores/signature-vault-store";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

type VaultTab = "type" | "draw" | "upload" | "stamps";

const SIGNATURE_FONTS = [
  { id: "dancing", label: "Script", className: dancingScript.className, family: "Dancing Script" },
  { id: "pacifico", label: "Pacifico", className: pacifico.className, family: "Pacifico" },
  { id: "serif", label: "Serif", className: merriweather.className, family: "Merriweather" },
] as const;

async function fileToPngDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  if (file.type === "image/png") {
    return dataUrl;
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not create canvas."));
        return;
      }
      ctx.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = reject;
    image.src = dataUrl;
  });
}

interface SignatureVaultModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (dataUrl: string, label: string) => void;
}

export function SignatureVaultModal({ open, onClose, onCreated }: SignatureVaultModalProps) {
  const [tab, setTab] = useState<VaultTab>("type");
  const [typedName, setTypedName] = useState("");
  const [selectedFontId, setSelectedFontId] =
    useState<(typeof SIGNATURE_FONTS)[number]["id"]>("dancing");
  const [selectedColorId, setSelectedColorId] = useState<SignatureColorId>("forest");
  const [penColor, setPenColor] = useState<string>(SIGNATURE_COLORS[0].value);
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const addSignature = useSignatureVaultStore((state) => state.addSignature);

  const selectedColor =
    SIGNATURE_COLORS.find((entry) => entry.id === selectedColorId) ?? SIGNATURE_COLORS[0];

  const saveSignature = useCallback(
    (dataUrl: string, label: string) => {
      addSignature(label, dataUrl);
      onCreated(dataUrl, label);
      onClose();
      setTypedName("");
      signatureRef.current?.clear();
    },
    [addSignature, onClose, onCreated],
  );

  const saveTypedSignature = async () => {
    const text = typedName.trim();
    if (!text) return;
    const font = SIGNATURE_FONTS.find((entry) => entry.id === selectedFontId) ?? SIGNATURE_FONTS[0];
    const dataUrl = await rasterizeTypedSignature(text, font.family, selectedColor.value);
    saveSignature(dataUrl, text);
  };

  const saveDrawnSignature = () => {
    const canvas = signatureRef.current;
    if (!canvas || canvas.isEmpty()) return;
    saveSignature(canvas.toDataURL("image/png"), "Drawn signature");
  };

  const onUploadDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      const dataUrl = await fileToPngDataUrl(file);
      saveSignature(dataUrl, file.name.replace(/\.(png|jpe?g)$/i, "") || "Uploaded signature");
    },
    [saveSignature],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onUploadDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    multiple: false,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-paper-lg"
        role="dialog"
        aria-modal
        aria-labelledby="signature-vault-title"
      >
        <div className="flex items-center justify-between border-b border-cream-300 bg-cream-100 px-5 py-4">
          <h2 id="signature-vault-title" className="font-serif text-lg font-bold text-forest-700">
            Draw your signature
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-cream-300 hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-cream-300 px-5 py-3">
          {(
            [
              ["type", "Type"],
              ["draw", "Draw"],
              ["upload", "Upload"],
              ["stamps", "Stamps"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={tab === value ? TAB_ACTIVE : TAB_INACTIVE}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4 px-5 py-5">
          {tab === "type" ? (
            <>
              <label className="block text-sm font-bold text-forest-700">
                Type your name
                <input
                  value={typedName}
                  onChange={(event) => setTypedName(event.target.value)}
                  placeholder="Jane Doe"
                  className={`${INPUT_CLASS} text-lg`}
                />
              </label>

              <div className="space-y-2">
                <p className="text-sm font-bold text-forest-700">Text color</p>
                <div className="flex flex-wrap gap-2">
                  {SIGNATURE_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColorId(color.id)}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-shadow ${
                        selectedColorId === color.id
                          ? "border-forest-500 bg-forest-50 shadow-paper"
                          : "border-cream-300 bg-white hover:border-forest-200 hover:bg-forest-50/50"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-cream-300"
                        style={{ backgroundColor: color.value }}
                        aria-hidden
                      />
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-forest-700">Choose a style</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {SIGNATURE_FONTS.map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setSelectedFontId(font.id)}
                      className={`min-h-24 rounded-xl border px-3 py-4 text-left transition-shadow ${
                        selectedFontId === font.id
                          ? "border-forest-500 bg-forest-50 shadow-paper"
                          : "border-cream-300 bg-white hover:border-forest-200 hover:bg-forest-50/50"
                      }`}
                    >
                      <span className="block text-xs font-semibold uppercase tracking-wide text-ink/50">
                        {font.label}
                      </span>
                      <span
                        className={`${font.className} mt-2 block text-3xl`}
                        style={{ color: selectedColor.value }}
                      >
                        {typedName.trim() || "Your Name"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <ToolButton onClick={saveTypedSignature} disabled={!typedName.trim()}>
                Save to Vault
              </ToolButton>
            </>
          ) : null}

          {tab === "draw" ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-bold text-forest-700">Pen color</p>
                <div className="flex flex-wrap gap-2">
                  {SIGNATURE_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setPenColor(color.value)}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-shadow ${
                        penColor === color.value
                          ? "border-forest-500 bg-forest-50 shadow-paper"
                          : "border-cream-300 bg-white hover:border-forest-200 hover:bg-forest-50/50"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-cream-300"
                        style={{ backgroundColor: color.value }}
                        aria-hidden
                      />
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-cream-300 bg-cream-100">
                <div className="pointer-events-none absolute inset-x-8 bottom-10 border-b border-cream-400/60" />
                <SignatureCanvas
                  ref={signatureRef}
                  penColor={penColor}
                  backgroundColor="rgba(0,0,0,0)"
                  canvasProps={{
                    className: "h-48 w-full touch-none",
                  }}
                />
              </div>
              <div className="flex gap-2">
                <ToolButton variant="secondary" onClick={() => signatureRef.current?.clear()}>
                  Clear
                </ToolButton>
                <ToolButton onClick={saveDrawnSignature}>Save to Vault</ToolButton>
              </div>
            </>
          ) : null}

          {tab === "upload" ? (
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-xl border-2 border-dashed px-8 py-12 text-center transition-colors ${
                isDragActive
                  ? "border-forest-500 bg-forest-50 text-forest-700 shadow-paper"
                  : "border-cream-300 bg-white text-forest-700 hover:border-forest-500 hover:bg-forest-50/50 hover:shadow-paper"
              }`}
            >
              <input {...getInputProps()} />
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cream-200">
                <Upload className="h-5 w-5 text-forest-500" strokeWidth={2} aria-hidden />
              </div>
              <p className="font-bold text-forest-700">Drop PNG or JPG signature</p>
              <p className="mt-1 text-sm text-ink/50">Transparent PNG recommended</p>
            </div>
          ) : null}

          {tab === "stamps" ? (
            <>
              <p className="text-sm text-ink/50">
                Place a stamp on the current page, or save it to your vault for reuse.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {STAMP_PRESETS.map((stamp) => {
                  const dataUrl = createStampDataUrl(stamp.text);
                  return (
                    <div
                      key={stamp.id}
                      className="flex flex-col items-center gap-3 rounded-xl border border-cream-300 bg-white p-4 shadow-paper"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={dataUrl} alt={stamp.label} className="h-14 w-full object-contain" />
                      <div className="flex w-full flex-col gap-2">
                        <ToolButton
                          variant="secondary"
                          className="w-full"
                          onClick={() => {
                            onCreated(dataUrl, stamp.label);
                            onClose();
                          }}
                        >
                          Place now
                        </ToolButton>
                        <ToolButton
                          className="w-full"
                          onClick={() => saveSignature(dataUrl, stamp.label)}
                        >
                          Save to vault
                        </ToolButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
