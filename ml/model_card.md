---
license: apache-2.0
base_model: answerdotai/ModernBERT-base
pipeline_tag: text-classification
library_name: transformers.js
tags: [autotrain, scam-detection, safety, onnx]
---
# Halo Sentinel

Labels one line of a phone call as **safe**, **suspicious** or **scam**. Part of [Halo](https://github.com/bmwelu12/halo), a portfolio project.

- **Base model:** answerdotai/ModernBERT-base (Apache-2.0)
- **Training:** Hugging Face AutoTrain text classification, default settings (see `training_params.json`)
- **Data:** ~6,000 invented call lines built from labeled templates. No real people or calls.
- **Evaluation:** `eval_results.json`, on a held-out template set and a small hand-written set with new phrasing, compared with a keyword baseline and the untrained base model.
- **Use in the browser:** `pipeline("text-classification", "bmwelu123/halo-sentinel")` with transformers.js (ONNX files in `onnx/`).

**Limits:** trained on template data with limited phrasing; judges single lines, not whole calls; English only; a demo, not a production safety system.
