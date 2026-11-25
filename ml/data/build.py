"""Build Sentinel's dataset in the format Hugging Face AutoTrain expects for text classification.

Output: ml/data/out/{train,validation}.csv  (columns: text, target)
        ml/data/out/test.csv                (held out, never used for training)

Labels: safe / suspicious / scam. Every name, number and company is invented.
"""
import csv
import hashlib
import json
from pathlib import Path

from templates import lines

OUT = Path(__file__).resolve().parent / "out"
LABEL = {"low": "safe", "medium": "suspicious", "high": "scam"}


def split_of(text: str) -> str:
    h = int(hashlib.sha256(text.strip().lower().encode()).hexdigest()[:8], 16) % 100
    return "test" if h < 15 else "validation" if h < 25 else "train"


def build(n: int = 20000) -> dict:
    seen, splits = set(), {"train": [], "validation": [], "test": []}
    for r in lines(n):
        key = r["text"].strip().lower()
        if key in seen:
            continue
        seen.add(key)
        splits[split_of(r["text"])].append({"text": r["text"], "target": LABEL[r["risk"]], "category": r["category"]})
    OUT.mkdir(exist_ok=True)
    for name, rows in splits.items():
        cols = ["text", "target"] + (["category"] if name == "test" else [])
        with (OUT / f"{name}.csv").open("w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore", quoting=csv.QUOTE_ALL)
            w.writeheader()
            w.writerows(rows)
    stats = {k: len(v) for k, v in splits.items()}
    stats["labels"] = {lab: sum(r["target"] == lab for r in splits["train"]) for lab in LABEL.values()}
    (OUT / "stats.json").write_text(json.dumps(stats, indent=2))
    return stats


if __name__ == "__main__":
    print(json.dumps(build(), indent=2))
