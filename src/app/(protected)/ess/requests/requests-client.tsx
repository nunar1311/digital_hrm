"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { submitAdministrativeRequest } from "../actions";
import { toast } from "sonner";
import { Plus } from "lucide-react";

function formatDate(isoDate?: Date | string | null) {
    if (!isoDate) return "";
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(isoDate));
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "APPROVED":
            return <Badge variant="secondary" className="bg-green-100 text-green-800">Đã duyệt</Badge>;
        case "REJECTED":
            return <Badge variant="destructive">Từ chối</Badge>;
        default:
            return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Đang chờ</Badge>;
    }
}

export function RequestsClient({ initialRequests }: { initialRequests: any[] }) {
    const [isNewOpen, setIsNewOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [type, setType] = useState("SALARY_CONFIRMATION");
    const [description, setDescription] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (!description.trim()) {
            toast.error("Vui lòng nhập chi tiết yêu cầu");
            return;
        }
        
        setIsSubmitting(true);
        try {
            await submitAdministrativeRequest({
                type,
                description
            });
            toast.success("Đã gửi yêu cầu hành chính thành công.");
            setIsNewOpen(false);
            setDescription("");
            setType("SALARY_CONFIRMATION");
        } catch (error) {
            toast.error("Có lỗi xảy ra khi gửi yêu cầu.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const typeLabels: Record<string, string> = {
        "SALARY_CONFIRMATION": "Xác nhận lương",
        "VISA_APPLICATION": "Hỗ trợ xin Visa",
        "WORK_CERTIFICATE": "Giấy xác nhận công tác",
        "OTHER": "Khác"
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle>Danh sách yêu cầu hành chính</CardTitle>
                        <CardDescription>Theo dõi trạng thái các yêu cầu bạn đã gửi</CardDescription>
                    </div>
                    <Button onClick={() => setIsNewOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Gửi yêu cầu mới
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Ngày gửi</TableHead>
                                    <TableHead>Loại yêu cầu</TableHead>
                                    <TableHead>Chi tiết</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Kết quả/Lý do</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialRequests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                            Bạn chưa có yêu cầu hành chính nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    initialRequests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium whitespace-nowrap">{formatDate(req.createdAt)}</TableCell>
                                            <TableCell className="whitespace-nowrap">{typeLabels[req.type] || req.type}</TableCell>
                                            <TableCell className="max-w-[300px] truncate" title={req.description}>
                                                {req.description}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={req.status} />
                                            </TableCell>
                                            <TableCell className="max-w-[200px]">
                                                {req.rejectReason && (
                                                    <span className="text-destructive text-sm" title={req.rejectReason}>Từ chối: {req.rejectReason}</span>
                                                )}
                                                {req.responseAttachment && (
                                                    <a href={req.responseAttachment} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                                                        Tải văn bản
                                                    </a>
                                                )}
                                                {!req.rejectReason && !req.responseAttachment && (
                                                    <span className="text-muted-foreground text-sm">-</span>
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

            <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Gửi yêu cầu hành chính mới</DialogTitle>
                            <DialogDescription>
                                Phòng HCNS sẽ tiếp nhận và xử lý yêu cầu của bạn.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Loại yêu cầu</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn loại yêu cầu" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SALARY_CONFIRMATION">Xác nhận lương</SelectItem>
                                        <SelectItem value="WORK_CERTIFICATE">Giấy xác nhận công tác</SelectItem>
                                        <SelectItem value="VISA_APPLICATION">Hỗ trợ xin Visa (chứng minh tài chính, vv)</SelectItem>
                                        <SelectItem value="OTHER">Yêu cầu khác</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="description">Chi tiết yêu cầu</Label>
                                <Textarea 
                                    id="description" 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    placeholder="Vui lòng ghi rõ mục đích, thời gian cần nhận kết quả (nếu có)..."
                                    rows={4}
                                />
                            </div>
                        </div>
                        
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsNewOpen(false)}>
                                Hủy bỏ
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
