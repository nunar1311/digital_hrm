import { useMemo } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const WorkloadCard = () => {
    const workloadData = useMemo(
        () => [
            { name: "To Do", value: 5, color: "bg-yellow-500" },
            { name: "In Progress", value: 0, color: "bg-blue-500" },
            { name: "Complete", value: 1, color: "bg-green-500" },
        ],
        []
    );

    const total = workloadData.reduce((acc, item) => acc + item.value, 0);

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">
                    Workload by Status
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                            Total Tasks
                        </span>
                        <span className="font-medium">{total}</span>
                    </div>
                    <div className="h-6 rounded-full overflow-hidden flex bg-muted">
                        {workloadData.map((item) => {
                            const percentage =
                                total > 0 ? (item.value / total) * 100 : 0;
                            return percentage > 0 ? (
                                <div
                                    key={item.name}
                                    className={`${item.color} transition-all`}
                                    style={{ width: `${percentage}%` }}
                                    title={`${item.name}: ${item.value}`}
                                />
                            ) : null;
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4">
                    {workloadData.map((item) => (
                        <div
                            key={item.name}
                            className="flex items-center gap-2"
                        >
                            <div
                                className={`w-3 h-3 rounded-full ${item.color}`}
                            />
                            <span className="text-sm text-muted-foreground">
                                {item.name}: {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default WorkloadCard;
