const API_BASE =
  window.location.origin && window.location.origin.startsWith("http")
    ? window.location.origin
    : "http://localhost:8000";

const i18n = {
  en: {
    subtitle: "Dip-signal DCA dashboard",
    form: {
      language: "Language",
      asset: "Asset",
      currency: "Display currency",
      baseAmount: (symbol) => `Base amount (${symbol})`,
      lookback: "L (days)",
      threshold2: "th2 (%)",
      threshold3: "th3 (%)",
      years: "Years",
      submit: "Fetch data & analyze",
    },
    assets: {
      reit: "REIT (REET)",
      gold: "GOLD (GLD)",
      btc: "BTC (BTC-USD)",
    },
    currencies: {
      usd: "US Dollar (USD)",
      jpy: "Japanese Yen (JPY)",
    },
    tabs: {
      today: "Today's suggestion",
      backtest: "Backtest",
    },
    placeholders: {
      today: "Results will appear after submitting.",
      backtest: "Backtest results will show here.",
    },
    status: {
      fetching: "Fetching price data...",
      fetched: (count) => `Fetched ${count} data points.`,
      errorPrefix: "Error: ",
    },
    errors: {
      insufficientData: "Not enough price data.",
      todayLatestMissing: "Could not retrieve latest price.",
      todayGeneric: "An error occurred. Please check the parameters.",
      fetchFailed: "Failed to fetch price data. Please check if the backend is running.",
    },
    today: {
      closingPrice: (symbol, date, price) =>
        `Closing price for ${symbol} (${date}) is<br /><strong>${price}</strong>.`,
      recommendedMultiple: "Recommended multiple",
      todayInvestment: "Today's investment",
      baseAmount: "Base amount",
      recentHigh: "Recent high",
      dropRate: "Drawdown",
      noData: "No data",
    },
    metrics: {
      indicator: "Metric",
      baseline: "Baseline",
      strategy: "Strategy",
      finalValue: "Final value",
      invested: "Total invested",
      profitDrawdown: "Profit / Drawdown",
      profitability: "Profitability",
      cumulativeReturn: "Cumulative return",
      returnMultiple: "Return multiple",
      annualizedReturn: "Annualized return",
      duration: "Duration",
      maxDD: "Max DD",
      years: "yrs",
    },
    charts: {
      baseline: "Baseline",
      strategy: "Strategy",
      price: "Price",
      multiplier: "Multiplier",
    },
  },
  ja: {
    subtitle: "下落シグナル付DCAアプリ",
    form: {
      language: "言語",
      asset: "資産",
      currency: "表示通貨",
      baseAmount: (symbol) => `ベース額 (${symbol})`,
      lookback: "L (日数)",
      threshold2: "th2 (%)",
      threshold3: "th3 (%)",
      years: "期間 (年)",
      submit: "データ取得 & 解析",
    },
    assets: {
      reit: "REIT (REET)",
      gold: "GOLD (GLD)",
      btc: "BTC (BTC-USD)",
    },
    currencies: {
      usd: "米ドル (USD)",
      jpy: "日本円 (JPY)",
    },
    tabs: {
      today: "今日の推奨",
      backtest: "バックテスト",
    },
    placeholders: {
      today: "フォーム送信後に結果が表示されます。",
      backtest: "バックテスト結果はここに表示されます。",
    },
    status: {
      fetching: "価格データを取得しています...",
      fetched: (count) => `${count} 件のデータを取得しました。`,
      errorPrefix: "エラー: ",
    },
    errors: {
      insufficientData: "価格データが不足しています。",
      todayLatestMissing: "最新価格が取得できませんでした。",
      todayGeneric: "エラーが発生しました。パラメータを確認してください。",
      fetchFailed: "価格データの取得に失敗しました。バックエンドが起動しているか確認してください。",
    },
    today: {
      closingPrice: (symbol, date, price) =>
        `${symbol} (${date}) の終値は<br /><strong>${price}</strong> です。`,
      recommendedMultiple: "推奨倍率",
      todayInvestment: "本日投資額",
      baseAmount: "ベース額",
      recentHigh: "直近高値",
      dropRate: "下落率",
      noData: "データなし",
    },
    metrics: {
      indicator: "指標",
      baseline: "ベースライン",
      strategy: "戦略",
      finalValue: "最終評価額",
      invested: "累計投資",
      profitDrawdown: "損益・ドローダウン",
      profitability: "収益性",
      cumulativeReturn: "累計収益率",
      returnMultiple: "リターン倍率",
      annualizedReturn: "年率",
      duration: "期間",
      maxDD: "最大DD",
      years: "年",
    },
    charts: {
      baseline: "ベースライン",
      strategy: "戦略",
      price: "価格",
      multiplier: "倍率",
    },
  },
};

