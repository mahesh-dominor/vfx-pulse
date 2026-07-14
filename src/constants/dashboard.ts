import type { QuickActionItem } from "@/types/dashboard";

export const DASHBOARD_QUICK_ACTIONS: readonly QuickActionItem[] = [
  { id: "daily-update", label: "Submit Daily Update", href: "/daily-update" },
  { id: "shots", label: "Open Shots", href: "/shots" },
  { id: "projects", label: "View Projects", href: "/projects" },
  { id: "planning", label: "Production Planning", href: "/planning" },
  { id: "reports", label: "Generate Reports", href: "/reports" },
] as const;
