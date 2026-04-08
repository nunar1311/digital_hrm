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
} from "./shift-dialogs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("ProtectedPages");

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
          <DialogTitle>{t("attendanceShiftsAssignCycleDeptDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("attendanceShiftsAssignCycleDeptDialogDescription")}
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
                    {t("attendanceShiftsAssignCycleDeptDepartment")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("attendanceShiftsAssignCycleDeptDepartmentPlaceholder")}
                        />
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
                    {t("attendanceShiftsAssignCycleDeptCycle")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("attendanceShiftsAssignCycleDeptCyclePlaceholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workCycles
                        .filter((c) => c.isActive)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({t("attendanceShiftsAssignDays", { dayCount: c.totalDays })})
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
                      {t("attendanceShiftsAssignFromDate")} <span className="text-destructive">*</span>
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
                    <FormLabel>{t("attendanceShiftsAssignToDate")}</FormLabel>
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
                {t("attendanceShiftsAssignCycleDeptSummaryPrefix")} {" "}
                <strong className="text-foreground">
                  {selectedCycle.name}
                </strong>{" "}
                {t("attendanceShiftsAssignCycleDeptSummaryForDept")} {" "}
                <strong className="text-foreground">{selectedDept.name}</strong>{" "}
                {t("attendanceShiftsAssignCycleDeptSummaryFrom")} {" "}
                <strong className="text-foreground">
                  {format(startDate, "dd/MM/yyyy")}
                </strong>
                {endDate ? (
                  <>
                    {" "}
                    {t("attendanceShiftsAssignCycleDeptSummaryTo")} {" "}
                    <strong className="text-foreground">
                      {format(endDate, "dd/MM/yyyy")}
                    </strong>
                  </>
                ) : (
                  ` (${t("attendanceShiftsAssignCycleDeptNoEndDate")})`
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("attendanceShiftsAssignCancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? t("attendanceShiftsAssignSaving")
                  : t("attendanceShiftsAssignCycleDeptSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