function getDict() {
  return i18n[currentLanguage] || i18n.en;
}

const currencyConfigs = {
  usd: { locale: "en-US", currency: "USD", maximumFractionDigits: 2 },
  jpy: { locale: "ja-JP", currency: "JPY", maximumFractionDigits: 0 },
};
const currencyFormatters = {};
const percentFormatters = {};

const currencySymbols = { usd: "$", jpy: "¥" };

let currentLanguage = "en";
let lastApiResponse = null;
let lastBacktestResult = null;
let lastParams = null;
let lastStatusState = { type: "idle" };

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("paramsForm");
  const status = document.getElementById("statusMessage");
  const todaySummaryEl = document.getElementById("todaySummary");
  const backtestSummaryEl = document.getElementById("backtestSummary");
  const valueChartCanvas = document.getElementById("valueChart");
  const multiplierChartCanvas = document.getElementById("multiplierChart");
  const currencySelect = document.getElementById("currencySelect");
  const baseAmountLabel = document.getElementById("baseAmountLabel");
  const languageLinks = Array.from(document.querySelectorAll(".language-link"));

  setLanguage(currentLanguage, {
    todaySummaryEl,
    backtestSummaryEl,
    baseAmountLabel,
    currencySelect,
    statusEl: status,
    languageLinks,
    valueChartCanvas,
    multiplierChartCanvas,
  });

  setupTabs();

  updateBaseAmountLabel(currencySelect?.value ?? "usd", baseAmountLabel);
  applyPlaceholders(todaySummaryEl, backtestSummaryEl);

  currencySelect?.addEventListener("change", () => {
    updateBaseAmountLabel(currencySelect.value, baseAmountLabel);
  });

  languageLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const lang = link.dataset.lang;
      if (!lang || lang === currentLanguage) return;
      handleLanguageChange(lang, {
        todaySummaryEl,
        backtestSummaryEl,
        baseAmountLabel,
        currencySelect,
        statusEl: status,
        valueChartCanvas,
        multiplierChartCanvas,
        languageLinks,
      });
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const params = readParams();
    lastStatusState = { type: "fetching" };
    setStatusMessage(status, lastStatusState);

    try {
      const dict = getDict();
      const apiResponse = await fetchPrices(params.asset, params.years, params.currency);
      lastStatusState = { type: "fetched", count: apiResponse.prices.length };
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
      lastApiResponse = apiResponse;
      lastBacktestResult = backtestResult;
      lastParams = { ...params };
      setStatusMessage(status, lastStatusState);
      updateTodaySummary(todaySummaryEl, apiResponse, backtestResult, params);
      updateBacktestSummary(backtestSummaryEl, backtestResult, params.currency);
      renderValueChart(
        valueChartCanvas,
        backtestResult.dates,
        backtestResult.baselineValues,
        backtestResult.strategyValues,
        backtestResult.priceSeries,
        params.currency,
        dict.charts
      );
      renderMultiplierChart(
        multiplierChartCanvas,
        backtestResult.dates,
        backtestResult.multipliers,
        dict.charts
      );
    } catch (error) {
      console.error(error);
      lastStatusState = buildErrorStatus(error);
      setStatusMessage(status, lastStatusState);
      todaySummaryEl.textContent = translateErrorMessage(lastStatusState);
      backtestSummaryEl.textContent = "";
    }
  });
});

