"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutGrid,
  Plus,
  Search,
  RefreshCw,
  List,
  GripVertical,
  Edit2,
  Trash2,
  Check,
  Copy,
  Download,
  FileText,
  MoreVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CATEGORY_LABELS,
  ASSIGNEE_ROLE_LABELS,
  ONBOARDING_CATEGORY,
  type OnboardingTemplateDB,
  type OnboardingTaskDB,
} from "@/types/onboarding";
import { reorderTemplateTasks, updateTemplateTask } from "../../actions";
import { SortableTaskItem } from "./sortable-task-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORY_COLORS: Record<string, string> = {
  EQUIPMENT: "bg-orange-100 text-orange-700 border-orange-200",
  ACCOUNT: "bg-blue-100 text-blue-700 border-blue-200",
  TRAINING: "bg-purple-100 text-purple-700 border-purple-200",
  DOCUMENTS: "bg-green-100 text-green-700 border-green-200",
  GENERAL: "bg-slate-100 text-slate-700 border-slate-200",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TemplateHeaderProps {
  template: OnboardingTemplateDB;
  taskCount: number;
  onEditTemplate: (template: OnboardingTemplateDB) => void;
  onDuplicate: (templateId: string) => void;
  onExport: (templateId: string) => void;
}

const TemplateHeader = memo(function TemplateHeader({
  template,
  taskCount,
  onEditTemplate,
  onDuplicate,
  onExport,
}: TemplateHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <DialogTitle>
          <span className="truncate">{template.name}</span>
        </DialogTitle>
        <DialogDescription className="mt-1">
          {template.description || "Không có mô tả"}
        </DialogDescription>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            {taskCount} tasks
          </Badge>
          {template.isActive ? (
            <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
              Đang hoạt động
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Không hoạt động
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-1 shrink-0 ml-4">
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => onEditTemplate(template)}
          tooltip="Chỉnh sửa template"
        >
          <Edit2 className="h-4 w-4" />
        </Button>

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => onDuplicate(template.id)}
          tooltip="Nhân bản template"
        >
          <Copy className="h-4 w-4" />
        </Button>

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => onExport(template.id)}
          tooltip="Xuất JSON"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

interface TemplateToolbarProps {
  filterCategory: string;
  onFilterCategory: (v: string) => void;
  search: string;
  onSearch: (v: string) => void;
  searchExpanded: boolean;
  onSearchExpandedToggle: () => void;
  viewMode: "list" | "category";
  onViewMode: (v: "list" | "category") => void;
  onResetFilters: () => void;
  onAddTask: () => void;
}

const TemplateToolbar = memo(function TemplateToolbar({
  filterCategory,
  onFilterCategory,
  search,
  onSearch,
  searchExpanded,
  onSearchExpandedToggle,
  viewMode,
  onViewMode,
  onResetFilters,
  onAddTask,
}: TemplateToolbarProps) {
  const showReset = filterCategory !== "all" || search;

  return (
    <>
      <div className="flex items-center gap-2">
        <Select value={filterCategory} onValueChange={onFilterCategory}>
          <SelectTrigger size="sm" className="h-6!">
            <SelectValue className="text-xs" />
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
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Tìm task..."
            className={cn(
              "h-6 text-xs transition-all duration-300 pr-6",
              searchExpanded ? "w-40 opacity-100 pl-3" : "w-0 opacity-0 pl-0",
            )}
          />
          <Button
            size={"icon-xs"}
            variant={"ghost"}
            onClick={onSearchExpandedToggle}
            className="absolute right-0.5 z-10"
          >
            <Search />
          </Button>
        </div>

        {showReset && (
          <Button variant="ghost" size="xs" onClick={onResetFilters}>
            <RefreshCw />
            Đặt lại
          </Button>
        )}

        <div className="flex items-center border rounded-md overflow-hidden shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "px-2 py-1 text-xs transition-colors",
                  viewMode === "category"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
                onClick={() => onViewMode("category")}
              >
                <LayoutGrid className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Xem theo danh mục</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "px-2 py-1 text-xs transition-colors border-l",
                  viewMode === "list"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
                onClick={() => onViewMode("list")}
              >
                <List className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Xem danh sách</TooltipContent>
          </Tooltip>
        </div>

        <Button size="xs" onClick={onAddTask} tooltip={"Thêm task mới"}>
          <Plus />
          Task
        </Button>
      </div>

      {viewMode === "list" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 rounded-md px-3 py-1.5">
          <GripVertical className="size-3.5" />
          <span>Kéo thả để sắp xếp thứ tự task</span>
        </div>
      )}
    </>
  );
});

