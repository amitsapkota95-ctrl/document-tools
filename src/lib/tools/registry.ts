import type { LucideIcon } from "lucide-react";
import {
  Combine,
  Crop,
  EyeOff,
  FileImage,
  FileText,
  GitCompare,
  Image,
  Link2,
  Minimize2,
  Monitor,
  PenLine,
  QrCode,
  ScanText,
  Scissors,
} from "lucide-react";

export type ToolSlug =
  | "merge-pdf"
  | "split-pdf"
  | "compress-pdf"
  | "image-to-pdf"
  | "pdf-to-image"
  | "fill-and-sign"
  | "redact-pdf"
  | "crop-pdf"
  | "extract-text-from-pdf"
  | "compare-text"
  | "invoice-builder"
  | "teleprompter"
  | "qr-tools"
  | "url-shortener";

export interface ToolDefinition {
  slug: ToolSlug;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  icon: LucideIcon;
  actionLabel: string;
}

export interface ToolCategory {
  id: "pdf" | "content" | "utilities";
  title: string;
  tools: ToolDefinition[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "pdf",
    title: "PDF Tools",
    tools: [
      {
        slug: "merge-pdf",
        title: "Combine PDF Files",
        description: "Join multiple PDFs into one document in the order you choose.",
        seoTitle: "Combine PDF Files Online — Free & Private | paperless.tools",
        seoDescription:
          "Merge PDF files in your browser. Drag, drop, reorder, and download — nothing is uploaded to a server.",
        icon: Combine,
        actionLabel: "Combine PDFs",
      },
      {
        slug: "split-pdf",
        title: "Split a PDF",
        description: "Separate pages into individual files or extract a page range.",
        seoTitle: "Split PDF Online — Extract Pages Free | paperless.tools",
        seoDescription:
          "Split PDF documents by page or range. Fast, free, and processed entirely on your device.",
        icon: Scissors,
        actionLabel: "Split PDF",
      },
      {
        slug: "compress-pdf",
        title: "Make File Smaller",
        description: "Reduce PDF file size while keeping documents readable.",
        seoTitle: "Make PDF Smaller — Compress PDF Free | paperless.tools",
        seoDescription:
          "Shrink PDF file size in your browser. No uploads, no accounts — just a smaller file to download.",
        icon: Minimize2,
        actionLabel: "Make Smaller",
      },
      {
        slug: "image-to-pdf",
        title: "Turn Images into PDF",
        description: "Convert JPG, PNG, and other images into a single PDF.",
        seoTitle: "Turn Images into PDF — Free Online | paperless.tools",
        seoDescription:
          "Convert photos and images to PDF in your browser. Choose page size and download instantly.",
        icon: Image,
        actionLabel: "Create PDF",
      },
      {
        slug: "pdf-to-image",
        title: "Save PDF as Images",
        description: "Export each PDF page as a high-quality PNG or JPEG.",
        seoTitle: "Save PDF as Images — PNG & JPEG | paperless.tools",
        seoDescription:
          "Convert PDF pages to images in your browser. Download one page or every page at once.",
        icon: FileImage,
        actionLabel: "Save as Images",
      },
      {
        slug: "fill-and-sign",
        title: "Fill & Sign PDF",
        description: "Add your signature and text to any PDF page.",
        seoTitle: "Fill & Sign PDF Online — Free | paperless.tools",
        seoDescription:
          "Sign PDF documents in your browser. Draw your signature, add text, and download.",
        icon: PenLine,
        actionLabel: "Sign PDF",
      },
      {
        slug: "redact-pdf",
        title: "Black Out Sensitive Info",
        description: "Permanently remove private text and areas from a PDF.",
        seoTitle: "Black Out PDF Text — True Redaction | paperless.tools",
        seoDescription:
          "Redact sensitive information from PDFs. Draw boxes to permanently black out content.",
        icon: EyeOff,
        actionLabel: "Black Out Info",
      },
      {
        slug: "crop-pdf",
        title: "Crop PDF Pages",
        description: "Trim margins and focus on the part of the page you need.",
        seoTitle: "Crop PDF Pages Online — Free | paperless.tools",
        seoDescription:
          "Crop PDF pages visually. Select the area to keep and download a trimmed document.",
        icon: Crop,
        actionLabel: "Crop Pages",
      },
      {
        slug: "extract-text-from-pdf",
        title: "Scan PDF for Text",
        description: "Read text from scanned documents and image-based PDFs.",
        seoTitle: "Scan PDF for Text — Free OCR | paperless.tools",
        seoDescription:
          "Extract text from PDFs using your browser. Works on scanned documents — files stay on your device.",
        icon: ScanText,
        actionLabel: "Scan for Text",
      },
    ],
  },
  {
    id: "content",
    title: "Content Tools",
    tools: [
      {
        slug: "compare-text",
        title: "Compare Two Texts",
        description: "See what changed between two versions side by side.",
        seoTitle: "Compare Two Texts — Free Diff Checker | paperless.tools",
        seoDescription:
          "Compare text and spot additions and deletions instantly. Private, browser-based diff tool.",
        icon: GitCompare,
        actionLabel: "Compare Texts",
      },
      {
        slug: "invoice-builder",
        title: "Build an Invoice",
        description: "Create invoices, estimates, and quotes with global tax support. Export searchable PDFs — no account required.",
        seoTitle: "Build an Invoice & Estimate — Free PDF Export | paperless.tools",
        seoDescription:
          "Professional invoices and estimates with VAT/GST, multi-tax, deposits, and 8 languages. Export vector PDFs locally — no account required.",
        icon: FileText,
        actionLabel: "Build Invoice",},
      {
        slug: "teleprompter",
        title: "Teleprompter",
        description: "Read scripts with rich text, themes, voice tracking, and section markers.",
        seoTitle: "Free Teleprompter — Browser Based | paperless.tools",
        seoDescription:
          "Full-screen teleprompter with WYSIWYG script editor, high-contrast themes, cue line, bi-directional mirroring, WPM timing, section markers, and voice-activated scrolling.",
        icon: Monitor,
        actionLabel: "Open Teleprompter",
      },
    ],
  },
  {
    id: "utilities",
    title: "Utilities",
    tools: [
      {
        slug: "qr-tools",
        title: "QR Code Generator",
        description:
          "Create QR codes for links, WiFi, contacts, email, and more. Download PNG, JPG, SVG, or PDF.",
        seoTitle: "QR Code Generator — WiFi, Contact, Link & More | paperless.tools",
        seoDescription:
          "Free QR code generator with live preview. Create codes for websites, WiFi, contacts, email, SMS, phone, location, and events. Download PNG, JPG, SVG, or printable PDF cards.",
        icon: QrCode,
        actionLabel: "Open QR Generator",
      },
      {
        slug: "url-shortener",
        title: "Shorten a Link",
        description: "Create a short link you can share anywhere.",
        seoTitle: "Shorten a Link — Free URL Shortener | paperless.tools",
        seoDescription:
          "Create short, shareable links. Fast and simple URL shortening.",
        icon: Link2,
        actionLabel: "Shorten Link",
      },
    ],
  },
];

export const ALL_TOOLS: ToolDefinition[] = TOOL_CATEGORIES.flatMap(
  (category) => category.tools,
);

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return ALL_TOOLS.find((tool) => tool.slug === slug);
}

export function getAllToolSlugs(): ToolSlug[] {
  return ALL_TOOLS.map((tool) => tool.slug);
}
