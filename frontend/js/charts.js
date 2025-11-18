const chartRefs = {
  value: null,
  multiplier: null,
};

const chartCurrencyConfigs = {
  usd: { locale: "en-US", currency: "USD", maximumFractionDigits: 2 },
  jpy: { locale: "ja-JP", currency: "JPY", maximumFractionDigits: 0 },
};
const chartCurrencyFormatters = {};

function getChartCurrencyFormatter(currency) {
  const normalized = (currency || "usd").toLowerCase();
  if (!chartCurrencyFormatters[normalized]) {
    const config = chartCurrencyConfigs[normalized] ?? chartCurrencyConfigs.usd;
    chartCurrencyFormatters[normalized] = new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.currency,
      maximumFractionDigits: config.maximumFractionDigits,
    });
  }
  return chartCurrencyFormatters[normalized];
}

function renderValueChart(canvas, labels, baselineValues, strategyValues, priceValues, currency) {
  if (!canvas) return;
  if (chartRefs.value) {
    chartRefs.value.destroy();
  }

  const formatter = getChartCurrencyFormatter(currency);

  chartRefs.value = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "ベースライン",
          data: baselineValues,
          borderColor: "#68d1ff",
          yAxisID: "yValue",
          pointRadius: 0,
          tension: 0.3,
        },
        {
          label: "戦略",
          data: strategyValues,
          borderColor: "#ffb347",
          yAxisID: "yValue",
          pointRadius: 0,
          tension: 0.3,
        },
        {
          label: "価格",
          data: priceValues,
          borderColor: "#4ade80",
          borderDash: [5, 4],
          yAxisID: "yPrice",
          pointRadius: 0,
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            color: "#f5f7ff",
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed?.y ?? context.parsed;
              if (context.dataset?.label) {
                return `${context.dataset.label}: ${formatter.format(Number(value ?? 0))}`;
              }
              return formatter.format(Number(value ?? 0));
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#98a1c0",
            maxTicksLimit: 6,
          },
        },
        yValue: {
          position: "left",
          ticks: {
            color: "#98a1c0",
            callback: (value) => formatter.format(Number(value ?? 0)),
          },
        },
        yPrice: {
          position: "right",
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: "#6feab3",
            callback: (value) => formatter.format(Number(value ?? 0)),
          },
        },
      },
    },
  });
}

function renderMultiplierChart(canvas, labels, multipliers) {
  if (!canvas) return;
  if (chartRefs.multiplier) {
    chartRefs.multiplier.destroy();
  }

  chartRefs.multiplier = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "倍率",
          data: multipliers,
          backgroundColor: "#ff6b6b",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#f5f7ff",
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#98a1c0",
            maxTicksLimit: 6,
          },
        },
        y: {
          ticks: {
            color: "#98a1c0",
            stepSize: 1,
            callback: (val) => `${val}x`,
          },
          suggestedMax: 3.5,
        },
      },
    },
  });
}
