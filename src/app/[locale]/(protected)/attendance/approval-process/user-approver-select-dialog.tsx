"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Check, Loader2, User, ChevronLeft, ChevronRight } from "lucide-react";
import { searchUsersForApproval } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserApproverSelectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedIds: string[];
    onSelectedChange: (ids: string[]) => void;
    maxSelect?: number;
}

export function UserApproverSelectDialog({
    open,
    onOpenChange,
    selectedIds,
    onSelectedChange,
    maxSelect,
}: UserApproverSelectDialogProps) {
    const t = useTranslations("ProtectedPages");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ["attendance", "approval", "users", "search", search, page],
        queryFn: () =>
            searchUsersForApproval({
                search,
                page,
                pageSize: PAGE_SIZE,
            }),
        enabled: open,
        placeholderData: (prev) => prev,
    });

    const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 1;

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        setPage(1);
    }, []);

    const handleToggleUser = useCallback(
        (userId: string) => {
            if (selectedIds.includes(userId)) {
                onSelectedChange(selectedIds.filter((id) => id !== userId));
            } else {
                if (maxSelect && selectedIds.length >= maxSelect) {
                    return;
                }
                onSelectedChange([...selectedIds, userId]);
            }
        },
        [selectedIds, onSelectedChange, maxSelect]
    );

    const handleRemoveUser = useCallback(
        (userId: string) => {
            onSelectedChange(selectedIds.filter((id) => id !== userId));
        },
        [selectedIds, onSelectedChange]
    );

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t("attendanceApprovalUserApproverDialogTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("attendanceApprovalUserApproverDialogDescription")}
                        {maxSelect && (
                            <span className="block mt-1">
                                {t("attendanceApprovalUserApproverDialogMax", {
                                    max: maxSelect,
                                })}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Selected Users Tags */}
                {selectedIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                        <span className="text-xs text-muted-foreground w-full mb-1">
                            {maxSelect
                                ? t("attendanceApprovalUserApproverSelectedCountWithMax", {
                                      selected: selectedIds.length,
                                      max: maxSelect,
                                  })
                                : t("attendanceApprovalUserApproverSelectedCount", {
                                      selected: selectedIds.length,
                                  })}
                        </span>
                        {selectedIds.map((id) => {
                            const user = data?.users.find((u) => u.id === id);
                            return (
                                <Badge
                                    key={id}
                                    variant="secondary"
                                    className="flex items-center gap-1 pr-1"
                                >
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={user?.image || undefined} />
                                        <AvatarFallback className="text-[8px]">
                                            {user ? getInitials(user.name) : "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs max-w-[120px] truncate">
                                        {user?.name ||
                                            t("attendanceApprovalUserApproverLoading")}
                                    </span>
                                    <button
                                        onClick={() => handleRemoveUser(id)}
                                        className="ml-1 hover:bg-background rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            );
                        })}
                    </div>
                )}

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("attendanceApprovalUserApproverSearchPlaceholder")}
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9"
                        autoFocus
                    />
                    {search && (
                        <button
                            onClick={() => handleSearchChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                </div>

                {/* User List */}
                <ScrollArea className="flex-1 min-h-[300px] max-h-[400px]">
                    <div className="space-y-1 p-1">
                        {isLoading || isFetching ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : data?.users.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>{t("attendanceApprovalUserApproverEmpty")}</p>
                            </div>
                        ) : (
                            data?.users.map((user) => {
                                const isSelected = selectedIds.includes(user.id);
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => handleToggleUser(user.id)}
                                        disabled={
                                            maxSelect !== undefined &&
                                            !isSelected &&
                                            selectedIds.length >= maxSelect
                                        }
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors disabled:opacity-50 ${
                                            isSelected
                                                ? "bg-primary/10 border border-primary/30"
                                                : "hover:bg-accent"
                                        }`}
                                    >
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.image || undefined} />
                                            <AvatarFallback className="text-xs">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {user.name}
                                            </p>
                                            {user.employeeCode && (
                                                <p className="text-xs text-muted-foreground">
                                                    {user.employeeCode}
                                                </p>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                                <Check className="h-4 w-4 text-primary-foreground" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                            {t("attendanceApprovalUserApproverTotal", {
                                count: data?.totalCount || 0,
                            })}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1 || isFetching}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs px-2">
                                {t("attendanceApprovalUserApproverPage", {
                                    page,
                                    totalPages,
                                })}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || isFetching}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t("attendanceApprovalUserApproverClose")}
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>
                        {t("attendanceApprovalUserApproverConfirm", {
                            count: selectedIds.length,
                        })}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
