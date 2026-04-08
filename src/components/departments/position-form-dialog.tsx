"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  createPosition,
  updatePosition,
} from "@/app/[locale]/(protected)/positions/actions";
// import { getAuthorityTypes } from "@/app/[locale]/(protected)/authority-types/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2 } from "lucide-react";
import z from "zod";
// import type { AuthorityTypeItem } from "@/app/[locale]/(protected)/authority-types/types";

const AUTHORITY_DUPLICATE_CHECK = ["MANAGER", "DEPUTY"];

const positionFormSchema = z.object({
  name: z.string().min(2, "Position name must be at least 2 characters"),
  code: z
    .string()
    .min(2, "Position code must be at least 2 characters")
    .max(20, "Position code must be at most 20 characters")
    .regex(/^[A-Z0-9_]+$/, "Position code must contain only uppercase letters, numbers, and underscore"),
  authority: z.enum([
    "EXECUTIVE",
    "DIRECTOR",
    "MANAGER",
    "DEPUTY",
    "TEAM_LEAD",
    "STAFF",
    "INTERN",
  ]),
  level: z.number().int().min(1).max(10),
  description: z.string().optional(),
});

type PositionFormValues = z.infer<typeof positionFormSchema>;

type ExistingPosition = {
  id: string;
  name: string;
  code: string;
  authority: string;
  level: number;
};

export interface DepartmentPositionFormDialogProps {
  departmentId: string;
  departmentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPosition?: {
    id: string;
    name: string;
    code: string;
  authority: string;
  level: number;
  description?: string | null;
} | null;
}

// function getAuthorityLabel(authority: string, authorityTypes: AuthorityTypeItem[]): string {
//     const option = authorityTypes.find((opt) => opt.code === authority);
//     return option?.name ?? authority;
// }

