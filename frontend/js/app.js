const API_BASE =
  window.location.origin && window.location.origin.startsWith("http")
    ? window.location.origin
    : "http://localhost:8000";

const currencyConfigs = {
  usd: { locale: "en-US", currency: "USD", maximumFractionDigits: 2 },
  jpy: { locale: "ja-JP", currency: "JPY", maximumFractionDigits: 0 },
};
const currencyFormatters = {};

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("paramsForm");
  const status = document.getElementById("statusMessage");
  const todaySummaryEl = document.getElementById("todaySummary");
  const backtestSummaryEl = document.getElementById("backtestSummary");
  const valueChartCanvas = document.getElementById("valueChart");
  const multiplierChartCanvas = document.getElementById("multiplierChart");
  const currencySelect = document.getElementById("currencySelect");
  const baseAmountLabel = document.getElementById("baseAmountLabel");
  setupTabs();
  updateBaseAmountLabel(currencySelect?.value ?? "usd", baseAmountLabel);
  currencySelect?.addEventListener("change", () => {
    updateBaseAmountLabel(currencySelect.value, baseAmountLabel);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const params = readParams();
    status.textContent = "価格データを取得しています...";

    try {
      const apiResponse = await fetchPrices(params.asset, params.years, params.currency);
      status.textContent = `${apiResponse.prices.length} 件のデータを取得しました。`;
      const displayCurrency = apiResponse.currency ?? params.currency;
      params.currency = displayCurrency;
      updateBaseAmountLabel(displayCurrency, baseAmountLabel);
      const backtestResult = runBacktest(
        apiResponse.prices,
        params.baseAmount,
        params.lookback,
        params.threshold2,
        params.threshold3
      );
      updateTodaySummary(todaySummaryEl, apiResponse, backtestResult, params);
      updateBacktestSummary(backtestSummaryEl, backtestResult, params.currency);
      renderValueChart(
        valueChartCanvas,
        backtestResult.dates,
        backtestResult.baselineValues,
        backtestResult.strategyValues,
        backtestResult.priceSeries,
        params.currency
      );
      renderMultiplierChart(multiplierChartCanvas, backtestResult.dates, backtestResult.multipliers);
    } catch (error) {
      console.error(error);
      status.textContent = `エラー: ${error.message}`;
      todaySummaryEl.textContent = "エラーが発生しました。パラメータを確認してください。";
      backtestSummaryEl.textContent = "";
    }
  });
});

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  const panels = document.querySelectorAll(".tab-panel");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      buttons.forEach((b) => b.classList.toggle("active", b === btn));
      panels.forEach((panel) => panel.classList.toggle("active", panel.id === target));
    });
  });
}

function readParams() {
  return {
    asset: document.getElementById("assetSelect").value,
    baseAmount: Number(document.getElementById("baseAmount").value) || 0,
    lookback: Number(document.getElementById("lookback").value) || 0,
    threshold2: Number(document.getElementById("threshold2").value) || 0,
    threshold3: Number(document.getElementById("threshold3").value) || 0,
    years: Number(document.getElementById("years").value) || 1,
    currency: document.getElementById("currencySelect").value?.toLowerCase() || "usd",
  };
}

async function fetchPrices(asset, years, currency) {
  const params = new URLSearchParams({ years, currency: currency ?? "usd" });
  const response = await fetch(`${API_BASE}/api/prices/${asset}?${params}`);
  if (!response.ok) {
    throw new Error("価格データの取得に失敗しました。バックエンドが起動しているか確認してください。");
  }
  return response.json();
}

