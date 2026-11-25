// Turns per-line verdicts into what the phone shows: a state (icon + words + color) and a risk meter.
import type { Label } from "./rules";

export type CallState = "verified" | "unverified" | "caution" | "scam";
const RISK: Record<Label, number> = { safe: 8, suspicious: 55, scam: 92 };

export function callStatus(verified: boolean, caller: string, labels: Label[]) {
  const risk = labels.length ? Math.max(...labels.map((l) => RISK[l])) : verified ? 5 : 20;
  const anyScam = labels.includes("scam");
  if (verified && !anyScam) return { state: "verified" as CallState, risk, label: `Verified agent from ${caller}` };
  if (verified && anyScam) return { state: "scam" as CallState, risk, label: `Verified ${caller} agent is breaking its rules` };
  if (anyScam) return { state: "scam" as CallState, risk, label: `Likely scam: pretending to be ${caller}` };
  if (labels.includes("suspicious")) return { state: "caution" as CallState, risk, label: "Be careful: pressure tactics" };
  return { state: "unverified" as CallState, risk, label: "AI caller, not verified" };
}

export const GUIDANCE: Record<CallState, string> = {
  verified: "Halo confirmed this agent with its business. Even so, it will never ask for codes, PINs or passwords.",
  unverified: "Halo can't confirm who this is yet. Take your time.",
  caution: "The caller is using pressure. Don't act on this call; check through the official number.",
  scam: "Don't share anything or send money. Hang up, then call the official number you already have.",
};
