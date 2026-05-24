"use client";

import {
  Calendar,
  Link2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Type,
  UserRound,
  Wifi,
} from "lucide-react";
import { CARD_CLASS } from "@/lib/ui/classes";
import {
  QR_TYPE_DESCRIPTIONS,
  QR_TYPE_LABELS,
  type QrContentType,
} from "@/lib/qr/types";

const TYPE_ICONS: Record<QrContentType, typeof Link2> = {
  website: Link2,
  wifi: Wifi,
  contact: UserRound,
  text: Type,
  email: Mail,
  sms: MessageSquare,
  phone: Phone,
  location: MapPin,
  event: Calendar,
};

const TYPE_ORDER: QrContentType[] = [
  "website",
  "wifi",
  "contact",
  "text",
  "email",
  "sms",
  "phone",
  "location",
  "event",
];

interface QrTypeSelectorProps {
  onSelect: (type: QrContentType) => void;
}

export function QrTypeSelector({ onSelect }: QrTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-serif text-xl font-semibold text-forest-700">Choose a QR code type</h2>
        <p className="mt-2 text-sm text-ink/60">
          Pick what you want to encode. Your QR code previews in real time as you fill in the
          details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TYPE_ORDER.map((type) => {
          const Icon = TYPE_ICONS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={`${CARD_CLASS} group flex flex-col items-start gap-2 p-4 text-left transition hover:border-forest-500 hover:shadow-lg`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream-200 text-forest-700 group-hover:bg-forest-50">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="font-semibold text-forest-700">{QR_TYPE_LABELS[type]}</span>
              <span className="text-sm text-ink/60">{QR_TYPE_DESCRIPTIONS[type]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface QrTypeTabsProps {
  active: QrContentType;
  onChange: (type: QrContentType) => void;
}

export function QrTypeTabs({ active, onChange }: QrTypeTabsProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {TYPE_ORDER.map((type) => {
        const Icon = TYPE_ICONS[type];
        const isActive = type === active;
        return (
          <button
            key={type}
            type="button"
            title={QR_TYPE_LABELS[type]}
            onClick={() => onChange(type)}
            className={`flex flex-col items-center gap-1 rounded-lg border px-1.5 py-2 text-[10px] font-semibold leading-tight ${
              isActive
                ? "border-forest bg-forest text-white"
                : "border-cream-300 bg-cream-200 text-forest-700 hover:border-forest-500"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="line-clamp-2 text-center">{QR_TYPE_LABELS[type]}</span>
          </button>
        );
      })}
    </div>
  );
}
