// Keyword baseline (TypeScript port of ml/baseline.py). Used to tag tactics and requested items on
// each line, and as the fallback risk classifier until the fine-tuned model has loaded.
export type Tactic = "none" | "urgency" | "authority" | "fear" | "secrecy" | "isolation" | "impersonation";
export type Item = "none" | "one_time_code" | "pin" | "password" | "gift_card" | "crypto" | "wire_transfer" | "remote_access" | "personal_data";
export interface LineFlags { tactic: Tactic; item: Item; risk: "low" | "medium" | "high"; all_tactics: Tactic[]; all_items: Item[]; injection: boolean }

const ITEM_PATTERNS: [Item, RegExp][] = [
  ["one_time_code", /(one[- ]?time|verification|security|confirmation|6[- ]digit|six[- ]digit|login|text(ed)?) (pass)?code|\bOTP\b|code (we|i|that) (just )?(sent|texted)|read (me |back )?(the|that) code|the code on your (phone|screen)/i],
  ["pin", /\bPINs?\b|pin number/i],
  ["password", /password|passcode|login details|sign[- ]in details/i],
  ["gift_card", /gift ?cards?|itunes card|google play card|steam card|scratch (off )?the back|card numbers? on the back/i],
  ["crypto", /bitcoin|crypto|\bBTC\b|\bUSDT\b|wallet address|bitcoin atm|coin ?atm/i],
  ["wire_transfer", /\bwire\b|transfer (the |your |all )?(money|funds|savings|balance)|bank transfer|safe account|western union|moneygram|send (the )?money|bail money/i],
  ["remote_access", /anydesk|teamviewer|remote (access|desktop|support|control)|install (this|an|the|our) app|screen ?shar/i],
  ["personal_data", /social security|\bSSN\b|date of birth|birthday|mother'?s maiden|account number|card number|full address|home address|routing number|\bCVV\b|security question/i],
];
const TACTIC_PATTERNS: [Tactic, RegExp][] = [
  ["secrecy", /don'?t tell|do not tell|keep (this|it) (between us|secret|confidential|quiet|to yourself)|do not discuss|this is confidential|nobody can know|don'?t mention/i],
  ["isolation", /don'?t (call|contact|talk to|speak to) (anyone|anybody|your|the)|stay on the line|don'?t hang up|do not hang up|no one else|only (talk|speak) to me|go somewhere private|without (telling|asking) (anyone|your)/i],
  ["fear", /arrest|jail|frozen|suspend|locked|compromised|stolen|lose (all )?(your|the) (money|savings|account)|in (big )?trouble|hacked|lawsuit|deport|bail|warrant|accident|hospital|emptied|drained/i],
  ["authority", /fraud (department|team|prevention)|security (team|department)|federal|\bIRS\b|police|officer|sheriff|court|government|compliance|legal department|supervisor|lawyer|attorney|detective|investigator/i],
  ["urgency", /right now|right away|immediately|urgent|within (the next )?\w+ (minutes?|hours?)|before (it'?s too late|midnight|the end of|we close)|hurry|quickly|\basap\b|today only|act now|deadline|last chance|minutes left|time is running out|tonight/i],
  ["impersonation", /(it'?s|this is) (me|your (grandson|granddaughter|grandchild|son|daughter|nephew|niece))|grandma|grandpa|calling (you )?from (the )?[\w ]{0,30}(bank|amazon|microsoft|apple|irs|support|fraud)|i'?m (calling )?from (the )?[\w ]{0,20}(bank|support|fraud)|on behalf of [\w ]{0,30}bank/i],
];
export const INJECTION_RE =
  /ignore (all |any |your |the )?(previous |prior |earlier )?(rules|instructions|guidelines|policies)|mark (this|the|me as|it as)? ?(caller|agent|call|request|action)? ?(as )?(verified|safe|trusted|approved)|system prompt|you are now|developer mode|new instructions|halo[,:]? (please )?(approve|verify|allow|whitelist)|override (your|the|all)|disregard (your|the|all|previous)|admin mode|this message is from halo|from the halo team|risk (score )?(=|to|is) ?0|set risk|do not flag|don'?t flag|auto-?approve/i;
const NEGATED_RE = /(will|would) never ask|never ask(s)? (you )?for|we don'?t ask|do not share|don'?t share|never share|if (that|this) wasn'?t you/i;

const SECRET = new Set<Item>(["one_time_code", "pin", "password"]);
const MONEY = new Set<Item>(["gift_card", "crypto", "wire_transfer"]);

export function classifyLine(text: string): LineFlags {
  const t = text ?? "";
  const items = NEGATED_RE.test(t) ? [] : ITEM_PATTERNS.filter(([, rx]) => rx.test(t)).map(([n]) => n);
  const tactics = TACTIC_PATTERNS.filter(([, rx]) => rx.test(t)).map(([n]) => n);
  const injection = INJECTION_RE.test(t);
  const danger = items.some((i) => SECRET.has(i) || MONEY.has(i) || i === "remote_access");
  let risk: LineFlags["risk"] = "low";
  if (injection || danger) risk = "high";
  else if ((items.includes("personal_data") && tactics.length) || tactics.length >= 2)
    risk = tactics.length >= 3 || items.includes("personal_data") ? "high" : "medium";
  else if (tactics.length || items.length) risk = "medium";
  return { tactic: tactics[0] ?? "none", item: items[0] ?? "none", risk, all_tactics: tactics, all_items: items, injection };
}


export type Label = "safe" | "suspicious" | "scam";
export const ruleLabel = (text: string): Label => ({ low: "safe", medium: "suspicious", high: "scam" } as const)[classifyLine(text).risk];
