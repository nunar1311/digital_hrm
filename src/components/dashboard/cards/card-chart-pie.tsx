"use client";

import { useMemo, useState } from "react";
import { useChartColors } from "@/hooks/use-chart-colors";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell, Sector } from "recharts";
import CardToolbar from "./card-toolbar";
import type { DepartmentDistributionItem } from "@/app/(protected)/dashboard/actions";

interface CardChartPieProps {
  departmentData: DepartmentDistributionItem[];
}

const CardChartPie = ({ departmentData }: CardChartPieProps) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>();
  const chartColors = useChartColors();

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      count: { label: "Nhân viên" },
    };
    departmentData.forEach((item, i) => {
      config[item.department] = {
        label: item.department,
        color: chartColors[i % chartColors.length]!,
      };
    });
    return config;
  }, [departmentData, chartColors]);

  return (
    <CardToolbar title="Phân bổ nhân viên theo phòng ban">
      <div className="h-full w-full">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full [&_.recharts-pie-label-text]:fill-foreground"
        >
          <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            {/* <ChartLegend
                            content={<ChartLegendContent />}
                        /> */}
            <Pie
              data={departmentData}
              dataKey="count"
              label={({ department, count }) => `${department}: ${count}`}
              nameKey="department"
              isAnimationActive={true}
              activeIndex={activeIndex}
              activeShape={({ outerRadius = 0, ...props }: any) => (
                <Sector {...props} outerRadius={outerRadius + 10} />
              )}
              // onMouseEnter={(_, index) => setActiveIndex(index)}
              // onMouseLeave={() => setActiveIndex(undefined)}
            >
              {departmentData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
    </CardToolbar>
  );
};

export default CardChartPie;
