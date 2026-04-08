"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  createPosition,
  updatePosition,
  getAllPositions,
} from "@/app/[locale]/(protected)/positions/actions";
import {
  getPositionRoleMapping,
  setPositionRoleMapping,
} from "@/app/[locale]/(protected)/positions/position-role-actions";
import { updatePositionSchema } from "@/app/[locale]/(protected)/positions/schemas";
import type { PositionListItem } from "@/app/[locale]/(protected)/positions/types";
import { getDepartments } from "@/app/[locale]/(protected)/departments/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, Plus, X } from "lucide-react";
import z from "zod";

/** Sinh mÃ£ chá»©c vá»¥ tá»« chá»¯ cÃ¡i Ä‘áº§u cá»§a má»—i tá»« trong tÃªn */
function generateCode(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join("")
    .slice(0, 6);
}

const STATUS_OPTIONS = [
  {
    value: "ACTIVE",
    labelKey: "positionsStatusActive",
  },
  {
    value: "INACTIVE",
    labelKey: "positionsStatusInactive",
  },
];

interface PositionFormDialogProps {
  open: boolean;
  onClose: () => void;
  editData?: PositionListItem | null;
  onOpenChange?: (open: boolean) => void;
  editingPosition?: PositionListItem | null;
  defaultDepartmentId?: string;
  defaultDepartmentName?: string;
}

