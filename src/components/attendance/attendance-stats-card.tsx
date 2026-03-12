import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { AttendanceRecord } from "@/app/(protected)/attendance/types";

interface StatusInfo {
    label: string;
    color: string;
}

interface AttendanceStatsCardProps {
    att?: AttendanceRecord | null;
    statusInfo?: StatusInfo | null;
}

export function AttendanceStatsCard({
    att,
    statusInfo,
}: AttendanceStatsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Thống kê hôm nay</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex items-center justify-between border-b py-2">
                        <span className="text-sm font-medium">
                            Giờ làm việc
                        </span>
                        <span className="text-lg font-bold">
                            {att?.workHours || 0}h
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-b py-2">
                        <span className="text-sm font-medium">
                            Làm thêm (OT)
                        </span>
                        <span className="text-lg font-bold">
                            {att?.overtimeHours || 0}h
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-b py-2">
                        <span className="text-sm font-medium">
                            Phương thức
                        </span>
                        <span className="text-sm">
                            {att?.checkInMethod || "—"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium">
                            Trạng thái
                        </span>
                        <span className="text-sm font-bold capitalize text-primary">
                            {statusInfo?.label || "Chưa ghi nhận"}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
