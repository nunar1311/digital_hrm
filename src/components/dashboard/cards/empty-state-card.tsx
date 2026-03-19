import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Inbox } from "lucide-react";

const CARD_BG = "var(--dashboard-card-bg)";
const CARD_FG = "var(--dashboard-card-fg)";
const CARD_BORDER = "var(--dashboard-card-border)";
const MUTED_FOREGROUND = "var(--dashboard-muted-foreground)";

interface EmptyStateCardProps {
    title: string;
}

const EmptyStateCard = ({ title }: EmptyStateCardProps) => {
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
                className="pb-2"
                style={{ borderBottom: `1px solid ${CARD_BORDER}` }}
            >
                <CardTitle className="text-base" style={{ color: CARD_FG }}>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent
                className="flex flex-col items-center justify-center h-[calc(100%-3rem)]"
                style={{ backgroundColor: CARD_BG }}
            >
                <div
                    className="flex flex-col items-center gap-2"
                    style={{ color: MUTED_FOREGROUND }}
                >
                    <Inbox className="h-12 w-12 opacity-50" />
                    <p className="text-sm">No Results</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default EmptyStateCard;
