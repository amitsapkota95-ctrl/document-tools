export type QrContentType =
  | "website"
  | "wifi"
  | "contact"
  | "text"
  | "email"
  | "sms"
  | "phone"
  | "location"
  | "event";

export type WifiSecurity = "WPA" | "WEP" | "nopass";

export type QrExportSize = 256 | 512 | 1024;

export type QrPdfCardSize = "business" | "a6";

export interface WebsiteForm {
  url: string;
}

export interface WifiForm {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
}

export interface ContactForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization: string;
  title: string;
  website: string;
}

export interface TextForm {
  content: string;
}

export interface EmailForm {
  address: string;
  subject: string;
  body: string;
}

export interface SmsForm {
  phone: string;
  message: string;
}

export interface PhoneForm {
  phone: string;
}

export interface LocationForm {
  latitude: string;
  longitude: string;
  label: string;
}

export interface EventForm {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  description: string;
}

export type QrFormData =
  | { type: "website"; fields: WebsiteForm }
  | { type: "wifi"; fields: WifiForm }
  | { type: "contact"; fields: ContactForm }
  | { type: "text"; fields: TextForm }
  | { type: "email"; fields: EmailForm }
  | { type: "sms"; fields: SmsForm }
  | { type: "phone"; fields: PhoneForm }
  | { type: "location"; fields: LocationForm }
  | { type: "event"; fields: EventForm };

export interface QrStyleOptions {
  foreground: string;
  background: string;
  exportSize: QrExportSize;
  pdfCardSize: QrPdfCardSize;
  logoUrl: string | null;
}

export interface QrEncodeResult {
  payload: string;
  isValid: boolean;
  hint: string;
  title: string;
  detailLines: string[];
}

export const QR_TYPE_LABELS: Record<QrContentType, string> = {
  website: "Website Link",
  wifi: "WiFi Login",
  contact: "Contact Card",
  text: "Plain Text",
  email: "Email",
  sms: "Text Message",
  phone: "Phone Call",
  location: "Location",
  event: "Event / Meeting",
};

export const QR_TYPE_DESCRIPTIONS: Record<QrContentType, string> = {
  website: "Share a URL that opens in the browser.",
  wifi: "Let guests join your network without typing a password.",
  contact: "Save a vCard contact with one scan.",
  text: "Encode any message or note.",
  email: "Open a pre-filled email draft.",
  sms: "Send a text message with optional body.",
  phone: "Dial a phone number instantly.",
  location: "Search for a place or enter coordinates to open in maps.",
  event: "Add a calendar event from a scan.",
};

export const DEFAULT_STYLE: QrStyleOptions = {
  foreground: "#1a2e1a",
  background: "#ffffff",
  exportSize: 512,
  pdfCardSize: "business",
  logoUrl: null,
};

export function defaultFormForType(type: QrContentType): QrFormData["fields"] {
  switch (type) {
    case "website":
      return { url: "" };
    case "wifi":
      return { ssid: "", password: "", security: "WPA", hidden: false };
    case "contact":
      return {
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        organization: "",
        title: "",
        website: "",
      };
    case "text":
      return { content: "" };
    case "email":
      return { address: "", subject: "", body: "" };
    case "sms":
      return { phone: "", message: "" };
    case "phone":
      return { phone: "" };
    case "location":
      return { latitude: "", longitude: "", label: "" };
    case "event":
      return {
        title: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        location: "",
        description: "",
      };
  }
}

export function createDefaultForm(type: QrContentType): QrFormData {
  return { type, fields: defaultFormForType(type) } as QrFormData;
}
