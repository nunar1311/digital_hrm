"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  Save,
  Search,
  RefreshCw,
  FileText,
  Loader2,
  ListFilter,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSettingsPanel } from "@/components/ui/table-settings-panel";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getOnboardingTemplates,
  createOnboardingTemplate,
  deleteOnboardingTemplate,
  addTaskToTemplate,
  updateTemplateTask,
  deleteTemplateTask,
  type CreateTaskData,
} from "../actions";
import {
  CATEGORY_LABELS,
  ASSIGNEE_ROLE_LABELS,
  ONBOARDING_CATEGORY,
  type OnboardingCategory,
  type OnboardingAssigneeRole,
  type OnboardingTemplateDB,
} from "@/types/onboarding";

// ============================================================
// TYPES
// ============================================================

const CATEGORY_COLORS: Record<string, string> = {
  EQUIPMENT: "bg-orange-100 text-orange-700 border-orange-200",
  ACCOUNT: "bg-blue-100 text-blue-700 border-blue-200",
  TRAINING: "bg-purple-100 text-purple-700 border-purple-200",
  DOCUMENTS: "bg-green-100 text-green-700 border-green-200",
  GENERAL: "bg-slate-100 text-slate-700 border-slate-200",
};

const createTemplateSchema = z.object({
  name: z.string().min(1, "Tên template không được trống"),
  description: z.string().optional(),
});

type CreateTemplateForm = z.infer<typeof createTemplateSchema>;

const createTaskSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được trống"),
  description: z.string().optional(),
  category: z.string().default("GENERAL"),
  assigneeRole: z.string().optional(),
  dueDays: z.number().min(1).default(3),
  isRequired: z.boolean().default(true),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

// ============================================================
// FILTER POPOVER
// ============================================================

