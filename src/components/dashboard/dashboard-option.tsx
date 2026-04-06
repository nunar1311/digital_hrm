import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ArrowDownToLine, Mail, MoreHorizontal } from "lucide-react";

const DashboardOption = ({
    onPrint,
    isExporting,
}: {
    onPrint: () => void;
    isExporting?: boolean;
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isExporting}
                >
                    <MoreHorizontal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <ArrowDownToLine /> Chế độ xem dạng xuất
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
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
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center bg-primary hover:bg-primary! text-white focus:text-white">
                    Chia sẻ & Quyền
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default DashboardOption;
