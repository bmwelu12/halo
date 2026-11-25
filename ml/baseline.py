"""Keyword baseline: hand-written regex rules. The fine-tuned model has to beat this."""
import re

I = re.IGNORECASE
SECRET_ITEMS = {"one_time_code", "pin", "password"}
MONEY_ITEMS = {"gift_card", "crypto", "wire_transfer"}

ITEM_PATTERNS = [
    ("one_time_code", re.compile(r"(one[- ]?time|verification|security|confirmation|6[- ]digit|six[- ]digit|login|text(ed)?) (pass)?code|\bOTP\b|code (we|i|that) (just )?(sent|texted)|read (me |back )?(the|that) code|the code on your (phone|screen)", I)),
    ("pin", re.compile(r"\bPINs?\b|pin number", I)),
    ("password", re.compile(r"password|passcode|login details|sign[- ]in details", I)),
    ("gift_card", re.compile(r"gift ?cards?|itunes card|google play card|steam card|scratch (off )?the back|card numbers? on the back", I)),
    ("crypto", re.compile(r"bitcoin|crypto|\bBTC\b|\bUSDT\b|wallet address|bitcoin atm|coin ?atm", I)),
    ("wire_transfer", re.compile(r"\bwire\b|transfer (the |your |all )?(money|funds|savings|balance)|bank transfer|safe account|western union|moneygram|send (the )?money|bail money", I)),
    ("remote_access", re.compile(r"anydesk|teamviewer|remote (access|desktop|support|control)|install (this|an|the|our) app|screen ?shar", I)),
    ("personal_data", re.compile(r"social security|\bSSN\b|date of birth|birthday|mother'?s maiden|account number|card number|full address|home address|routing number|\bCVV\b|security question", I)),
]

TACTIC_PATTERNS = [
    ("secrecy", re.compile(r"don'?t tell|do not tell|keep (this|it) (between us|secret|confidential|quiet|to yourself)|do not discuss|this is confidential|nobody can know|don'?t mention", I)),
    ("isolation", re.compile(r"don'?t (call|contact|talk to|speak to) (anyone|anybody|your|the)|stay on the line|don'?t hang up|do not hang up|no one else|only (talk|speak) to me|go somewhere private|without (telling|asking) (anyone|your)", I)),
    ("fear", re.compile(r"arrest|jail|frozen|suspend|locked|compromised|stolen|lose (all )?(your|the) (money|savings|account)|in (big )?trouble|hacked|lawsuit|deport|bail|warrant|accident|hospital|emptied|drained", I)),
    ("authority", re.compile(r"fraud (department|team|prevention)|security (team|department)|federal|\bIRS\b|police|officer|sheriff|court|government|compliance|legal department|supervisor|lawyer|attorney|detective|investigator", I)),
    ("urgency", re.compile(r"right now|right away|immediately|urgent|within (the next )?\w+ (minutes?|hours?)|before (it'?s too late|midnight|the end of|we close)|hurry|quickly|\basap\b|today only|act now|deadline|last chance|minutes left|time is running out|tonight", I)),
    ("impersonation", re.compile(r"(it'?s|this is) (me|your (grandson|granddaughter|grandchild|son|daughter|nephew|niece))|grandma|grandpa|calling (you )?from (the )?[\w ]{0,30}(bank|amazon|microsoft|apple|irs|support|fraud)|i'?m (calling )?from (the )?[\w ]{0,20}(bank|support|fraud)|on behalf of [\w ]{0,30}bank", I)),
]

INJECTION_RE = re.compile(
    r"ignore (all |any |your |the )?(previous |prior |earlier )?(rules|instructions|guidelines|policies)"
    r"|mark (this|the|me as|it as)? ?(caller|agent|call|request|action)? ?(as )?(verified|safe|trusted|approved)"
    r"|system prompt|you are now|developer mode|new instructions|halo[,:]? (please )?(approve|verify|allow|whitelist)"
    r"|override (your|the|all)|disregard (your|the|all|previous)|admin mode|this message is from halo|from the halo team"
    r"|risk (score )?(=|to|is) ?0|set risk|do not flag|don'?t flag|auto-?approve",
    I,
)

PRESSURE_RE = re.compile(r"no matter what|whatever it takes|at any cost|by any means|don'?t take no|do anything|whatever you have to", I)
IMPOSSIBLE_RE = re.compile(r"guarantee(d)? (a )?(full )?(refund|win|approval)|100% (refund|guaranteed)|even if (they|it) (say|says) no|make them", I)

RISK_SCORE = {"low": 10, "medium": 45, "high": 85}


def _matches(patterns, text):
    return [name for name, rx in patterns if rx.search(text or "")]


NEGATED_RE = re.compile(r"(will|would) never ask|never ask(s)? (you )?for|we don'?t ask|do not share|don'?t share|never share|if (that|this) wasn'?t you", I)


def classify_line(text: str) -> dict:
    """Sentinel-Fast-shaped output for one line."""
    items = [] if NEGATED_RE.search(text or "") else _matches(ITEM_PATTERNS, text)
    tactics = _matches(TACTIC_PATTERNS, text)
    injection = bool(INJECTION_RE.search(text or ""))
    item = items[0] if items else "none"
    tactic = tactics[0] if tactics else "none"
    if injection or set(items) & (SECRET_ITEMS | MONEY_ITEMS | {"remote_access"}):
        risk = "high"
    elif ("personal_data" in items and tactics) or len(tactics) >= 2:
        risk = "high" if len(tactics) >= 3 or "personal_data" in items else "medium"
    elif tactics or items:
        risk = "medium"
    else:
        risk = "low"
    return {
        "tactic": tactic,
        "item": item,
        "risk": risk,
        "all_tactics": tactics,
        "all_items": items,
        "injection": injection,
        "scores": {"tactic": 0.9 if tactics else 0.6, "item": 0.9 if items else 0.6, "risk": 0.8},
    }


LABEL = {"low": "safe", "medium": "suspicious", "high": "scam"}


def predict(text: str) -> str:
    return LABEL[classify_line(text)["risk"]]
