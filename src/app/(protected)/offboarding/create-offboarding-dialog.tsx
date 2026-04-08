"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { createOffboarding, getUsers } from "./actions";
import type { OffboardingTemplate } from "./types";
import { REASON_OPTIONS } from "./types";

// Form schema
const createOffboardingSchema = z.object({
  userId: z.string().min(1, "Vui lòng chọn nhân viên"),
  templateId: z.string().optional(),
  resignDate: z.date({ message: "Vui lòng chọn ngày nghỉ" }),
  lastWorkDate: z.date({ message: "Vui lòng chọn ngày làm cuối" }),
  reason: z.string().min(1, "Vui lòng chọn lý do nghỉ"),
  reasonDetail: z.string().optional(),
});

type CreateOffboardingFormData = z.infer<typeof createOffboardingSchema>;

interface CreateOffboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: OffboardingTemplate[];
  onSuccess: () => void;
}

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  departmentId: string | null;
  position: string | null;
}

export function CreateOffboardingDialog({
  open,
  onOpenChange,
  templates,
  onSuccess,
}: CreateOffboardingDialogProps) {
  const queryClient = useQueryClient();
  const [userOpen, setUserOpen] = useState(false);

  // Fetch users for selection
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserItem[]>({
    queryKey: ["users", "all"],
    queryFn: () => getUsers() as Promise<UserItem[]>,
    enabled: open,
  });

  const form = useForm<CreateOffboardingFormData>({
    resolver: zodResolver(createOffboardingSchema),
    defaultValues: {
      userId: "",
      templateId: undefined,
      reason: "",
      reasonDetail: "",
    },
  });

  const selectedUserId = useWatch({
    control: form.control,
    name: "userId",
  });
  const selectedUser = users.find((user) => user.id === selectedUserId);

  const createMutation = useMutation({
    mutationFn: createOffboarding,
    onSuccess: () => {
      toast.success("Đã tạo quy trình offboarding");
      queryClient.invalidateQueries({
        queryKey: ["offboardings"],
      });
      queryClient.invalidateQueries({
        queryKey: ["offboarding-stats"],
      });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error("Lỗi khi tạo quy trình");
      console.error(error);
    },
  });

  const onSubmit = (data: CreateOffboardingFormData) => {
    createMutation.mutate({
      userId: data.userId,
      templateId: data.templateId || undefined,
      resignDate: data.resignDate,
      lastWorkDate: data.lastWorkDate,
      reason: data.reason,
      reasonDetail: data.reasonDetail,
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setUserOpen(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>Tạo quy trình nghỉ việc</DialogTitle>
          <DialogDescription>
            Thiết lập quy trình offboarding theo từng bước để tránh thiếu thông
            tin bàn giao.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-h-[75vh] overflow-y-auto space-y-4 no-scrollbar"
          >
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhân viên *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Popover open={userOpen} onOpenChange={setUserOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={userOpen}
                            disabled={isLoadingUsers}
                            className={cn(
                              "w-full justify-between border-input bg-background px-3 font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <span className="truncate gap-x-2">
                              {isLoadingUsers
                                ? "Đang tải danh sách nhân viên..."
                                : selectedUser
                                  ? `${selectedUser.name || "Nhân viên"} - ${selectedUser.username}`
                                  : "Chọn nhân viên"}
                            </span>
                            <ChevronDownIcon
                              aria-hidden="true"
                              className="shrink-0 text-muted-foreground/80"
                              size={16}
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-full min-w-(--radix-popper-anchor-width) border-input p-0 max-h-80 overflow-hidden"
                        >
                          <Command>
                            <CommandInput placeholder="Tìm theo tên, email hoặc mã nhân viên..." />
                            <CommandList
                              className="max-h-64 overflow-y-auto overscroll-contain"
                              onWheelCapture={(e) => e.stopPropagation()}
                            >
                              <CommandEmpty>
                                Không tìm thấy nhân viên phù hợp
                              </CommandEmpty>
                              <CommandGroup>
                                {users.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    value={`${user.id} ${user.name || ""} ${user.email} ${user.username || ""}`}
                                    onSelect={() => {
                                      field.onChange(user.id);
                                      setUserOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col min-w-0 ">
                                      <div className="flex items-center gap-2">
                                        <span className="truncate">
                                          {user.name || "Chưa có tên"}
                                        </span>
                                        -
                                        <span className="text-xs text-muted-foreground truncate">
                                          {user.username}
                                        </span>
                                      </div>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {user.email}
                                      </span>
                                    </div>
                                    {field.value === user.id && (
                                      <CheckIcon
                                        className="ml-auto"
                                        size={16}
                                      />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {!!selectedUser && (
                        <p className="text-xs text-muted-foreground">
                          Đang chọn:{" "}
                          <strong>{selectedUser.name || "Nhân viên"}</strong> (
                          {selectedUser.username || selectedUser.email})
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mẫu quy trình</FormLabel>
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? undefined : value)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn mẫu (không bắt buộc)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Mặc định</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Mẫu giúp tự động tạo checklist bàn giao ngay khi khởi tạo.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="resignDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày nộp đơn *</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={(date) => field.onChange(date)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastWorkDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày làm cuối *</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={(date) => field.onChange(date)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do nghỉ *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn lý do" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REASON_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reasonDetail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chi tiết lý do</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả thêm bối cảnh nghỉ việc, tình trạng bàn giao, đề xuất hỗ trợ..."
                      rows={4}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="sticky bottom-0 bg-background border-t pt-4">
              <Button
                size={"sm"}
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Hủy
              </Button>
              <Button
                size={"sm"}
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="animate-spin" />
                )}
                Tạo quy trình
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
