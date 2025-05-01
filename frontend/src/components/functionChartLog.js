// src/components/FunctionChart.jsx

import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from "chart.js";
import React from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

const FunctionChartLog = ({ mu1, sigma1, mu2, sigma2, mu3, sigma3 }) => {
  const xValues = [];
  for (let x = 0; x <= 1500; x += 2) {
    xValues.push(x.toFixed(1));
  }

  function normalPDF(x, mean = 0, sigma = 1) {
    const coeff = 1 / (Math.sqrt(2 * Math.PI * sigma) * x);
    const exponent = -((Math.log(x) - mean) ** 2) / (2 * sigma);
    return coeff * Math.exp(exponent);
  }

  const y1 = xValues.map((x) => normalPDF(x, mu1, sigma1));
  const y2 = xValues.map((x) => normalPDF(x, mu2, sigma2));
  const y3 = xValues.map((x) => normalPDF(x, mu3, sigma3));

  const data = {
    labels: xValues,
    datasets: [
      {
        label: "テスト１",
        data: y1,
        borderColor: "red",
        fill: false,
        pointRadius: 0,
      },
      {
        label: "テスト２",
        data: y2,
        borderColor: "blue",
        fill: false,
        pointRadius: 0,
      },
      {
        label: "テスト３",
        data: y3,
        borderColor: "green",
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: "反応速度",
        },
      },
      y: {
        title: {
          display: true,
          text: "確率密度関数",
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default FunctionChartLog;
