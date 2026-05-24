import { createBrandIconImage } from "@/lib/brand/brand-icon-image";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return createBrandIconImage(size.width);
}
