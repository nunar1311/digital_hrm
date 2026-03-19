import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const AISummaryCard = () => {
    return (
        <Card className="w-full h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">
                    AI Executive Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Executive Summary */}
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                            Executive Summary:{" "}
                        </span>
                        The team has 5 unassigned tasks and 0 tasks in
                        progress. Focus on resource allocation to
                        improve throughput.
                    </p>
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                    <Badge
                        variant="outline"
                        className="bg-yellow-500/10"
                    >
                        TO DO: 5
                    </Badge>
                    <Badge
                        variant="outline"
                        className="bg-blue-500/10"
                    >
                        IN PROGRESS: 0
                    </Badge>
                    <Badge
                        variant="outline"
                        className="bg-green-500/10"
                    >
                        COMPLETE: 1
                    </Badge>
                </div>

                {/* Key Efforts */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                        Key Efforts & Initiatives
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                        <li>Prioritize backlog tasks for Q1</li>
                        <li>
                            Schedule team sync for resource planning
                        </li>
                        <li>Review completed items for accuracy</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};

export default AISummaryCard;
