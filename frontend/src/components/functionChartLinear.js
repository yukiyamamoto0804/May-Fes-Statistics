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

const FunctionChartLinear = ({coef1, intercept1, coef2, intercept2, coef3, intercept3 }) => {
  const xValues = [];
  for (let x = 0; x <= 1200; x += 2) {
    xValues.push(x.toFixed(1));
  }

  function normalPDF(x, coef, intercept) {
    return coef * x + intercept;
  }

  const y1 = xValues.map((x) => normalPDF(x, coef1, intercept1));
  const y2 = xValues.map((x) => normalPDF(x, coef2, intercept2));
  const y3 = xValues.map((x) => normalPDF(x, coef3, intercept3));

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
          text: "x",
        },
      },
      y: {
        title: {
          display: true,
          text: "y",
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default FunctionChartLinear;