interface TaskListCategoryProps {
  tasksByCategory: Record<string, OnboardingTaskDB[]>;
  draggingId: string | null;
  onSetDragging: (id: string | null) => void;
  onToggleRequired: (taskId: string, currentValue: boolean) => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskListCategory = memo(function TaskListCategory({
  tasksByCategory,
  draggingId,
  onSetDragging,
  onToggleRequired,
  onEditTask,
  onDeleteTask,
}: TaskListCategoryProps) {
  const categories = useMemo(
    () =>
      (Object.values(ONBOARDING_CATEGORY) as string[]).filter(
        (cat) => tasksByCategory[cat]?.length > 0,
      ),
    [tasksByCategory],
  );

  return (
    <Accordion type="multiple" className="w-full">
      {categories.map((cat) => (
        <AccordionItem key={cat} value={cat}>
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs border", CATEGORY_COLORS[cat])}>
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
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border bg-slate-50/50 hover:bg-slate-50 transition-colors",
                    draggingId === task.id && "opacity-50",
                  )}
                  onMouseDown={() => onSetDragging(task.id)}
                  onMouseUp={() => onSetDragging(null)}
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
                          {ASSIGNEE_ROLE_LABELS[
                            task.assigneeRole as keyof typeof ASSIGNEE_ROLE_LABELS
                          ] || task.assigneeRole}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Hạn: {task.dueDays} ngày
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() =>
                            onToggleRequired(task.id, task.isRequired)
                          }
                        >
                          <Check className="text-green-500" />
                          {task.isRequired ? "Bỏ bắt buộc" : "Đặt bắt buộc"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditTask(task.id)}>
                          <Edit2 />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDeleteTask(task.id)}
                        >
                          <Trash2 />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
});

interface TaskListFlatProps {
  taskIds: string[];
  getTaskById: (id: string) => OnboardingTaskDB | undefined;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (activeId: string, overId: string) => void;
  onToggleRequired: (taskId: string, currentValue: boolean) => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskListFlat = memo(function TaskListFlat({
  taskIds,
  getTaskById,
  sensors,
  onDragEnd,
  onToggleRequired,
  onEditTask,
  onDeleteTask,
}: TaskListFlatProps) {
  const handleDragEnd = useCallback(
    (event: { active: { id: unknown }; over: { id: unknown } | null }) => {
      const { active, over } = event;
      if (!over) return;
      onDragEnd(active.id as string, over.id as string);
    },
    [onDragEnd],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {taskIds.map((taskId, idx) => {
            const task = getTaskById(taskId);
            if (!task) return null;
            return (
              <SortableTaskItem
                key={task.id}
                task={task}
                index={idx}
                onEdit={() => onEditTask(task.id)}
                onDelete={() => onDeleteTask(task.id)}
                onToggleRequired={() =>
                  onToggleRequired(task.id, task.isRequired)
                }
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
});

interface EmptyTasksStateProps {
  onAddTask: () => void;
}

const EmptyTasksState = memo(function EmptyTasksState({
  onAddTask,
}: EmptyTasksStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <FileText className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">Không có task nào</p>
      <Button variant="link" size="sm" className="mt-1" onClick={onAddTask}>
        Thêm task đầu tiên
      </Button>
    </div>
  );
});

// ─── Main Component ──────────────────────────────────────────────────────────

interface TemplateDetailDialogProps {
  template: OnboardingTemplateDB | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditTask: (
    taskId: string,
    data: {
      title: string;
      description: string;
      category: string;
      assigneeRole: string;
      dueDays: number;
      isRequired: boolean;
    },
  ) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (templateId: string) => void;
  onExport: (templateId: string) => void;
  onDuplicate: (templateId: string) => void;
  onEditTemplate: (template: OnboardingTemplateDB) => void;
}

export function TemplateDetailDialog({
  template,
  open,
  onOpenChange,
  onEditTask,
  onDeleteTask,
  onAddTask,
  onExport,
  onDuplicate,
  onEditTemplate,
}: TemplateDetailDialogProps) {
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "category">("category");

  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ── Mutations ──────────────────────────────────────────────────────────────

  const reorderMutation = useMutation({
    mutationFn: reorderTemplateTasks,
    onSuccess: () => {
      toast.success("Đã sắp xếp lại thứ tự");
      queryClient.invalidateQueries({
        queryKey: ["onboarding-templates-settings"],
      });
    },
    onError: () => toast.error("Sắp xếp thất bại"),
  });

  const toggleRequiredMutation = useMutation({
    mutationFn: ({
      taskId,
      isRequired,
    }: {
      taskId: string;
      isRequired: boolean;
    }) => updateTemplateTask(taskId, { isRequired }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-templates-settings"],
      });
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  // ── Task lookup map (O(1) access) ──────────────────────────────────────────

  const taskMap = useMemo(() => {
    const map = new Map<string, OnboardingTaskDB>();
    (template?.tasks || []).forEach((t) => map.set(t.id, t));
    return map;
  }, [template?.tasks]);

  const getTaskById = useCallback((id: string) => taskMap.get(id), [taskMap]);

  // ── Memoized filtered + grouped tasks ─────────────────────────────────────

  const filteredTaskIds = useMemo(() => {
    return (template?.tasks || [])
      .filter((task) => {
        const matchCategory =
          filterCategory === "all" || task.category === filterCategory;
        const matchSearch =
          !search ||
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          (task.description || "").toLowerCase().includes(search.toLowerCase());
        return matchCategory && matchSearch;
      })
      .map((t) => t.id);
  }, [template?.tasks, filterCategory, search]);

  const tasksByCategory = useMemo(() => {
    return (template?.tasks || []).reduce(
      (acc, task) => {
        if (filterCategory === "all" || task.category === filterCategory) {
          const matchSearch =
            !search ||
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            (task.description || "")
              .toLowerCase()
              .includes(search.toLowerCase());
          if (matchSearch) {
            if (!acc[task.category]) acc[task.category] = [];
            acc[task.category].push(task);
          }
        }
        return acc;
      },
      {} as Record<string, OnboardingTaskDB[]>,
    );
  }, [template?.tasks, filterCategory, search]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleResetFilters = useCallback(() => {
    setFilterCategory("all");
    setSearch("");
  }, []);

  const handleDragEnd = useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return;
      const tasks = template?.tasks || [];
      const oldIndex = tasks.findIndex((t) => t.id === activeId);
      const newIndex = tasks.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(tasks, oldIndex, newIndex);
      const orders = reordered.map((t, idx) => ({
        id: t.id,
        sortOrder: idx,
      }));
      reorderMutation.mutate(orders);
    },
    [reorderMutation, template?.tasks],
  );

  const handleToggleRequired = useCallback(
    (taskId: string, currentValue: boolean) => {
      toggleRequiredMutation.mutate({
        taskId,
        isRequired: !currentValue,
      });
    },
    [toggleRequiredMutation],
  );

  const handleEditTask = useCallback(
    (taskId: string) => {
      const task = taskMap.get(taskId);
      if (!task) return;
      onEditTask(taskId, {
        title: task.title,
        description: task.description || "",
        category: task.category,
        assigneeRole: task.assigneeRole || "",
        dueDays: task.dueDays,
        isRequired: task.isRequired,
      });
    },
    [taskMap, onEditTask],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!template) return null;

  const taskCount = template.tasks?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-3xl max-h-[85vh] overflow-hidden"
      >
        <DialogHeader>
          <TemplateHeader
            template={template}
            taskCount={taskCount}
            onEditTemplate={onEditTemplate}
            onDuplicate={onDuplicate}
            onExport={onExport}
          />
        </DialogHeader>

        <TemplateToolbar
          filterCategory={filterCategory}
          onFilterCategory={setFilterCategory}
          search={search}
          onSearch={setSearch}
          searchExpanded={searchExpanded}
          onSearchExpandedToggle={() => setSearchExpanded((prev) => !prev)}
          viewMode={viewMode}
          onViewMode={setViewMode}
          onResetFilters={handleResetFilters}
          onAddTask={() => onAddTask(template.id)}
        />

        <ScrollArea className="h-full max-h-[400px]">
          {filteredTaskIds.length === 0 ? (
            <EmptyTasksState onAddTask={() => onAddTask(template.id)} />
          ) : viewMode === "category" ? (
            <TaskListCategory
              tasksByCategory={tasksByCategory}
              draggingId={null}
              onSetDragging={() => {}}
              onToggleRequired={handleToggleRequired}
              onEditTask={handleEditTask}
              onDeleteTask={onDeleteTask}
            />
          ) : (
            <TaskListFlat
              taskIds={filteredTaskIds}
              getTaskById={getTaskById}
              sensors={sensors}
              onDragEnd={handleDragEnd}
              onToggleRequired={handleToggleRequired}
              onEditTask={handleEditTask}
              onDeleteTask={onDeleteTask}
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
