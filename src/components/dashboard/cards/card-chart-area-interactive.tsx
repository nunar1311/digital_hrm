"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import CardToolbar from "./card-toolbar";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { AttendanceTrendItem } from "@/app/(protected)/dashboard/actions";
import { useRouter } from "next/navigation";

const chartConfig = {
  onTime: {
    label: "Đúng giờ",
    color: "var(--chart-1)",
  },
  late: {
    label: "Đi trễ",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface CardChartAreaInteractiveProps {
  trendData: AttendanceTrendItem[];
}

const CardChartAreaInteractive = ({
  trendData,
}: CardChartAreaInteractiveProps) => {
  const router = useRouter();
  const [showLegend, setShowLegend] = useState(true);

  return (
    <CardToolbar
      title="Nhân sự đi làm đúng giờ"
      onRefresh={() => { router.refresh(); }}
      showLegend={showLegend}
      onToggleLegend={setShowLegend}
    >
      <div className="h-full w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart
            accessibilityLayer
            data={trendData}
            margin={{
              left: -20,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={3}
              allowDecimals={false}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {showLegend && <ChartLegend content={<ChartLegendContent />} />}
            <Area
              dataKey="late"
              type="natural"
              fill="var(--color-late)"
              fillOpacity={0.4}
              stroke="var(--color-late)"
              stackId="a"
              isAnimationActive={false}
            />
            <Area
              dataKey="onTime"
              type="natural"
              fill="var(--color-onTime)"
              fillOpacity={0.4}
              stroke="var(--color-onTime)"
              stackId="a"
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </CardToolbar>
  );
};

export default CardChartAreaInteractive;
