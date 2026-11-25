import type { ReactNode } from "react";
import type { CallState } from "../lib/call";

const STYLE: Record<CallState, { cls: string; icon: string; word: string }> = {
  verified: { cls: "bg-safe-bg text-safe border-safe/40", icon: "✓", word: "Verified" },
  unverified: { cls: "bg-warn-bg text-warn border-warn/40", icon: "?", word: "Not verified" },
  caution: { cls: "bg-warn-bg text-warn border-warn/40", icon: "!", word: "Caution" },
  scam: { cls: "bg-danger-bg text-danger border-danger/40", icon: "✕", word: "Scam" },
};

export function StateBanner({ state, label }: { state: CallState; label: string }) {
  const s = STYLE[state];
  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-3 rounded-2xl border p-4 ${s.cls}`}>
      <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-current text-xl font-bold">{s.icon}</span>
      <div className="min-w-0"><div className="text-lg font-bold leading-tight">{label}</div><div className="text-sm opacity-80">{s.word}</div></div>
    </div>
  );
}

export function RiskMeter({ risk }: { risk: number }) {
  const tone = risk >= 75 ? "danger" : risk >= 45 ? "warn" : "safe";
  const word = risk >= 75 ? "High risk" : risk >= 45 ? "Be careful" : "Low risk";
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm"><span className="eyebrow">Risk</span><span className={`font-bold text-${tone} tnum`}>{word} · {risk}</span></div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-sunk" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={risk} aria-label="Risk">
        <div className={`h-full rounded-full bg-${tone} transition-all duration-700`} style={{ width: `${Math.max(4, risk)}%` }} />
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>{children}</div>;
}

export function Pill({ tone, children }: { tone: "safe" | "warn" | "danger" | "muted"; children: ReactNode }) {
  const c = { safe: "bg-safe-bg text-safe border-safe/40", warn: "bg-warn-bg text-warn border-warn/40", danger: "bg-danger-bg text-danger border-danger/40", muted: "border-line text-muted" }[tone];
  return <span className={`chip ${c}`}>{children}</span>;
}

export const labelTone = (l: string) => (l === "scam" ? "danger" : l === "suspicious" ? "warn" : "safe") as "danger" | "warn" | "safe";
export const human = (s: string) => s.replace(/_/g, " ");
