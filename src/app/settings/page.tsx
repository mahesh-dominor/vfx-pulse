"use client";

import TopNav from "@/components/layout/TopNav";
import SettingsManagement from "@/components/settings/SettingsManagement";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#070B14] p-8">
      <TopNav />
      <h1 className="mb-6 text-3xl font-semibold text-slate-100">Settings</h1>
      <SettingsManagement />
    </main>
  );
}
