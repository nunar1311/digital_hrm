"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Holiday, HolidayCalendarWithRelations } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Copy,
  Loader2,
  Pen,
  Plus,
  Trash2,
  MoreVertical,
} from "lucide-react";
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
  copyHolidayCalendar,
  createHoliday,
  createHolidayCalendar,
  createFromVietnamTemplate,
  deleteHoliday,
  deleteHolidayCalendar,
  getHolidayCalendars,
  updateHoliday,
  updateHolidayCalendar,
} from "./actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useTranslations } from "next-intl";
import z from "zod";
import { useTimezone } from "@/hooks/use-timezone";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================================
// Schemas
// ============================================================

const calendarSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z.string().min(1, t("holidaysCalendarNameRequired")),
    year: z.number().min(2020).max(2100),
    description: z.string().optional(),
    isDefault: z.boolean(),
  });

const holidaySchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z.string().min(1, t("holidaysHolidayNameRequired")),
    date: z.date({ message: t("holidaysDateRequired") }),
    endDate: z.date().optional().nullable(),
    isRecurring: z.boolean(),
    halfDay: z.enum(["FULL", "MORNING", "AFTERNOON"]),
  });

const copySchema = z.object({
  targetYear: z.number().min(2020).max(2100),
  targetName: z.string().optional(),
});

type CalendarFormValues = z.infer<ReturnType<typeof calendarSchema>>;
type HolidayFormValues = z.infer<ReturnType<typeof holidaySchema>>;
type CopyFormValues = z.infer<typeof copySchema>;

// ============================================================
// Component
// ============================================================

interface HolidaysClientProps {
  initialData: HolidayCalendarWithRelations[];
}

