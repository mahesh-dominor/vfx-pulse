"use client";

import { useEffect, useState } from "react";

import TopNav from "@/components/layout/TopNav";
import { DataPanel, EmptyState, LoadingState, TableWrapper } from "@/components/ui/data-states";
import { FeedbackMessage } from "@/components/ui/feedback-message";

type AssetItem = {
  id: string;
  name: string;
  assetType: string;
  version: number;
  project: { code: string };
  shot: { code: string | null; shotName: string } | null;
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/assets");
        if (!response.ok) {
          throw new Error("Unable to fetch assets");
        }

        const data = (await response.json()) as AssetItem[];
        setAssets(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to fetch assets");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <main className="min-h-screen bg-[#070B14] p-8">
      <TopNav />
      <h1 className="mb-6 text-3xl font-semibold text-slate-100">Assets</h1>

      {error ? (
        <FeedbackMessage variant="error" message={error} className="mb-4" />
      ) : null}

      <DataPanel>
        {loading ? (
          <LoadingState text="Loading assets..." />
        ) : (
          <TableWrapper>
            <table className="min-w-full text-left">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Project</th>
              <th className="px-3 py-2">Shot</th>
              <th className="px-3 py-2">Version</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-t border-slate-800 text-slate-200">
                <td className="px-3 py-2">{asset.name}</td>
                <td className="px-3 py-2">{asset.assetType}</td>
                <td className="px-3 py-2">{asset.project.code}</td>
                <td className="px-3 py-2">{asset.shot?.code ?? asset.shot?.shotName ?? "-"}</td>
                <td className="px-3 py-2">{asset.version}</td>
              </tr>
            ))}
            {assets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-3">
                  <EmptyState text="No assets found." />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
          </TableWrapper>
        )}
      </DataPanel>
    </main>
  );
}
