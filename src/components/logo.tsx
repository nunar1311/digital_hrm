import { cn } from "@/lib/utils";
import React from "react";

const Logo = ({ className }: { className: string }) => {
    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <div
                className={
                    "bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-bold"
                }
            >
                HR
            </div>
            <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">
                    Digital HRM
                </span>
                <span className="truncate text-xs text-muted-foreground">
                    Quản lý nhân sự
                </span>
            </div>
        </div>
    );
};

export default Logo;
