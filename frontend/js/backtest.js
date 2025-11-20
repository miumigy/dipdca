/**
 * Run a simple DCA backtest using a drawdown-based multiplier strategy.
 * @param {Array<{date: string, price: number}>} prices
 * @param {number} baseAmount
 * @param {number} lookbackDays
 * @param {number} threshold2Pct
 * @param {number} threshold3Pct
 */
function runBacktest(prices, baseAmount, lookbackDays, threshold2Pct, threshold3Pct) {
  if (!Array.isArray(prices) || prices.length === 0) {
    const error = new Error("INSUFFICIENT_DATA");
    error.code = "INSUFFICIENT_DATA";
    throw error;
  }

  const lookback = Math.max(1, lookbackDays);
  const th2 = Math.max(0, threshold2Pct) / 100;
  const th3 = Math.max(th2, threshold3Pct) / 100;

  const dates = [];
  const baselineValues = [];
  const strategyValues = [];
  const multipliers = [];
  const priceSeries = [];

  let baselineUnits = 0;
  let baselineInvested = 0;
  let strategyUnits = 0;
  let strategyInvested = 0;

  prices.forEach((point, index) => {
    const price = Number(point.price);
    if (!isFinite(price) || price <= 0) {
      return;
    }

    const multiplier = computeMultiplier(prices, index, lookback, th2, th3);
    multipliers.push(multiplier);

    baselineUnits += baseAmount / price;
    baselineInvested += baseAmount;
    strategyUnits += (baseAmount * multiplier) / price;
    strategyInvested += baseAmount * multiplier;

    dates.push(point.date);
    baselineValues.push(baselineUnits * price);
    strategyValues.push(strategyUnits * price);
    priceSeries.push(price);
  });

  const baselineMetrics = buildMetrics(dates, baselineValues, baselineInvested);
  const strategyMetrics = buildMetrics(dates, strategyValues, strategyInvested);

  return {
    dates,
    baselineValues,
    strategyValues,
    multipliers,
    priceSeries,
    metrics: {
      baseline: baselineMetrics,
      strategy: strategyMetrics,
    },
  };
}

function computeMultiplier(prices, index, lookback, th2, th3) {
  if (index === 0) return 1;
  const price = Number(prices[index].price);
  const windowStart = Math.max(0, index - lookback + 1);
  let rollingHigh = price;
  for (let i = windowStart; i <= index; i += 1) {
    rollingHigh = Math.max(rollingHigh, Number(prices[i].price));
  }
  if (!isFinite(rollingHigh) || rollingHigh === 0) return 1;

  const drawdown = (rollingHigh - price) / rollingHigh;
  if (drawdown >= th3) return 3;
  if (drawdown >= th2) return 2;
  return 1;
}

function buildMetrics(dates, values, invested) {
  const lastValue = values.at(-1) ?? 0;
  const profit = lastValue - invested;
  const profitPct = invested ? (profit / invested) * 100 : 0;
  const { maxDrawdown, maxDrawdownPct } = computeMaxDrawdown(values);
  const returnMultiple = invested ? lastValue / invested : 0;
  const durationYears = computeDurationYears(dates);
  const annualizedReturnPct =
    durationYears > 0 && returnMultiple > 0
      ? (Math.pow(returnMultiple, 1 / durationYears) - 1) * 100
      : 0;

  return {
    totalInvested: invested,
    finalValue: lastValue,
    profit,
    profitPct,
    returnMultiple,
    annualizedReturnPct,
    durationYears,
    maxDrawdown,
    maxDrawdownPct,
  };
}

function computeMaxDrawdown(series) {
  let peak = 0;
  let maxDrawdown = 0;

  series.forEach((value) => {
    if (value > peak) {
      peak = value;
    }
    const drawdown = peak - value;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  return {
    maxDrawdown,
    maxDrawdownPct: peak ? (-maxDrawdown / peak) * 100 : 0,
  };
}

function computeDurationYears(dates) {
  if (!Array.isArray(dates) || dates.length < 2) {
    return 0;
  }
  const firstDate = new Date(dates[0]);
  const lastDate = new Date(dates.at(-1));
  if (Number.isNaN(firstDate) || Number.isNaN(lastDate) || lastDate <= firstDate) {
    return 0;
  }
  const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;
  return (lastDate - firstDate) / MS_PER_YEAR;
}
