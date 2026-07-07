"use client";

import { useEffect, useState } from "react";

import TopNav from "@/components/layout/TopNav";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/notifications");
        if (!response.ok) throw new Error("Unable to fetch notifications");
        const data = (await response.json()) as NotificationItem[];
        setNotifications(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to fetch notifications");
      }
    }

    void load();
  }, []);

  return (
    <main className="min-h-screen bg-[#070B14] p-8">
      <TopNav />
      <h1 className="mb-6 text-3xl font-semibold text-slate-100">Notifications</h1>

      {error ? <p className="mb-4 rounded border border-red-800 bg-red-900/20 p-3 text-red-300">{error}</p> : null}

      <div className="space-y-3">
        {notifications.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-800 bg-[#111827] p-4">
            <p className="text-sm font-semibold text-slate-100">{item.title}</p>
            <p className="mt-1 text-sm text-slate-300">{item.message}</p>
            <p className="mt-2 text-xs text-slate-500">
              {item.channel} • {item.isRead ? "Read" : "Unread"}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
