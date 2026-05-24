"use client";

import { useCallback, useMemo, useState } from "react";
import { encodePayload } from "@/lib/qr/encode-payload";
import {
  exportQrJpg,
  exportQrPdfCard,
  exportQrPng,
  exportQrSvg,
} from "@/lib/qr/export";
import {
  createDefaultForm,
  DEFAULT_STYLE,
  type QrContentType,
  type QrFormData,
  type QrStyleOptions,
} from "@/lib/qr/types";

export function useQrGeneratorState() {
  const [contentType, setContentType] = useState<QrContentType | null>(null);
  const [form, setForm] = useState<QrFormData | null>(null);
  const [style, setStyle] = useState<QrStyleOptions>(DEFAULT_STYLE);
  const [exporting, setExporting] = useState(false);

  const selectType = useCallback((type: QrContentType) => {
    setContentType(type);
    setForm(createDefaultForm(type));
  }, []);

  const updateField = useCallback((field: string, value: string | boolean) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: { ...prev.fields, [field]: value },
      } as QrFormData;
    });
  }, []);

  const updateStyle = useCallback(
    <K extends keyof QrStyleOptions>(key: K, value: QrStyleOptions[K]) => {
      setStyle((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const encoded = useMemo(() => {
    if (!form) {
      return {
        payload: "",
        isValid: false,
        hint: "Choose a QR code type to get started.",
        title: "",
        detailLines: [] as string[],
      };
    }
    return encodePayload(form);
  }, [form]);

  const errorCorrectionLevel: "L" | "M" | "Q" | "H" = style.logoUrl ? "H" : "M";

  const copyPayload = useCallback(async () => {
    if (!encoded.isValid || !encoded.payload) return false;
    try {
      await navigator.clipboard.writeText(encoded.payload);
      return true;
    } catch {
      return false;
    }
  }, [encoded.isValid, encoded.payload]);

  const runExport = useCallback(
    async (format: "png" | "jpg" | "svg" | "pdf") => {
      if (!form || !encoded.isValid || !encoded.payload) return;
      setExporting(true);
      try {
        switch (format) {
          case "png":
            await exportQrPng(encoded.payload, form, style);
            break;
          case "jpg":
            await exportQrJpg(encoded.payload, form, style);
            break;
          case "svg":
            exportQrSvg(encoded.payload, form, style);
            break;
          case "pdf":
            await exportQrPdfCard(encoded.payload, form, style, encoded);
            break;
        }
      } finally {
        setExporting(false);
      }
    },
    [encoded, form, style],
  );

  return {
    contentType,
    form,
    style,
    encoded,
    errorCorrectionLevel,
    exporting,
    selectType,
    updateField,
    updateStyle,
    copyPayload,
    runExport,
  };
}

export type QrGeneratorState = ReturnType<typeof useQrGeneratorState>;
