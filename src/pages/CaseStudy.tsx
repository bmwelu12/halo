import { Card } from "../components/ui";

const COMPETITORS = [
  ["Google fake call detection", "Checks a saved contact's call really comes from their phone", "Judges what any AI caller is trying to do"],
  ["Pindrop", "Detects AI voices for enterprises", "Built for consumers, line by line"],
  ["Truecaller, Hiya", "Blocklists of known bad numbers", "Catches new scams no list has seen yet"],
];

const DECISIONS = [
  ["One small model, not four", "I first scoped four models (line classifier, conversation judge, agent action reviewer, AI interrogator). For a one-week build I kept the line classifier: it shows the full ML loop end to end and runs free in the browser.", "Slow-burn scams need whole-call context: next on the roadmap."],
  ["Run the model in the browser", "No server costs, nothing to keep running, and call text never leaves the device, which is also the product's privacy promise.", "Model size is capped; a bigger model would need a server."],
  ["Open model + AutoTrain defaults", "Open weights keep it private and free. Default settings keep the experiment honest and repeatable; I spent the time on data and evaluation instead of tuning.", "Probably leaves a little accuracy on the table."],
  ["Test on new phrasing, not just templates", "Template test scores looked great for keyword rules (95%) but dropped to 47% on hand-written lines. The second test set is what tells you if the product works.", "The hand-written set is small (36 lines), so numbers are directional."],
  ["Fall back to rules if the model fails", "The demo must never break in front of a recruiter or user.", "Fallback is weaker, so the UI says clearly which one is running."],
];

export function CaseStudy() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8">
      <header>
        <div className="eyebrow">Case study · Product</div>
        <h1 className="text-3xl font-bold md:text-4xl">Halo: fighting AI scam callers with AI</h1>
        <p className="mt-2 text-muted">A one-week product and ML project. My role: product definition, scoping, data, model training and evaluation, and the UI.</p>
      </header>

      <Section title="The problem">
        <p>Scam calls are now run by AI agents that sound human, adapt in real time and never get tired. In 2026, reports of AI agents coordinating in groups, inventing identities and faking their own logs showed how far this has come. Older people and families are hit hardest, and today's tools mostly block <i>known</i> numbers.</p>
      </Section>

      <Section title="Who it's for">
        <Card>
          <div className="font-bold">Maya, 72, retired teacher</div>
          <p className="text-sm text-muted">Lives alone, banks by phone, trusts people who sound official. Her daughter Sam worries about her.</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            <li><b>Job to be done:</b> "When someone calls about my money, help me know in plain words whether to trust them."</li>
            <li><b>Pain:</b> scammers create urgency and fear, so she acts before she thinks.</li>
            <li><b>Must have:</b> large type, calm language, and a clear answer: green, amber or red, with words, not just colors.</li>
          </ul>
        </Card>
      </Section>

      <Section title="The insight">
        <p>Every scam ends with the same few <b>asks</b>: a one-time code, a PIN, a gift card, a wire, remote access. Callers change their story constantly, but not the ask. So Halo judges <b>what the caller wants you to do</b>, not who they say they are or how convincing their excuse sounds.</p>
      </Section>

      <Section title="The solution">
        <ul className="list-disc pl-5">
          <li>Halo listens to the call and labels each line <i>safe</i>, <i>suspicious</i> or <i>scam</i> as it happens.</li>
          <li>The phone shows one clear state with an icon, words and color, a risk meter, and one sentence of calm guidance.</li>
          <li>Businesses that register their AI agents show as verified (green). Anyone using their name without a credential shows red.</li>
        </ul>
      </Section>

      <Section title="How it compares">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="text-muted"><th className="py-1 pr-3 font-normal">Product</th><th className="pr-3 font-normal">What it does</th><th className="font-normal">Halo's angle</th></tr></thead>
            <tbody>{COMPETITORS.map(([a, b, c]) => <tr key={a} className="border-t border-line align-top"><td className="py-2 pr-3 font-bold">{a}</td><td className="py-2 pr-3 text-muted">{b}</td><td className="py-2">{c}</td></tr>)}</tbody>
          </table>
        </div>
      </Section>

      <Section title="Key decisions and trade-offs">
        <div className="flex flex-col gap-3">
          {DECISIONS.map(([d, why, cost]) => (
            <Card key={d}><div className="font-bold">{d}</div><p className="mt-1 text-sm">{why}</p><p className="mt-1 text-sm text-muted"><b>Trade-off:</b> {cost}</p></Card>
          ))}
        </div>
      </Section>

      <Section title="How I'd measure success">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card><div className="eyebrow">North star</div><div className="font-bold">Scam calls where the user didn't comply</div></Card>
          <Card><div className="eyebrow">Model</div><div className="font-bold">Missed-scam rate under 5% on new phrasing</div></Card>
          <Card><div className="eyebrow">Guardrail</div><div className="font-bold">False alarms on real calls under 5%</div><p className="text-sm text-muted">Too many false alarms and people stop trusting it.</p></Card>
        </div>
      </Section>

      <Section title="What I cut, and what's next">
        <ol className="list-decimal pl-5">
          <li><b>Now (this project):</b> line classifier, browser demo, honest evaluation.</li>
          <li><b>Next:</b> a model that reads the whole call to catch slow-burn scams; more varied, human-reviewed training data.</li>
          <li><b>Later:</b> a verified-agent registry for businesses, checking what your own AI assistant does for you, and partnering with banks to show Halo inside their apps.</li>
        </ol>
      </Section>

      <Section title="What I learned">
        <ul className="list-disc pl-5">
          <li>The most important number came from the test set I almost didn't build: new phrasing.</li>
          <li>Cutting scope from four models to one made the project shippable in a week, and the cuts became a clear roadmap.</li>
          <li>For a safety product, the fallback and the honesty of the UI ("which model is running?") matter as much as accuracy.</li>
        </ul>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="flex flex-col gap-3 text-[16px] leading-relaxed"><h2 className="text-2xl font-bold">{title}</h2>{children}</section>;
}
