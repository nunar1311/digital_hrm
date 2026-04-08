"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, FileType2, History, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
    createContractAddendum,
    exportContractDocument,
    getContractById,
} from "@/app/(protected)/contracts/actions";
import type { ContractDetailItem } from "@/types/contract";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
    contractId: string;
    initialData: ContractDetailItem;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
}

export function ContractDetailClient({ contractId, initialData }: Props) {
    const queryClient = useQueryClient();
    const [addendumType, setAddendumType] = useState<"EXTENSION" | "SALARY_CHANGE">("EXTENSION");
    const [title, setTitle] = useState("");
    const [effectiveDate, setEffectiveDate] = useState("");
    const [newEndDate, setNewEndDate] = useState("");
    const [newSalary, setNewSalary] = useState("");
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");

    const { data } = useQuery({
        queryKey: ["contracts", "detail", contractId],
        queryFn: () => getContractById(contractId),
        initialData,
    });

    const addendumMutation = useMutation({
        mutationFn: createContractAddendum,
        onSuccess: (result) => {
            if (!result.success) {
                toast.error(result.message || "Không thể tạo phụ lục");
                return;
            }
            toast.success("Đã lưu phụ lục hợp đồng.");
            setTitle("");
            setEffectiveDate("");
            setNewEndDate("");
            setNewSalary("");
            setReason("");
            setNotes("");
            queryClient.invalidateQueries({ queryKey: ["contracts", "detail", contractId] });
            queryClient.invalidateQueries({ queryKey: ["contracts", "list"] });
        },
        onError: () => {
            toast.error("Không thể tạo phụ lục hợp đồng");
        },
    });

    const exportMutation = useMutation({
        mutationFn: exportContractDocument,
        onSuccess: (result) => {
            const blob = base64ToBlob(result.base64Content, result.mimeType);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = result.fileName;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
            toast.success("Đã xuất file hợp đồng.");
        },
        onError: () => {
            toast.error("Không thể xuất file hợp đồng");
        },
    });

    const addendumRows = useMemo(() => data?.addendums ?? [], [data?.addendums]);

    if (!data) {
        return (
            <Card>
                <CardContent className="py-10 text-center text-muted-foreground">Không tìm thấy hợp đồng.</CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-3">
                        <span>
                            {data.contractNumber} - {data.title}
                        </span>
                        <ContractStatusBadge status={data.status} />
                    </CardTitle>
                    <CardDescription>
                        {data.employee.name} ({data.employee.employeeCode || "N/A"})
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Loại hợp đồng</p>
                            <p className="font-medium">{data.contractTypeName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Ngày hiệu lực</p>
                            <p className="font-medium">{new Date(data.startDate).toLocaleDateString("vi-VN")}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Ngày hết hạn</p>
                            <p className="font-medium">
                                {data.endDate
                                    ? new Date(data.endDate).toLocaleDateString("vi-VN")
                                    : "Không thời hạn"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Lương chính thức</p>
                            <p className="font-medium">
                                {data.salary
                                    ? new Intl.NumberFormat("vi-VN", {
                                          style: "currency",
                                          currency: data.currency,
                                          maximumFractionDigits: 0,
                                      }).format(data.salary)
                                    : "-"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() =>
                                exportMutation.mutate({
                                    contractId,
                                    format: "DOCX",
                                })
                            }
                            disabled={exportMutation.isPending}
                        >
                            {exportMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileText className="h-4 w-4" />
                            )}
                            Xuất DOCX
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() =>
                                exportMutation.mutate({
                                    contractId,
                                    format: "PDF",
                                })
                            }
                            disabled={exportMutation.isPending}
                        >
                            {exportMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileType2 className="h-4 w-4" />
                            )}
                            Xuất PDF
                        </Button>
                        {data.fileUrl && (
                            <Button variant="ghost" asChild>
                                <a href={data.fileUrl} target="_blank" rel="noreferrer">
                                    <Download className="h-4 w-4" />
                                    Tải file đính kèm
                                </a>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Thêm phụ lục</CardTitle>
                    <CardDescription>
                        Quản lý lịch sử gia hạn hợp đồng và điều chỉnh lương.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">Loại phụ lục</label>
                            <Select
                                value={addendumType}
                                onValueChange={(value) =>
                                    setAddendumType(value as "EXTENSION" | "SALARY_CHANGE")
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXTENSION">Gia hạn hợp đồng</SelectItem>
                                    <SelectItem value="SALARY_CHANGE">Điều chỉnh lương</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">Tiêu đề phụ lục</label>
                            <Input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="Ví dụ: Gia hạn hợp đồng 12 tháng"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">Ngày hiệu lực</label>
                            <Input
                                value={effectiveDate}
                                type="date"
                                onChange={(event) => setEffectiveDate(event.target.value)}
                            />
                        </div>

                        {addendumType === "EXTENSION" ? (
                            <div>
                                <label className="mb-1 block text-xs text-muted-foreground">Ngày hết hạn mới</label>
                                <Input
                                    value={newEndDate}
                                    type="date"
                                    onChange={(event) => setNewEndDate(event.target.value)}
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="mb-1 block text-xs text-muted-foreground">Lương mới</label>
                                <Input
                                    value={newSalary}
                                    type="number"
                                    onChange={(event) => setNewSalary(event.target.value)}
                                    placeholder="Nhập mức lương mới"
                                />
                            </div>
                        )}

                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">Lý do</label>
                            <Input
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                placeholder="Lý do thay đổi"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Ghi chú</label>
                        <Textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Thông tin bổ sung"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={() => {
                                if (!effectiveDate) {
                                    toast.error("Vui lòng chọn ngày hiệu lực phụ lục.");
                                    return;
                                }

                                addendumMutation.mutate({
                                    contractId,
                                    addendumType,
                                    title,
                                    effectiveDate: new Date(effectiveDate),
                                    ...(addendumType === "EXTENSION"
                                        ? {
                                              newEndDate: newEndDate
                                                  ? new Date(newEndDate)
                                                  : null,
                                          }
                                        : {
                                              newSalary: newSalary ? Number(newSalary) : null,
                                          }),
                                    reason: reason || null,
                                    notes: notes || null,
                                });
                            }}
                            disabled={addendumMutation.isPending}
                        >
                            {addendumMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Lưu phụ lục
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <History className="h-4 w-4" />
                        Lịch sử phụ lục
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ngày hiệu lực</TableHead>
                                <TableHead>Loại phụ lục</TableHead>
                                <TableHead>Nội dung</TableHead>
                                <TableHead>Giá trị thay đổi</TableHead>
                                <TableHead>Người tạo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {addendumRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        Chưa có phụ lục cho hợp đồng này.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                addendumRows.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            {new Date(item.effectiveDate).toLocaleDateString("vi-VN")}
                                        </TableCell>
                                        <TableCell>
                                            {item.addendumType === "EXTENSION"
                                                ? "Gia hạn"
                                                : "Điều chỉnh lương"}
                                        </TableCell>
                                        <TableCell>{item.title}</TableCell>
                                        <TableCell>
                                            {item.addendumType === "EXTENSION"
                                                ? `${item.oldEndDate ? new Date(item.oldEndDate).toLocaleDateString("vi-VN") : "-"} -> ${item.newEndDate ? new Date(item.newEndDate).toLocaleDateString("vi-VN") : "-"}`
                                                : `${item.oldSalary ?? "-"} -> ${item.newSalary ?? "-"}`}
                                        </TableCell>
                                        <TableCell>{item.createdByName || "N/A"}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
