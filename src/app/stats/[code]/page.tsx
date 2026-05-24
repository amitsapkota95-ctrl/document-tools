import type { Metadata } from "next";
import StatsClient from "./StatsClient";

export const metadata: Metadata = {
  title: "Link Analytics — paperless.tools",
};

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <StatsClient code={code} />;
}