function updateTodaySummary(container, apiResponse, backtestResult, params) {
  const latestPoint = apiResponse.prices.at(-1);
  const latestMultiplier = backtestResult.multipliers.at(-1) ?? 1;
  if (!latestPoint) {
    container.textContent = "最新価格が取得できませんでした。";
    return;
  }
  const investedToday = params.baseAmount * latestMultiplier;
  const recentMetrics = computeRecentHighData(apiResponse.prices, params.lookback);
  const highLabel = recentMetrics?.highDate ? `<small>${recentMetrics.highDate}</small>` : "";
  const highValueFormatted = recentMetrics
    ? formatCurrency(recentMetrics.highValue, params.currency)
    : "データなし";
  const dropPctFormatted = recentMetrics
    ? percentFormatter.format(recentMetrics.dropPct)
    : "データなし";

  container.innerHTML = `
    <p>
      ${apiResponse.symbol} (${latestPoint.date}) の終値は<br />
      <strong>${formatCurrency(latestPoint.price, params.currency)}</strong> です。
    </p>
    <div class="summary-grid">
      <div>
        <span>推奨倍率</span>
        <strong>${latestMultiplier.toFixed(1)}x</strong>
      </div>
      <div>
        <span>本日投資額</span>
        <strong>${formatCurrency(investedToday, params.currency)}</strong>
      </div>
      <div>
        <span>ベース額</span>
        <strong>${formatCurrency(params.baseAmount, params.currency)}</strong>
      </div>
    </div>
    <div class="summary-grid">
      <div>
        <span>直近高値 ${highLabel}</span>
        <strong>${highValueFormatted}</strong>
      </div>
      <div>
        <span>下落率</span>
        <strong>${dropPctFormatted}</strong>
      </div>
    </div>
  `;
}

function updateBacktestSummary(container, backtestResult, currency) {
  const base = backtestResult.metrics.baseline;
  const strat = backtestResult.metrics.strategy;
  const stats = [
    {
      title: "ベースライン",
      finalValue: formatCurrency(base.finalValue, currency),
      invested: formatCurrency(base.totalInvested, currency),
      profit: formatCurrency(base.profit, currency),
      drawdown: percentFormatter.format(base.maxDrawdownPct / 100),
    },
    {
      title: "戦略",
      finalValue: formatCurrency(strat.finalValue, currency),
      invested: formatCurrency(strat.totalInvested, currency),
      profit: formatCurrency(strat.profit, currency),
      drawdown: percentFormatter.format(strat.maxDrawdownPct / 100),
    },
  ];

  container.innerHTML = `
    <div class="summary-grid">
      ${stats
        .map(
          (s) => `
        <div>
          <strong>${s.title}</strong>
          <span>最終評価額</span>${s.finalValue}
          <span>累計投資</span>${s.invested}
          <span>損益</span>${s.profit}
          <span>最大DD</span>${s.drawdown}
        </div>
      `
        )
      .join("")}
    </div>
  `;
}

function getCurrencyFormatter(currency) {
  const normalized = (currency || "usd").toLowerCase();
  if (!currencyFormatters[normalized]) {
    const config = currencyConfigs[normalized] ?? currencyConfigs.usd;
    currencyFormatters[normalized] = new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.currency,
      maximumFractionDigits: config.maximumFractionDigits,
    });
  }
  return currencyFormatters[normalized];
}

function formatCurrency(value, currency) {
  const numericValue = Number(value);
  const resolvedValue = Number.isFinite(numericValue) ? numericValue : 0;
  return getCurrencyFormatter(currency).format(resolvedValue);
}

const currencySymbols = { usd: "$", jpy: "¥" };
function updateBaseAmountLabel(currency, labelEl) {
  if (!labelEl) return;
  const symbol = currencySymbols[currency?.toLowerCase()] ?? currencySymbols.usd;
  labelEl.textContent = `ベース額 (${symbol})`;
}

function computeRecentHighData(prices, lookbackDays) {
  if (!Array.isArray(prices) || prices.length === 0) {
    return null;
  }
  const lookback = Math.max(1, Number(lookbackDays) || 1);
  const windowStart = Math.max(prices.length - lookback, 0);
  let highPoint = null;
  for (let i = windowStart; i < prices.length; i += 1) {
    const price = Number(prices[i]?.price);
    if (!Number.isFinite(price) || price <= 0) {
      continue;
    }
    if (!highPoint || price > highPoint.price) {
      highPoint = { price, date: prices[i].date };
    }
  }
  if (!highPoint) {
    return null;
  }
  const latestPrice = Number(prices.at(-1)?.price);
  const dropPct =
    Number.isFinite(latestPrice) && latestPrice >= 0
      ? Math.max(0, (highPoint.price - latestPrice) / highPoint.price)
      : 0;
  return {
    highValue: highPoint.price,
    highDate: highPoint.date,
    dropPct,
  };
}
