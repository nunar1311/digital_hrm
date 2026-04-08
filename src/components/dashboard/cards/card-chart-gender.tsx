"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    XAxis,
    YAxis,
    Cell,
} from "recharts";
import { useTranslations } from "next-intl";
import CardToolbar from "./card-toolbar";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltipContent,
    ChartTooltip,
} from "@/components/ui/chart";
import type { GenderDistributionItem } from "@/app/[locale]/(protected)/dashboard/actions";

const chartConfig = {
    count: {
        label: "count",
        color: "var(--chart-1)",
    },
    male: {
        label: "male",
        color: "var(--chart-1)",
    },
    female: {
        label: "female",
        color: "var(--chart-2)",
    },
    otherGender: {
        label: "otherGender",
        color: "var(--chart-3)",
    },
    unspecifiedGender: {
        label: "unspecifiedGender",
        color: "var(--chart-4)",
    },
} satisfies ChartConfig;

interface CardChartGenderProps {
    genderData: GenderDistributionItem[];
}

const CardChartGender = ({
    genderData,
}: CardChartGenderProps) => {
    const t = useTranslations("Dashboard");
    const maleLabel = t("male");
    const femaleLabel = t("female");
    const otherLabel = t("otherGender");
    const unspecifiedLabel = t("unspecifiedGender");

    const genderLabelMap: Record<string, string> = {
        [maleLabel]: maleLabel,
        [femaleLabel]: femaleLabel,
        [otherLabel]: otherLabel,
        [unspecifiedLabel]: unspecifiedLabel,
    };

    const chartConfigI18n: ChartConfig = {
        ...chartConfig,
        count: {
            ...chartConfig.count,
            label: t("employeeCount"),
        },
    };

    return (
        <CardToolbar title={t("genderDistribution")}>
            <div className="h-full w-full">
                <ChartContainer
                    config={chartConfigI18n}
                    className="h-full w-full"
                >
                    <BarChart
                        accessibilityLayer
                        data={genderData}
                        margin={{
                            top: 20,
                            left: -20,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="gender"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => genderLabelMap[String(value)] ?? String(value)}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickCount={4}
                            allowDecimals={false}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar
                            dataKey="count"
                            radius={4}
                            isAnimationActive={false}
                        >
                            {genderData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                            <LabelList
                                position="top"
                                offset={12}
                                className="fill-foreground"
                                fontSize={12}
                            />
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </div>
        </CardToolbar>
    );
};

export default CardChartGender;