function FilterPopover({
  filterCategory,
  setFilterCategory,
  onReset,
}: {
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasFilter = filterCategory !== "all";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="xs"
          className={cn(hasFilter && "border-primary bg-primary/5")}
        >
          <ListFilter className="h-3.5 w-3.5" />
          Bộ lọc
          {hasFilter && (
            <Badge
              variant="default"
              className="ml-1 h-4 w-4 p-0 justify-center text-[10px]"
            >
              1
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Bộ lọc</p>
            {hasFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onReset();
                  setOpen(false);
                }}
              >
                Đặt lại
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Danh mục task</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================
// TEMPLATE DETAIL DIALOG
// ============================================================

function TemplateDetailDialog({
  template,
  open,
  onOpenChange,
  onEditTask,
  onDeleteTask,
  onAddTask,
}: {
  template: OnboardingTemplateDB | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditTask: (taskId: string, data: {
    title: string;
    description: string;
    category: string;
    assigneeRole: string;
    dueDays: number;
    isRequired: boolean;
  }) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (templateId: string) => void;
}) {
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);

  if (!template) return null;

  const tasks = template.tasks || [];

  const filteredTasks = tasks.filter((task) => {
    const matchCategory = filterCategory === "all" || task.category === filterCategory;
    const matchSearch =
      !search ||
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description || "").toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const tasksByCategory = (Object.values(ONBOARDING_CATEGORY) as string[]).reduce((acc: Record<string, typeof filteredTasks>, cat: string) => {
    acc[cat] = filteredTasks.filter((t) => t.category === cat);
    return acc;
  }, {} as Record<string, typeof filteredTasks>);

  const resetFilters = () => {
    setFilterCategory("all");
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-blue-600" />
            {template.name}
          </DialogTitle>
          <DialogDescription>
            {template.description || "Không có mô tả"}
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <Select
            value={filterCategory}
            onValueChange={setFilterCategory}
          >
            <SelectTrigger className="h-7 w-auto text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex items-center flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm task..."
              className={cn(
                "h-7 text-xs transition-all duration-300 pr-6",
                searchExpanded ? "w-40 opacity-100 pl-3" : "w-0 opacity-0 pl-0",
              )}
            />
            <Button
              size={"icon-xs"}
              variant={"ghost"}
              onClick={() => setSearchExpanded((p) => !p)}
              className="absolute right-0.5 z-10"
            >
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>

          {(filterCategory !== "all" || search) && (
            <Button
              variant="ghost"
              size="xs"
              className="h-7 text-xs"
              onClick={resetFilters}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Đặt lại
            </Button>
          )}

          <Button
            size="xs"
            className="h-7 ml-auto"
            onClick={() => onAddTask(template.id)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Thêm task
          </Button>
        </div>

        {/* Tasks by Category */}
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Không có task nào</p>
            <Button
              variant="link"
              size="sm"
              className="mt-1"
              onClick={() => onAddTask(template.id)}
            >
              Thêm task đầu tiên
            </Button>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {(Object.values(ONBOARDING_CATEGORY) as string[]).filter((cat) => tasksByCategory[cat]?.length > 0).map(
              (cat) => (
                <AccordionItem key={cat} value={cat}>
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn("text-xs border", CATEGORY_COLORS[cat])}
                      >
                        {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-normal">
                        ({tasksByCategory[cat].length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-1">
                      {tasksByCategory[cat].map((task, idx) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        >
                          <span className="text-xs text-muted-foreground font-mono w-5 text-right shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{task.title}</span>
                              {task.isRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  Bắt buộc
                                </Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {task.assigneeRole && (
                                <Badge variant="outline" className="text-xs">
                                  {ASSIGNEE_ROLE_LABELS[task.assigneeRole as keyof typeof ASSIGNEE_ROLE_LABELS] || task.assigneeRole}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                Hạn: {task.dueDays} ngày
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                onEditTask(task.id, {
                                  title: task.title,
                                  description: task.description || "",
                                  category: task.category,
                                  assigneeRole: task.assigneeRole || "",
                                  dueDays: task.dueDays,
                                  isRequired: task.isRequired,
                                })
                              }
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ),
            )}
          </Accordion>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
  const [detailTemplate, setDetailTemplate] = useState<OnboardingTemplateDB | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{
    taskId: string;
    templateId: string;
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
    templateId?: string;
  } | null>(null);

  // ─── Column visibility ───
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
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

  // ─── Mutations ───
  const createTemplateMutation = useMutation({
    mutationFn: createOnboardingTemplate,
    onSuccess: () => {
      toast.success("Đã tạo template mới");
      queryClient.invalidateQueries({ queryKey: ["onboarding-templates-settings"] });
      setShowCreateTemplate(false);
    },
    onError: () => toast.error("Tạo template thất bại"),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: deleteOnboardingTemplate,
    onSuccess: () => {
      toast.success("Đã xóa template");
      queryClient.invalidateQueries({ queryKey: ["onboarding-templates-settings"] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error("Xóa template thất bại"),
  });

  const addTaskMutation = useMutation({
    mutationFn: ({ templateId, task }: { templateId: string; task: CreateTaskData }) =>
      addTaskToTemplate(templateId, task),
    onSuccess: () => {
      toast.success("Đã thêm task");
      queryClient.invalidateQueries({ queryKey: ["onboarding-templates-settings"] });
      setShowAddTask(null);
    },
    onError: () => toast.error("Thêm task thất bại"),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<CreateTaskData> }) =>
      updateTemplateTask(taskId, data),
    onSuccess: () => {
      toast.success("Đã cập nhật task");
      queryClient.invalidateQueries({ queryKey: ["onboarding-templates-settings"] });
      setEditingTask(null);
    },
    onError: () => toast.error("Cập nhật task thất bại"),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTemplateTask,
    onSuccess: () => {
      toast.success("Đã xóa task");
      queryClient.invalidateQueries({ queryKey: ["onboarding-templates-settings"] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error("Xóa task thất bại"),
  });

  // ─── Forms ───
  const templateForm = useForm<CreateTemplateForm>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: { name: "", description: "" },
  });

  const taskForm = useForm<CreateTaskForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createTaskSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      category: "GENERAL",
      assigneeRole: "",
      dueDays: 3,
      isRequired: true,
    },
  });

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
            {(row.original as { _count?: { onboardings: number } })._count?.onboardings || 0}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 160,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <Button
              size="icon-xs"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setDetailTemplate(row.original);
                setDetailOpen(true);
              }}
              title="Xem chi tiết"
            >
              <FileText className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddTask(row.original.id);
              }}
              title="Thêm task"
            >
              <Plus className="h-3.5 w-3.5 text-green-600" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm({ type: "template", id: row.original.id });
              }}
              title="Xóa template"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  // ─── Filter data ───
  const filteredTemplates = templates.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const table = useReactTable({
    data: filteredTemplates,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  // ─── Handlers ───
  const handleCreateTemplate = (values: CreateTemplateForm) => {
    createTemplateMutation.mutate({
      name: values.name,
      description: values.description,
    });
  };

  const handleAddTask = (templateId: string) => {
    taskForm.handleSubmit((taskValues) => {
      addTaskMutation.mutate({
        templateId,
        task: {
          title: taskValues.title,
          description: taskValues.description,
          category: taskValues.category as OnboardingCategory,
          assigneeRole: taskValues.assigneeRole as OnboardingAssigneeRole | undefined,
          dueDays: taskValues.dueDays,
          isRequired: taskValues.isRequired,
        },
      });
    })();
  };

  const handleEditTask = () => {
    if (!editingTask) return;
    updateTaskMutation.mutate({
      taskId: editingTask.taskId,
      data: {
        title: editingTask.data.title,
        description: editingTask.data.description,
        category: editingTask.data.category as OnboardingCategory,
        assigneeRole: editingTask.data.assigneeRole as OnboardingAssigneeRole | undefined,
        dueDays: editingTask.data.dueDays,
        isRequired: editingTask.data.isRequired,
      },
    });
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "template") {
      deleteTemplateMutation.mutate(deleteConfirm.id);
    } else if (deleteConfirm.taskId) {
      deleteTaskMutation.mutate(deleteConfirm.taskId);
    }
  };

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

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearchExpanded(false);
      setSearch("");
      searchInputRef.current?.blur();
    }
  };

  const resetFilters = () => {
    setFilterCategory("all");
    setSearch("");
  };

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
    return (
      <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
        <div className="flex flex-col gap-0">
          <section>
            <header className="p-2 flex items-center h-10 border-b">
              <h1 className="font-bold flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                Cài đặt Onboarding
              </h1>
            </header>
          </section>
          <div className="flex items-center justify-end gap-1 px-2 py-2 shrink-0">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-7 w-48" />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-0">
        <section>
          <header className="p-2 flex items-center h-10 border-b">
            <h1 className="font-bold flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-600" />
              Cài đặt Onboarding
            </h1>
          </header>
        </section>

        {/* ─── Toolbar ─── */}
        <div className="flex items-center justify-end gap-1 px-2 py-2 shrink-0">
          <FilterPopover
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            onReset={resetFilters}
          />

          <Button
            variant="outline"
            size="xs"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["onboarding-templates-settings"] })
            }
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </Button>

          <Separator orientation="vertical" className="h-4!" />

          <Button
            variant="outline"
            size="icon-xs"
            className="h-7 w-7"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="xs"
            className="h-7"
            onClick={() => setShowCreateTemplate(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Tạo template
          </Button>

          {/* Search */}
          <div className="relative flex items-center" ref={mergedSearchRef}>
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Tìm template..."
              className={cn(
                "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
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
                    setDetailTemplate(row.original);
                    setDetailOpen(true);
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
      <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo template mới</DialogTitle>
            <DialogDescription>
              Tạo template onboarding với các task tiếp nhận nhân viên mới
            </DialogDescription>
          </DialogHeader>
          <Form {...templateForm}>
            <form
              onSubmit={templateForm.handleSubmit(handleCreateTemplate)}
              className="space-y-4"
            >
              <FormField
                control={templateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên template</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: Template Tiếp nhận Chuẩn" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={templateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả (tùy chọn)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mô tả ngắn về template..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateTemplate(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={createTemplateMutation.isPending}>
                  {createTemplateMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Tạo template
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ─── Add Task Dialog ──────────────────────────────────────── */}
      <Dialog
        open={!!showAddTask}
        onOpenChange={(open) => !open && setShowAddTask(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm task mới</DialogTitle>
          </DialogHeader>
          <Form {...taskForm}>
            <form
              onSubmit={taskForm.handleSubmit(() => {
                if (showAddTask) {
                  handleAddTask(showAddTask);
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={taskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiêu đề</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: Cấp laptop" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={taskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mô tả chi tiết công việc..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={taskForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Danh mục</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={taskForm.control}
                  name="assigneeRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giao cho (role)</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn vai trò..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Không chỉ định</SelectItem>
                          {Object.entries(ASSIGNEE_ROLE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={taskForm.control}
                name="dueDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số ngày (hạn hoàn thành)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddTask(null)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={addTaskMutation.isPending}>
                  {addTaskMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Thêm task
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Task Dialog ────────────────────────────────────── */}
      <Dialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <Label>Tiêu đề</Label>
                <Input
                  value={editingTask.data.title}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      data: { ...editingTask.data, title: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Textarea
                  value={editingTask.data.description}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      data: { ...editingTask.data, description: e.target.value },
                    })
                  }
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Danh mục</Label>
                  <Select
                    value={editingTask.data.category}
                    onValueChange={(value) =>
                      setEditingTask({
                        ...editingTask,
                        data: { ...editingTask.data, category: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Giao cho (role)</Label>
                  <Select
                    value={editingTask.data.assigneeRole}
                    onValueChange={(value) =>
                      setEditingTask({
                        ...editingTask,
                        data: { ...editingTask.data, assigneeRole: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Không chỉ định</SelectItem>
                      {Object.entries(ASSIGNEE_ROLE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Số ngày (hạn hoàn thành)</Label>
                <Input
                  type="number"
                  min={1}
                  value={editingTask.data.dueDays}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      data: {
                        ...editingTask.data,
                        dueDays: parseInt(e.target.value) || 1,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequiredEdit"
                  checked={editingTask.data.isRequired}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      data: { ...editingTask.data, isRequired: e.target.checked },
                    })
                  }
                />
                <Label htmlFor="isRequiredEdit">Task bắt buộc</Label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingTask(null)}>
                  Hủy
                </Button>
                <Button onClick={handleEditTask} disabled={updateTaskMutation.isPending}>
                  {updateTaskMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Save className="h-4 w-4 mr-2" />
                  Lưu
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Template Detail Dialog ─────────────────────────────── */}
      <TemplateDetailDialog
        template={detailTemplate}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEditTask={(taskId, data) => {
          setDetailOpen(false);
          const templateId = detailTemplate?.id || "";
          setEditingTask({ taskId, templateId, data });
        }}
        onDeleteTask={(taskId) =>
          setDeleteConfirm({
            type: "task",
            id: taskId,
            taskId,
          })
        }
        onAddTask={(templateId) => {
          setDetailOpen(false);
          setShowAddTask(templateId);
        }}
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
