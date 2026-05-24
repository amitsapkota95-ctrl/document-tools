"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

interface StatsData {
  code: string;
  url: string;
  totalClicks: number;
  byCountry: Record<string, number>;
  byDay: Record<string, number>;
}

export default function StatsClient({ code }: { code: string }) {
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState("");
  const countryRef = useRef<HTMLCanvasElement>(null);
  const dayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch(`/api/analytics/${code}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d as StatsData);
      })
      .catch(() => setError("Could not load stats."));
  }, [code]);

  useEffect(() => {
    if (!data || !countryRef.current) return;

    const chart = new Chart(countryRef.current, {
      type: "bar",
      data: {
        labels: Object.keys(data.byCountry),
        datasets: [{ label: "Clicks", data: Object.values(data.byCountry), backgroundColor: "#22c55e" }],
      },
      options: { responsive: true, plugins: { legend: { display: false } } },
    });
    return () => chart.destroy();
  }, [data]);

  useEffect(() => {
    if (!data || !dayRef.current) return;

    const labels = Object.keys(data.byDay).sort();
    const chart = new Chart(dayRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "Clicks", data: labels.map((l) => data.byDay[l]), backgroundColor: "#14532d" }],
      },
      options: { responsive: true, plugins: { legend: { display: false } } },
    });
    return () => chart.destroy();
  }, [data]);

  if (error) return <p className="p-8 text-red-700">{error}</p>;
  if (!data) return <p className="p-8 text-sand">Loading analytics…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="font-serif text-3xl font-bold text-forest">Link Analytics</h1>
        <p className="mt-2 break-all text-sm text-sand">{data.url}</p>
        <p className="mt-4 text-2xl font-bold text-forest">{data.totalClicks} total clicks</p>
      </div>
      <div className="eco-card rounded-xl p-6 shadow-eco">
        <h2 className="mb-4 font-semibold">Clicks by Country</h2>
        <canvas ref={countryRef} />
      </div>
      <div className="eco-card rounded-xl p-6 shadow-eco">
        <h2 className="mb-4 font-semibold">Clicks Over Time</h2>
        <canvas ref={dayRef} />
      </div>
    </div>
  );
}
