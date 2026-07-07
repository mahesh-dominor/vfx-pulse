import type { DashboardNotification } from "@/types/dashboard";

type NotificationsCardProps = {
  notifications: DashboardNotification[];
};

function getSeverityClass(severity: DashboardNotification["severity"]): string {
  if (severity === "critical") {
    return "border-red-700/60 bg-red-500/10 text-red-300";
  }

  if (severity === "warning") {
    return "border-amber-700/60 bg-amber-500/10 text-amber-200";
  }

  return "border-slate-700 bg-slate-500/10 text-slate-200";
}

export default function NotificationsCard({ notifications }: NotificationsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">Notifications</h2>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-400">No notifications for now.</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg border px-3 py-2 text-sm ${getSeverityClass(notification.severity)}`}
            >
              {notification.title}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
