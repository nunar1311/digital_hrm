"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import {
  formatCurrencyShort,
  buildPayrollChartData,
  type PayrollChartDataPoint,
} from "./payroll-utils";

interface PayrollChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function PayrollChartTooltip({
  active,
  payload,
  label,
}: PayrollChartTooltipProps) {
  if (!active || !payload) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
            }).format(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface PayrollChartProps {
  records: PayrollChartDataPoint[];
}

export function PayrollChart({ records }: PayrollChartProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <BarChart3 className="h-10 w-10 opacity-30 mb-3" />
        <p className="text-sm">Chưa có dữ liệu để hiển thị biểu đồ</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={records}
        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/10" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={(v) => formatCurrencyShort(v)}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip content={<PayrollChartTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey="gross"
          name="Gross"
          fill="hsl(221, 83%, 53%)"
          radius={[4, 4, 0, 0]}
          barSize={24}
        />
        <Bar
          dataKey="net"
          name="Net"
          fill="hsl(142, 71%, 45%)"
          radius={[4, 4, 0, 0]}
          barSize={24}
        />
        <Bar
          dataKey="tax"
          name="Thuế"
          fill="hsl(38, 92%, 50%)"
          radius={[4, 4, 0, 0]}
          barSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
