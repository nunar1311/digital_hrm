"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useTranslations } from "next-intl";

import { createAsset, updateAsset } from "@/app/[locale]/(protected)/assets/actions";
import { ASSET_CATEGORY_OPTIONS } from "@/app/[locale]/(protected)/assets/constants";
import type { AssetWithCurrentUser } from "@/app/[locale]/(protected)/assets/types";
import { DatePicker } from "../ui/date-picker";

type FormValues = {
  name: string;
  code: string;
  category: "LAPTOP" | "PHONE" | "MONITOR" | "DESK" | "CHAIR" | "CARD" | "OTHER";
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyEnd?: Date;
  location?: string;
  description?: string;
};

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  asset?: AssetWithCurrentUser | null;
}

export function AssetFormDialog({
  open,
  onOpenChange,
  mode,
  asset,
}: AssetFormDialogProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("ProtectedPages");

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("assetsFormValidationNameRequired")),
        code: z.string().min(1, t("assetsFormValidationCodeRequired")),
        category: z.enum([
          "LAPTOP",
          "PHONE",
          "MONITOR",
          "DESK",
          "CHAIR",
          "CARD",
          "OTHER",
        ]),
        brand: z.string().optional(),
        model: z.string().optional(),
        serialNumber: z.string().optional(),
        purchaseDate: z.date().optional(),
        purchasePrice: z.number().optional(),
        warrantyEnd: z.date().optional(),
        location: z.string().optional(),
        description: z.string().optional(),
      }),
    [t],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: asset?.name || "",
      code: asset?.code || "",
      category: (asset?.category as FormValues["category"]) || "LAPTOP",
      brand: asset?.brand || "",
      model: asset?.model || "",
      serialNumber: asset?.serialNumber || "",
      purchaseDate: asset?.purchaseDate
        ? new Date(asset.purchaseDate)
        : undefined,
      purchasePrice: asset?.purchasePrice || undefined,
      warrantyEnd: asset?.warrantyEnd ? new Date(asset.warrantyEnd) : undefined,
      location: asset?.location || "",
      description: asset?.description || "",
    },
  });

  useEffect(() => {
    form.reset({
      name: asset?.name || "",
      code: asset?.code || "",
      category: (asset?.category as FormValues["category"]) || "LAPTOP",
      brand: asset?.brand || "",
      model: asset?.model || "",
      serialNumber: asset?.serialNumber || "",
      purchaseDate: asset?.purchaseDate
        ? new Date(asset.purchaseDate)
        : undefined,
      purchasePrice: asset?.purchasePrice || undefined,
      warrantyEnd: asset?.warrantyEnd ? new Date(asset.warrantyEnd) : undefined,
      location: asset?.location || "",
      description: asset?.description || "",
    });
  }, [open, asset, mode]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (mode === "edit" && asset) {
        return updateAsset(asset.id, values);
      }
      return createAsset(values);
    },
    onSuccess: () => {
      toast.success(
        mode === "create"
          ? t("assetsFormToastCreateSuccess")
          : t("assetsFormToastEditSuccess"),
      );
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || t("assetsFormToastError"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t("assetsFormDialogTitleCreate")
              : t("assetsFormDialogTitleEdit")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("assetsFormCodeLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assetsFormCodePlaceholder")}
                        {...field}
                        disabled={mode === "edit"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("assetsFormNameLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assetsFormNamePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("assetsFormCategoryLabel")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t("assetsFormCategoryPlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ASSET_CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("assetsFormBrandLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assetsFormBrandPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("assetsFormModelLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assetsFormModelPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("assetsFormSerialLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assetsFormSerialPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("assetsFormPurchaseDateLabel")}</FormLabel>
                    <FormControl>
                      <DatePicker date={field.value} setDate={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("assetsFormPurchasePriceLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="warrantyEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("assetsFormWarrantyEndLabel")}</FormLabel>
                    <FormControl>
                      <DatePicker date={field.value} setDate={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("assetsFormLocationLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assetsFormLocationPlaceholder")}
                        {...field}
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
                  <FormLabel>{t("assetsFormDescriptionLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("assetsFormDescriptionPlaceholder")}
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
              >
                {t("assetsFormCancelButton")}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create"
                  ? t("assetsFormSubmitCreateButton")
                  : t("assetsFormSubmitEditButton")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

