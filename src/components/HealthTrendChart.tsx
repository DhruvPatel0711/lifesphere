"use client";

import React from "react";

interface DataPoint {
  date: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  unit: string;
  color: string;
  data: DataPoint[];
}

export default function HealthTrendChart({ title, unit, color, data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">{title}</h3>
        <div className="py-8 text-center text-slate-400 text-xs italic">
          No data points recorded yet for {title.toLowerCase()}.
        </div>
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values) * 0.95;
  const maxVal = Math.max(...values) * 1.05 || 1;

  const width = 400;
  const height = 140;
  const padding = 20;

  const points = data
    .map((d, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
      const y = height - padding - ((d.value - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Historical trend overview</p>
        </div>
        <span className="font-extrabold text-lg" style={{ color }}>
          {data[data.length - 1]?.value} <span className="text-xs font-normal text-slate-400">{unit}</span>
        </span>
      </div>

      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 overflow-visible">
          {/* Gradient Fill */}
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          {data.length > 1 && (
            <polygon
              fill={`url(#grad-${title.replace(/\s+/g, "")})`}
              points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
            />
          )}

          {/* Line */}
          {data.length > 1 && (
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          )}

          {/* Data Points */}
          {data.map((d, index) => {
            const x = padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
            const y = height - padding - ((d.value - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#ffffff"
                stroke={color}
                strokeWidth="2.5"
              />
            );
          })}
        </svg>
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