export function PositionFormDialog({
  open,
  onClose,
  editData,
  onOpenChange,
  editingPosition,
  defaultDepartmentId,
  defaultDepartmentName,
}: PositionFormDialogProps) {
  const resolvedEditData = editingPosition ?? editData;
  const resolvedOnClose = onOpenChange ? () => onOpenChange(false) : onClose;
  const queryClient = useQueryClient();
  const isEdit = !!resolvedEditData;
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>("");
  const t = useTranslations("ProtectedPages");

  const form = useForm<z.infer<typeof updatePositionSchema>>({
    resolver: zodResolver(updatePositionSchema),
    defaultValues: {
      name: "",
      code: "",
      authority: "STAFF",
      departmentId: defaultDepartmentId ?? undefined,
      level: 5,
      description: "",
      parentId: undefined,
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (resolvedEditData) {
      form.reset({
        name: resolvedEditData.name,
        code: resolvedEditData.code,
        authority: resolvedEditData.authority as never,
        departmentId: resolvedEditData.departmentId ?? undefined,
        level: resolvedEditData.level || 0,
        description: resolvedEditData.description || "",
        parentId: resolvedEditData.parentId ?? undefined,
        status: resolvedEditData.status as never,
      });
    } else {
      form.reset({
        name: "",
        code: "",
        authority: "STAFF",
        departmentId: defaultDepartmentId ?? undefined,
        level: 5,
        description: "",
        parentId: undefined,
        status: "ACTIVE",
      });
    }
  }, [resolvedEditData, form, defaultDepartmentId]);

  // Reset role key khi Ä‘Ã³ng/má»Ÿ dialog táº¡o má»›i
  useEffect(() => {
    if (!open) {
      queueMicrotask(() => setSelectedRoleKey(""));
    }
  }, [open]);

  // Láº¥y role mapping má»›i nháº¥t tá»« query cache khi edit
  const { data: existingMapping } = useQuery({
    queryKey: ["position-role-mapping", resolvedEditData?.id],
    queryFn: () => getPositionRoleMapping(resolvedEditData!.id),
    enabled: !!open && !!resolvedEditData?.id,
  });

  // Khi mapping cÃ³ dá»¯ liá»‡u, sync vÃ o state
  const prevMappingIdRef = useRef<string | null>(null);
  useEffect(() => {
    const mapping = existingMapping;
    if (!mapping?.roleKey) return;
    const mappingId = mapping.positionId ?? null;
    if (mappingId && mappingId !== prevMappingIdRef.current) {
      prevMappingIdRef.current = mappingId;
      queueMicrotask(() => {
        setSelectedRoleKey(mapping.roleKey);
      });
    }
  }, [existingMapping]);

  const { data: departmentsData } = useQuery({
    queryKey: ["departments", "all"],
    queryFn: () =>
      getDepartments({
        page: 1,
        pageSize: 100,
        status: "ACTIVE",
      }),
    enabled: open,
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["positions", "all"],
    queryFn: () =>
      getAllPositions({
        status: "ACTIVE",
      }),
    enabled: open,
  });

  // Tá»± sinh mÃ£ chá»©c vá»¥ khi tÃªn thay Ä‘á»•i (chá»‰ khi táº¡o má»›i)
  const watchedName = useWatch({ control: form.control, name: "name" });
  useEffect(() => {
    if (!isEdit && watchedName && watchedName.trim().length > 0) {
      const generated = generateCode(watchedName);
      if (form.getValues("code") !== generated) {
        form.setValue("code", generated, { shouldValidate: true });
      }
    }
  }, [watchedName, isEdit, form]);

  const createMutation = useMutation({
    mutationFn: createPosition,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["positions"] });
      resolvedOnClose();
      return {};
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("positionsCreateSuccess"));
        if (selectedRoleKey && selectedRoleKey !== "__none__") {
          roleMappingMutation.mutate({
            positionId: result.id,
            roleKey: selectedRoleKey,
          });
        }
      } else {
        toast.error(result.error);
        queryClient.invalidateQueries({ queryKey: ["positions"] });
      }
    },
    onError: () => {
      toast.error(t("positionsCreateError"));
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updatePosition>[1];
    }) => updatePosition(id, data),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["positions"] });
      resolvedOnClose();
      return {};
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("positionsUpdateSuccess"));
      } else {
        toast.error(result.error);
        queryClient.invalidateQueries({ queryKey: ["positions"] });
      }
    },
    onError: () => {
      toast.error(t("positionsUpdateError"));
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
  });

  const roleMappingMutation = useMutation({
    mutationFn: ({
      positionId,
      roleKey,
    }: {
      positionId: string;
      roleKey: string;
    }) => setPositionRoleMapping(positionId, roleKey),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
      }
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const finalDepartmentId = isEdit
      ? (values.departmentId ?? undefined)
      : (defaultDepartmentId ?? values.departmentId ?? undefined);

    const payload = {
      name: values.name,
      code: values.code,
      authority: values.authority as never,
      departmentId: finalDepartmentId,
      level: Number(values.level),
      description: values.description || undefined,
      parentId: values.parentId ?? undefined,
      status: values.status as never,
    };

    if (isEdit && editData) {
      updateMutation.mutate({ id: editData.id, data: payload });
      if (selectedRoleKey && selectedRoleKey !== "__none__") {
        roleMappingMutation.mutate({
          positionId: editData.id,
          roleKey: selectedRoleKey,
        });
      }
    } else {
      createMutation.mutate(payload as never);
    }
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const parentOptions = (positions as PositionListItem[]).filter(
    (p: PositionListItem) => p.id !== editData?.id,
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resolvedOnClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEdit
              ? t("positionsDialogTitleEdit")
              : t("positionsDialogTitleCreate")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? t("positionsDialogDescriptionEdit", {
                  name: resolvedEditData?.name ?? "",
                })
              : defaultDepartmentName
                ? t("positionsDialogDescriptionCreateInDepartment", {
                    department: defaultDepartmentName,
                  })
                : t("positionsDialogDescriptionCreate")}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("positionsFieldName")} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t("positionsPlaceholderName")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* MÃ£ chá»©c vá»¥ */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("positionsFieldCode")} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("positionsPlaceholderCodeAuto")}
                        {...field}
                        disabled={isEdit}
                        readOnly={!isEdit}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Cáº¥p báº­c */}
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("positionsFieldLevel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        placeholder={t("positionsPlaceholderLevel")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("positionsFieldParent")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("positionsPlaceholderParent")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parentOptions.map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>
                            {pos.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* PhÃ²ng ban */}
              {(!defaultDepartmentId || isEdit) && (
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("positionsFieldDepartment")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("positionsPlaceholderDepartment")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departmentsData?.departments?.map(
                            (dept: { id: string; name: string }) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Tráº¡ng thÃ¡i */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("positionsStatusLabel")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {t(opt.labelKey as
                              | "positionsStatusActive"
                              | "positionsStatusInactive")}
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
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("positionsFieldDescription")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("positionsPlaceholderDescription")}
                      rows={4}
                      className="resize-none"
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
                onClick={onClose}
                disabled={isLoading}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                {t("positionsCancelAction")}
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("positionsProcessing")}
                  </>
                ) : isEdit ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {t("positionsSaveChanges")}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {t("positionsCreateAction")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

