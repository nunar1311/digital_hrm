import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

interface Props {
    status: string | undefined | null;
}

export function EmployeeStatusBadge({ status }: Props) {
    const t = useTranslations("ProtectedPages");

    switch (status) {
        case "ACTIVE":
            return (
                <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary border-primary"
                >
                    {t("employeesStatusActive")}
                </Badge>
            );
        case "ON_LEAVE":
            return (
                <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-600 hover:bg-amber-50 hover:text-amber-600 border-amber-200"
                >
                    {t("employeesStatusOnLeave")}
                </Badge>
            );
        case "RESIGNED":
            return (
                <Badge
                    variant="outline"
                    className="bg-slate-50 text-slate-600 hover:bg-slate-50 hover:text-slate-600 border-slate-200"
                >
                    {t("employeesStatusResigned")}
                </Badge>
            );
        case "TERMINATED":
            return <Badge variant="destructive">{t("employeesStatusTerminated")}</Badge>;
        default:
            return <Badge variant="secondary">{t("employeesStatusUnknown")}</Badge>;
    }
}