function setLanguage(language, refs = {}) {
  currentLanguage = i18n[language] ? language : "en";
  document.documentElement.lang = currentLanguage === "ja" ? "ja" : "en";
  applyLanguageToStaticUi();
  setStatusMessage(refs.statusEl, lastStatusState);
  if (refs.currencySelect && refs.baseAmountLabel) {
    updateBaseAmountLabel(refs.currencySelect.value, refs.baseAmountLabel);
  }
  if (!lastApiResponse || !lastBacktestResult || !lastParams) {
    applyPlaceholders(refs.todaySummaryEl, refs.backtestSummaryEl);
  }
  syncLanguageLinks(refs.languageLinks);
}

function handleLanguageChange(language, refs) {
  setLanguage(language, refs);
  rerenderSummaries({
    todaySummaryEl: refs.todaySummaryEl,
    backtestSummaryEl: refs.backtestSummaryEl,
    valueChartCanvas: refs.valueChartCanvas,
    multiplierChartCanvas: refs.multiplierChartCanvas,
  });
}

function syncLanguageLinks(languageLinks = []) {
  languageLinks.forEach((link) => {
    const isActive = link.dataset.lang === currentLanguage;
    link.classList.toggle("active", isActive);
  });
}

function applyLanguageToStaticUi() {
  const dict = getDict();
  setText("subtitle", dict.subtitle);
  setText("languageLabel", dict.form.language);
  setText("assetLabel", dict.form.asset);
  setText("currencyLabel", dict.form.currency);
  setText("lookbackLabel", dict.form.lookback);
  setText("threshold2Label", dict.form.threshold2);
  setText("threshold3Label", dict.form.threshold3);
  setText("yearsLabel", dict.form.years);
  setText("submitButton", dict.form.submit);
  setText("todayTabButton", dict.tabs.today);
  setText("backtestTabButton", dict.tabs.backtest);
  setOptionText("assetOptionReit", dict.assets.reit);
  setOptionText("assetOptionGold", dict.assets.gold);
  setOptionText("assetOptionBtc", dict.assets.btc);
  setOptionText("currencyOptionUsd", dict.currencies.usd);
  setOptionText("currencyOptionJpy", dict.currencies.jpy);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
  }
}

function setOptionText(id, text) {
  const option = document.getElementById(id);
  if (option) {
    option.textContent = text;
  }
}

function applyPlaceholders(todaySummaryEl, backtestSummaryEl) {
  if (!lastApiResponse || !lastBacktestResult) {
    const dict = getDict();
    if (todaySummaryEl) todaySummaryEl.textContent = dict.placeholders.today;
    if (backtestSummaryEl) backtestSummaryEl.textContent = dict.placeholders.backtest;
  }
}

function setStatusMessage(el, statusState) {
  if (!el) return;
  const dict = getDict();
  if (!statusState || statusState.type === "idle") {
    el.textContent = "";
    return;
  }
  if (statusState.type === "fetching") {
    el.textContent = dict.status.fetching;
    return;
  }
  if (statusState.type === "fetched") {
    el.textContent = dict.status.fetched(statusState.count ?? 0);
    return;
  }
  if (statusState.type === "error") {
    el.textContent = `${dict.status.errorPrefix}${translateErrorMessage(statusState)}`;
  }
}

function buildErrorStatus(error) {
  if (!error) {
    return { type: "error", code: "UNKNOWN" };
  }
  if (error.code === "FETCH_FAILED") {
    return { type: "error", code: "FETCH_FAILED" };
  }
  if (error.code === "INSUFFICIENT_DATA" || error.message === "INSUFFICIENT_DATA") {
    return { type: "error", code: "INSUFFICIENT_DATA" };
  }
  return { type: "error", code: "GENERIC", message: error.message };
}

