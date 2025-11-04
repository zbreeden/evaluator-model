"""
Shelf Optimization Pipeline (Evaluator / The Evaluator)

Pattern: question -> data -> model -> visuals/storytelling
Input: evaluator-model/data/external/storeshelfoptimization_synth.csv
Expected columns: transactionID, OilPurchased, MilkPurchased, BreadPurchased (booleans/0-1)

Outputs (for UI to consume), written to evaluator-model/ :
- summary.json : high-level KPIs and counts
- rules.json   : association-like rules with support/ confidence/ lift

Run:
    python shelf_op.py

Notes:
- Designed to mirror The Protector's structure: clarity-first, reproducible, and demo-friendly.
- No external packages required. Keeps things portable for Parallels.
"""

import json
import os
from dataclasses import dataclass, asdict
from typing import List, Dict, Tuple

import pandas as pd
import numpy as np

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(PROJECT_ROOT, "data", "external", "storeshelfoptimization_synth.csv")
SUMMARY_OUT = os.path.join(PROJECT_ROOT, "summary.json")
RULES_OUT = os.path.join(PROJECT_ROOT, "rules.json")
SEED = 42


# -----------------------------
# Question Development
# -----------------------------
# Core business question:
# "What product placements (pairings or bundles) meaningfully co-occur in baskets,
#  and how could that inform shelf adjacency or promotions?"
#
# For this toy dataset (3 binary items), we approximate 'shelf optimization' by
# surfacing high-confidence associations among Oil, Milk, Bread.
# The same pattern scales to more items with Apriori/FP-Growth if needed.


@dataclass
class KPI:
    total_transactions: int
    support_threshold: float
    confidence_threshold: float
    oil_rate: float
    milk_rate: float
    bread_rate: float


@dataclass
class Rule:
    antecedent: List[str]
    consequent: List[str]
    support: float
    confidence: float
    lift: float


def _clean_frame(df: pd.DataFrame) -> pd.DataFrame:
    # Normalize expected columns and coerce to {0,1}
    expected = ["transactionID", "OilPurchased", "MilkPurchased", "BreadPurchased"]
    missing = [c for c in expected if c not in df.columns]
    if missing:
        raise ValueError(f"Missing expected columns: {missing}")

    for c in ["OilPurchased", "MilkPurchased", "BreadPurchased"]:
        df[c] = df[c].astype(str).str.strip().str.lower().replace(
            {"true": "1", "false": "0", "yes": "1", "no": "0"}
        )
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0).astype(int).clip(0, 1)

    # Drop exact duplicate transactionIDs if present; keep first
    df = df.sort_values("transactionID").drop_duplicates(subset=["transactionID"], keep="first")
    return df.reset_index(drop=True)


def _support(series: pd.Series) -> float:
    return series.mean() if len(series) else 0.0


def _pair_support(df: pd.DataFrame, a: str, b: str) -> float:
    return (df[a].eq(1) & df[b].eq(1)).mean()


def _triple_support(df: pd.DataFrame, a: str, b: str, c: str) -> float:
    return (df[a].eq(1) & df[b].eq(1) & df[c].eq(1)).mean()


def _confidence(sup_ab: float, sup_a: float) -> float:
    if sup_a == 0:
        return 0.0
    return sup_ab / sup_a


def _lift(conf_ab: float, sup_b: float) -> float:
    if sup_b == 0:
        return 0.0
    return conf_ab / sup_b


def _gen_rules(df: pd.DataFrame,
               items: List[str],
               min_support: float = 0.01,
               min_confidence: float = 0.1) -> List[Rule]:
    # Enumerate pair rules A -> B, B -> A and triple rules {A,B} -> C
    rules: List[Rule] = []

    # Precompute single supports
    s = {i: _support(df[i].eq(1)) for i in items}

    # Pairs
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            a, b = items[i], items[j]
            sup_ab = _pair_support(df, a, b)
            if sup_ab >= min_support:
                # A -> B
                conf_ab = _confidence(sup_ab, s[a])
                lift_ab = _lift(conf_ab, s[b])
                if conf_ab >= min_confidence:
                    rules.append(Rule([a], [b], sup_ab, conf_ab, lift_ab))
                # B -> A
                conf_ba = _confidence(sup_ab, s[b])
                lift_ba = _lift(conf_ba, s[a])
                if conf_ba >= min_confidence:
                    rules.append(Rule([b], [a], sup_ab, conf_ba, lift_ba))

    # Triples
    if len(items) >= 3:
        a, b, c = items[0], items[1], items[2]
        sup_abc = _triple_support(df, a, b, c)
        if sup_abc >= min_support:
            # {A,B} -> C
            sup_ab = _pair_support(df, a, b)
            conf_abc = _confidence(sup_abc, sup_ab)
            lift_abc = _lift(conf_abc, s[c])
            if conf_abc >= min_confidence:
                rules.append(Rule([a, b], [c], sup_abc, conf_abc, lift_abc))

            # {A,C} -> B
            sup_ac = _pair_support(df, a, c)
            conf_acb = _confidence(sup_abc, sup_ac)
            lift_acb = _lift(conf_acb, s[b])
            if conf_acb >= min_confidence:
                rules.append(Rule([a, c], [b], sup_abc, conf_acb, lift_acb))

            # {B,C} -> A
            sup_bc = _pair_support(df, b, c)
            conf_bca = _confidence(sup_abc, sup_bc)
            lift_bca = _lift(conf_bca, s[a])
            if conf_bca >= min_confidence:
                rules.append(Rule([b, c], [a], sup_abc, conf_bca, lift_bca))

    # Sort: primary by lift desc, then confidence desc, then support desc
    rules.sort(key=lambda r: (r.lift, r.confidence, r.support), reverse=True)
    return rules


def main():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(
            f"Input not found: {DATA_PATH}\n"
            "Place storeshelfoptimization_synth.csv in evaluator-model/data/external and re-run."
        )

    df = pd.read_csv(DATA_PATH)
    df = _clean_frame(df)

    items = ["OilPurchased", "MilkPurchased", "BreadPurchased"]

    # Simple EDA metrics
    oil_rate = _support(df["OilPurchased"].eq(1))
    milk_rate = _support(df["MilkPurchased"].eq(1))
    bread_rate = _support(df["BreadPurchased"].eq(1))

    # Reasonable demo defaults (tweak if dataset is very sparse/dense)
    min_support = 0.05
    min_confidence = 0.3

    rules = _gen_rules(df, items, min_support=min_support, min_confidence=min_confidence)

    kpi = KPI(
        total_transactions=len(df),
        support_threshold=min_support,
        confidence_threshold=min_confidence,
        oil_rate=round(oil_rate, 4),
        milk_rate=round(milk_rate, 4),
        bread_rate=round(bread_rate, 4),
    )

    # Write outputs
    with open(SUMMARY_OUT, "w", encoding="utf-8") as f:
        json.dump(asdict(kpi), f, indent=2)

    rules_payload = [asdict(r) for r in rules]
    for r in rules_payload:
        r["support"] = round(r["support"], 6)
        r["confidence"] = round(r["confidence"], 6)
        r["lift"] = round(r["lift"], 6)

    with open(RULES_OUT, "w", encoding="utf-8") as f:
        json.dump(rules_payload, f, indent=2)

    print(f"Wrote {SUMMARY_OUT} and {RULES_OUT}.")
    print(f"Rules found: {len(rules_payload)}")
    if len(rules_payload) == 0:
        print("No rules met thresholds. Try lowering support/confidence in shelf_op.py.")


if __name__ == "__main__":
    main()
