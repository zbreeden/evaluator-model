# Evaluator — Store Shelf Optimization (Demo)

**Pattern:** question → data → model → visuals/storytelling

This repo mirrors your *Protector* cadence with a tiny, dependency-light pipeline and a minimal UI for demos.

---

## Run the pipeline

1) Place your CSV at:
```
evaluator-model/data/external/storeshelfoptimization.csv
```

Expected columns:
- `transactionID`, `OilPurchased`, `MilkPurchased`, `BreadPurchased` (boolean or 0/1)

2) Execute:
```
python shelf_op.py
```

This writes:
- `summary.json` — KPIs for the UI
- `rules.json` — association-style rules with support / confidence / lift

---

## View the UI

Open `model.html` in a browser (same folder). It reads the JSON outputs and renders KPIs, a rules table, and simple bars.

---

## Tuning

Thresholds live in `shelf_op.py`:
```python
min_support = 0.05
min_confidence = 0.3
```
If no rules are found, lower them. If too many, raise them.

---

## Notes

- The pipeline is intentionally portable: no external libraries required.
- For larger item universes, you can swap `_gen_rules` with Apriori/FP-Growth code and keep the same JSON outputs for the UI.
- Keep additional UI variations as sibling HTML files if needed; all can consume the same JSON in the project root.