function translateErrorMessage(statusState) {
  const dict = getDict();
  if (!statusState || statusState.type !== "error") return "";
  if (statusState.code === "FETCH_FAILED") {
    return dict.errors.fetchFailed;
  }
  if (statusState.code === "INSUFFICIENT_DATA") {
    return dict.errors.insufficientData;
  }
  if (statusState.code === "GENERIC") {
    return statusState.message || dict.errors.todayGeneric;
  }
  return dict.errors.todayGeneric;
}

function rerenderSummaries(refs) {
  const dict = getDict();
  const currency = lastParams?.currency ?? "usd";
  if (lastApiResponse && lastBacktestResult && lastParams) {
    updateTodaySummary(refs.todaySummaryEl, lastApiResponse, lastBacktestResult, lastParams);
    updateBacktestSummary(refs.backtestSummaryEl, lastBacktestResult, currency);
    renderValueChart(
      refs.valueChartCanvas,
      lastBacktestResult.dates,
      lastBacktestResult.baselineValues,
      lastBacktestResult.strategyValues,
      lastBacktestResult.priceSeries,
      currency,
      dict.charts
    );
    renderMultiplierChart(
      refs.multiplierChartCanvas,
      lastBacktestResult.dates,
      lastBacktestResult.multipliers,
      dict.charts
    );
  } else {
    applyPlaceholders(refs.todaySummaryEl, refs.backtestSummaryEl);
  }
}

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
    const error = new Error("FETCH_FAILED");
    error.code = "FETCH_FAILED";
    throw error;
  }
  return response.json();
}

function updateTodaySummary(container, apiResponse, backtestResult, params) {
  const dict = getDict();
  const latestPoint = apiResponse.prices.at(-1);
  const latestMultiplier = backtestResult.multipliers.at(-1) ?? 1;
  if (!latestPoint) {
    container.textContent = dict.errors.todayLatestMissing;
    return;
  }
  const investedToday = params.baseAmount * latestMultiplier;
  const recentMetrics = computeRecentHighData(apiResponse.prices, params.lookback);
  const highLabel = recentMetrics?.highDate ? `<small>${recentMetrics.highDate}</small>` : "";
  const highValueFormatted = recentMetrics
    ? formatCurrency(recentMetrics.highValue, params.currency)
    : dict.today.noData;
  const dropPctFormatted = recentMetrics
    ? formatPercentValue(recentMetrics.dropPct * 100, currentLanguage)
    : dict.today.noData;
  const closingPriceText = dict.today.closingPrice(
    apiResponse.symbol,
    latestPoint.date,
    formatCurrency(latestPoint.price, params.currency)
  );

  container.innerHTML = `
    <p>
      ${closingPriceText}
    </p>
    <div class="summary-grid">
      <div>
        <span>${dict.today.recommendedMultiple}</span>
        <strong>${latestMultiplier.toFixed(1)}x</strong>
      </div>
      <div>
        <span>${dict.today.todayInvestment}</span>
        <strong>${formatCurrency(investedToday, params.currency)}</strong>
      </div>
      <div>
        <span>${dict.today.baseAmount}</span>
        <strong>${formatCurrency(params.baseAmount, params.currency)}</strong>
      </div>
    </div>
    <div class="summary-grid">
      <div>
        <span>${dict.today.recentHigh} ${highLabel}</span>
        <strong>${highValueFormatted}</strong>
      </div>
      <div>
        <span>${dict.today.dropRate}</span>
        <strong>${dropPctFormatted}</strong>
      </div>
    </div>
  `;
}

