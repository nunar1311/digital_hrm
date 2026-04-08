"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import CardToolbar from "./card-toolbar";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
} from "@/components/ui/chart";
import type { TurnoverTrendItem } from "@/app/[locale]/(protected)/dashboard/actions";
import { useTranslations } from "next-intl";

interface CardChartTurnoverRateProps {
  trendData: TurnoverTrendItem[];
}

const CardChartTurnoverRate = ({ trendData }: CardChartTurnoverRateProps) => {
  const t = useTranslations("Dashboard");

  const chartConfig = {
    turnoverRate: {
      label: t("turnoverRatePercent"),
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <CardToolbar title={t("turnoverRate")}>
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

