import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import React from "react";
import { Bar } from "react-chartjs-2";

// Chart.js の必要モジュールを登録
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ヒストグラムを作る関数（ビンに分ける）
function computeHistogram(data, binSize, rangeMin, rangeMax) {
  const numBins = Math.ceil((rangeMax - rangeMin) / binSize);
  const bins = Array(numBins).fill(0);

  data.forEach((value) => {
    const bin = Math.floor((value - rangeMin) / binSize);
    if (bin >= 0 && bin < numBins) {
      bins[bin]++;
    }
  });

  return bins;
}

const HistogramChart = ({ red_values, blue_values, color1 = "red", color2 = "blue" }) => {
  const binSize = 20;
  const rangeMin = Math.min(...red_values, ...blue_values);
  const rangeMax = Math.max(...red_values, ...blue_values);

  const bins = [];
  for (let i = rangeMin; i < rangeMax; i += binSize) {
    bins.push(`${i}-${i + binSize}`);
  }

  const redHistogram = computeHistogram(red_values, binSize, rangeMin, rangeMax);
  const blueHistogram = computeHistogram(blue_values, binSize, rangeMin, rangeMax);

  const data = {
    labels: bins,
    datasets: [
      {
        label: "Red Values",
        data: redHistogram,
        backgroundColor: color1,
        barPercentage: 1,
        categoryPercentage: 0.5,
      },
      {
        label: "Blue Values",
        data: blueHistogram,
        backgroundColor: color2,
        barPercentage: 1,
        categoryPercentage: 0.5,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        stacked: false,
        title: {
          display: true,
          text: "値の範囲",
        },
      },
      y: {
        title: {
          display: true,
          text: "度数（頻度）",
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default HistogramChart;