export function DepartmentPositionFormDialog({
  departmentId,
  departmentName,
  open,
  onOpenChange,
  editingPosition,
}: DepartmentPositionFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!editingPosition;
  const t = useTranslations("ProtectedPages");

  // Fetch authority types from database
  // const { data: authorityTypes = [] } = useQuery({
  //     queryKey: ["authority-types"],
  //     queryFn: () => getAuthorityTypes(),
  //     enabled: open,
  // });

  // Helper function to get default level from authority types
  // const getDefaultLevel = (authority: string): number => {
  //     const option = authorityTypes.find((opt) => opt.code === authority);
  //     return option?.level ?? 6;
  // };

  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      name: "",
      code: "",
      authority: "STAFF",
      level: 6,
      description: "",
    },
  });

  const authority = form.watch("authority");

  useEffect(() => {
    if (editingPosition) {
      form.reset({
        name: editingPosition.name,
        code: editingPosition.code,
        authority: editingPosition.authority as PositionFormValues["authority"],
        description: editingPosition.description || "",
      });
    } else {
      form.reset({
        name: "",
        code: "",
        authority: "STAFF",
        description: "",
      });
    }
  }, [editingPosition, form]);

  // useEffect(() => {
  //     if (!isEdit && authority) {
  //         form.setValue("level", getDefaultLevel(authority), {
  //             shouldValidate: true,
  //         });
  //     }
  // }, [authority, isEdit, form]);

  const { data: existingPositions = [] } = useQuery({
    queryKey: ["positions", "department", departmentId],
    queryFn: async () => {
      const { getAllPositions } =
        await import("@/app/[locale]/(protected)/positions/actions");
      return getAllPositions({ departmentId, status: "ACTIVE" });
    },
    enabled: open,
  });

  const positionsList: ExistingPosition[] = existingPositions;

  const createMutation = useMutation({
    mutationFn: createPosition,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["positions", "department", departmentId] });
      await queryClient.cancelQueries({ queryKey: ["departments", departmentId] });
      onOpenChange(false);
      return {};
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("positionsCreateSuccess"));
      } else {
        toast.error(result.error);
        queryClient.invalidateQueries({ queryKey: ["positions", "department", departmentId] });
        queryClient.invalidateQueries({ queryKey: ["departments", departmentId] });
      }
    },
    onError: () => {
      toast.error(t("positionsCreateError"));
      queryClient.invalidateQueries({ queryKey: ["positions", "department", departmentId] });
      queryClient.invalidateQueries({ queryKey: ["departments", departmentId] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["positions", "department", departmentId] });
      queryClient.invalidateQueries({ queryKey: ["departments", departmentId] });
    }
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
      await queryClient.cancelQueries({ queryKey: ["positions", "department", departmentId] });
      await queryClient.cancelQueries({ queryKey: ["departments", departmentId] });
      onOpenChange(false);
      return {};
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("positionsUpdateSuccess"));
      } else {
        toast.error(result.error);
        queryClient.invalidateQueries({ queryKey: ["positions", "department", departmentId] });
        queryClient.invalidateQueries({ queryKey: ["departments", departmentId] });
      }
    },
    onError: () => {
      toast.error(t("positionsUpdateError"));
      queryClient.invalidateQueries({ queryKey: ["positions", "department", departmentId] });
      queryClient.invalidateQueries({ queryKey: ["departments", departmentId] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["positions", "department", departmentId] });
      queryClient.invalidateQueries({ queryKey: ["departments", departmentId] });
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    const requiresDuplicateCheck = AUTHORITY_DUPLICATE_CHECK.includes(
      values.authority,
    );
    const editingId: string | null = editingPosition
      ? editingPosition.id
      : null;

    if (requiresDuplicateCheck && !isEdit) {
      const hasExisting = positionsList.some(
        (p) => p.authority === values.authority && p.id !== editingId,
      );
      // if (hasExisting) {
      //     const label = getAuthorityLabel(values.authority, authorityTypes);
      //     toast.error(
      //         `Department already has position "${label}". Only one "${label}" is allowed per department.`,
      //     );
      //     return;
      // }
    }

    const payload = {
      name: values.name,
      code: values.code,
      authority: values.authority,
      departmentId,
      level: Number(values.level),
      description: values.description || undefined,
      status: "ACTIVE" as const,
    };

    if (isEdit && editingPosition) {
      updateMutation.mutate({
        id: editingPosition.id,
        data: payload,
      });
    } else {
      createMutation.mutate(payload as Parameters<typeof createPosition>[0]);
    }
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("positionsDialogTitleEdit") : t("positionsDialogTitleCreate")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("positionsDialogDescriptionEdit", {
                  name: `${editingPosition?.name ?? ""} (${departmentName})`,
                })
              : t("positionsDialogDescriptionCreateInDepartment", {
                  department: departmentName,
                })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("positionsFieldName")} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("positionsPlaceholderName")}
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
                  <FormItem>
                    <FormLabel>{t("positionsFieldCode")} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: HR_MANAGER"
                        {...field}
                        disabled={isEdit}
                        className={isEdit ? "opacity-60" : ""}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* <FormField
                                control={form.control}
                                name="authority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quyá»n háº¡n *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select authority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {authorityTypes.map(
                                                    (opt) => (
                                                        <SelectItem
                                                            key={opt.code}
                                                            value={opt.code}
                                                        >
                                                            {opt.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        {AUTHORITY_DUPLICATE_CHECK.includes(
                                            field.value,
                                        ) && (
                                            <FormDescription className="text-amber-600">
                                                Only one{" "}
                                                {getAuthorityLabel(field.value, authorityTypes).toLowerCase()}
                                            </FormDescription>
                                        )}
                                    </FormItem>
                                )}
                            /> */}

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("positionsFieldLevel")} *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        placeholder={t("positionsPlaceholderLevel")}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val ? Number(val) : undefined);
                        }}
                      />
                    </FormControl>
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
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t("positionsCancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? t("positionsSaveChanges") : t("positionsCreateAction")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

