import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const PINK = "var(--dashboard-highlight)";
const MUTED = "var(--dashboard-muted)";
const MUTED_BG = "var(--dashboard-muted-bg)";
const CARD_BG = "var(--dashboard-card-bg)";
const CARD_FG = "var(--dashboard-card-fg)";
const CARD_BORDER = "var(--dashboard-card-border)";
const MUTED_FOREGROUND = "var(--dashboard-muted-foreground)";

const TotalTasksPieCard = () => {
    const data = [
        { name: "Hoàng Quân Nguyễn", value: 14.28 },
        { name: "Unassigned", value: 85.72 },
    ];

    const total = data.reduce((acc, item) => acc + item.value, 0);
    let cumulativePercent = 0;

    const slices = data.map((item, index) => {
        const percent = (item.value / total) * 100;
        const startAngle = cumulativePercent * 3.6;
        cumulativePercent += percent;
        const endAngle = cumulativePercent * 3.6;

        return {
            ...item,
            percent,
            startAngle,
            endAngle,
            isHighlighted: index === 0,
        };
    });

    return (
        <Card
            className="h-full dashboard-card-bg dashboard-card-fg dashboard-card-border"
            style={{
                backgroundColor: CARD_BG,
                borderColor: CARD_BORDER,
                color: CARD_FG,
                borderWidth: 1,
                borderStyle: "solid",
            }}
        >
            <CardHeader
                className="pb-2"
                style={{ borderBottom: `1px solid ${CARD_BORDER}` }}
            >
                <CardTitle className="text-base" style={{ color: CARD_FG }}>
                    Total Tasks by Assignee
                </CardTitle>
            </CardHeader>
            <CardContent
                className="flex flex-col items-center flex-1"
                style={{ backgroundColor: CARD_BG }}
            >
                <div className="relative w-36 h-36 shrink-0">
                    <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full -rotate-90"
                    >
                        {slices.map((slice, index) => {
                            const color =
                                slice.isHighlighted ? PINK : MUTED;
                            return (
                                <circle
                                    key={index}
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke={color}
                                    strokeWidth="20"
                                    strokeDasharray={`${
                                        (slice.percent / 100) * 251.2
                                    } 251.2`}
                                    strokeDashoffset={`${
                                        -((cumulativePercent -
                                            slice.percent) /
                                            100) *
                                        251.2
                                    }`}
                                />
                            );
                        })}
                    </svg>
                </div>

                <div
                    className="mt-3 w-full space-y-1.5 text-sm"
                    style={{ backgroundColor: CARD_BG }}
                >
                    {data.map((item, index) => (
                        <div
                            key={item.name}
                            className="flex justify-between items-center"
                        >
                            <span
                                style={{
                                    color: index === 0 ? CARD_FG : MUTED_FOREGROUND,
                                    fontWeight: index === 0 ? 500 : 400,
                                }}
                            >
                                {item.name}
                            </span>
                            <span
                                className="tabular-nums"
                                style={{ color: MUTED_FOREGROUND }}
                            >
                                {item.value.toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default TotalTasksPieCard;
