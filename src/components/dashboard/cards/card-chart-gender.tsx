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
import CardToolbar from "./card-toolbar";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltipContent,
    ChartTooltip,
} from "@/components/ui/chart";
import type { GenderDistributionItem } from "@/app/(protected)/dashboard/actions";

const chartConfig = {
    count: {
        label: "Số lượng nhân sự",
        color: "var(--chart-1)",
    },
    Nam: {
        label: "Nam",
        color: "var(--chart-1)",
    },
    Nữ: {
        label: "Nữ",
        color: "var(--chart-2)",
    },
    Khác: {
        label: "Khác",
        color: "var(--chart-3)",
    },
    "Chưa xác định": {
        label: "Chưa xác định",
        color: "var(--chart-4)",
    },
} satisfies ChartConfig;

interface CardChartGenderProps {
    genderData: GenderDistributionItem[];
}

const CardChartGender = ({
    genderData,
}: CardChartGenderProps) => {
    return (
        <CardToolbar title="Thống kê nhân sự theo giới tính">
            <div className="h-full w-full">
                <ChartContainer
                    config={chartConfig}
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
