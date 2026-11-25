import { useEffect, useState } from "react";
import { CaseStudy } from "./pages/CaseStudy";
import { Demo } from "./pages/Demo";
import { HowItWorks } from "./pages/HowItWorks";

const PAGES = [["demo", "Demo"], ["how-it-works", "How it works"], ["case-study", "Case study"]] as const;
type Page = (typeof PAGES)[number][0];
const current = (): Page => (PAGES.find(([k]) => "#" + k === location.hash)?.[0] ?? "demo");

export function App() {
  const [page, setPage] = useState<Page>(current());
  useEffect(() => { const f = () => { setPage(current()); scrollTo(0, 0); }; addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  return (
    <div className="gutter mx-auto flex min-h-full max-w-6xl flex-col gap-8 pb-12 pt-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <a href="#demo" className="flex items-center gap-3">
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full border-[3px] border-accent font-display text-lg font-bold text-accent">h</span>
          <span><span className="block font-display text-xl font-bold leading-none">Halo</span><span className="text-xs text-muted">AI that answers AI scam callers</span></span>
        </a>
        <nav className="flex flex-wrap gap-1" aria-label="Pages">
          {PAGES.map(([k, l]) => <a key={k} href={"#" + k} aria-current={page === k} className={`rounded-full px-3 py-1.5 text-sm font-bold ${page === k ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"}`}>{l}</a>)}
          <a href="https://github.com/bmwelu12/halo" target="_blank" rel="noreferrer" className="rounded-full px-3 py-1.5 text-sm font-bold text-muted hover:text-ink">GitHub ↗</a>
        </nav>
      </header>
      <main>{page === "demo" ? <Demo /> : page === "how-it-works" ? <HowItWorks /> : <CaseStudy />}</main>
      <footer className="border-t border-line pt-4 text-sm text-muted">A portfolio project. All calls, names and companies are invented. Built with an open model, Hugging Face AutoTrain and transformers.js.</footer>
    </div>
  );
}
