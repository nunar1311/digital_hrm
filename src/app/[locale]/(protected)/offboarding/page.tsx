
"use client";

import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, FileText, UserMinus, AlertCircle, CheckCircle2 } from "lucide-react";

type LegacyReasonCode =
    | "EDUCATION"
    | "CAREER_CHANGE"
    | "FAMILY"
    | "INTERNSHIP_COMPLETED";

const offboardingList = [
    {
        id: "1",
        name: "Le Van Tam",
        code: "NV008",
        resignDate: "10/03/2026",
        lastWorkDate: "30/03/2026",
        progress: 40,
        status: "PROCESSING",
        reason: "EDUCATION" as LegacyReasonCode,
    },
    {
        id: "2",
        name: "Nguyen Thi Mai",
        code: "NV025",
        resignDate: "01/03/2026",
        lastWorkDate: "15/03/2026",
        progress: 90,
        status: "PROCESSING",
        reason: "CAREER_CHANGE" as LegacyReasonCode,
    },
    {
        id: "3",
        name: "Tran Minh Hoang",
        code: "NV102",
        resignDate: "15/02/2026",
        lastWorkDate: "28/02/2026",
        progress: 100,
        status: "COMPLETED",
        reason: "FAMILY" as LegacyReasonCode,
    },
    {
        id: "4",
        name: "Hoang Phuong Thao",
        code: "NV257",
        resignDate: "12/03/2026",
        lastWorkDate: "12/04/2026",
        progress: 10,
        status: "PROCESSING",
        reason: "INTERNSHIP_COMPLETED" as LegacyReasonCode,
    },
];

export default function OffboardingPage() {
    const t = useTranslations("ProtectedPages");

    return (
        <div className="h-screen overflow-y-auto bg-slate-50/30">
            <div className="p-8 space-y-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <UserMinus className="text-rose-600 w-9 h-9" />
                            {t("offboardingLegacyTitle")}
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">{t("offboardingLegacyDescription")}</p>
                    </div>
                    <Button className="bg-rose-600 hover:bg-rose-700 shadow-md">
                        <FileText className="mr-2 w-4 h-4" />
                        {t("offboardingLegacyCreateRequest")}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-slate-500">{t("offboardingLegacyStatTotal")}</CardTitle>
                            <LogOut className="w-4 h-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">15</div>
                            <p className="text-xs text-slate-400 mt-1">{t("offboardingLegacyStatPeriod")}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-slate-500">{t("offboardingLegacyStatProcessing")}</CardTitle>
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-600">06</div>
                            <p className="text-xs text-slate-400 mt-1">{t("offboardingLegacyStatProcessingHint")}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-slate-500">{t("offboardingLegacyStatCompleted")}</CardTitle>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">09</div>
                            <p className="text-xs text-slate-400 mt-1">{t("offboardingLegacyStatCompletedHint")}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-10">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">{t("offboardingLegacyTableTitle")}</h3>
                    </div>

                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="font-bold">{t("offboardingTableColEmployee")}</TableHead>
                                <TableHead className="font-bold">{t("offboardingLegacyColSubmittedDate")}</TableHead>
                                <TableHead className="font-bold">{t("offboardingTableColLastWorkDate")}</TableHead>
                                <TableHead className="w-[200px] font-bold">{t("offboardingLegacyColProgress")}</TableHead>
                                <TableHead className="font-bold text-center">{t("offboardingTableColStatus")}</TableHead>
                                <TableHead className="font-bold text-right">{t("offboardingTableColActions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {offboardingList.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{item.name}</span>
                                            <span className="text-xs text-slate-500">
                                                {item.code} - {t(`offboardingLegacyReason_${item.reason}`)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{item.resignDate}</TableCell>
                                    <TableCell className="text-slate-600 font-medium">{item.lastWorkDate}</TableCell>
                                    <TableCell>
                                        <div className="space-y-2">
                                            <Progress
                                                value={item.progress}
                                                className={`h-2 ${item.progress === 100 ? "bg-green-100" : "bg-slate-100"}`}
                                            />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                {t("offboardingLegacyProgressText", { progress: item.progress })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={item.status === "COMPLETED" ? "default" : "secondary"}
                                            className={
                                                item.status === "COMPLETED"
                                                    ? "bg-green-100 text-green-700 hover:bg-green-100 shadow-none border-none"
                                                    : "bg-amber-100 text-amber-700 hover:bg-amber-100 shadow-none border-none"
                                            }
                                        >
                                            {item.status === "COMPLETED"
                                                ? t("offboardingFilterCompleted")
                                                : t("offboardingFilterProcessing")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-600 font-bold hover:text-blue-700 hover:bg-blue-50"
                                        >
                                            {t("offboardingTableActionView")}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
