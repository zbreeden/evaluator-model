// Minimal UI logic: fetch JSON, render KPIs, render rules table, and simple bar "chart".

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return await res.json();
}

function pct(x, digits = 1) {
  return (x * 100).toFixed(digits) + "%";
}

function renderKPIs(kpi) {
  const grid = document.getElementById("kpi-grid");
  grid.innerHTML = "";
  const items = [
    { label: "Transactions", value: kpi.total_transactions.toLocaleString() },
    { label: "Support ≥", value: pct(kpi.support_threshold, 1) },
    { label: "Confidence ≥", value: pct(kpi.confidence_threshold, 1) },
    { label: "Oil rate", value: pct(kpi.oil_rate, 1) },
    { label: "Milk rate", value: pct(kpi.milk_rate, 1) },
    { label: "Bread rate", value: pct(kpi.bread_rate, 1) },
  ];

  for (const {label, value} of items) {
    const card = document.createElement("div");
    card.className = "kpi";
    card.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`;
    grid.appendChild(card);
  }
}

function renderRulesTable(rules) {
  const tbody = document.querySelector("#rules-table tbody");
  tbody.innerHTML = "";
  rules.forEach((r, idx) => {
    const tr = document.createElement("tr");
    const row = [
      idx + 1,
      r.antecedent.join(", "),
      r.consequent.join(", "),
      r.support.toFixed(3),
      r.confidence.toFixed(3),
      r.lift.toFixed(3),
    ];
    row.forEach(val => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function renderBars(kpi) {
  const bars = document.getElementById("bars");
  bars.innerHTML = "";
  const items = [
    ["Oil", kpi.oil_rate],
    ["Milk", kpi.milk_rate],
    ["Bread", kpi.bread_rate],
  ];
  items.forEach(([label, rate]) => {
    const wrap = document.createElement("div");
    wrap.className = "bar";
    const fill = document.createElement("div");
    fill.className = "fill";
    fill.style.height = Math.round(rate * 100) + "%";
    const caption = document.createElement("div");
    caption.className = "caption";
    caption.textContent = `${label} (${pct(rate)})`;
    wrap.appendChild(fill);
    wrap.appendChild(caption);
    bars.appendChild(wrap);
  });
}

function computeROI({rule, captureRate, avgBasket, marginPerUnit, traffic}) {
  // rule has: support, confidence, lift
  // Simple incremental-units proxy from lift:
  const baselineProbB = rule.support / (rule.confidence || 1e-9); // ≈ P(B)
  const incrementalProb = Math.max(rule.lift - 1, 0) * baselineProbB; // extra P(B) due to A
  const realizedProb = incrementalProb * (captureRate / 100);
  const incrUnits = realizedProb * traffic; // ~ extra units of B
  const incrGrossMargin = incrUnits * marginPerUnit;
  // If you later price-promo, subtract promo cost here.
  return { incrUnits, incrGrossMargin };
}

async function bootROI(rules, kpi){
  // pick the top rule (already sorted by lift in your table)
  const rule = rules[0] || {support:0, confidence:0, lift:1};
  const capture = document.getElementById('capture');
  const captureVal = document.getElementById('captureVal');
  const out = document.getElementById('roi-out');

  // crude defaults; replace with data-backed values from your pipeline
  const avgBasket = 1;              // baskets counted in kpi.total_transactions
  const marginPerUnit = 1.25;       // $
  const traffic = kpi.total_transactions * avgBasket;

  function refresh(){
    captureVal.textContent = capture.value + "%";
    const { incrUnits, incrGrossMargin } =
      computeROI({ rule, captureRate: +capture.value, avgBasket, marginPerUnit, traffic });
    out.textContent = `Top rule lift=${rule.lift.toFixed(2)} → +${Math.round(incrUnits)} units, ~$${incrGrossMargin.toFixed(0)} gross margin`;
  }
  capture.addEventListener('input', refresh);
  refresh();
}

document.getElementById("metricsBtn").addEventListener("click", () => {
  document.getElementById("metricsModal").classList.remove("hidden");
});
document.getElementById("closeMetrics").addEventListener("click", () => {
  document.getElementById("metricsModal").classList.add("hidden");
});


async function boot() {
  let kpi = null, rules = null;

  try {
    kpi = await loadJSON("./summary.json");
    renderKPIs(kpi);
    renderBars(kpi);
  } catch (e) {
    console.error(e);
    document.getElementById("kpis").insertAdjacentHTML(
      "beforeend",
      `<p style="color:#f99">Load summary.json failed. Run shelf_op.py first.</p>`
    );
  }

  try {
    rules = await loadJSON("./rules.json");
    renderRulesTable(rules);
  } catch (e) {
    console.error(e);
    document.getElementById("rules").insertAdjacentHTML(
      "beforeend",
      `<p style="color:#f99">Load rules.json failed. Run shelf_op.py first.</p>`
    );
  }

  // Only boot ROI if the ROI section exists on the page
  if (document.getElementById('roi') && kpi && rules) {
    bootROI(rules, kpi);
  }
}

boot();
