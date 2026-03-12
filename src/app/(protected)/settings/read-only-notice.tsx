"use client";

import { Clock } from "lucide-react";
import {
    Card,
    CardContent,
} from "@/components/ui/card";

export function ReadOnlyNotice() {
    return (
        <Card className="border-dashed">
            <CardContent className="flex items-center gap-2 py-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    Bạn chỉ có quyền xem cài đặt. Liên hệ quản
                    trị viên để thay đổi.
                </p>
            </CardContent>
        </Card>
    );
}
