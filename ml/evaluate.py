"""Score Sentinel on the held-out test set and write eval_results.json.

Systems compared:
  - fine-tuned : the AutoTrain model (pass --model)
  - keyword baseline : regex rules (baseline.py)
  - untrained base : the base model with a random classification head (chance level)

Usage: python ml/evaluate.py --model ./halo-sentinel --base answerdotai/ModernBERT-base
       python ml/evaluate.py --baseline-only
"""
import argparse
import csv
import json
import statistics
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import baseline  # noqa: E402

DATA = Path(__file__).resolve().parent / "data"
TEST_SETS = {"template": DATA / "out" / "test.csv", "handwritten": DATA / "handwritten_test.csv"}
LABELS = ["safe", "suspicious", "scam"]
HARD = {"convincing_excuse": "Scam with a convincing excuse", "prompt_injection_vs_halo": "Caller tries to instruct the AI", "incident_case": "2026 incident-style agent"}


def score(name, predict, rows):
    preds, lat = [], []
    for r in rows:
        t = time.perf_counter()
        preds.append(predict(r["text"]))
        lat.append((time.perf_counter() - t) * 1000)
    gold = [r["target"] for r in rows]
    acc = sum(p == g for p, g in zip(preds, gold)) / len(rows)
    f1s = []
    for lab in LABELS:
        tp = sum(p == lab and g == lab for p, g in zip(preds, gold))
        fp = sum(p == lab and g != lab for p, g in zip(preds, gold))
        fn = sum(p != lab and g == lab for p, g in zip(preds, gold))
        prec = tp / (tp + fp) if tp + fp else 0.0
        rec = tp / (tp + fn) if tp + fn else 0.0
        f1s.append(2 * prec * rec / (prec + rec) if prec + rec else 0.0)
    safe = [p for p, g in zip(preds, gold) if g == "safe"]
    scam = [p for p, g in zip(preds, gold) if g == "scam"]
    hard = {}
    for key, label in HARD.items():
        sub = [p for p, r in zip(preds, rows) if r["category"] == key]
        hard[label] = sum(p == "scam" for p in sub) / len(sub) if sub else None
    return {
        "system": name,
        "accuracy": round(acc, 4),
        "macro_f1": round(sum(f1s) / 3, 4),
        "false_alarm_rate": round(sum(p != "safe" for p in safe) / len(safe), 4) if safe else None,
        "missed_scam_rate": round(sum(p == "safe" for p in scam) / len(scam), 4) if scam else None,
        "latency_ms_p50": round(statistics.median(lat), 2),
        "hard_cases_caught": hard,
    }


def hf_predictor(path):
    from transformers import pipeline

    clf = pipeline("text-classification", model=path, device=-1, truncation=True, max_length=128)
    return lambda text: clf(text)[0]["label"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model")
    ap.add_argument("--base", default="answerdotai/ModernBERT-base")
    ap.add_argument("--baseline-only", action="store_true")
    ap.add_argument("--out", default=str(Path(__file__).resolve().parents[1] / "public" / "results" / "eval_results.json"))
    a = ap.parse_args()
    trained = bool(a.model and not a.baseline_only)
    systems = [("Keyword baseline", baseline.predict)]
    if trained:
        from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline

        tok = AutoTokenizer.from_pretrained(a.base)
        m = AutoModelForSequenceClassification.from_pretrained(a.base, num_labels=3, id2label=dict(enumerate(LABELS)), label2id={l: i for i, l in enumerate(LABELS)})
        base_clf = pipeline("text-classification", model=m, tokenizer=tok, device=-1, truncation=True, max_length=128)
        systems = [("Fine-tuned Sentinel", hf_predictor(a.model))] + systems + [("Untrained base model", lambda t: base_clf(t)[0]["label"])]
    test_sets = {}
    for name, path in TEST_SETS.items():
        rows = list(csv.DictReader(path.open()))
        test_sets[name] = {"lines": len(rows), "results": [score(sys_name, fn, rows) for sys_name, fn in systems]}
    out = {"generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "trained": trained, "test_sets": test_sets}
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(out, indent=2))
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
