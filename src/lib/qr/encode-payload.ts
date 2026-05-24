import type {
  ContactForm,
  EmailForm,
  EventForm,
  LocationForm,
  PhoneForm,
  QrEncodeResult,
  QrFormData,
  SmsForm,
  TextForm,
  WebsiteForm,
  WifiForm,
} from "./types";
import { QR_TYPE_LABELS } from "./types";

function escapeVCard(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function escapeWifi(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/:/g, "\\:").replace(/"/g, '\\"');
}

function encodeQueryParam(value: string): string {
  return encodeURIComponent(value);
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function toIcsDateTime(date: string, time: string): string | null {
  if (!date) return null;
  const normalizedTime = time || "00:00";
  const [year, month, day] = date.split("-");
  const [hour, minute] = normalizedTime.split(":");
  if (!year || !month || !day || !hour || !minute) return null;
  return `${year}${month}${day}T${hour}${minute}00`;
}

function encodeWebsite(fields: WebsiteForm): QrEncodeResult {
  const url = normalizeUrl(fields.url);
  if (!url) {
    return {
      payload: "",
      isValid: false,
      hint: "Enter a website URL to generate your QR code.",
      title: QR_TYPE_LABELS.website,
      detailLines: [],
    };
  }

  return {
    payload: url,
    isValid: true,
    hint: "",
    title: QR_TYPE_LABELS.website,
    detailLines: [url],
  };
}

function encodeWifi(fields: WifiForm): QrEncodeResult {
  const ssid = fields.ssid.trim();
  if (!ssid) {
    return {
      payload: "",
      isValid: false,
      hint: "Enter a network name (SSID) to generate your QR code.",
      title: QR_TYPE_LABELS.wifi,
      detailLines: [],
    };
  }

  const security = fields.security;
  const password =
    security === "nopass" ? "" : escapeWifi(fields.password);
  const payload = `WIFI:T:${security};S:${escapeWifi(ssid)};P:${password};H:${fields.hidden ? "true" : "false"};;`;

  return {
    payload,
    isValid: true,
    hint: "",
    title: QR_TYPE_LABELS.wifi,
    detailLines: [ssid, security === "nopass" ? "Open network" : "Secured network"],
  };
}

function encodeContact(fields: ContactForm): QrEncodeResult {
  const firstName = fields.firstName.trim();
  const lastName = fields.lastName.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  if (!fullName && !fields.phone.trim() && !fields.email.trim()) {
    return {
      payload: "",
      isValid: false,
      hint: "Add a name, phone number, or email to generate a contact card.",
      title: QR_TYPE_LABELS.contact,
      detailLines: [],
    };
  }

  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  if (fullName) lines.push(`FN:${escapeVCard(fullName)}`);
  if (firstName) lines.push(`N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`);
  if (fields.phone.trim()) lines.push(`TEL:${escapeVCard(fields.phone.trim())}`);
  if (fields.email.trim()) lines.push(`EMAIL:${escapeVCard(fields.email.trim())}`);
  if (fields.organization.trim()) lines.push(`ORG:${escapeVCard(fields.organization.trim())}`);
  if (fields.title.trim()) lines.push(`TITLE:${escapeVCard(fields.title.trim())}`);
  if (fields.website.trim()) lines.push(`URL:${escapeVCard(normalizeUrl(fields.website))}`);
  lines.push("END:VCARD");

  const detailLines = [fullName || "Contact card"];
  if (fields.phone.trim()) detailLines.push(fields.phone.trim());
  if (fields.email.trim()) detailLines.push(fields.email.trim());

  return {
    payload: lines.join("\n"),
    isValid: true,
    hint: "",
    title: QR_TYPE_LABELS.contact,
    detailLines,
  };
}

function encodeText(fields: TextForm): QrEncodeResult {
  const content = fields.content;
  if (!content.trim()) {
    return {
      payload: "",
      isValid: false,
      hint: "Type your message to generate a QR code.",
      title: QR_TYPE_LABELS.text,
      detailLines: [],
    };
  }

  const preview = content.length > 80 ? `${content.slice(0, 80)}…` : content;

  return {
    payload: content,
    isValid: true,
    hint: "",
    title: QR_TYPE_LABELS.text,
    detailLines: [preview],
  };
}

function encodeEmail(fields: EmailForm): QrEncodeResult {
  const address = fields.address.trim();
  if (!address) {
    return {
      payload: "",
      isValid: false,
      hint: "Enter an email address to generate your QR code.",
      title: QR_TYPE_LABELS.email,
      detailLines: [],
    };
  }

  const params: string[] = [];
  if (fields.subject.trim()) params.push(`subject=${encodeQueryParam(fields.subject.trim())}`);
  if (fields.body.trim()) params.push(`body=${encodeQueryParam(fields.body.trim())}`);
  const payload = params.length > 0 ? `mailto:${address}?${params.join("&")}` : `mailto:${address}`;

  const detailLines = [address];
  if (fields.subject.trim()) detailLines.push(fields.subject.trim());

  return {
    payload,
    isValid: true,
    hint: "",
    title: QR_TYPE_LABELS.email,
    detailLines,
  };
}

function encodeSms(fields: SmsForm): QrEncodeResult {
  const phone = fields.phone.trim();
  if (!phone) {
    return {
      payload: "",
      isValid: false,
      hint: "Enter a phone number to generate your QR code.",
      title: QR_TYPE_LABELS.sms,
      detailLines: [],
    };
  }

  const payload = fields.message.trim()
    ? `sms:${phone}?body=${encodeQueryParam(fields.message.trim())}`
    : `sms:${phone}`;

  return {
    payload,
    isValid: true,
    hint: "",
    title: QR_TYPE_LABELS.sms,
    detailLines: [phone, fields.message.trim() || "No preset message"],
  };
}

function encodePhone(fields: PhoneForm): QrEncodeResult {
  const phone = fields.phone.trim();
  if (!phone) {
    return {
      payload: "",
      isValid: false,
      hint: "Enter a phone number to generate your QR code.",
      title: QR_TYPE_LABELS.phone,
      detailLines: [],
    };
  }

  return {
    payload: `tel:${phone}`,
    isValid: true,
    hint: "",
    title: QR_TYPE_LABELS.phone,
    detailLines: [phone],
  };
}

function encodeLocation(fields: LocationForm): QrEncodeResult {
  const lat = fields.latitude.trim();
  const lng = fields.longitude.trim();
  if (!lat || !lng) {
    return {
      payload: "",
      isValid: false,
      hint: "Search for a place or enter coordinates manually.",
      title: QR_TYPE_LABELS.location,
      detailLines: [],
    };
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return {
      payload: "",
      isValid: false,
      hint: "Latitude and longitude must be valid numbers.",
      title: QR_TYPE_LABELS.location,
      detailLines: [],
    };
  }

  const label = fields.label.trim();
  const payload = label
    ? `geo:${latNum},${lngNum}?q=${encodeQueryParam(label)}`
    : `geo:${latNum},${lngNum}`;

  return {
    payload,
    isValid: true,
    hint: "",
    title: QR_TYPE_LABELS.location,
    detailLines: [label || `${latNum}, ${lngNum}`],
  };
}

function encodeEvent(fields: EventForm): QrEncodeResult {
  const title = fields.title.trim();
  const start = toIcsDateTime(fields.startDate, fields.startTime);
  const end = toIcsDateTime(fields.endDate || fields.startDate, fields.endTime);

  if (!title) {
    return {
      payload: "",
      isValid: false,
      hint: "Enter an event title to generate your QR code.",
      title: QR_TYPE_LABELS.event,
      detailLines: [],
    };
  }

  if (!start) {
    return {
      payload: "",
      isValid: false,
      hint: "Choose a start date (and time) for the event.",
      title: QR_TYPE_LABELS.event,
      detailLines: [],
    };
  }

  const lines = [
    "BEGIN:VEVENT",
    `SUMMARY:${escapeVCard(title)}`,
    `DTSTART:${start}`,
  ];
  if (end) lines.push(`DTEND:${end}`);
  if (fields.location.trim()) lines.push(`LOCATION:${escapeVCard(fields.location.trim())}`);
  if (fields.description.trim()) lines.push(`DESCRIPTION:${escapeVCard(fields.description.trim())}`);
  lines.push("END:VEVENT");

  const detailLines = [title];
  if (fields.startDate) {
    detailLines.push(
      `${fields.startDate}${fields.startTime ? ` at ${fields.startTime}` : ""}`,
    );
  }
  if (fields.location.trim()) detailLines.push(fields.location.trim());

  return {
    payload: lines.join("\n"),
    isValid: true,
    hint: "",
    title: QR_TYPE_LABELS.event,
    detailLines,
  };
}

export function encodePayload(form: QrFormData): QrEncodeResult {
  switch (form.type) {
    case "website":
      return encodeWebsite(form.fields);
    case "wifi":
      return encodeWifi(form.fields);
    case "contact":
      return encodeContact(form.fields);
    case "text":
      return encodeText(form.fields);
    case "email":
      return encodeEmail(form.fields);
    case "sms":
      return encodeSms(form.fields);
    case "phone":
      return encodePhone(form.fields);
    case "location":
      return encodeLocation(form.fields);
    case "event":
      return encodeEvent(form.fields);
  }
}

export function buildExportFilename(form: QrFormData, extension: string): string {
  const base = (() => {
    switch (form.type) {
      case "website":
        return form.fields.url.trim() || "website";
      case "wifi":
        return form.fields.ssid.trim() || "wifi";
      case "contact": {
        const name = [form.fields.firstName, form.fields.lastName].filter(Boolean).join("-");
        return name || "contact";
      }
      case "text":
        return "text";
      case "email":
        return form.fields.address.trim() || "email";
      case "sms":
      case "phone":
        return form.fields.phone.trim() || form.type;
      case "location":
        return form.fields.label.trim() || "location";
      case "event":
        return form.fields.title.trim() || "event";
    }
  })();

  const sanitized = base.replace(/[^\w\s.-]/g, "").trim().replace(/\s+/g, "-").slice(0, 40);
  return `qrcode-${sanitized || form.type}.${extension}`;
}
