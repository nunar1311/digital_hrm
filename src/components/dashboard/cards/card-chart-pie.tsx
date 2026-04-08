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
import type { DepartmentDistributionItem } from "@/app/[locale]/(protected)/dashboard/actions";
import { useTranslations } from "next-intl";

interface CardChartPieProps {
    departmentData: DepartmentDistributionItem[];
}

const CardChartPie = ({ departmentData }: CardChartPieProps) => {
    const t = useTranslations("Dashboard");

    const chartConfig = useMemo(() => {
        const config: ChartConfig = {
            count: { label: t("employee") },
        };
        departmentData.forEach((item) => {
            config[item.department] = {
                label: item.department,
                color: item.fill,
            };
        });
        return config;
    }, [departmentData, t]);

    return (
        <CardToolbar title={t("departmentDistribution")}>
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
                        {/* <ChartLegend
                            content={<ChartLegendContent />}
                        /> */}
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

