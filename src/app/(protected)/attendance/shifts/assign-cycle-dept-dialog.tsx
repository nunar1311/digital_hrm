import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DepartmentBasic, WorkCycle } from "../types";
import {
  assignCycleDeptFormSchema,
  AssignCycleDeptFormValues,
  dateToStr,
  strToDate,
} from "./shift-dialogs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { CyclePreview } from "@/components/attendance/cycle-preview";
import { format } from "date-fns";

interface AssignCycleDeptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: DepartmentBasic[];
  workCycles: WorkCycle[];
  onSubmit: (values: AssignCycleDeptFormValues) => void;
  isPending: boolean;
}

export function AssignCycleDeptDialog({
  open,
  onOpenChange,
  departments,
  workCycles,
  onSubmit,
  isPending,
}: AssignCycleDeptDialogProps) {
  const form = useForm<AssignCycleDeptFormValues>({
    resolver: zodResolver(assignCycleDeptFormSchema),
    defaultValues: {
      departmentId: "",
      workCycleId: "",
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        departmentId: "",
        workCycleId: "",
        startDate: new Date(),
        endDate: new Date(),
      });
    }
  }, [open, form]);

  const departmentId = form.watch("departmentId");
  const workCycleId = form.watch("workCycleId");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  const selectedCycle = workCycles.find((c) => c.id === workCycleId);
  const selectedDept = departments.find((d) => d.id === departmentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gán chu kỳ theo phòng ban</DialogTitle>
          <DialogDescription>
            Gán chu kỳ làm việc xoay vòng cho toàn bộ nhân viên trong phòng ban
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Phòng ban <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn phòng ban" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                          {d.code ? ` (${d.code})` : ""}
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
              name="workCycleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Chu kỳ làm việc <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn chu kỳ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workCycles
                        .filter((c) => c.isActive)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.totalDays} ngày)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CyclePreview cycle={selectedCycle as WorkCycle} />
            {/* Cycle preview */}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Từ ngày <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={(d) => field.onChange(d)}
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
                    <FormLabel>Đến ngày</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={(d) => field.onChange(d)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Summary */}
            {startDate && selectedDept && selectedCycle && (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                Gán chu kỳ{" "}
                <strong className="text-foreground">
                  {selectedCycle.name}
                </strong>{" "}
                cho toàn bộ nhân viên phòng{" "}
                <strong className="text-foreground">{selectedDept.name}</strong>{" "}
                từ{" "}
                <strong className="text-foreground">
                  {format(startDate, "dd/MM/yyyy")}
                </strong>
                {endDate ? (
                  <>
                    {" "}
                    đến{" "}
                    <strong className="text-foreground">
                      {format(endDate, "dd/MM/yyyy")}
                    </strong>
                  </>
                ) : (
                  " (không có ngày kết thúc)"
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang lưu..." : "Gán chu kỳ phòng ban"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
