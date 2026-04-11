/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { DepartmentNode } from "@/types/org-chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createDepartment,
  updateDepartment,
} from "@/app/(protected)/org-chart/actions";
import { getPotentialManagers } from "@/app/(protected)/departments/actions";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconPicker } from "./icon-picker";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ChevronsUpDown, Check, Info, Network } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const departmentFormSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên phòng ban"),
  code: z.string().min(1, "Vui lòng nhập mã phòng ban"),
  description: z.string().optional(),
  logo: z.string().optional(),
  parentId: z.string().optional(),
  secondaryParentIds: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  managerId: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

interface DepartmentFormDialogProps {
  open: boolean;
  onClose: () => void;
  department: DepartmentNode | null; // null = create mode
  allDepartments: DepartmentNode[];
}

function flattenDepartments(
  nodes: DepartmentNode[],
): { id: string; name: string; code: string }[] {
  const result: { id: string; name: string; code: string }[] = [];
  function walk(ns: DepartmentNode[]) {
    for (const n of ns) {
      result.push({ id: n.id, name: n.name, code: n.code });
      walk(n.children);
    }
  }
  walk(nodes);
  return result;
}

export function DepartmentFormDialog({
  open,
  onClose,
  department,
  allDepartments,
}: DepartmentFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = department !== null;
  const allFlat = flattenDepartments(allDepartments);

  // Fetch potential managers
  const { data: potentialManagers = [] } = useQuery({
    queryKey: ["potentialManagers"],
    queryFn: getPotentialManagers,
    enabled: open,
  });

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      logo: "",
      parentId: "none",
      secondaryParentIds: [],
      status: "ACTIVE",
      managerId: "__none__",
    },
  });

  useEffect(() => {
    if (department && open) {
      form.reset({
        name: department.name,
        code: department.code,
        description: department.description ?? "",
        logo: department.logo ?? "",
        parentId: department.parentId ?? "none",
        secondaryParentIds: department.secondaryParentIds ?? [],
        status: department.status as "ACTIVE" | "INACTIVE",
        managerId: department.managerId ?? "__none__",
      });
    } else if (open) {
      form.reset();
    }
  }, [department, open, form]);

  const watchName = form.watch("name");

  useEffect(() => {
    // Auto generate code from name ONLY in create mode
    if (watchName && !isEdit) {
      const generatedCode = watchName
        .split(/\s+/)
        .filter((word) => word.length > 0)
        .map((word) => word[0].toUpperCase())
        .join("");
      form.setValue("code", generatedCode, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [watchName, isEdit, form]);

  const mutation = useMutation({
    mutationFn: async (data: {
      name: string;
      code: string;
      description?: string;
      logo?: string;
      parentId?: string | null;
      secondaryParentIds?: string[];
      status: string;
      managerId?: string | null;
    }) => {
      if (isEdit && department) {
        return updateDepartment(department.id, data);
      } else {
        return createDepartment(data);
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({
          queryKey: ["departmentTree"],
        });
        queryClient.invalidateQueries({
          queryKey: ["departments"],
        });
        queryClient.invalidateQueries({
          queryKey: ["potentialManagers"],
        });
        onClose();
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      toast.error("Có lỗi xảy ra");
    },
  });

  const onSubmit = (values: DepartmentFormValues) => {
    mutation.mutate({
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      description: values.description?.trim() || undefined,
      logo: values.logo?.trim() || undefined,
      parentId: values.parentId === "none" ? null : values.parentId,
      secondaryParentIds: values.secondaryParentIds || [],
      status: values.status,
      managerId:
        values.managerId === "__none__" || !values.managerId
          ? null
          : values.managerId,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(-1)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => (!o || !mutation.isPending) && onClose()}
    >
      <DialogContent className="sm:max-w-[700px] p-0 flex flex-col overflow-hidden h-[80vh]">
        <DialogHeader className="px-6 pt-4">
          <DialogTitle className="text-xl">
            {isEdit ? "Chi tiết phòng ban" : "Tạo phòng ban mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin chi tiết và cơ cấu của phòng ban"
              : "Thêm phòng ban mới vào sơ đồ tổ chức của công ty"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden h-full"
          >
            <Tabs
              defaultValue="general"
              className="w-full h-full flex flex-col overflow-hidden gap-0"
            >
              <div className="px-6 pt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general" className="gap-2">
                    <Info />
                    Thông tin chung
                  </TabsTrigger>
                  <TabsTrigger value="structure" className="gap-2">
                    <Network />
                    Cơ cấu tổ chức
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto pt-2 no-scrollbar">
                <div className="px-6 py-2">
                  <TabsContent value="general" className="space-y-6 mt-0">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-[35%] space-y-6">
                        <FormField
                          control={form.control}
                          name="logo"
                          render={({ field }) => (
                            <FormItem className="flex flex-col p-4 border border-dashed rounded-xl bg-muted/10 hover:bg-muted/30 transition-colors">
                              <FormLabel className="text-sm font-semibold cursor-pointer">
                                Biểu tượng
                              </FormLabel>
                              <FormControl>
                                <div className="w-full flex justify-center">
                                  <IconPicker
                                    value={field.value ?? ""}
                                    onChange={field.onChange}
                                    className="w-full justify-center"
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Chọn biểu tượng cho phòng ban
                              </FormDescription>

                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Trạng thái</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn trạng thái" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ACTIVE">
                                    Đang hoạt động
                                  </SelectItem>
                                  <SelectItem value="INACTIVE">
                                    Ngừng hoạt động
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex-1 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem className="col-span-2 sm:col-span-1">
                                <FormLabel>
                                  Tên phòng ban{" "}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Nhập tên phòng ban"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                              <FormItem className="col-span-2 sm:col-span-1">
                                <FormLabel>
                                  Mã phòng ban{" "}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="uppercase"
                                    placeholder=""
                                    disabled={!isEdit && !!watchName}
                                    {...field}
                                    readOnly
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="managerId"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Trưởng phòng</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground",
                                      )}
                                    >
                                      {field.value &&
                                      field.value !== "__none__" ? (
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-5 w-5">
                                            <AvatarImage
                                              src={
                                                potentialManagers.find(
                                                  (m) => m.id === field.value,
                                                )?.image ?? undefined
                                              }
                                            />
                                            <AvatarFallback className="text-[10px]">
                                              {getInitials(
                                                potentialManagers.find(
                                                  (m) => m.id === field.value,
                                                )?.name || "",
                                              )}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="truncate">
                                            {
                                              potentialManagers.find(
                                                (m) => m.id === field.value,
                                              )?.name
                                            }
                                          </span>
                                        </div>
                                      ) : (
                                        "Không chọn trưởng phòng"
                                      )}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-[300px] p-0"
                                  align="start"
                                >
                                  <Command>
                                    <CommandInput placeholder="Tìm kiếm nhân viên..." />
                                    <CommandList className="max-h-60 overflow-y-auto">
                                      <CommandEmpty>
                                        Không tìm thấy nhân viên
                                      </CommandEmpty>
                                      <CommandGroup>
                                        <CommandItem
                                          value="__none__"
                                          onSelect={() => {
                                            field.onChange("__none__");
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === "__none__"
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          -- Chưa phân công --
                                        </CommandItem>
                                        {potentialManagers.map((manager) => (
                                          <CommandItem
                                            key={manager.id}
                                            value={`${manager.name} ${manager.position || ""} ${manager.username || ""}`}
                                            onSelect={() => {
                                              field.onChange(manager.id);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === manager.id
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                            <Avatar className="h-6 w-6 mr-2">
                                              <AvatarImage
                                                src={manager.image ?? undefined}
                                              />
                                              <AvatarFallback className="text-[10px]">
                                                {getInitials(manager.name)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                              <span>{manager.name}</span>
                                              {manager.position && (
                                                <span className="text-[10px] text-muted-foreground leading-tight">
                                                  {manager.position}
                                                </span>
                                              )}
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mô tả chức năng</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Mô tả ngắn về chức năng, nhiệm vụ của phòng ban..."
                                  className="min-h-[140px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="structure" className="space-y-6 mt-0">
                    <div className="bg-muted/10 p-3 rounded-lg border">
                      <FormField
                        control={form.control}
                        name="parentId"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex flex-col gap-0.5">
                              <FormLabel className="text-base font-medium">
                                Phòng ban cấp trên trực tiếp
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Xác định vị trí chính của phòng ban này trong sơ
                                đồ tổ chức.
                              </p>
                            </div>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full bg-background">
                                  <SelectValue placeholder="Chọn phòng ban cấp trên" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">
                                  -- Không có (Phòng ban gốc) --
                                </SelectItem>
                                {allFlat
                                  .filter((d) => d.id !== department?.id)
                                  .map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                      {d.name} ({d.code})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="p-3 rounded-lg border border-dashed">
                      <FormField
                        control={form.control}
                        name="secondaryParentIds"
                        render={() => (
                          <FormItem>
                            <div className="flex flex-col gap-0.5">
                              <FormLabel className="text-base font-medium">
                                Phòng ban quản lý phụ (Ma trận tổ chức)
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Lựa chọn các phòng ban khác mà phòng ban này có
                                trách nhiệm báo cáo phụ. Thường dùng cho sơ đồ
                                tổ chức dạng ma trận.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/10 p-2 rounded-lg min-h-[150px]">
                              {allFlat.filter(
                                (d) =>
                                  d.id !== department?.id &&
                                  d.id !== form.watch("parentId"),
                              ).length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center text-muted-foreground text-sm py-8 space-y-2">
                                  <Network className="h-8 w-8 opacity-20" />
                                  <span>Không có phòng ban khả dụng</span>
                                </div>
                              ) : (
                                allFlat
                                  .filter(
                                    (d) =>
                                      d.id !== department?.id &&
                                      d.id !== form.watch("parentId"),
                                  )
                                  .map((item) => (
                                    <FormField
                                      key={item.id}
                                      control={form.control}
                                      name="secondaryParentIds"
                                      render={({ field }) => {
                                        return (
                                          <FormItem
                                            key={item.id}
                                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer bg-background"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(
                                                  item.id,
                                                )}
                                                onCheckedChange={(checked) => {
                                                  return checked
                                                    ? field.onChange([
                                                        ...(field.value || []),
                                                        item.id,
                                                      ])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                          (value) =>
                                                            value !== item.id,
                                                        ),
                                                      );
                                                }}
                                                className="mt-0.5"
                                              />
                                            </FormControl>

                                            <FormLabel className="font-medium text-sm cursor-pointer leading-none">
                                              {item.name} -{" "}
                                              <p className="text-xs text-muted-foreground">
                                                {item.code}
                                              </p>
                                            </FormLabel>
                                          </FormItem>
                                        );
                                      }}
                                    />
                                  ))
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </div>
              </div>

              <div className="px-6 py-4 bg-muted/10 shrink-0">
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    size={"sm"}
                    onClick={onClose}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size={"sm"}
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending
                      ? "Đang xử lý..."
                      : isEdit
                        ? "Lưu thay đổi"
                        : "Tạo mới"}
                  </Button>
                </DialogFooter>
              </div>
            </Tabs>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
