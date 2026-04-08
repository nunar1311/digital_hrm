import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ArrowDownToLine, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

interface DashboardDownloadProps {
    onPrint?: () => void;
    isExporting?: boolean;
}

const DashboardDownload = ({
    onPrint,
    isExporting,
}: DashboardDownloadProps) => {
    const t = useTranslations("Dashboard");

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    tooltip={t("exportPdfTooltip")}
                    variant="ghost"
                    size="icon-sm"
                    disabled={isExporting}
                >
                    <ArrowDownToLine />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={onPrint}
                    disabled={isExporting}
                >
                    <ArrowDownToLine />
                    {t("downloadPdf")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isExporting}>
                    <Mail />
                    {t("exportPdfToEmail")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default DashboardDownload;
