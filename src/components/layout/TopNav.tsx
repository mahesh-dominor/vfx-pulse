"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { subscribeDataSync } from "@/lib/live-sync";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/shots", label: "Shots" },
  { href: "/artists", label: "Artists" },
  { href: "/shot-tasks", label: "Shot Tasks" },
  { href: "/time-logs", label: "Time Logs" },
  { href: "/reviews", label: "Reviews" },
  { href: "/reports", label: "Reports" },
  { href: "/users", label: "Users" },
  { href: "/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function TopNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [badges, setBadges] = useState({
    openShots: 0,
    openTasks: 0,
    pendingReviews: 0,
    warningThreshold: 10,
    criticalThreshold: 20,
  });

  useEffect(() => {
    let mounted = true;

    async function loadBadges() {
      try {
        const response = await fetch("/api/nav/badges", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          openShots: number;
          openTasks: number;
          pendingReviews: number;
          warningThreshold: number;
          criticalThreshold: number;
        };
        if (mounted) {
          setBadges(data);
        }
      } catch {
        // Keep nav usable even if badges fail.
      }
    }

    void loadBadges();

    const timer = window.setInterval(() => {
      void loadBadges();
    }, 30000);

    const unsubscribe = subscribeDataSync(() => {
      void loadBadges();
    });

    return () => {
      mounted = false;
      window.clearInterval(timer);
      unsubscribe();
    };
  }, []);

  function getBadge(href: string): number | null {
    if (href === "/shots") {
      return badges.openShots;
    }

    if (href === "/shot-tasks") {
      return badges.openTasks;
    }

    if (href === "/reviews") {
      return badges.pendingReviews;
    }

    return null;
  }

  function getBadgeColorClass(count: number | null): string {
    if (count === null) {
      return "bg-slate-900/70 text-cyan-200";
    }

    if (count >= badges.criticalThreshold) {
      return "bg-red-900/60 text-red-200 border border-red-700/60";
    }

    if (count >= badges.warningThreshold) {
      return "bg-amber-900/60 text-amber-200 border border-amber-700/60";
    }

    return "bg-slate-900/70 text-cyan-200 border border-slate-700/60";
  }

  return (
    <nav className="sticky top-0 z-40 mb-6 rounded-2xl border border-slate-800/90 bg-[#0B1321]/95 p-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
            MR
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 md:hidden"
          aria-expanded={isOpen}
          aria-label="Toggle menu"
        >
          Menu
        </button>

        <ul className="hidden flex-wrap gap-2 md:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            const badge = getBadge(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-slate-100",
                  ].join(" ")}
                >
                  {item.label}
                  {badge !== null ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColorClass(badge)}`}>
                      {badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {isOpen ? (
        <ul className="mt-3 grid gap-2 border-t border-slate-800 pt-3 md:hidden">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            const badge = getBadge(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={[
                    "inline-flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-slate-100",
                  ].join(" ")}
                >
                  <span>{item.label}</span>
                  {badge !== null ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColorClass(badge)}`}>
                      {badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </nav>
  );
}
