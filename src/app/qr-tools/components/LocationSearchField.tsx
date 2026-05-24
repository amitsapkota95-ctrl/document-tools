"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { AdvancedToolsToggle } from "@/components/tools/AdvancedToolsToggle";
import { CARD_CLASS, INPUT_CLASS } from "@/lib/ui/classes";
import { searchLocations, type LocationPlace } from "@/lib/qr/location-search";
import type { LocationForm } from "@/lib/qr/types";

interface LocationSearchFieldProps {
  fields: LocationForm;
  onSelect: (place: LocationPlace) => void;
  updateField: (field: string, value: string | boolean) => void;
}

export function LocationSearchField({ fields, onSelect, updateField }: LocationSearchFieldProps) {
  const [query, setQuery] = useState(fields.label);
  const [results, setResults] = useState<LocationPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(fields.label);
  }, [fields.label]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    const timer = window.setTimeout(() => {
      searchLocations(query, controller.signal)
        .then((places) => {
          setResults(places);
          setLoading(false);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setLoading(false);
          setError(err instanceof Error ? err.message : "Search failed.");
        });
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasCoordinates = fields.latitude.trim() && fields.longitude.trim();

  const handleSelect = (place: LocationPlace) => {
    onSelect(place);
    setQuery(place.label);
    setOpen(false);
    setResults([]);
  };

  const clearSelection = () => {
    updateField("latitude", "");
    updateField("longitude", "");
    updateField("label", "");
    setQuery("");
    setResults([]);
    setError("");
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold">
        Search for a place
        <div ref={containerRef} className="relative mt-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              if (!e.target.value.trim()) clearSelection();
            }}
            onFocus={() => setOpen(true)}
            placeholder="City, address, landmark…"
            className={`${INPUT_CLASS} mt-0 pl-9`}
            autoFocus
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls="location-search-results"
          />

          {open && query.trim().length >= 2 ? (
            <div
              id="location-search-results"
              className={`${CARD_CLASS} absolute z-20 mt-1 max-h-56 w-full overflow-y-auto p-1 shadow-lg`}
              role="listbox"
            >
              {loading ? (
                <p className="flex items-center gap-2 px-3 py-2 text-sm text-sand">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Searching…
                </p>
              ) : null}

              {!loading && error ? (
                <p className="px-3 py-2 text-sm text-red-700">{error}</p>
              ) : null}

              {!loading && !error && results.length === 0 ? (
                <p className="px-3 py-2 text-sm text-sand">No places found. Try a different search.</p>
              ) : null}

              {!loading
                ? results.map((place) => (
                    <button
                      key={`${place.latitude}-${place.longitude}-${place.label}`}
                      type="button"
                      role="option"
                      onClick={() => handleSelect(place)}
                      className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-moss-light/80"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sage-dark" aria-hidden />
                      <span>{place.label}</span>
                    </button>
                  ))
                : null}
            </div>
          ) : null}
        </div>
      </label>

      <p className="text-xs text-sand-light">
        Place search uses OpenStreetMap data via Photon — free, no account required.
      </p>

      {hasCoordinates ? (
        <div className={`${CARD_CLASS} bg-moss-light/40 p-3 text-sm`}>
          <p className="font-semibold text-forest">{fields.label || "Selected location"}</p>
          <p className="mt-1 text-sand">
            {fields.latitude}, {fields.longitude}
          </p>
          <button
            type="button"
            onClick={clearSelection}
            className="mt-2 text-xs font-semibold text-sage-dark hover:underline"
          >
            Clear and search again
          </button>
        </div>
      ) : null}

      <AdvancedToolsToggle variant="sidebar" label="Manual coordinates">
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-semibold">
            Latitude
            <input
              value={fields.latitude}
              onChange={(e) => updateField("latitude", e.target.value)}
              placeholder="37.7749"
              className={INPUT_CLASS}
            />
          </label>
          <label className="block text-sm font-semibold">
            Longitude
            <input
              value={fields.longitude}
              onChange={(e) => updateField("longitude", e.target.value)}
              placeholder="-122.4194"
              className={INPUT_CLASS}
            />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          Map label (optional)
          <input
            value={fields.label}
            onChange={(e) => {
              updateField("label", e.target.value);
              setQuery(e.target.value);
            }}
            placeholder="San Francisco, CA"
            className={INPUT_CLASS}
          />
        </label>
      </AdvancedToolsToggle>
    </div>
  );
}
