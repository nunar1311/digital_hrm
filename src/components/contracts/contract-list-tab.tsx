"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, FileText } from "lucide-react";
import { mockContracts } from "@/mock/contracts";
import { formatVND } from "@/mock/helpers";

const CURRENT_TIMESTAMP = Date.now();

export function ContractListTab() {
    const [searchTerm, setSearchTerm] = useState("");

    // Identify contracts expiring soon (based on mock status for now)
    const expiringContracts = mockContracts.filter(c => c.status === "ACTIVE" && c.endDate && (new Date(c.endDate).getTime() - CURRENT_TIMESTAMP < 30 * 24 * 60 * 60 * 1000));

    const filteredContracts = mockContracts.filter(c =>
        (c.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.employeeCode || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string, endDate: string | null) => {
        if (status === "ACTIVE" && endDate && (new Date(endDate).getTime() - CURRENT_TIMESTAMP < 30 * 24 * 60 * 60 * 1000)) {
            return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Sắp hết hạn</Badge>;
        }
        switch (status) {
            case "ACTIVE":
                return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Đang hiệu lực</Badge>;
            case "EXPIRED":
                return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Đã hết hạn</Badge>;
            case "DRAFT":
                return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">Bản nháp</Badge>;
            case "TERMINATED":
                return <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200">Chấm dứt</Badge>;
            default:
                return <Badge variant="outline">Không xác định</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {expiringContracts.length > 0 && (
                <Card className="border-amber-200 bg-amber-50 shadow-sm">
                    <CardHeader className="pb-3 text-amber-800">
                        <CardTitle className="flex items-center text-lg gap-2">
                            <AlertTriangle className="h-5 w-5" /> Cảnh báo: Hợp đồng sắp hết hạn
                        </CardTitle>
                        <CardDescription className="text-amber-700/80">
                            Có {expiringContracts.length} hợp đồng chuẩn bị hết hạn trong 30 ngày tới. Vui lòng rà soát và tạo phụ lục gia hạn.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            <Card className="shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
                    <div>
                        <CardTitle className="text-lg">Danh sách Hợp đồng</CardTitle>
                        <CardDescription>Toàn bộ hợp đồng hiện có trên hệ thống</CardDescription>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm nhân viên, phòng ban..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Nhân viên</TableHead>
                                    <TableHead>Loại hợp đồng</TableHead>
                                    <TableHead>Ngày ký</TableHead>
                                    <TableHead>Ngày hết hạn</TableHead>
                                    <TableHead className="text-right">Mức lương</TableHead>
                                    <TableHead className="text-center">Trạng thái</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredContracts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            Không tìm thấy hợp đồng nào.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredContracts.map((contract) => (
                                        <TableRow key={contract.id}>
                                            <TableCell>
                                                <div className="font-medium">{contract.employeeName || "Không xác định"}</div>
                                                <div className="text-xs text-muted-foreground">{contract.employeeCode || "N/A"}</div>
                                            </TableCell>
                                            <TableCell>{contract.contractType}</TableCell>
                                            <TableCell>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(contract.startDate))}</TableCell>
                                            <TableCell>
                                                {contract.endDate ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(contract.endDate)) : "Vô thời hạn"}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{formatVND(contract.salary)}</TableCell>
                                            <TableCell className="text-center">
                                                {getStatusBadge(contract.status, contract.endDate)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <button className="text-primary hover:underline text-sm inline-flex items-center gap-1">
                                                    <FileText className="h-4 w-4" /> Chi tiết
                                                </button>
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
