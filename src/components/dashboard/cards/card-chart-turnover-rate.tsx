"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  XAxis,
  YAxis,
} from "recharts";
import CardToolbar from "./card-toolbar";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { TurnoverTrendItem } from "@/app/(protected)/dashboard/actions";
import { useRouter } from "next/navigation";

const chartConfig = {
  turnoverRate: {
    label: "Tỷ lệ nghỉ việc (%)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface CardChartTurnoverRateProps {
  trendData: TurnoverTrendItem[];
}

const CardChartTurnoverRate = ({ trendData }: CardChartTurnoverRateProps) => {
  const router = useRouter();
  const [showLegend, setShowLegend] = useState(false);

  return (
    <CardToolbar
      title="Tỷ lệ biến động nhân sự (Nghỉ việc)"
      onRefresh={() => { router.refresh(); }}
      showLegend={showLegend}
      onToggleLegend={setShowLegend}
    >
      <div className="h-full w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart
            accessibilityLayer
            data={trendData}
            margin={{
              top: 20,
              left: -20,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={4}
              allowDecimals={true}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            {showLegend && <ChartLegend content={<ChartLegendContent />} />}
            <Bar
              dataKey="turnoverRate"
              fill="var(--color-turnoverRate)"
              radius={4}
              isAnimationActive={false}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) => `${value}%`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </CardToolbar>
  );
};

export default CardChartTurnoverRate;
