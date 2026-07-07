"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { logout } from "@/features/auth/actions/logout";
import { subscribeDataSync } from "@/lib/live-sync";
import BackButton from "@/components/layout/BackButton";

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [now, setNow] = useState(new Date());
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
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
        <div className="flex items-center gap-2">
          <BackButton />
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
              MR
            </span>
            <span className="hidden text-xs text-slate-200 sm:inline">
              {now.toLocaleDateString()} {now.toLocaleTimeString()}
            </span>
          </Link>
        </div>

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

        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
            aria-expanded={isProfileOpen}
          >
            Profile
          </button>

          {isProfileOpen ? (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-700 bg-[#0B1321] p-2 shadow-xl">
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-900/30"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : null}
        </div>
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
          <li>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-red-300 transition hover:bg-red-900/30"
              >
                <span>Sign Out</span>
              </button>
            </form>
          </li>
        </ul>
      ) : null}
    </nav>
  );
}
