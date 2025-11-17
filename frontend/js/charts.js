const chartRefs = {
  value: null,
  multiplier: null,
};

function renderValueChart(canvas, labels, baselineValues, strategyValues, priceValues) {
  if (!canvas) return;
  if (chartRefs.value) {
    chartRefs.value.destroy();
  }

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
          },
        },
        yPrice: {
          position: "right",
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: "#6feab3",
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
