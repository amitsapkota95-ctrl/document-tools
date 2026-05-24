"use client";

import { INPUT_CLASS } from "@/lib/ui/classes";
import type { QrFormData } from "@/lib/qr/types";
import type { QrGeneratorState } from "../useQrGeneratorState";
import { LocationSearchField } from "./LocationSearchField";

interface QrFormFieldsProps {
  form: QrFormData;
  updateField: QrGeneratorState["updateField"];
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}

export function QrFormFields({ form, updateField }: QrFormFieldsProps) {
  switch (form.type) {
    case "website":
      return (
        <FieldLabel label="Website URL">
          <input
            value={form.fields.url}
            onChange={(e) => updateField("url", e.target.value)}
            placeholder="example.com or https://example.com"
            className={INPUT_CLASS}
            autoFocus
          />
        </FieldLabel>
      );

    case "wifi":
      return (
        <div className="space-y-3">
          <FieldLabel label="Network name (SSID)">
            <input
              value={form.fields.ssid}
              onChange={(e) => updateField("ssid", e.target.value)}
              placeholder="My WiFi Network"
              className={INPUT_CLASS}
              autoFocus
            />
          </FieldLabel>
          <FieldLabel label="Password">
            <input
              value={form.fields.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="Network password"
              type="password"
              className={INPUT_CLASS}
              disabled={form.fields.security === "nopass"}
            />
          </FieldLabel>
          <FieldLabel label="Security">
            <select
              value={form.fields.security}
              onChange={(e) => updateField("security", e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="WPA">WPA / WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No password (open)</option>
            </select>
          </FieldLabel>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.fields.hidden}
              onChange={(e) => updateField("hidden", e.target.checked)}
              className="rounded border-cream-300"
            />
            Hidden network
          </label>
        </div>
      );

    case "contact":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <FieldLabel label="First name">
              <input
                value={form.fields.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                className={INPUT_CLASS}
                autoFocus
              />
            </FieldLabel>
            <FieldLabel label="Last name">
              <input
                value={form.fields.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                className={INPUT_CLASS}
              />
            </FieldLabel>
          </div>
          <FieldLabel label="Phone">
            <input
              value={form.fields.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+1 555 123 4567"
              className={INPUT_CLASS}
            />
          </FieldLabel>
          <FieldLabel label="Email">
            <input
              value={form.fields.email}
              onChange={(e) => updateField("email", e.target.value)}
              type="email"
              className={INPUT_CLASS}
            />
          </FieldLabel>
          <FieldLabel label="Organization">
            <input
              value={form.fields.organization}
              onChange={(e) => updateField("organization", e.target.value)}
              className={INPUT_CLASS}
            />
          </FieldLabel>
          <FieldLabel label="Job title">
            <input
              value={form.fields.title}
              onChange={(e) => updateField("title", e.target.value)}
              className={INPUT_CLASS}
            />
          </FieldLabel>
          <FieldLabel label="Website">
            <input
              value={form.fields.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://example.com"
              className={INPUT_CLASS}
            />
          </FieldLabel>
        </div>
      );

    case "text":
      return (
        <FieldLabel label="Message">
          <textarea
            value={form.fields.content}
            onChange={(e) => updateField("content", e.target.value)}
            placeholder="Type anything you want encoded…"
            rows={5}
            className={INPUT_CLASS}
            autoFocus
          />
        </FieldLabel>
      );

    case "email":
      return (
        <div className="space-y-3">
          <FieldLabel label="Email address">
            <input
              value={form.fields.address}
              onChange={(e) => updateField("address", e.target.value)}
              type="email"
              placeholder="you@example.com"
              className={INPUT_CLASS}
              autoFocus
            />
          </FieldLabel>
          <FieldLabel label="Subject (optional)">
            <input
              value={form.fields.subject}
              onChange={(e) => updateField("subject", e.target.value)}
              className={INPUT_CLASS}
            />
          </FieldLabel>
          <FieldLabel label="Body (optional)">
            <textarea
              value={form.fields.body}
              onChange={(e) => updateField("body", e.target.value)}
              rows={3}
              className={INPUT_CLASS}
            />
          </FieldLabel>
        </div>
      );

    case "sms":
      return (
        <div className="space-y-3">
          <FieldLabel label="Phone number">
            <input
              value={form.fields.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+1 555 123 4567"
              className={INPUT_CLASS}
              autoFocus
            />
          </FieldLabel>
          <FieldLabel label="Message (optional)">
            <textarea
              value={form.fields.message}
              onChange={(e) => updateField("message", e.target.value)}
              rows={3}
              className={INPUT_CLASS}
            />
          </FieldLabel>
        </div>
      );

    case "phone":
      return (
        <FieldLabel label="Phone number">
          <input
            value={form.fields.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+1 555 123 4567"
            className={INPUT_CLASS}
            autoFocus
          />
        </FieldLabel>
      );

    case "location":
      return (
        <LocationSearchField
          fields={form.fields}
          updateField={updateField}
          onSelect={(place) => {
            updateField("latitude", place.latitude);
            updateField("longitude", place.longitude);
            updateField("label", place.label);
          }}
        />
      );

    case "event":
      return (
        <div className="space-y-3">
          <FieldLabel label="Event title">
            <input
              value={form.fields.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Team meeting"
              className={INPUT_CLASS}
              autoFocus
            />
          </FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <FieldLabel label="Start date">
              <input
                value={form.fields.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                type="date"
                className={INPUT_CLASS}
              />
            </FieldLabel>
            <FieldLabel label="Start time">
              <input
                value={form.fields.startTime}
                onChange={(e) => updateField("startTime", e.target.value)}
                type="time"
                className={INPUT_CLASS}
              />
            </FieldLabel>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FieldLabel label="End date">
              <input
                value={form.fields.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                type="date"
                className={INPUT_CLASS}
              />
            </FieldLabel>
            <FieldLabel label="End time">
              <input
                value={form.fields.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                type="time"
                className={INPUT_CLASS}
              />
            </FieldLabel>
          </div>
          <FieldLabel label="Location">
            <input
              value={form.fields.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="Conference Room A"
              className={INPUT_CLASS}
            />
          </FieldLabel>
          <FieldLabel label="Description">
            <textarea
              value={form.fields.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className={INPUT_CLASS}
            />
          </FieldLabel>
        </div>
      );
  }
}
