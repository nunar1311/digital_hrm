"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, FileType2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { mockContractTemplates } from "@/mock/contracts";
import type { ContractTemplate } from "@/types";
import Link from "next/link";

export default function TemplatesClient() {
    const [exportingId, setExportingId] = useState<string | null>(null);

    const handleExport = (templateId: string, formatName: "PDF" | "Word") => {
        setExportingId(`${templateId}-${formatName}`);

        // TODO: Replace this mock timeout with the real Backend API call (Puppeteer/Docxtemplater)
        setTimeout(() => {
            setExportingId(null);
            toast.success(`Đã xuất mẫu hợp đồng thành công`, {
                description: `Tệp ${formatName} đã được tải xuống thiết bị của bạn.`
            });
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/contracts" className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm transition-colors">
                            <ArrowLeft className="mr-1 h-4 w-4" /> Về Màn hình chính
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Mẫu Hợp đồng</h1>
                    <p className="text-muted-foreground">Lưu trữ và xuất các biểu mẫu hợp đồng tiêu chuẩn đã được ban hành.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockContractTemplates.map((template: ContractTemplate) => (
                    <Card key={template.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-start gap-2 text-lg">
                                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <span className="leading-tight">{template.name}</span>
                            </CardTitle>
                            <CardDescription>
                                Cập nhật: {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(template.createdAt))}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-sm text-foreground/80 line-clamp-3" dangerouslySetInnerHTML={{ __html: template.content || "" }} />
                        </CardContent>
                        <CardFooter className="pt-4 border-t flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handleExport(template.id, "PDF")}
                                disabled={exportingId !== null}
                            >
                                {exportingId === `${template.id}-PDF` ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <FileType2 className="mr-2 h-4 w-4 text-red-500/80" />
                                )}
                                Xuất PDF
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleExport(template.id, "Word")}
                                disabled={exportingId !== null}
                            >
                                {exportingId === `${template.id}-Word` ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4 text-blue-500/80" />
                                )}
                                Xuất Word
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
