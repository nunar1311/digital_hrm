"use client";

import { useMemo } from "react";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import CardToolbar from "./card-toolbar";
import type { DepartmentDistributionItem } from "@/app/(protected)/dashboard/actions";

interface CardChartPieProps {
    departmentData: DepartmentDistributionItem[];
}

const CardChartPie = ({ departmentData }: CardChartPieProps) => {
    const chartConfig = useMemo(() => {
        const config: ChartConfig = {
            count: { label: "Nhân viên" },
        };
        departmentData.forEach((item) => {
            config[item.department] = {
                label: item.department,
                color: item.fill,
            };
        });
        return config;
    }, [departmentData]);

    return (
        <CardToolbar title="Phân bổ nhân viên theo phòng ban">
            <div className="h-full w-full">
                <ChartContainer
                    config={chartConfig}
                    className="h-full w-full [&_.recharts-pie-label-text]:fill-foreground"
                >
                    <PieChart>
                        <ChartTooltip
                            content={
                                <ChartTooltipContent hideLabel />
                            }
                        />
                        <ChartLegend
                            content={<ChartLegendContent />}
                        />
                        <Pie
                            data={departmentData}
                            dataKey="count"
                            label={({ department, count }) =>
                                `${department}: ${count}`
                            }
                            nameKey="department"
                            isAnimationActive={false}
                        />
                    </PieChart>
                </ChartContainer>
            </div>
        </CardToolbar>
    );
};

export default CardChartPie;
