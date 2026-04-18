"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
  AreaChart,
  Area,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
  ChartTooltipContent,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  ScatterChartIcon,
  AreaChart as AreaChartIcon,
} from "lucide-react";

const CHART_COLORS = [
  "hsl(220 80% 55%)",
  "hsl(145 70% 42%)",
  "hsl(25 90% 55%)",
  "hsl(330 75% 52%)",
  "hsl(270 65% 55%)",
  "hsl(185 65% 45%)",
  "hsl(355 80% 55%)",
  "hsl(50 95% 53%)",
  "hsl(200 75% 50%)",
  "hsl(280 60% 55%)",
];

function formatNumber(value: unknown): string {
  if (typeof value === "number") {
    return new Intl.NumberFormat("vi-VN").format(value);
  }
  return String(value ?? "");
}

export interface ChartDataPoint {
  label?: string;
  name?: string;
  value: number;
  x?: number;
  y?: number;
  percent?: number;
  [key: string]: unknown;
}

export function BarChartComponent({
  data,
  title,
  xAxisLabel,
  yAxisLabel,
}: {
  data: ChartDataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}) {
  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((item, i) => [
      item.label ?? `item${i}`,
      {
        label: item.label ?? String(item.value),
        color: CHART_COLORS[i % CHART_COLORS.length],
      },
    ]),
  );

  return (
    <div className="w-full">
      {title && (
        <p
          className="text-sm font-medium mb-2 text-center"
          style={{ color: "hsl(220 50% 35%)" }}
        >
          {title}
        </p>
      )}
      <ChartContainer config={chartConfig} className="w-full">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: xAxisLabel ? 20 : 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          {/* <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "hsl(220 40% 45%)" }}
            tickLine={false}
            axisLine={false}
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: "insideBottom",
                    offset: -5,
                    style: { fontSize: 11, fill: "hsl(220 40% 45%)" },
                  }
                : undefined
            }
          /> */}
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(220 40% 45%)" }}
            tickLine={false}
            axisLine={false}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "hsl(220 40% 45%)" },
                  }
                : undefined
            }
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend
            content={<ChartLegendContent className="flex-wrap gap-2" />}
            payload={data.map((item, index) => ({
              id: item.label || `item${index}`,
              type: "square",
              value: item.label || `item${index}`,
              color: CHART_COLORS[index % CHART_COLORS.length],
            }))}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="value"
              position="top"
              style={{ fontSize: 10, fill: "hsl(220 40% 45%)" }}
              formatter={(v: number) => formatNumber(v)}
            />
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export function LineChartComponent({
  data,
  title,
  xAxisLabel,
  yAxisLabel,
}: {
  data: ChartDataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}) {
  const chartConfig: ChartConfig = {
    value: {
      label: title || yAxisLabel || "Giá trị",
      color: CHART_COLORS[0],
    },
  };

  return (
    <div className="w-full">
      {title && (
        <p
          className="text-sm font-medium mb-2 text-center"
          style={{ color: "hsl(220 50% 35%)" }}
        >
          {title}
        </p>
      )}
      <ChartContainer config={chartConfig} className="w-full h-[280px]">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: xAxisLabel ? 20 : 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "hsl(220 40% 45%)" }}
            tickLine={false}
            axisLine={false}
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: "insideBottom",
                    offset: -5,
                    style: { fontSize: 11, fill: "hsl(220 40% 45%)" },
                  }
                : undefined
            }
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(220 40% 45%)" }}
            tickLine={false}
            axisLine={false}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "hsl(220 40% 45%)" },
                  }
                : undefined
            }
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="value"
            name="value"
            stroke={CHART_COLORS[0]}
            strokeWidth={3}
            dot={{ fill: CHART_COLORS[0], strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

export function PieChartComponent({
  data,
  title,
}: {
  data: ChartDataPoint[];
  title?: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((item, i) => [
      item.name ?? `item${i}`,
      {
        label: item.name ?? String(item.value),
        color: CHART_COLORS[i % CHART_COLORS.length],
      },
    ]),
  );

  return (
    <div className="w-full">
      {title && (
        <p
          className="text-sm font-medium mb-2 text-center"
          style={{ color: "hsl(220 50% 35%)" }}
        >
          {title}
        </p>
      )}
      <ChartContainer config={chartConfig} className="w-full h-[320px]">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            label={({ name, percent }) => `${name} ${percent?.toFixed(1)}%`}
            labelLine={{ strokeWidth: 1 }}
          >
            {data.map((_, index) => {
              const isActive = activeIndex === index;
              const isOther = activeIndex !== null && !isActive;
              const color = CHART_COLORS[index % CHART_COLORS.length];
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={color}
                  strokeWidth={3}
                  fillOpacity={isOther ? 0.7 : 1}
                  strokeOpacity={isOther ? 0.7 : 1}
                  style={{
                    cursor: "pointer",
                    transform: isActive ? "scale(1.1)" : undefined,
                    transformOrigin: "center",
                    transition: "all 0.2s ease",
                  }}
                />
              );
            })}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
        </PieChart>
      </ChartContainer>
    </div>
  );
}

export function ScatterChartComponent({
  data,
  title,
  xAxisLabel,
  yAxisLabel,
}: {
  data: ChartDataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}) {
  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((item, i) => [
      item.label ?? `item${i}`,
      {
        label: item.label ?? String(item.value),
        color: CHART_COLORS[i % CHART_COLORS.length],
      },
    ]),
  );

  return (
    <div className="w-full">
      {title && (
        <p
          className="text-sm font-medium mb-2 text-center"
          style={{ color: "hsl(220 50% 35%)" }}
        >
          {title}
        </p>
      )}
      <ChartContainer config={chartConfig} className="w-full h-[280px]">
        <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="x"
            name={xAxisLabel || "X"}
            type="number"
            tick={{ fontSize: 11, fill: "hsl(220 40% 45%)" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: xAxisLabel || "X",
              position: "insideBottom",
              offset: -5,
              style: { fontSize: 11, fill: "hsl(220 40% 45%)" },
            }}
          />
          <YAxis
            dataKey="y"
            name={yAxisLabel || "Y"}
            type="number"
            tick={{ fontSize: 11, fill: "hsl(220 40% 45%)" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: yAxisLabel || "Y",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: "hsl(220 40% 45%)" },
            }}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <ChartLegend
            content={<ChartLegendContent className="flex-wrap gap-2" />}
          />
          {data.map((_, index) => (
            <Scatter
              key={`scatter-${index}`}
              name={data[index].label || `item${index}`}
              data={[data[index]]}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              fillOpacity={0.85}
            />
          ))}
        </ScatterChart>
      </ChartContainer>
    </div>
  );
}

