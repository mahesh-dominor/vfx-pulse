import type { ReactNode } from "react";

type DataPanelProps = {
  children: ReactNode;
  className?: string;
};

type DataMessageProps = {
  text: string;
};

export function DataPanel({ children, className }: DataPanelProps) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-[#111827] p-5 ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}

export function TableWrapper({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function LoadingState({ text }: DataMessageProps) {
  return <p className="text-slate-300">{text}</p>;
}

export function EmptyState({ text }: DataMessageProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0B1321] px-4 py-5 text-sm text-slate-400">
      {text}
    </div>
  );
}
