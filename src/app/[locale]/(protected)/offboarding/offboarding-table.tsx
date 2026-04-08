"use client";

import { Eye, CheckCircle, Trash2, User, FileText, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { OffboardingListItem, OffboardingStatus } from "./types";
import { OFFBOARDING_STATUS_LABELS, OFFBOARDING_STATUS_COLORS } from "./types";
import { useTimezone } from "@/hooks/use-timezone";
import { useTranslations } from "next-intl";

interface OffboardingTableProps {
    offboardings: OffboardingListItem[];
    isLoading: boolean;
    canManage: boolean;
    onComplete?: (id: string) => void;
    onDelete?: (id: string) => void;
}

function StatusBadge({ status }: { status: OffboardingStatus }) {
    const colorClass = OFFBOARDING_STATUS_COLORS[status];
    return (
        <Badge className={`${colorClass} text-white`}>
            {OFFBOARDING_STATUS_LABELS[status]}
        </Badge>
    );
}
export function OffboardingTable({
    offboardings,
    isLoading,
    canManage,
    onComplete,
    onDelete,
}: OffboardingTableProps) {
    const { formatDate } = useTimezone();
    const router = useRouter();
    const t = useTranslations("ProtectedPages");

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">{t("offboardingTableLoading")}</div>
            </div>
        );
    }

    if (offboardings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("offboardingTableEmpty")}</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t("offboardingTableColEmployee")}</TableHead>
                    <TableHead>{t("offboardingTableColResignDate")}</TableHead>
                    <TableHead>{t("offboardingTableColLastWorkDate")}</TableHead>
                    <TableHead>{t("offboardingTableColTemplate")}</TableHead>
                    <TableHead>{t("offboardingTableColChecklist")}</TableHead>
                    <TableHead>{t("offboardingTableColAssets")}</TableHead>
                    <TableHead>{t("offboardingTableColStatus")}</TableHead>
                    <TableHead>{t("offboardingTableColCreatedAt")}</TableHead>
                    <TableHead className="text-right">{t("offboardingTableColActions")}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {offboardings.map((offboarding) => (
                    <TableRow key={offboarding.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={offboarding.user.image || undefined} />
                                    <AvatarFallback>
                                        {offboarding.user.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{offboarding.user.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {offboarding.user.employeeCode || offboarding.user.email}
                                    </div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="cursor-pointer">
                                            {formatDate(offboarding.resignDate, { day: "2-digit", month: "2-digit", year: "numeric" })}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t("offboardingTableTooltipResignDate")}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </TableCell>
                        <TableCell>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="cursor-pointer font-medium">
                                            {formatDate(offboarding.lastWorkDate, { day: "2-digit", month: "2-digit", year: "numeric" })}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t("offboardingTableTooltipLastWorkDate")}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </TableCell>
                        <TableCell>
                            {offboarding.template ? (
                                <Badge variant="outline">
                                    {offboarding.template.name}
                                </Badge>
                            ) : (
                                <span className="text-muted-foreground text-sm">{t("offboardingTableDefaultTemplate")}</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>{t("offboardingTableChecklistCount", { count: offboarding._count.checklist })}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span>{t("offboardingTableAssetsCount", { count: offboarding._count.assets })}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <StatusBadge status={offboarding.status as OffboardingStatus} />
                        </TableCell>
                        <TableCell>
                            <div className="text-sm text-muted-foreground">
                                {formatDate(offboarding.createdAt, { day: "2-digit", month: "2-digit", year: "numeric" })}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/offboarding/${offboarding.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t("offboardingTableActionView")}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                {canManage && offboarding.status === "PROCESSING" && (
                                    <>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onComplete?.(offboarding.id)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t("offboardingTableActionComplete")}</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onDelete?.(offboarding.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t("offboardingTableActionDelete")}</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
