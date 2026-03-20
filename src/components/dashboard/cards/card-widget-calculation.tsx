import { TrendingUp } from "lucide-react";
import CardToolbar from "./card-toolbar";
import { cn } from "@/lib/utils";
import { useFullscreenCardContext } from "@/contexts/fullscreen-card-context";
import { useGridStackWidgetContext } from "@/contexts/grid-stack-widget-context";
import { cardRegistry } from "@/contexts/fullscreen-card-registry";

interface CardWidgetCalculationProps {
    title: string;
    total: number;
    label: string;
    percentage: number;
    editMode?: boolean;
}

const CardWidgetCalculation = ({
    title,
    total,
    label,
    percentage,
}: CardWidgetCalculationProps) => {
    const { openFullscreen } = useFullscreenCardContext();
    const { widget } = useGridStackWidgetContext() ?? {
        widget: null,
    };

    const handleClick = () => {
        if (!widget?.id) return;
        const allCards = cardRegistry.getAll();
        const idx = allCards.findIndex((c) => c.id === widget.id);
        openFullscreen(idx >= 0 ? idx : 0);
    };

    return (
        <CardToolbar title={title}>
            <div
                className="flex flex-1 flex-col items-start justify-center gap-4 w-full h-full hover:bg-muted rounded-lg p-4 cursor-pointer"
                onClick={handleClick}
            >
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
