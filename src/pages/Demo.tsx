import { useEffect, useRef, useState } from "react";
import { Card, Pill, RiskMeter, StateBanner, human, labelTone } from "../components/ui";
import { GUIDANCE, callStatus } from "../lib/call";
import { classify, getStatus, loadModel, onStatus, type ModelStatus, type Verdict } from "../lib/model";
import { classifyLine } from "../lib/rules";
import { SCENARIOS, type Line, type Scenario } from "../lib/scenarios";

type Shown = Line & { verdict?: Verdict; tags?: string[] };

export function Demo() {
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[1]);
  const [shown, setShown] = useState<Shown[]>([]);
  const [playing, setPlaying] = useState(false);
  const [model, setModel] = useState<ModelStatus>(getStatus());
  const run = useRef(0);

  useEffect(() => { loadModel(); return onStatus(setModel); }, []);

  const play = async (sc: Scenario) => {
    const id = ++run.current;
    setScenario(sc); setShown([]); setPlaying(true);
    for (const line of sc.lines) {
      await new Promise((r) => setTimeout(r, 1100));
      if (run.current !== id) return;
      const entry: Shown = { ...line };
      if (line.speaker !== "you") {
        entry.verdict = await classify(line.text);
        const f = classifyLine(line.text);
        entry.tags = [...new Set([...f.all_tactics, ...f.all_items.map((i) => "asks for " + human(i)), ...(f.injection ? ["talks to the AI"] : [])])];
      }
      setShown((s) => [...s, entry]);
    }
    if (run.current === id) setPlaying(false);
  };

  const labels = shown.filter((l) => l.verdict).map((l) => l.verdict!.label);
  const status = callStatus(scenario.verified, scenario.caller, labels);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
      <Phone scenario={scenario} shown={shown} status={status} started={shown.length > 0 || playing} />
      <div className="flex min-w-0 flex-col gap-5">
        <div>
          <div className="eyebrow">Live demo</div>
          <h1 className="text-3xl font-bold md:text-4xl">Watch Halo answer an AI scam call</h1>
          <p className="mt-2 max-w-prose text-muted">Pick a call. Each line the caller says goes through <b className="text-ink">Sentinel</b>, a small model fine-tuned with Hugging Face AutoTrain, which labels it <i>safe</i>, <i>suspicious</i> or <i>scam</i>. It runs right here in your browser.</p>
          <ModelBadge status={model} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {SCENARIOS.map((s) => (
            <button key={s.id} onClick={() => play(s)} className={`rounded-xl border bg-surface p-3 text-left transition hover:border-accent ${scenario.id === s.id ? "border-accent" : "border-line"}`}>
              <div className="flex items-center justify-between gap-2"><span className="font-bold">{s.title}</span><span className="text-sm font-bold text-accent">{playing && scenario.id === s.id ? "Playing…" : "Play ▸"}</span></div>
              <p className="text-sm text-muted">{s.blurb}</p>
            </button>
          ))}
        </div>
        <TryIt />
      </div>
    </div>
  );
}

function ModelBadge({ status }: { status: ModelStatus }) {
  const text = {
    idle: "Preparing the model…",
    loading: "Loading Sentinel into your browser…",
    ready: "Sentinel model loaded · running on your device",
    unavailable: "Sentinel model not published yet · using the keyword baseline",
  }[status];
  return <div className="mt-3"><Pill tone={status === "ready" ? "safe" : status === "unavailable" ? "warn" : "muted"}>{text}</Pill></div>;
}

function Phone({ scenario, shown, status, started }: { scenario: Scenario; shown: Shown[]; status: ReturnType<typeof callStatus>; started: boolean }) {
  const end = useRef<HTMLLIElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [shown.length]);
  return (
    <div className="phone mx-auto flex h-[720px] max-h-[85vh] flex-col lg:sticky lg:top-4">
      <header className="border-b border-line bg-surface px-5 pb-3 pt-4">
        <div className="font-display text-2xl font-bold">Halo</div>
        <div className="flex items-center gap-2 text-sm text-muted"><span className="listening-dot" aria-hidden /> Halo is listening for you</div>
      </header>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {!started ? (
          <Card><div className="font-bold">No call right now</div><p className="text-sm text-muted">Pick a call on the right to see Halo at work.</p></Card>
        ) : (
          <>
            <div className="sticky top-0 z-10 -mx-3 -mt-3 flex flex-col gap-3 bg-bg px-3 pb-2 pt-3">
              <div className="text-sm text-muted">Incoming call · claims to be <b className="text-ink">{scenario.caller}</b></div>
              <StateBanner state={status.state} label={status.label} />
              <p className="text-[15px]">{GUIDANCE[status.state]}</p>
              <RiskMeter risk={status.risk} />
            </div>
            <ol className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3">
              {shown.map((l, i) => (
                <li key={i} className={l.speaker === "you" ? "pl-8" : ""}>
                  <div className="text-xs font-bold text-muted">{l.speaker === "you" ? "You" : l.speaker === "caller2" ? "Second caller" : scenario.caller}</div>
                  <div className="text-[15px]">{l.text}</div>
                  {l.verdict && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Pill tone={labelTone(l.verdict.label)}>{l.verdict.label}{l.verdict.source === "model" ? ` · ${Math.round(l.verdict.score * 100)}%` : ""}</Pill>
                      {l.tags?.map((t) => <Pill key={t} tone="muted">{t}</Pill>)}
                    </div>
                  )}
                </li>
              ))}
              <li ref={end} aria-hidden />
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

function TryIt() {
  const [text, setText] = useState("It's totally standard procedure, just read me the code we texted you.");
  const [v, setV] = useState<Verdict | null>(null);
  const check = async () => setV(await classify(text));
  return (
    <Card>
      <h2 className="text-lg font-bold">Try your own line</h2>
      <p className="text-sm text-muted">Type something a caller might say and see how Sentinel labels it.</p>
      <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); check(); }}>
        <label htmlFor="try-line" className="sr-only">Caller line</label>
        <input id="try-line" value={text} onChange={(e) => setText(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2" />
        <button className="btn btn-primary justify-center" type="submit">Check line</button>
      </form>
      {v && <div className="mt-3 flex flex-wrap items-center gap-2 text-sm"><Pill tone={labelTone(v.label)}>{v.label}</Pill><span className="text-muted">{v.source === "model" ? `Sentinel model · ${Math.round(v.score * 100)}% confident · ${v.ms.toFixed(0)} ms` : "keyword baseline (model not loaded)"}</span></div>}
    </Card>
  );
}
