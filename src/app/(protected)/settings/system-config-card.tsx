"use client";

import { Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { SYSTEM_FIELDS } from "./constants";

interface SystemConfigCardProps {
    settings: Record<string, string>;
    canEdit: boolean;
    onFieldChange: (key: string, value: string) => void;
}

export function SystemConfigCard({
    settings,
    canEdit,
    onFieldChange,
}: SystemConfigCardProps) {
    const workHours = SYSTEM_FIELDS.standardWorkHours;
    const workDays = SYSTEM_FIELDS.standardWorkDays;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Cấu hình hệ thống
                </CardTitle>
                <CardDescription>
                    Giờ làm chuẩn mỗi ngày và ngày công chuẩn mỗi tháng
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor={workHours.key}>Giờ làm chuẩn/ngày</Label>
                        <Input
                            id={workHours.key}
                            type="number"
                            min={1}
                            max={24}
                            value={settings[workHours.key] ?? workHours.default}
                            onChange={(e) => onFieldChange(workHours.key, e.target.value)}
                            disabled={!canEdit}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={workDays.key}>Ngày công chuẩn/tháng</Label>
                        <Input
                            id={workDays.key}
                            type="number"
                            min={1}
                            max={31}
                            value={settings[workDays.key] ?? workDays.default}
                            onChange={(e) => onFieldChange(workDays.key, e.target.value)}
                            disabled={!canEdit}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
