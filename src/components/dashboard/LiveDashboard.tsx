"use client";

import { useEffect, useState } from "react";

import DashboardGrid from "@/components/dashboard/DashboardGrid";
import { subscribeDataSync } from "@/lib/live-sync";
import type { DashboardData } from "@/types/dashboard";

type LiveDashboardProps = {
  initialData: DashboardData;
};

export default function LiveDashboard({ initialData }: LiveDashboardProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      try {
        const response = await fetch("/api/dashboard/stats", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to refresh dashboard");
        }

        const payload = (await response.json()) as DashboardData;
        if (mounted) {
          setData(payload);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Failed to refresh dashboard");
        }
      }
    }

    const timer = window.setInterval(() => {
      void refresh();
    }, 30000);

    const unsubscribe = subscribeDataSync(() => {
      void refresh();
    });

    return () => {
      mounted = false;
      window.clearInterval(timer);
      unsubscribe();
    };
  }, []);

  return (
    <>
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      <DashboardGrid data={data} />
    </>
  );
}
