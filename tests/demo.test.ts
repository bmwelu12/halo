import { describe, expect, it } from "vitest";
import { callStatus } from "../src/lib/call";
import { ruleLabel } from "../src/lib/rules";
import { SCENARIOS } from "../src/lib/scenarios";

// With the keyword fallback (no model loaded), every scenario should still end in the right state.
const finalState = (id: string) => {
  const s = SCENARIOS.find((x) => x.id === id)!;
  const labels = s.lines.filter((l) => l.speaker !== "you").map((l) => ruleLabel(l.text));
  return callStatus(s.verified, s.caller, labels);
};

describe("demo scenarios (keyword fallback)", () => {
  it("real bank call stays green", () => expect(finalState("real-bank").state).toBe("verified"));
  it.each(["fake-bank", "slow-burn", "grandson", "injection"])("%s ends red", (id) => {
    const st = finalState(id);
    expect(st.state).toBe("scam");
    expect(st.risk).toBeGreaterThanOrEqual(75);
  });
  it("coordinated-agent call: keyword rules only reach amber (known gap the model should close)", () => {
    expect(finalState("agent-swarm").state).toBe("caution");
  });
  it("slow-burn starts safe before turning", () => {
    const s = SCENARIOS.find((x) => x.id === "slow-burn")!;
    expect(ruleLabel(s.lines[0].text)).toBe("safe");
  });
  it("a verified agent asking for a PIN is flagged", () => {
    expect(callStatus(true, "Northshore Bank", ["safe", "scam"]).label).toMatch(/breaking its rules/);
  });
});
