import { useEffect, useState } from "react";
import { Card, Pill } from "../components/ui";
import { MODEL_ID } from "../lib/model";

interface Row { system: string; accuracy: number; macro_f1: number; false_alarm_rate: number | null; missed_scam_rate: number | null; latency_ms_p50: number; hard_cases_caught: Record<string, number | null> }
interface Evals { generated_at: string; trained: boolean; test_sets: Record<string, { lines: number; results: Row[] }> }

const pct = (v: number | null | undefined) => (v == null ? "—" : `${(v * 100).toFixed(0)}%`);
const SYSTEM_COLOR: Record<string, string> = { "Fine-tuned Sentinel": "bg-accent", "Keyword baseline": "bg-muted", "Untrained base model": "bg-line" };

async function loadEvals(): Promise<Evals> {
  try {
    const r = await fetch(`https://huggingface.co/${MODEL_ID}/resolve/main/eval_results.json`);
    if (r.ok) return r.json();
  } catch { /* model not published yet */ }
  return (await fetch(`${import.meta.env.BASE_URL}results/eval_results.json`)).json();
}

export function HowItWorks() {
  const [ev, setEv] = useState<Evals | null>(null);
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    loadEvals().then(setEv).catch(() => {});
    fetch(`${import.meta.env.BASE_URL}results/data_stats.json`).then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <div className="eyebrow">How it works · AI/ML</div>
        <h1 className="text-3xl font-bold md:text-4xl">One small model, trained and tested honestly</h1>
        <p className="mt-2 max-w-prose text-muted">Sentinel reads one line of a call and labels it safe, suspicious or scam. It's an open model fine-tuned with Hugging Face AutoTrain on default settings, then exported so it runs in the browser. No call text leaves your device.</p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Data", `${stats ? (stats.train + stats.validation + stats.test).toLocaleString() : "8,000"} invented call lines built from labeled templates: legit calls, pressure tactics, requests for codes, gift cards and wires, excuses, and lines that try to instruct the AI.`],
          ["Train", "AutoTrain text classification on ModernBERT-base with AutoTrain's default settings, on a free Kaggle GPU (about 15 minutes)."],
          ["Test", "Two held-out sets the model never trains on: a template set, and a small hand-written set with new phrasing to check it generalizes."],
          ["Ship", "Exported to ONNX and quantized, then loaded in the browser with transformers.js. If it can't load, Halo falls back to keyword rules."],
        ].map(([t, d], i) => (
          <li key={t} className="rounded-2xl border border-line bg-surface p-4"><div className="eyebrow">Step {i + 1}</div><div className="text-lg font-bold">{t}</div><p className="text-sm text-muted">{d}</p></li>
        ))}
      </ol>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold">Results</h2>
          {ev && <span className="text-sm text-muted">{ev.trained ? `Evaluated ${new Date(ev.generated_at).toLocaleDateString()}` : "Model not trained yet: baseline only"}</span>}
        </div>
        {ev && !ev.trained && <p className="mt-2 rounded-xl bg-warn-bg p-3 text-sm text-warn">These are the keyword baseline's scores. Fine-tuned results appear here automatically once the model is trained and published.</p>}
        {ev && Object.entries(ev.test_sets).map(([name, set]) => (
          <div key={name} className="mt-5">
            <h3 className="font-bold">{name === "template" ? "Template test set" : "Hand-written test set (new phrasing)"} <span className="font-normal text-muted">· {set.lines.toLocaleString()} lines · macro-F1</span></h3>
            <div className="mt-2 flex flex-col gap-2">
              {set.results.map((r) => (
                <div key={r.system} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
                  <span className="truncate">{r.system}</span>
                  <div className="h-4 overflow-hidden rounded bg-sunk"><div className={`h-full rounded ${SYSTEM_COLOR[r.system] ?? "bg-muted"}`} style={{ width: `${Math.max(2, r.macro_f1 * 100)}%` }} /></div>
                  <span className="text-right font-bold tnum">{pct(r.macro_f1)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm tnum">
                <thead><tr className="text-muted"><th className="py-1 pr-3 font-normal">System</th><th className="pr-3 font-normal">Accuracy</th><th className="pr-3 font-normal">False alarms</th><th className="pr-3 font-normal">Missed scams</th>{Object.keys(set.results[0].hard_cases_caught).map((h) => <th key={h} className="pr-3 font-normal">{h}</th>)}</tr></thead>
                <tbody>{set.results.map((r) => (
                  <tr key={r.system} className="border-t border-line"><td className="py-1.5 pr-3 font-bold">{r.system}</td><td className="pr-3">{pct(r.accuracy)}</td><td className="pr-3">{pct(r.false_alarm_rate)}</td><td className="pr-3">{pct(r.missed_scam_rate)}</td>{Object.values(r.hard_cases_caught).map((v, i) => <td key={i} className="pr-3">{pct(v)}</td>)}</tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        ))}
        <p className="mt-4 text-sm text-muted">Why two test sets? The keyword rules score well on template-style lines but fall apart on new wording. The hand-written set shows whether a model learned the pattern or just the templates.</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">Training setup</h2>
          <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
            {[["Tool", "Hugging Face AutoTrain 0.8.36"], ["Task", "Text classification (3 labels)"], ["Base model", "answerdotai/ModernBERT-base (Apache-2.0)"], ["Settings", "AutoTrain defaults: lr 5e-5, 3 epochs, batch 8, max length 128, fp16"], ["Hardware", "Free Kaggle T4 GPU"], ["Runs in", "Browser via transformers.js (ONNX, 8-bit)"]].flatMap(([k, v]) => [<dt key={k + "k"} className="text-muted">{k}</dt>, <dd key={k + "v"}>{v}</dd>])}
          </dl>
          <p className="mt-3 text-sm"><a className="font-bold text-accent underline" href={`https://huggingface.co/${MODEL_ID}`} target="_blank" rel="noreferrer">Model card on Hugging Face</a></p>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Limits I'd fix next</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            <li>Training lines come from templates, so phrasing variety is limited. Next: real-world style data with human review.</li>
            <li>Sentinel judges one line at a time. Slow-burn scams need a model that reads the whole call.</li>
            <li>Labels lean toward "scam" (most template lines are scams), so I report macro-F1, not just accuracy.</li>
            <li>Simulated calls only; no audio or voice-clone detection.</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-1"><Pill tone="muted">Open-weight model</Pill><Pill tone="muted">No closed AI APIs</Pill><Pill tone="muted">Invented data only</Pill></div>
        </Card>
      </div>
    </div>
  );
}
