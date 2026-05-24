export const SIGNATURE_COLORS = [
  { id: "forest", label: "Forest", value: "#14532d" },
  { id: "black", label: "Black", value: "#1c1917" },
  { id: "blue", label: "Blue", value: "#1d4ed8" },
  { id: "red", label: "Red", value: "#b91c1c" },
  { id: "purple", label: "Purple", value: "#7e22ce" },
] as const;

export type SignatureColorId = (typeof SIGNATURE_COLORS)[number]["id"];

export const STAMP_PRESETS = [
  { id: "approved", label: "Approved", text: "APPROVED" as const },
  { id: "declined", label: "Declined", text: "DECLINED" as const },
  { id: "review", label: "Review", text: "REVIEW" as const },
  { id: "confidential", label: "Confidential", text: "CONFIDENTIAL" as const },
] as const;

export type StampText = (typeof STAMP_PRESETS)[number]["text"];

const STAMP_STYLES: Record<
  StampText,
  { color: string; border: string; background: string }
> = {
  APPROVED: { color: "#166534", border: "#22c55e", background: "rgba(34, 197, 94, 0.1)" },
  DECLINED: { color: "#b91c1c", border: "#ef4444", background: "rgba(239, 68, 68, 0.1)" },
  REVIEW: { color: "#b45309", border: "#f59e0b", background: "rgba(245, 158, 11, 0.12)" },
  CONFIDENTIAL: { color: "#1e3a8a", border: "#3b82f6", background: "rgba(59, 130, 246, 0.1)" },
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export async function rasterizeTypedSignature(
  text: string,
  fontFamily: string,
  color: string,
  fontSize = 56,
) {
  await document.fonts.load(`${fontSize}px "${fontFamily}"`);
  const canvas = document.createElement("canvas");
  canvas.width = 560;
  canvas.height = 180;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas.");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 24, canvas.height / 2);
  return canvas.toDataURL("image/png");
}

export function createStampDataUrl(text: StampText): string {
  const style = STAMP_STYLES[text];
  const canvas = document.createElement("canvas");
  canvas.width = 280;
  canvas.height = 120;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas.");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  roundRect(ctx, 8, 8, canvas.width - 16, canvas.height - 16, 10);
  ctx.fillStyle = style.background;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = style.border;
  ctx.stroke();

  ctx.font = `700 ${text.length > 9 ? 22 : 28}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillStyle = style.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL("image/png");
}

export const DEFAULT_STAMP_WIDTH = 220;
export const DEFAULT_STAMP_HEIGHT = 88;
