import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    RefreshCw,
    Maximize2,
    Filter,
    Settings,
    MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PINK = "var(--dashboard-highlight)";
const MUTED = "var(--dashboard-muted)";
const MUTED_BG = "var(--dashboard-muted-bg)";
const CARD_BG = "var(--dashboard-card-bg)";
const CARD_FG = "var(--dashboard-card-fg)";
const CARD_BORDER = "var(--dashboard-card-border)";
const MUTED_FOREGROUND = "var(--dashboard-muted-foreground)";

const OpenTasksBarCard = () => {
    const data = [
        { name: "Hoàng Quân Nguyễn", tasks: 1 },
        { name: "Unassigned", tasks: 5 },
    ];

    const maxTasks = 6;

    return (
        <Card
            className="h-full"
            style={{
                backgroundColor: CARD_BG,
                borderColor: CARD_BORDER,
                color: CARD_FG,
                borderWidth: 1,
                borderStyle: "solid",
            }}
        >
            <CardHeader
                className="pb-2 flex flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1"
                style={{ borderBottom: `1px solid ${CARD_BORDER}` }}
            >
                <CardTitle
                    className="text-base shrink-0"
                    style={{ color: CARD_FG }}
                >
                    Open Tasks by Assignee
                </CardTitle>
                <div className="flex items-center gap-0.5 shrink-0">
                    <span
                        className="text-xs whitespace-nowrap hidden sm:inline"
                        style={{ color: MUTED_FOREGROUND }}
                    >
                        Refreshed 23 mins ago
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        style={{ color: MUTED_FOREGROUND }}
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        style={{ color: MUTED_FOREGROUND }}
                    >
                        <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 relative"
                        style={{ color: MUTED_FOREGROUND }}
                    >
                        <Filter className="h-3.5 w-3.5" />
                        <span
                            className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] px-1 flex items-center justify-center rounded-full text-[10px] font-medium"
                            style={{
                                backgroundColor: MUTED_BG,
                                color: MUTED_FOREGROUND,
                            }}
                        >
                            1
                        </span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        style={{ color: MUTED_FOREGROUND }}
                    >
                        <Settings className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        style={{ color: MUTED_FOREGROUND }}
                    >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent
                className="flex flex-col flex-1"
                style={{ backgroundColor: CARD_BG }}
            >
                <div className="flex items-end gap-6 flex-1 min-h-[140px]">
                    {data.map((item, index) => {
                        const height =
                            maxTasks > 0
                                ? (item.tasks / maxTasks) * 100
                                : 0;
                        const isHighlighted = index === 0;

                        return (
                            <div
                                key={item.name}
                                className="flex flex-col items-center gap-2 flex-1"
                            >
                                <span
                                    className="text-sm font-medium tabular-nums"
                                    style={{ color: CARD_FG }}
                                >
                                    {item.tasks}
                                </span>
                                <div
                                    className="w-full max-w-[80px] rounded-t transition-all"
                                    style={{
                                        height: 120,
                                        backgroundColor: MUTED_BG,
                                    }}
                                >
                                    <div
                                        className="w-full rounded-t transition-all"
                                        style={{
                                            height: `${Math.max(height, 2)}%`,
                                            backgroundColor: isHighlighted
                                                ? PINK
                                                : MUTED,
                                        }}
                                    />
                                </div>
                                <span
                                    className="text-xs text-center"
                                    style={{ color: MUTED_FOREGROUND }}
                                >
                                    {item.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default OpenTasksBarCard;
