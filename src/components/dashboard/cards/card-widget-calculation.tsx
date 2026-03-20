import { TrendingUp } from "lucide-react";
import CardToolbar from "./card-toolbar";
import { cn } from "@/lib/utils";

interface CardWidgetCalculationProps {
    title: string;
    total: number;
    label: string;
    percentage: number;
}

const CardWidgetCalculation = ({
    title,
    total,
    label,
    percentage,
}: CardWidgetCalculationProps) => {
    return (
        <CardToolbar title={title}>
            <div className="flex flex-col items-start justify-center gap-4 w-full h-full hover:bg-muted rounded-lg p-2 cursor-pointer">
                <div className="flex items-center justify-between w-full gap-2">
                    <span className="text-5xl font-bold truncate">
                        {total.toLocaleString("vi-VN")}
                    </span>
                    <div
                        className={cn(
                            "flex items-center justify-between px-2 gap-x-2 bg-emerald-500/20 h-6 text-emerald-500 rounded-lg max-w-fit",
                        )}
                    >
                        <TrendingUp className="size-4" /> +
                        {percentage.toFixed(1)}%
                    </div>
                </div>
                <p>{label}</p>
            </div>
        </CardToolbar>
    );
};

export default CardWidgetCalculation;
