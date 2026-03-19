import {
    Card,
    CardContent,
} from "@/components/ui/card";

interface MetricCardProps {
    title: string;
    value: number;
    label: string;
    variant?: "warning" | "info" | "success";
}

const variantStyles = {
    warning: {
        badge: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        icon: "text-yellow-500",
    },
    info: {
        badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        icon: "text-blue-500",
    },
    success: {
        badge: "bg-green-500/10 text-green-600 border-green-500/20",
        icon: "text-green-500",
    },
};

const MetricCard = ({ title, value, label, variant = "info" }: MetricCardProps) => {
    const styles = variantStyles[variant];

    return (
        <Card className="h-full flex flex-col justify-center">
            <CardContent className="p-4">
                <div className="flex flex-col items-center justify-center text-center gap-1">
                    <span className="text-3xl font-bold">{value}</span>
                    <span className="text-sm text-muted-foreground">
                        {label}
                    </span>
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full mt-1 ${styles.badge}`}
                    >
                        {title}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};

export default MetricCard;
