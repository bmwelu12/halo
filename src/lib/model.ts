// Sentinel: the fine-tuned classifier, run in the browser with transformers.js.
// Until the model is published (or if it can't load), Halo falls back to the keyword baseline.
import { ruleLabel, type Label } from "./rules";

export const MODEL_ID = "bmwelu123/halo-sentinel";
export type ModelStatus = "idle" | "loading" | "ready" | "unavailable";
export interface Verdict { label: Label; score: number; source: "model" | "rules"; ms: number }

let classifier: any = null;
let status: ModelStatus = "idle";
const listeners = new Set<(s: ModelStatus) => void>();
const setStatus = (s: ModelStatus) => { status = s; listeners.forEach((l) => l(s)); };

export const getStatus = () => status;
export function onStatus(fn: (s: ModelStatus) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export async function loadModel() {
  if (status !== "idle") return;
  setStatus("loading");
  try {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    classifier = await pipeline("text-classification", MODEL_ID, { dtype: "q8" });
    setStatus("ready");
  } catch {
    setStatus("unavailable");
  }
}

export async function classify(text: string): Promise<Verdict> {
  const t0 = performance.now();
  if (classifier) {
    try {
      const [out] = await classifier(text);
      return { label: out.label as Label, score: out.score, source: "model", ms: performance.now() - t0 };
    } catch { /* fall through to rules */ }
  }
  return { label: ruleLabel(text), score: 1, source: "rules", ms: performance.now() - t0 };
}
