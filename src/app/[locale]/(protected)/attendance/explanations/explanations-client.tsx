"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import type {
    ExplanationWithAttendance,
    ExplanationWithAttendanceAndUser,
} from "../types";
import { useExplanationsData } from "./use-explanations-data";
import { ExplanationTable } from "./explanation-table";
import { CreateExplanationDialog } from "./create-explanation-dialog";
import { RejectExplanationDialog } from "./reject-explanation-dialog";

export function ExplanationsClient({
    userId,
    myExplanations,
    pendingExplanations,
    allExplanations,
    canApprove,
}: {
    userId: string;
    myExplanations: ExplanationWithAttendance[];
    pendingExplanations: ExplanationWithAttendanceAndUser[];
    allExplanations: ExplanationWithAttendanceAndUser[];
    canApprove: boolean;
}) {
    const t = useTranslations("ProtectedPages");

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [rejectingId, setRejectingId] = useState<string | null>(
        null,
    );

    const {
        myData,
        pendingData,
        allData,
        explainableAttendances,
        submitMutation,
        approveMutation,
        isPending,
    } = useExplanationsData({
        userId,
        myExplanations,
        pendingExplanations,
        allExplanations,
        canApprove,
    });

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t("attendanceExplanationsPageTitle")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("attendanceExplanationsPageDescription")}
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t("attendanceExplanationsPageCreateButton")}
                </Button>
            </div>

            <Tabs defaultValue="my">
                <TabsList>
                    <TabsTrigger value="my">
                        {t("attendanceExplanationsTabMy")} ({myData.length})
                    </TabsTrigger>
                    {canApprove && (
                        <TabsTrigger value="pending">
                            {t("attendanceExplanationsTabPending")} ({pendingData.length})
                        </TabsTrigger>
                    )}
                    {canApprove && (
                        <TabsTrigger value="all">
                            {t("attendanceExplanationsTabAll")} ({allData.length})
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="my" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {t("attendanceExplanationsCardMyTitle")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ExplanationTable
                                explanations={myData}
                                showUser={false}
                                showActions={false}
                                isPending={isPending}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {canApprove && (
                    <TabsContent value="pending" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-yellow-500" />{" "}
                                    {t("attendanceExplanationsCardPendingTitle")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ExplanationTable
                                    explanations={pendingData}
                                    showUser={true}
                                    showActions="approve"
                                    isPending={isPending}
                                    onApprove={(id) =>
                                        approveMutation.mutate({
                                            id,
                                            action: "APPROVED",
                                        })
                                    }
                                    onReject={(id) =>
                                        setRejectingId(id)
                                    }
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {canApprove && (
                    <TabsContent value="all" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {t("attendanceExplanationsCardAllTitle")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ExplanationTable
                                    explanations={allData}
                                    showUser={true}
                                    showActions={false}
                                    isPending={isPending}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>

            <CreateExplanationDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                explainableAttendances={explainableAttendances}
                isPending={isPending}
                onSubmit={(form) => {
                    submitMutation.mutate(form, {
                        onSuccess: () => setIsCreateOpen(false),
                    });
                }}
            />

            <RejectExplanationDialog
                open={!!rejectingId}
                onOpenChange={(open) => {
                    if (!open) setRejectingId(null);
                }}
                isPending={isPending}
                onConfirm={(reason) => {
                    if (rejectingId) {
                        approveMutation.mutate(
                            {
                                id: rejectingId,
                                action: "REJECTED",
                                reason,
                            },
                            {
                                onSuccess: () => setRejectingId(null),
                            },
                        );
                    }
                }}
            />
        </div>
    );
}