function updateBacktestSummary(container, backtestResult, currency) {
  const dict = getDict();
  const stats = [
    buildSummaryStat(dict.metrics.baseline, backtestResult.metrics.baseline, currency, currentLanguage),
    buildSummaryStat(dict.metrics.strategy, backtestResult.metrics.strategy, currency, currentLanguage),
  ];

  const [baselineStat, strategyStat] = stats;
  const metricRows = [
    {
      label: dict.metrics.finalValue,
      baselineValue: `<span class="metric-money">${baselineStat.finalValue}</span>`,
      strategyValue: `<span class="metric-money">${strategyStat.finalValue}</span>`,
    },
    {
      label: dict.metrics.invested,
      baselineValue: `<span class="metric-money">${baselineStat.invested}</span>`,
      strategyValue: `<span class="metric-money">${strategyStat.invested}</span>`,
    },
    {
      label: dict.metrics.profitDrawdown,
      baselineValue: `
        <div class="metric-detail">
          <span class="metric-money">${baselineStat.profit}</span>
          <small>${dict.metrics.maxDD} ${baselineStat.drawdown}</small>
        </div>
      `,
      strategyValue: `
        <div class="metric-detail">
          <span class="metric-money">${strategyStat.profit}</span>
          <small>${dict.metrics.maxDD} ${strategyStat.drawdown}</small>
        </div>
      `,
    },
    {
      label: dict.metrics.profitability,
      baselineValue: `
        <div class="metric-detail">
          <small>${dict.metrics.cumulativeReturn} ${baselineStat.profitPct}</small>
          <small>${dict.metrics.returnMultiple} ${baselineStat.returnMultiple}</small>
          <small>${dict.metrics.annualizedReturn} ${baselineStat.annualizedReturnPct}</small>
          <small>${dict.metrics.duration} ${baselineStat.duration}</small>
        </div>
      `,
      strategyValue: `
        <div class="metric-detail">
          <small>${dict.metrics.cumulativeReturn} ${strategyStat.profitPct}</small>
          <small>${dict.metrics.returnMultiple} ${strategyStat.returnMultiple}</small>
          <small>${dict.metrics.annualizedReturn} ${strategyStat.annualizedReturnPct}</small>
          <small>${dict.metrics.duration} ${strategyStat.duration}</small>
        </div>
      `,
    },
  ];

  const rowsHtml = metricRows
    .map(
      (row) => `
      <tr>
        <th scope="row">${row.label}</th>
        <td>${row.baselineValue}</td>
        <td>${row.strategyValue}</td>
      </tr>
    `
    )
    .join("");

  container.innerHTML = `
    <div class="table-wrapper">
      <table class="backtest-metrics-table">
        <thead>
          <tr>
            <th>${dict.metrics.indicator}</th>
            <th>${dict.metrics.baseline}</th>
            <th>${dict.metrics.strategy}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

function buildSummaryStat(title, metrics, currency, language) {
  return {
    title,
    finalValue: formatCurrency(metrics.finalValue, currency),
    invested: formatCurrency(metrics.totalInvested, currency),
    profit: formatCurrency(metrics.profit, currency),
    drawdown: formatPercentValue(metrics.maxDrawdownPct, language),
    profitPct: formatPercentValue(metrics.profitPct, language),
    returnMultiple: metrics.returnMultiple ? `${metrics.returnMultiple.toFixed(2)}x` : "0x",
    annualizedReturnPct: formatPercentValue(metrics.annualizedReturnPct, language),
    duration: formatDuration(metrics.durationYears, language),
  };
}

function formatDuration(years, language) {
  const suffix = i18n[language]?.metrics?.years ?? "yrs";
  if (!Number.isFinite(years)) {
    return `0 ${suffix}`;
  }
  return `${years.toFixed(2)} ${suffix}`;
}

function formatPercentValue(value, language) {
  const formatter = getPercentFormatter(language);
  const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
  return formatter.format(numeric / 100);
}

function getPercentFormatter(language) {
  const locale = language === "ja" ? "ja-JP" : "en-US";
  if (!percentFormatters[locale]) {
    percentFormatters[locale] = new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 1,
    });
  }
  return percentFormatters[locale];
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

function updateBaseAmountLabel(currency, labelEl) {
  if (!labelEl) return;
  const symbol = currencySymbols[currency?.toLowerCase()] ?? currencySymbols.usd;
  labelEl.textContent = getDict().form.baseAmount(symbol);
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