export function AreaChartComponent({
  data,
  title,
  xAxisLabel,
  yAxisLabel,
}: {
  data: ChartDataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}) {
  const chartConfig: ChartConfig = {
    value: {
      label: title || yAxisLabel || "Giá trị",
      color: CHART_COLORS[0],
    },
  };

  return (
    <div className="w-full p-3">
      {title && (
        <p
          className="text-sm font-medium mb-2 text-center"
          style={{ color: "hsl(220 50% 35%)" }}
        >
          {title}
        </p>
      )}
      <ChartContainer config={chartConfig} className="w-full h-[300px]">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: xAxisLabel ? 20 : 5 }}
        >
          <defs>
            <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.8} />
              <stop
                offset="95%"
                stopColor={CHART_COLORS[0]}
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border/50"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "hsl(220 40% 45%)" }}
            tickLine={false}
            axisLine={false}
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: "insideBottom",
                    offset: -5,
                    style: { fontSize: 11, fill: "hsl(220 40% 45%)" },
                  }
                : undefined
            }
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(220 40% 45%)" }}
            tickLine={false}
            axisLine={false}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "hsl(220 40% 45%)" },
                  }
                : undefined
            }
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            type="monotone"
            dataKey="value"
            name="value"
            stroke={CHART_COLORS[0]}
            strokeWidth={3}
            fill="url(#fillArea)"
            fillOpacity={1}
            activeDot={{ r: 7 }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

export function ChartTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "bar":
      return <BarChart3 className="h-4 w-4" />;
    case "line":
      return <LineChartIcon className="h-4 w-4" />;
    case "pie":
      return <PieChartIcon className="h-4 w-4" />;
    case "scatter":
      return <ScatterChartIcon className="h-4 w-4" />;
    case "area":
    case "areachart":
      return <AreaChartIcon className="h-4 w-4" />;
    default:
      return null;
  }
}
