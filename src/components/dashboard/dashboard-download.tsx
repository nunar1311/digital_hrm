import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ArrowDownToLine, Mail } from "lucide-react";

interface DashboardDownloadProps {
    onPrint?: () => void;
    isExporting?: boolean;
}

const DashboardDownload = ({
    onPrint,
    isExporting,
}: DashboardDownloadProps) => {
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    tooltip={"Xuất dữ liệu PDF"}
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
                    Tải PDF
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isExporting}>
                    <Mail />
                    Xuất PDF sang Email
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default DashboardDownload;
