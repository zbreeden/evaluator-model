# Eye-Level Economics — Quantifying the Shelf Advantage

**Purpose**  
This project examines how product placement on retail shelves influences sales performance.  
Using the Kaggle **Store Shelf Optimization** dataset, the goal is to quantify *sales lift* by shelf tier — eye-level, mid, or lower — and to visualize how placement interacts with price, promotion, and category.  
The focus is to show how data turns an old merchandising instinct (“eye-level sells”) into measurable ROI.

---

## 1. Executive Overview

Shelf space is finite and political. Every inch of it represents negotiation between visibility and profit.  
This analysis asks: *How much is eye-level placement really worth?*  
By combining regression modeling and interactive simulation, the project quantifies the incremental sales value of premium shelf positioning across categories.

Deliverables include:

- Python data prep and modeling pipeline  
- Power BI dashboard with what-if simulations and ROI visuals  
- One-page executive brief translating results into merchandising strategy  

---

## 2. Business Context & Data

Retailers and manufacturers both chase the “shelf sweet spot.”  
But shelf placement data often lives in anecdotes — this model provides evidence.  

**Data Source:**  
[Kaggle: Store Shelf Optimization](https://www.kaggle.com/datasets/ashydv/store-shelf-optimization)  
This dataset contains shelf-level product details across multiple categories, with variables such as:

- `product_category`, `shelf_level`, `price`, `promotions`, `sales_volume`  

**Derived Features:**

- `revenue_per_linear_foot`  
- `sales_per_facing`  
- Encoded shelf tiers (`eye`, `mid`, `lower`)  

The data structure mimics a retail planogram: each product tied to a shelf position, allowing analysis by category and shelf tier.

**Dataset Size & Synthesis Note:**  
The base dataset includes roughly 700 rows, which limits statistical depth for association and regression modeling.  
To better demonstrate shelf-relationship patterns, a *synthetic dataset generator* was added.  
It uses probabilistic sampling and controlled correlation between items (e.g., Oil ↔ Bread co-purchase patterns) to create larger, reproducible datasets for exploration.  
This ensures model outputs are rich enough to support storytelling without relying on unavailable proprietary data.

---

## 3. Analytical Approach

### Phase 1 — Data Structuring

- Clean categorical values and normalize shelf-tier labels  
- Encode shelf tiers numerically for regression modeling  
- Create calculated features for ROI per linear foot and per facing  

### Phase 2 — Exploratory Analysis

- Compare average sales and revenue distributions across shelf levels  
- Visualize lift by category and price band  

### Phase 3 — Modeling

- Apply regression to estimate the impact of shelf tier while controlling for price and promotion  
- Simulate “tier swaps” to predict expected changes in sales and ROI when moving a product’s placement  
- Summarize insights by product category  

---

## 4. Dashboard & Visualization

The Power BI dashboard serves as a decision lab rather than a static report.

**Pages:**

- **Overview:** KPIs for sales lift and ROI per tier  
- **Category Drill-Down:** Interactive visualizations by shelf level, category, and promotion  
- **Simulation:** A what-if slider that models revenue outcomes for hypothetical placement changes  

The design mirrors the *Protector* dashboard — approachable, story-first, and decision-ready.

---

## 5. Expected Outcomes

- Eye-level placement yields measurable lift, especially for impulse categories (snacks, beverages)  
- Mid- and lower-shelf items perform better when paired with strong promotions  
- Regression coefficients quantify placement elasticity — the ROI of moving one product up or down a tier  

Deliverables blend technical analysis with visual storytelling, helping non-technical audiences grasp both the *numbers* and their *meaning*.

---

## 6. Reflective Narrative — From Intuition to Evidence

Retailers often rely on “gut feel” to make shelf decisions.  
I wanted to see what happens when intuition meets data — not to replace it, but to ground it.  
My process:

1. Translate business intuition into measurable variables  
2. Visualize patterns until trends become obvious  
3. Frame the results in plain language so that data becomes negotiation leverage  

The goal is clarity, not cleverness — to show how structure and storytelling can turn shelf data into strategy.

---

## 7. Artifacts

- `shelf_optimization.ipynb` — Python notebook for cleaning, feature engineering, and modeling  
- `shelf_dashboard.pbix` — Power BI report visualizing shelf-tier performance and what-if simulations  
- `shelf_data_manifest.csv` — overview of dataset source, derived fields, and variable lineage  
- `executive_brief.pdf` — concise narrative linking analysis to retail merchandising strategy  
- `shelf_data_synth.py` — generator script to produce synthetic transactions for demo or teaching scenarios  

---

## 8. Reproducibility & Ethics

- Uses open, anonymized Kaggle data; no proprietary retail data included  
- Random seeds ensure repeatable results for demonstrations  
- Synthetic data generation preserves structure and behavior without exposing sensitive information  
- Visuals and metrics designed to educate — not to model or disclose real retailer performance  

---

## Appendix A — Synthetic Data Generator

The following script expands the base dataset by generating additional synthetic transactions.  
It introduces light item-to-item correlation to simulate real-world co-purchasing patterns and stabilize rule-based models.

```python
import pandas as pd
import numpy as np

# Adjustable parameters
n = 5000              # Number of synthetic transactions
seed = 42             # For reproducibility
np.random.seed(seed)

# Simulate purchase patterns
oil = np.random.binomial(1, 0.4, n)
milk = np.random.binomial(1, 0.5, n)
# Bread is partly dependent on Oil purchases
bread = (oil & (np.random.rand(n) < 0.6)) | (np.random.rand(n) < 0.2)

# Build the dataset
df = pd.DataFrame({
    "transactionID": range(1, n + 1),
    "OilPurchased": oil,
    "MilkPurchased": milk,
    "BreadPurchased": bread.astype(int)
})

# Save to the expected evaluator-model location
df.to_csv("data/external/storeshelfoptimization_synth.csv", index=False)

print("Synthetic dataset created at data/external/storeshelfoptimization_synth.csv")