const HolidaysClient = ({ initialData }: HolidaysClientProps) => {
  const { timezone } = useTimezone();
  const queryClient = useQueryClient();
  const t = useTranslations("ProtectedPages");

  // Dialog states
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [showHolidayDialog, setShowHolidayDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showVietnamTemplateDialog, setShowVietnamTemplateDialog] =
    useState(false);
  const [showHolidaysListDialog, setShowHolidaysListDialog] = useState(false);
  const [holidaysListCalendarId, setHolidaysListCalendarId] = useState<
    string | null
  >(null);
  const [deleteCalendarId, setDeleteCalendarId] = useState<string | null>(null);
  const [deleteHolidayId, setDeleteHolidayId] = useState<string | null>(null);

  // Edit states
  const [editCalendarId, setEditCalendarId] = useState<string | null>(null);
  const [editHolidayId, setEditHolidayId] = useState<string | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
    null,
  );

  // Forms
  const calendarForm = useForm<CalendarFormValues>({
    resolver: zodResolver(calendarSchema(t)),
    defaultValues: {
      name: "",
      year: new Date().getFullYear(),
      description: "",
      isDefault: false,
    },
  });

  const holidayForm = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema(t)),
    defaultValues: {
      name: "",
      date: new Date(),
      endDate: undefined,
      isRecurring: false,
      halfDay: "FULL",
    },
  });

  const copyForm = useForm<CopyFormValues>({
    resolver: zodResolver(copySchema),
    defaultValues: {
      targetYear: new Date().getFullYear() + 1,
      targetName: "",
    },
  });

  // Queries
  const { data: calendars = initialData, isLoading } = useQuery({
    queryKey: ["attendance", "holidays", "calendars"],
    queryFn: () =>
      getHolidayCalendars() as Promise<HolidayCalendarWithRelations[]>,
  });

  // Mutations - Calendar
  const createCalendarMutation = useMutation({
    mutationFn: (data: CalendarFormValues) => createHolidayCalendar(data),
    onSuccess: () => {
      toast.success(t("holidaysToastCalendarCreated"));
      setShowCalendarDialog(false);
      calendarForm.reset();
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "holidays", "calendars"],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateCalendarMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CalendarFormValues>;
    }) => updateHolidayCalendar(id, data),
    onSuccess: () => {
      toast.success(t("holidaysToastCalendarUpdated"));
      setShowCalendarDialog(false);
      calendarForm.reset();
      setEditCalendarId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "holidays", "calendars"],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteCalendarMutation = useMutation({
    mutationFn: (id: string) => deleteHolidayCalendar(id),
    onSuccess: () => {
      toast.success(t("holidaysToastCalendarDeleted"));
      setDeleteCalendarId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "holidays", "calendars"],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: (year: number) => createFromVietnamTemplate(year),
    onSuccess: () => {
      toast.success(t("holidaysToastVietnamTemplateCreated"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "holidays", "calendars"],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const copyCalendarMutation = useMutation({
    mutationFn: ({
      sourceId,
      targetYear,
      targetName,
    }: {
      sourceId: string;
      targetYear: number;
      targetName?: string;
    }) => copyHolidayCalendar(sourceId, targetYear, targetName),
    onSuccess: () => {
      toast.success(t("holidaysToastCalendarCopied"));
      setShowCopyDialog(false);
      copyForm.reset();
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "holidays", "calendars"],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Mutations - Holiday
  const createHolidayMutation = useMutation({
    mutationFn: ({
      calendarId,
      data,
    }: {
      calendarId: string;
      data: HolidayFormValues;
    }) =>
      createHoliday({
        holidayCalendarId: calendarId,
        name: data.name,
        date: data.date,
        endDate: data.endDate || undefined,
        isRecurring: data.isRecurring,
        halfDay: data.halfDay,
      }),
    onSuccess: () => {
      toast.success(t("holidaysToastHolidayCreated"));
      setShowHolidayDialog(false);
      holidayForm.reset();
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "holidays", "calendars"],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateHolidayMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<HolidayFormValues>;
    }) =>
      updateHoliday(id, {
        name: data.name,
        date: data.date,
        endDate: data.endDate || null,
        isRecurring: data.isRecurring,
        halfDay: data.halfDay,
      }),
    onSuccess: () => {
      toast.success(t("holidaysToastHolidayUpdated"));
      setShowHolidayDialog(false);
      holidayForm.reset();
      setEditHolidayId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "holidays", "calendars"],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: (id: string) => deleteHoliday(id),
    onSuccess: () => {
      toast.success(t("holidaysToastHolidayDeleted"));
      setDeleteHolidayId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "holidays", "calendars"],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Helpers
  const formatDate = (dateStr: Date | string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const openCalendarDialog = (calendar?: HolidayCalendarWithRelations) => {
    if (calendar) {
      setEditCalendarId(calendar.id);
      calendarForm.reset({
        name: calendar.name,
        year: calendar.year,
        description: calendar.description || "",
        isDefault: calendar.isDefault,
      });
    } else {
      setEditCalendarId(null);
      calendarForm.reset({
        name: "",
        year: new Date().getFullYear(),
        description: "",
        isDefault: false,
      });
    }
    setShowCalendarDialog(true);
  };

  const openHolidayDialog = (calendarId: string, holiday?: Holiday) => {
    setSelectedCalendarId(calendarId);
    if (holiday) {
      setEditHolidayId(holiday.id);
      holidayForm.reset({
        name: holiday.name,
        date: new Date(holiday.date),
        endDate: holiday.endDate ? new Date(holiday.endDate) : undefined,
        isRecurring: holiday.isRecurring,
        halfDay:
          (holiday.halfDay as "FULL" | "MORNING" | "AFTERNOON") || "FULL",
      });
    } else {
      setEditHolidayId(null);
      holidayForm.reset({
        name: "",
        date: new Date(),
        endDate: undefined,
        isRecurring: false,
        halfDay: "FULL",
      });
    }
    setShowHolidayDialog(true);
  };

  const handleCalendarSubmit = (values: CalendarFormValues) => {
    if (editCalendarId) {
      updateCalendarMutation.mutate({
        id: editCalendarId,
        data: values,
      });
    } else {
      createCalendarMutation.mutate(values);
    }
  };

  const handleHolidaySubmit = (values: HolidayFormValues) => {
    if (editHolidayId) {
      updateHolidayMutation.mutate({
        id: editHolidayId,
        data: values,
      });
    } else {
      createHolidayMutation.mutate({
        calendarId: selectedCalendarId!,
        data: values,
      });
    }
  };

  const getHalfDayLabel = (halfDay: string | null) => {
    switch (halfDay) {
      case "MORNING":
        return t("holidaysHalfDayMorning");
      case "AFTERNOON":
        return t("holidaysHalfDayAfternoon");
      default:
        return t("holidaysHalfDayFullDay");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 min-h-0 flex-1 overflow-hidden p-2">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button onClick={() => openCalendarDialog()} size="xs">
            <Plus />
            {t("holidaysCreateCalendar")}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowVietnamTemplateDialog(true)}
            size="xs"
            disabled={createFromTemplateMutation.isPending}
          >
            {createFromTemplateMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            )}
            {t("holidaysVietnamTemplate")}
          </Button>
        </div>
      </div>

      {/* Calendar List */}
      {calendars.length === 0 ? (
        <Card>
          <CardContent>
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("holidaysEmptyTitle")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("holidaysEmptyDescription")}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => openCalendarDialog()}>
                <Plus />
                {t("holidaysCreateCalendar")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 h-[calc(100vh-8rem)] overflow-y-auto">
          {calendars.map((calendar) => (
            <Card key={calendar.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {calendar.name}
                        {calendar.isDefault && (
                          <Badge variant="default" className="text-xs">
                            {t("holidaysDefaultBadge")}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {t("holidaysYearSummary", {
                          year: calendar.year,
                          count: calendar._count?.holidays || 0,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {/* Toggle holidays */}
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setHolidaysListCalendarId(calendar.id);
                          setShowHolidaysListDialog(true);
                        }}
                      >
                        {t("holidaysShowHolidays", { count: calendar.holidays.length })}
                      </Button>

                      <Button
                        size="xs"
                        onClick={() => openHolidayDialog(calendar.id)}
                      >
                        <Plus />
                        {t("holidaysAddHoliday")}
                      </Button>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-xs" variant="ghost">
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCalendarId(calendar.id);
                            setShowCopyDialog(true);
                            copyForm.reset({
                              targetYear: calendar.year + 1,
                              targetName: `${calendar.name.replace(
                                /\d{4}/,
                                String(calendar.year + 1),
                              )}`,
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                          {t("holidaysActionCopy")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openCalendarDialog(calendar)}
                        >
                          <Pen className="h-4 w-4" />
                          {t("holidaysActionEdit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteCalendarId(calendar.id)}
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" /> {t("holidaysActionDelete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Calendar Dialog */}
      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCalendarId
                ? t("holidaysEditCalendarTitle")
                : t("holidaysCreateCalendarTitle")}
            </DialogTitle>
          </DialogHeader>
          <Form {...calendarForm}>
            <form
              onSubmit={calendarForm.handleSubmit(handleCalendarSubmit)}
              className="space-y-4"
            >
              <FormField
                control={calendarForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("holidaysCalendarNameLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("holidaysCalendarNamePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={calendarForm.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("holidaysYearLabel")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={calendarForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("holidaysDescriptionLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("holidaysDescriptionPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={calendarForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>{t("holidaysSetAsDefault")}</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCalendarDialog(false)}
                >
                  {t("holidaysCancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createCalendarMutation.isPending ||
                    updateCalendarMutation.isPending
                  }
                >
                  {(createCalendarMutation.isPending ||
                    updateCalendarMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  )}
                  {editCalendarId ? t("holidaysUpdate") : t("holidaysCreate")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Holiday Dialog */}
      <Dialog open={showHolidayDialog} onOpenChange={setShowHolidayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editHolidayId
                ? t("holidaysEditHolidayTitle")
                : t("holidaysAddHolidayTitle")}
            </DialogTitle>
          </DialogHeader>
          <Form {...holidayForm}>
            <form
              onSubmit={holidayForm.handleSubmit(handleHolidaySubmit)}
              className="space-y-4"
            >
              <FormField
                control={holidayForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("holidaysHolidayNameLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("holidaysHolidayNamePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={holidayForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("holidaysStartDateLabel")}</FormLabel>
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
                  control={holidayForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("holidaysEndDateLabel")}</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value ?? undefined}
                          setDate={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={holidayForm.control}
                name="halfDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("holidaysHalfDayLabel")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FULL">{t("holidaysHalfDayFullDay")}</SelectItem>
                        <SelectItem value="MORNING">{t("holidaysHalfDayMorningOption")}</SelectItem>
                        <SelectItem value="AFTERNOON">
                          {t("holidaysHalfDayAfternoonOption")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={holidayForm.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>{t("holidaysRecurringLabel")}</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowHolidayDialog(false)}
                >
                  {t("holidaysCancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createHolidayMutation.isPending ||
                    updateHolidayMutation.isPending
                  }
                >
                  {(createHolidayMutation.isPending ||
                    updateHolidayMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  )}
                  {editHolidayId ? t("holidaysUpdate") : t("holidaysAdd")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Copy Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("holidaysCopyCalendarTitle")}</DialogTitle>
          </DialogHeader>
          <Form {...copyForm}>
            <form
              onSubmit={copyForm.handleSubmit((v) =>
                copyCalendarMutation.mutate({
                  sourceId: selectedCalendarId!,
                  targetYear: v.targetYear,
                  targetName: v.targetName,
                }),
              )}
              className="space-y-4"
            >
              <FormField
                control={copyForm.control}
                name="targetYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("holidaysNewYearLabel")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={copyForm.control}
                name="targetName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("holidaysNewNameLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("holidaysNewNamePlaceholder")}
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
                  onClick={() => setShowCopyDialog(false)}
                >
                  {t("holidaysCancel")}
                </Button>
                <Button type="submit" disabled={copyCalendarMutation.isPending}>
                  {copyCalendarMutation.isPending && (
                    <Loader2 className="animate-spin" />
                  )}
                  {t("holidaysActionCopy")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Calendar Confirmation */}
      <AlertDialog
        open={!!deleteCalendarId}
        onOpenChange={(open) => !open && setDeleteCalendarId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("holidaysDeleteCalendarTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("holidaysDeleteCalendarDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("holidaysCancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteCalendarId &&
                deleteCalendarMutation.mutate(deleteCalendarId)
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("holidaysActionDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vietnam Template Confirmation */}
      <AlertDialog
        open={showVietnamTemplateDialog}
        onOpenChange={setShowVietnamTemplateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("holidaysCreateVietnamTemplateTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("holidaysCreateVietnamTemplateDescription", {
                year: new Date().getFullYear(),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("holidaysCancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowVietnamTemplateDialog(false);
                createFromTemplateMutation.mutate(new Date().getFullYear());
              }}
            >
              {t("holidaysConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Holidays List Dialog */}
      <Dialog
        open={showHolidaysListDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowHolidaysListDialog(false);
            setHolidaysListCalendarId(null);
          } else {
            setShowHolidaysListDialog(true);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("holidaysListTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {calendars.find((c) => c.id === holidaysListCalendarId)?.holidays
              .length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("holidaysListEmpty")}
              </p>
            ) : (
              calendars
                .find((c) => c.id === holidaysListCalendarId)
                ?.holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{holiday.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(holiday.date)}
                          {holiday.endDate &&
                            ` → ${formatDate(holiday.endDate)}`}
                          {" · "}
                          {getHalfDayLabel(holiday.halfDay)}
                          {holiday.isRecurring && t("holidaysRecurringInline")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setShowHolidaysListDialog(false);
                          openHolidayDialog(holidaysListCalendarId!, holiday);
                        }}
                      >
                        <Pen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setShowHolidaysListDialog(false);
                          setDeleteHolidayId(holiday.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Holiday Confirmation */}
      <AlertDialog
        open={!!deleteHolidayId}
        onOpenChange={(open) => !open && setDeleteHolidayId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("holidaysDeleteHolidayTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("holidaysDeleteHolidayDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("holidaysCancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteHolidayId && deleteHolidayMutation.mutate(deleteHolidayId)
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("holidaysActionDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HolidaysClient;
