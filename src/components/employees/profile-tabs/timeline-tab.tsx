import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    ArrowUpCircle,
    ScrollText,
    DollarSign,
    Plane,
    Gift,
    AlertTriangle,
    GraduationCap,
} from "lucide-react";

const mockTimelineEvents = [
    {
        id: "1",
        employeeId: "1",
        date: "2021-01-01",
        type: "HIRED",
        title: "Nhận vào công ty",
        description: "Nhận vào công ty với mức lương 1000000",
        metadata: {
            "Mức lương": 1000000,
            "Ngày nhận": "2021-01-01",
        },
    },
];

interface Props {
    employeeId: string;
}

export function TimelineTab({ employeeId }: Props) {
    const events = mockTimelineEvents
        .filter((e) => e.employeeId === employeeId)
        .sort(
            (a, b) =>
                new Date(b.date).getTime() -
                new Date(a.date).getTime(),
        );

    const getEventIcon = (type: string) => {
        switch (type) {
            case "HIRED":
                return (
                    <Building2 className="h-4 w-4 text-emerald-600" />
                );
            case "PROMOTED":
                return (
                    <ArrowUpCircle className="h-4 w-4 text-primary" />
                );
            case "CONTRACT_RENEWED":
                return (
                    <ScrollText className="h-4 w-4 text-blue-600" />
                );
            case "SALARY_CHANGE":
                return (
                    <DollarSign className="h-4 w-4 text-amber-600" />
                );
            case "LEAVE":
                return <Plane className="h-4 w-4 text-purple-600" />;
            case "REWARD":
                return <Gift className="h-4 w-4 text-pink-600" />;
            case "DISCIPLINE":
                return (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                );
            case "TRAINING":
                return (
                    <GraduationCap className="h-4 w-4 text-indigo-600" />
                );
            default:
                return (
                    <div className="h-2 w-2 rounded-full bg-slate-400" />
                );
        }
    };

    const getEventBg = (type: string) => {
        switch (type) {
            case "HIRED":
                return "bg-emerald-100 ring-emerald-50";
            case "PROMOTED":
                return "bg-primary/20 ring-primary/5";
            case "CONTRACT_RENEWED":
                return "bg-blue-100 ring-blue-50";
            case "SALARY_CHANGE":
                return "bg-amber-100 ring-amber-50";
            case "LEAVE":
                return "bg-purple-100 ring-purple-50";
            case "REWARD":
                return "bg-pink-100 ring-pink-50";
            case "DISCIPLINE":
                return "bg-red-100 ring-red-50";
            case "TRAINING":
                return "bg-indigo-100 ring-indigo-50";
            default:
                return "bg-slate-100 ring-slate-50";
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    Lịch sử hoạt động
                </CardTitle>
            </CardHeader>
            <CardContent>
                {events.length > 0 ? (
                    <div className="relative border-l ml-6 space-y-8 py-4">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="relative pl-8"
                            >
                                {/* Timeline Icon */}
                                <span
                                    className={`absolute -left-4 top-1 h-8 w-8 rounded-full flex items-center justify-center ring-4 shadow-sm ${getEventBg(event.type)}`}
                                >
                                    {getEventIcon(event.type)}
                                </span>

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                        {event.title}
                                    </h3>
                                    <time className="text-sm text-muted-foreground font-mono mt-1 sm:mt-0">
                                        {new Date(
                                            event.date,
                                        ).toLocaleDateString("vi-VN")}
                                    </time>
                                </div>

                                <Badge
                                    variant="outline"
                                    className="mb-2 text-xs font-normal"
                                >
                                    {event.type}
                                </Badge>

                                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border mt-1">
                                    {event.description}
                                </p>

                                {/* Metadata parsing */}
                                {event.metadata &&
                                    Object.keys(event.metadata)
                                        .length > 0 && (
                                        <div className="mt-2 text-xs font-mono text-muted-foreground bg-background p-2 rounded border border-dashed flex gap-3 flex-wrap">
                                            {Object.entries(
                                                event.metadata as Record<
                                                    string,
                                                    unknown
                                                >,
                                            ).map(([key, val]) => (
                                                <span
                                                    key={key}
                                                    className="bg-muted px-1.5 py-0.5 rounded"
                                                >
                                                    <span className="opacity-70">
                                                        {key}:
                                                    </span>{" "}
                                                    {String(val)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        Không có sự kiện lịch sử nào được ghi nhận.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
