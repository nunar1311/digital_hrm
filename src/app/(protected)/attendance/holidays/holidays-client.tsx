"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Holiday } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Loader2, Pen, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import {
  createHoliday,
  deleteHoliday,
  getHolidays,
  updateHoliday,
} from "../actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import z from "zod";
import { useTimezone } from "@/hooks/use-timezone";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const holidaySchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên ngày lễ"),
  date: z.date().min(1, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.date().optional(),
  isRecurring: z.boolean(),
});

type HolidayFormValues = z.infer<typeof holidaySchema>;

interface HolidaysClientProps {
  initialHolidays: Holiday[];
}

const HolidaysClient = ({ initialHolidays }: HolidaysClientProps) => {
  const queryClient = useQueryClient();

  const [showDialog, setShowDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const { timezone } = useTimezone();

  const toUTCDate = (dateStr: Date | undefined | null) => {
    if (!dateStr) return undefined;
    return new Date(
      Date.UTC(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate()),
    );
  };

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      name: "",
      date: new Date(),
      endDate: new Date(),
      isRecurring: false,
    },
  });

  const { data: holidays } = useQuery({
    queryKey: ["attendance", "holidays"],
    queryFn: async () => {
      const res = await getHolidays();
      return JSON.parse(JSON.stringify(res)) as Holiday[];
    },
    initialData: initialHolidays,
  });

  const createMutation = useMutation({
    mutationFn: (values: HolidayFormValues) =>
      createHoliday({
        name: values.name,
        date: toUTCDate(values.date)!,
        endDate: toUTCDate(values.endDate),
        isRecurring: values.isRecurring,
      }),
    onMutate: async (newHoliday) => {
      await queryClient.cancelQueries({ queryKey: ["attendance", "holidays"] });
      const optimisticHoliday = {
        id: `optimistic-${Date.now()}`,
        name: newHoliday.name,
        date: new Date(newHoliday.date).toISOString(),
        endDate: newHoliday.endDate
          ? new Date(newHoliday.endDate).toISOString()
          : null,
        isRecurring: newHoliday.isRecurring,
      };
      queryClient.setQueryData(["attendance", "holidays"], (old: any) => {
        if (!old) return [optimisticHoliday];
        return [...old, optimisticHoliday];
      });
      return {};
    },
    onSuccess: () => {
      toast.success("Đã thêm ngày nghỉ lễ");
      setShowDialog(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Có lỗi xảy ra");
      queryClient.invalidateQueries({ queryKey: ["attendance", "holidays"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "holidays"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: HolidayFormValues) =>
      updateHoliday(editId!, {
        name: values.name,
        date: toUTCDate(values.date)!,
        endDate: toUTCDate(values.endDate) || null,
        isRecurring: values.isRecurring,
      }),
    onMutate: async (updatedHoliday) => {
      await queryClient.cancelQueries({ queryKey: ["attendance", "holidays"] });
      queryClient.setQueryData(["attendance", "holidays"], (old: any) => {
        if (!old) return old;
        return old.map((h: any) =>
          h.id === editId
            ? {
                ...h,
                name: updatedHoliday.name,
                date: new Date(updatedHoliday.date).toISOString(),
                endDate: updatedHoliday.endDate
                  ? new Date(updatedHoliday.endDate).toISOString()
                  : null,
                isRecurring: updatedHoliday.isRecurring,
              }
            : h,
        );
      });
      return {};
    },
    onSuccess: () => {
      toast.success("Đã cập nhật ngày nghỉ lễ");
      setShowDialog(false);
      setEditId(null);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Có lỗi xảy ra");
      queryClient.invalidateQueries({ queryKey: ["attendance", "holidays"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "holidays"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHoliday(id),
    onMutate: async (deleteId) => {
      await queryClient.cancelQueries({ queryKey: ["attendance", "holidays"] });
      queryClient.setQueryData(["attendance", "holidays"], (old: any) => {
        if (!old) return old;
        return old.filter((h: any) => h.id !== deleteId);
      });
      return {};
    },
    onSuccess: () => {
      toast.success("Đã xoá ngày nghỉ lễ");
      setDeleteId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Có lỗi xảy ra");
      queryClient.invalidateQueries({ queryKey: ["attendance", "holidays"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "holidays"],
      });
    },
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  return (
    <div>
      <div className="flex flex-row items-center justify-between border-b px-2 h-10">
        <h2 className="font-semibold">Ngày nghỉ lễ</h2>
      </div>
      <div className="px-2 flex justify-end items-center gap-2 p-2">
        <Button
          onClick={() => {
            setEditId(null);
            form.reset({
              name: "",
              date: new Date(),
              endDate: undefined,
              isRecurring: false,
            });
            setShowDialog(true);
          }}
          size="xs"
        >
          <Plus />
          Thêm ngày lễ
        </Button>
      </div>
      <div className="flex flex-col p-2">
        {holidays.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Chưa có ngày nghỉ lễ nào
          </p>
        ) : (
          <div className="space-y-2">
            {holidays.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{h.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(h.date)}
                      {h.endDate && ` → ${formatDate(h.endDate)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {h.isRecurring && (
                    <Badge variant="secondary" className="text-xs">
                      Hàng năm
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    tooltip={"Chỉnh sửa"}
                    onClick={() => {
                      setEditId(h.id);
                      form.reset({
                        name: h.name,
                        date: new Date(h.date),
                        endDate: h.endDate ? new Date(h.endDate) : undefined,
                        isRecurring: h.isRecurring,
                      });
                      setShowDialog(true);
                    }}
                  >
                    <Pen className="h-4 w-4 text-primary" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    tooltip={"Xoá"}
                    onClick={() => setDeleteId(h.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? "Chỉnh sửa ngày nghỉ lễ" : "Thêm ngày nghỉ lễ"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) =>
                editId ? updateMutation.mutate(v) : createMutation.mutate(v),
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên ngày lễ</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên ngày lễ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày bắt đầu</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày kết thúc (tuỳ chọn)</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Lặp lại hàng năm</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editId ? "Cập nhật" : "Thêm"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá ngày nghỉ lễ?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Ngày nghỉ lễ sẽ bị xoá khỏi hệ
              thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HolidaysClient;
