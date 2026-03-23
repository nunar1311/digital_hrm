"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatTime(isoDate?: Date | string | null) {
    if (!isoDate) return "--:--";
    return new Intl.DateTimeFormat("vi-VN", { timeStyle: "short" }).format(new Date(isoDate));
}

function formatDate(isoDate?: Date | string | null) {
    if (!isoDate) return "";
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(isoDate));
}

export function AttendanceClient({ 
    initialAttendances, 
    initialSummary,
    currentMonth,
    currentYear 
}: { 
    initialAttendances: any[];
    initialSummary: any;
    currentMonth: number;
    currentYear: number;
}) {
    const router = useRouter();
    const [month, setMonth] = useState(currentMonth.toString());
    const [year, setYear] = useState(currentYear.toString());

    function handleFilter() {
        router.push(`/ess/attendance?month=${month}&year=${year}`);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle>Bảng công Tháng {currentMonth}/{currentYear}</CardTitle>
                    <CardDescription>Xem chi tiết lịch sử chấm công của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Tháng" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <SelectItem key={m} value={m.toString()}>Tháng {m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Năm" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((y) => (
                                    <SelectItem key={y} value={y.toString()}>Năm {y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        <Button onClick={handleFilter}>Lọc dữ liệu</Button>
                    </div>

                    {initialSummary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6 p-4 bg-muted rounded-lg">
                            <div>
                                <div className="text-sm text-muted-foreground">Công chuẩn</div>
                                <div className="font-semibold">{initialSummary.standardDays}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Ngày làm</div>
                                <div className="font-semibold text-primary">{initialSummary.totalWorkDays}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Đi trễ/Về sớm</div>
                                <div className="font-semibold text-orange-600">{initialSummary.lateDays} / {initialSummary.earlyLeaveDays}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Nghỉ phép</div>
                                <div className="font-semibold text-green-600">{initialSummary.leaveDays}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Nghỉ không lương</div>
                                <div className="font-semibold text-destructive">{initialSummary.unpaidLeaveDays}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Tăng ca</div>
                                <div className="font-semibold text-blue-600">{initialSummary.totalOtHours}h</div>
                            </div>
                        </div>
                    )}

                    <div className="rounded-md border border-border">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Ngày</TableHead>
                                    <TableHead>Ca làm</TableHead>
                                    <TableHead>Vào</TableHead>
                                    <TableHead>Ra</TableHead>
                                    <TableHead>Trễ/Sớm</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Ghi chú</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialAttendances.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                            Không có dữ liệu chấm công cho tháng này
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    initialAttendances.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                                            <TableCell>{record.shift?.name || "MD"}</TableCell>
                                            <TableCell>{formatTime(record.checkIn)}</TableCell>
                                            <TableCell>{formatTime(record.checkOut)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs">
                                                    {record.lateMinutes > 0 && <span className="text-orange-600">Trễ: {record.lateMinutes}p</span>}
                                                    {record.earlyMinutes > 0 && <span className="text-orange-600">Sớm: {record.earlyMinutes}p</span>}
                                                    {record.lateMinutes === 0 && record.earlyMinutes === 0 && <span className="text-muted-foreground">-</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {record.status === "PRESENT" ? (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800">Có mặt</Badge>
                                                ) : record.status === "ABSENT" ? (
                                                    <Badge variant="destructive">Vắng</Badge>
                                                ) : record.status === "LEAVE" ? (
                                                    <Badge variant="outline" className="text-blue-600 border-blue-600">Nghỉ phép</Badge>
                                                ) : (
                                                    <Badge variant="outline">{record.status}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                                {record.note}
                                                {record.explanation && (
                                                    <span className="ml-1 text-blue-600" title={record.explanation.reason}>[Giải trình]</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
