"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { mockContractAppendices } from "@/mock/contracts";

export function ContractAppendicesTab() {
    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">Lịch sử Phụ lục Hợp đồng</CardTitle>
                <CardDescription>Danh sách các thay đổi, gia hạn, hoặc điều chỉnh mức lương đã được ghi nhận</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Mã Phụ lục</TableHead>
                                <TableHead>Nhân viên</TableHead>
                                <TableHead>Loại điều chỉnh</TableHead>
                                <TableHead>Ngày hiệu lực</TableHead>
                                <TableHead>Lý do / Căn cứ</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockContractAppendices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Không có phụ lục hợp đồng nào.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                mockContractAppendices.map((appendix) => (
                                    <TableRow key={appendix.id}>
                                        <TableCell className="font-medium">{appendix.id}</TableCell>
                                        <TableCell>{appendix.employeeName}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                {appendix.changeType}
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(appendix.effectiveDate))}</TableCell>
                                        <TableCell className="text-muted-foreground">{appendix.reason}</TableCell>
                                        <TableCell className="text-right">
                                            <button className="text-primary hover:underline text-sm inline-flex items-center gap-1">
                                                <FileText className="h-4 w-4" /> Xem
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
    );
}
