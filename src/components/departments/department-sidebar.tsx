"use client";

import React, {
    useState,
    useEffect,
    useRef,
    createContext,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    Search,
    X,
    Snowflake,
    Plus,
    ChevronsUpDown,
} from "lucide-react";
import type { DepartmentNode } from "@/types/org-chart";
import { Button } from "@/components/ui/button";
import { DepartmentFormDialog } from "@/components/org-chart/department-form-dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { deleteDepartment } from "@/app/[locale]/(protected)/org-chart/actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/contexts/settings-context";
import DepartmentTree from "./department-tree";

// â”€â”€â”€ Context Ä‘á»ƒ chia sáº» tráº¡ng thÃ¡i expand/collapse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type ExpandedState = "all" | "none" | null;

interface ExpandedStateContextValue {
    expandedState: ExpandedState;
    setExpandedState: (state: ExpandedState) => void;
}

export const ExpandedStateContext =
    createContext<ExpandedStateContextValue>({
        expandedState: null,
        setExpandedState: () => {},
    });

// â”€â”€â”€ Main Sidebar Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface DepartmentSidebarProps {
    departmentTree: DepartmentNode[];
}

const DepartmentSidebar = ({
    departmentTree,
}: DepartmentSidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const { settings } = useSettings();
    const t = useTranslations("ProtectedPages");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedState, setExpandedState] =
        useState<ExpandedState>("all");
    const [dialogState, setDialogState] = useState<{
        open: boolean;
        department: DepartmentNode | null;
    }>({
        open: false,
        department: null,
    });
    const [deleteTarget, setDeleteTarget] =
        useState<DepartmentNode | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Cmd+K / Ctrl+K to focus search
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    const deleteMutation = useMutation({
        mutationFn: deleteDepartment,
        onSuccess: (result) => {
            if (result.success) {
                toast.success(result.message);
                setDeleteTarget(null);
            } else {
                toast.error(result.message);
            }
        },
        onError: () => {
            toast.error(t("departmentsGenericError"));
        },
    });

    const handleEdit = (department: DepartmentNode) => {
        setDialogState({ open: true, department });
    };

    const handleDelete = (department: DepartmentNode) => {
        setDeleteTarget(department);
    };

    const handleClose = () => {
        setDialogState({ open: false, department: null });
    };

    return (
        <>
            <Sidebar
                collapsible="offcanvas"
                className="absolute h-full! group/sidebar"
            >
                <SidebarHeader className="flex-row h-[44px] items-center justify-between">
                    <div className="group-data-[collapsible=icon]:hidden px-2 font-bold">
                        {t("departmentsSidebarTitle")}
                    </div>
                    <div className="flex items-center gap-0.5">
                        <div className="flex items-center transition-all duration-150 transform-gpu translate-x-2 group-hover:translate-x-0 gap-0.5 ease-linear opacity-0 group-hover:opacity-100">
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                tooltip={
                                    expandedState === "all"
                                        ? t("departmentsSidebarCollapseAll")
                                        : t("departmentsSidebarExpandAll")
                                }
                                onClick={() =>
                                    setExpandedState(
                                        expandedState === "all"
                                            ? "none"
                                            : "all",
                                    )
                                }
                                className="group-data-[collapsible=icon]:hidden"
                            >
                                <ChevronsUpDown className="size-3.5" />
                            </Button>
                            <SidebarTrigger className="group-data-[collapsible=icon]:hidden gap-0!" />
                        </div>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup className="gap-3 px-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="pointer-events-none absolute inset-y-0 left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                ref={searchInputRef}
                                className="pl-8 pr-8 h-7 text-xs"
                                placeholder={t("departmentsSidebarSearchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                }
                            />
                            <div className="absolute inset-y-0 right-2 flex items-center">
                                {searchQuery ? (
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() =>
                                            setSearchQuery("")
                                        }
                                    >
                                        <X />
                                    </Button>
                                ) : settings.keyboardShortcutsEnabled ? (
                                    <kbd className="inline-flex h-4 items-center rounded border px-1 font-medium text-[10px] text-muted-foreground/70">
                                        âŒ˜K
                                    </kbd>
                                ) : null}
                            </div>
                        </div>

                        {/* Nav: Táº¥t cáº£ phÃ²ng ban */}
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={
                                        pathname === "/departments"
                                    }
                                    onClick={() =>
                                        router.push("/departments")
                                    }
                                    className="min-h-7"
                                >
                                    <Snowflake className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <span className="truncate">
                                        {t("departmentsSidebarAll")}
                                    </span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <ExpandedStateContext.Provider
                                value={{
                                    expandedState,
                                    setExpandedState,
                                }}
                            >
                                {departmentTree.map((item) => (
                                    <DepartmentTree
                                        key={item.id}
                                        item={item}
                                        searchQuery={searchQuery}
                                        onEdit={handleEdit}
                                        onAddChild={(id) => {
                                            const d =
                                                departmentTree.find(
                                                    (n) =>
                                                        n.id === id,
                                                );
                                            if (d) handleEdit(d);
                                        }}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </ExpandedStateContext.Provider>

                            <SidebarMenuButton
                                onClick={() => {
                                    setDialogState({
                                        open: true,
                                        department: null,
                                    });
                                }}
                            >
                                <Plus />
                                {t("departmentsSidebarAdd")}
                            </SidebarMenuButton>
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>

            <DepartmentFormDialog
                open={dialogState.open}
                onClose={handleClose}
                department={dialogState.department}
                allDepartments={departmentTree}
            />

            <AlertDialog
                open={deleteTarget !== null}
                onOpenChange={(open) =>
                    !open && setDeleteTarget(null)
                }
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t("departmentsDeleteConfirmTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("departmentsDeleteConfirmDescription", {
                                name: deleteTarget?.name ?? "",
                            })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t("departmentsDeleteCancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteTarget) {
                                    deleteMutation.mutate(
                                        deleteTarget.id,
                                    );
                                }
                            }}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending
                                ? t("departmentsDeletePending")
                                : t("departmentsDeleteAction")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default DepartmentSidebar;

