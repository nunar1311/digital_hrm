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
}

const DashboardDownload = ({ onPrint }: DashboardDownloadProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    tooltip={"Xuất dữ liệu PDF"}
                    variant="ghost"
                    size="icon-sm"
                >
                    <ArrowDownToLine />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onPrint}>
                    <ArrowDownToLine />
                    Tải PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Mail />
                    Xuất PDF sang Email
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default DashboardDownload;
