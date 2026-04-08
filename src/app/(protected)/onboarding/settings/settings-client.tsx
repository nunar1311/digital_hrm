"use client";

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useTransition,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Settings,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  ListFilter,
  LayoutGrid,
  Copy,
  Download,
  FileUp,
  MoreHorizontal,
  Pencil,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getOnboardingTemplates,
  deleteOnboardingTemplate,
  duplicateOnboardingTemplate,
  exportTemplateAsJson,
} from "../actions";
import { type OnboardingTemplateDB } from "@/types/onboarding";
import Loading from "../../loading";
import {
  CreateTemplateDialog,
  AddTaskDialog,
  EditTaskDialog,
  EditTemplateDialog,
  ImportTemplateDialog,
  TemplateDetailDialog,
} from "./components";

// ============================================================
// MAIN COMPONENT
// ============================================================

export function SettingsClient() {
  const queryClient = useQueryClient();

  // ─── Search / filter state ───
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (search.trim()) setSearch("");
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  // ─── Dialog states ───
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [detailTemplate, setDetailTemplate] =
    useState<OnboardingTemplateDB | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{
    taskId: string;
    data: {
      title: string;
      description: string;
      category: string;
      assigneeRole: string;
      dueDays: number;
      isRequired: boolean;
    };
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "template" | "task";
    id: string;
    taskId?: string;
  } | null>(null);
  const [editTemplate, setEditTemplate] = useState<OnboardingTemplateDB | null>(
    null,
  );
  const [editTemplateOpen, setEditTemplateOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // ─── Column visibility ───
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    description: true,
    taskCount: true,
    usageCount: true,
    actions: true,
  });

  // ─── Fetch templates ───
  const {
    data: templates = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["onboarding-templates-settings"],
    queryFn: getOnboardingTemplates,
  });

  // ─── Transition for non-urgent state updates ───
  const [, startTransition] = useTransition();

  // ─── Mutations ───
  const deleteTemplateMutation = useMutation({
    mutationFn: deleteOnboardingTemplate,
    onSuccess: () => {
      toast.success("Đã xóa template");
      queryClient.invalidateQueries({
        queryKey: ["onboarding-templates-settings"],
      });
      setDeleteConfirm(null);
    },
    onError: () => toast.error("Xóa template thất bại"),
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: duplicateOnboardingTemplate,
    onSuccess: () => {
      toast.success("Đã nhân bản template");
      queryClient.invalidateQueries({
        queryKey: ["onboarding-templates-settings"],
      });
    },
    onError: () => toast.error("Nhân bản thất bại"),
  });

  const exportTemplateMutation = useMutation({
    mutationFn: exportTemplateAsJson,
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.name.replace(/\s+/g, "_")}_template.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Đã tải file JSON");
    },
    onError: () => toast.error("Xuất thất bại"),
  });

  // Use refs for mutation objects to keep callbacks stable
  const duplicateMutationRef = useRef(duplicateTemplateMutation);
  duplicateMutationRef.current = duplicateTemplateMutation;
  const exportMutationRef = useRef(exportTemplateMutation);
  exportMutationRef.current = exportTemplateMutation;

  const duplicateMutation = useCallback(
    (id: string) => duplicateMutationRef.current.mutate(id),
    [],
  );
  const exportMutation = useCallback(
    (id: string) => exportMutationRef.current.mutate(id),
    [],
  );

  // ─── Column definitions for template table ───
  type TemplateRow = (typeof templates)[number];

  const columns = useMemo<ColumnDef<TemplateRow>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: "Tên template",
        size: 220,
        cell: ({ row }) => (
          <div className="font-semibold text-sm">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "description",
        id: "description",
        header: "Mô tả",
        size: 280,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground line-clamp-1">
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        accessorKey: "taskCount",
        id: "taskCount",
        header: "Tasks",
        size: 80,
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {row.original.tasks?.length || 0}
          </Badge>
        ),
      },
      {
        accessorKey: "usageCount",
        id: "usageCount",
        header: "Sử dụng",
        size: 100,
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-xs">
            {(row.original as { _count?: { onboardings: number } })._count
              ?.onboardings || 0}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 48,
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-xs"
                variant="ghost"
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailTemplate({ ...row.original });
                  setDetailOpen(true);
                }}
              >
                <Eye />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setEditTemplate({ ...row.original });
                  setEditTemplateOpen(true);
                }}
              >
                <Pencil />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddTask(row.original.id);
                }}
              >
                <Plus />
                Thêm công việc
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateMutationRef.current.mutate(row.original.id);
                }}
              >
                <Copy />
                Nhân bản
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  exportMutationRef.current.mutate(row.original.id);
                }}
              >
                <Download />
                Xuất JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm({ type: "template", id: row.original.id });
                }}
              >
                <Trash2 />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  // ─── Filter data (memoized to prevent re-renders) ───
  const filteredTemplates = useMemo(
    () =>
      templates.filter((t) => {
        const matchSearch =
          !search ||
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.description || "").toLowerCase().includes(search.toLowerCase());
        const matchCategory =
          filterCategory === "all" ||
          t.tasks?.some((task) => task.category === filterCategory);
        return matchSearch && matchCategory;
      }),
    [templates, search, filterCategory],
  );

  const table = useReactTable({
    data: filteredTemplates,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  // ─── Memoized callbacks for dialog props ───
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  const refreshTemplates = useCallback(() => {
    queryClientRef.current.invalidateQueries({
      queryKey: ["onboarding-templates-settings"],
    });
  }, []);

  const deleteConfirmRef = useRef(deleteConfirm);
  deleteConfirmRef.current = deleteConfirm;
  const deleteTemplateMutationRef = useRef(deleteTemplateMutation);
  deleteTemplateMutationRef.current = deleteTemplateMutation;

  const handleDelete = useCallback(() => {
    const dc = deleteConfirmRef.current;
    if (!dc) return;
    if (dc.type === "template") {
      deleteTemplateMutationRef.current.mutate(dc.id);
    }
  }, []);

  const handleSearchToggle = useCallback(() => {
    setSearchExpanded((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else {
        setSearch("");
      }
      return next;
    });
  }, []);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearchExpanded(false);
        setSearch("");
        searchInputRef.current?.blur();
      }
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilterCategory("all");
    setSearch("");
  }, []);

  const handleDetailEditTask = useCallback(
    (
      taskId: string,
      data: {
        title: string;
        description: string;
        category: string;
        assigneeRole: string;
        dueDays: number;
        isRequired: boolean;
      },
    ) => {
      setDetailOpen(false);
      setEditingTask({ taskId, data });
    },
    [],
  );

  const handleDetailDeleteTask = useCallback((taskId: string) => {
    setDeleteConfirm({ type: "task", id: taskId, taskId });
  }, []);

  const handleDetailAddTask = useCallback((templateId: string) => {
    setDetailOpen(false);
    setShowAddTask(templateId);
  }, []);

  const handleDetailEditTemplate = useCallback(
    (template: OnboardingTemplateDB) => {
      setDetailOpen(false);
      setEditTemplate(template);
      setEditTemplateOpen(true);
    },
    [],
  );

  const handleAddTaskOpenChange = useCallback((open: boolean) => {
    if (!open) setShowAddTask(null);
  }, []);

  const handleEditTaskOpenChange = useCallback((open: boolean) => {
    if (!open) setEditingTask(null);
  }, []);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isInputFocused) return;
      if (e.key === "/") {
        e.preventDefault();
        handleSearchToggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-0">
        <section>
          <header className="p-2 flex items-center h-10 border-b">
            <h1 className="font-bold flex items-center gap-2">
              Thiết lập onboarding
            </h1>
          </header>
        </section>

        {/* ─── Toolbar ─── */}
        <div className="flex items-center justify-end gap-1 px-2 py-2 shrink-0">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setImportDialogOpen(true)}
            tooltip="Nhập template từ JSON"
          >
            <FileUp />
            Nhập
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={refreshTemplates}
            disabled={isFetching}
            tooltip="Làm mới"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            />
          </Button>

          <div className="relative flex items-center" ref={mergedSearchRef}>
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Tìm template..."
              className={cn(
                "h-6 text-xs transition-all duration-300 ease-in-out pr-6",
                searchExpanded ? "w-48 opacity-100 pl-3" : "w-0 opacity-0 pl-0",
              )}
            />
            <Button
              size={"icon-xs"}
              variant={"ghost"}
              onClick={handleSearchToggle}
              className={cn(
                "absolute right-0.5 z-10",
                searchExpanded && "[&_svg]:text-primary",
              )}
            >
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4!" />

          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => setSettingsOpen(true)}
            tooltip="Cấu hình cột hiển thị"
          >
            <Settings />
          </Button>

          <Button
            size="xs"
            onClick={() => setShowCreateTemplate(true)}
            tooltip="Tạo template mới"
          >
            <Plus />
            Template
          </Button>

          {/* Search */}
        </div>

        {/* ─── Table Settings ─── */}
        <TableSettingsPanel
          open={settingsOpen}
          onClose={setSettingsOpen}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          defaultVisibleColumns={{
            description: true,
            taskCount: true,
            usageCount: true,
            actions: true,
          }}
          columnOptions={[
            { key: "description", label: "Mô tả", icon: FileText },
            { key: "taskCount", label: "Tasks", icon: ListFilter },
            { key: "usageCount", label: "Sử dụng", icon: LayoutGrid },
            { key: "actions", label: "Thao tác", icon: Settings },
          ]}
          className="top-10"
        />
      </div>

      {/* ─── Table ─── */}
      <div className="flex-1 min-h-0 overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-7 px-2 select-none z-10 relative bg-background"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j} className="p-2">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group/row cursor-pointer"
                  onClick={() => {
                    startTransition(() => {
                      setDetailTemplate({ ...row.original });
                      setDetailOpen(true);
                    });
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Settings className="h-8 w-8 text-muted-foreground/50" />
                    <p>Chưa có template nào</p>
                    {search && (
                      <Button variant="link" size="sm" onClick={resetFilters}>
                        Xóa tìm kiếm
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── Summary Footer ─── */}
      {!isLoading && templates.length > 0 && (
        <div className="shrink-0 px-2 py-2 border-t bg-background flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Hiển thị <strong>{filteredTemplates.length}</strong> /{" "}
            <strong>{templates.length}</strong> template
          </p>
        </div>
      )}

      {/* ─── Create Template Dialog ──────────────────────────────── */}
      <CreateTemplateDialog
        open={showCreateTemplate}
        onOpenChange={setShowCreateTemplate}
        onSuccess={refreshTemplates}
      />

      {/* ─── Add Task Dialog ──────────────────────────────────────── */}
      <AddTaskDialog
        templateId={showAddTask}
        onOpenChange={handleAddTaskOpenChange}
        onSuccess={refreshTemplates}
      />

      {/* ─── Edit Task Dialog ────────────────────────────────────── */}
      <EditTaskDialog
        taskId={editingTask?.taskId ?? ""}
        initialData={
          editingTask?.data ?? {
            title: "",
            description: "",
            category: "GENERAL",
            assigneeRole: "",
            dueDays: 3,
            isRequired: true,
          }
        }
        open={!!editingTask}
        onOpenChange={handleEditTaskOpenChange}
        onSuccess={refreshTemplates}
      />

      {/* ─── Template Detail Dialog ─────────────────────────────── */}
      <TemplateDetailDialog
        template={detailTemplate}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEditTask={handleDetailEditTask}
        onDeleteTask={handleDetailDeleteTask}
        onAddTask={handleDetailAddTask}
        onExport={exportMutation}
        onDuplicate={duplicateMutation}
        onEditTemplate={handleDetailEditTemplate}
      />

      {/* ─── Edit Template Dialog ─────────────────────────────── */}
      <EditTemplateDialog
        template={editTemplate}
        open={editTemplateOpen}
        onOpenChange={setEditTemplateOpen}
        onSuccess={refreshTemplates}
      />

      {/* ─── Import Template Dialog ───────────────────────────── */}
      <ImportTemplateDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={refreshTemplates}
      />

      {/* ─── Delete Confirm ───────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === "template"
                ? "Bạn có chắc muốn xóa template này? Template đang được sử dụng sẽ bị vô hiệu hóa thay vì xóa hoàn toàn."
                : "Bạn có chắc muốn xóa task này?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
