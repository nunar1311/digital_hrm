"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
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

import { createAsset, updateAsset } from "@/app/(protected)/assets/actions";
import { ASSET_CATEGORY_OPTIONS } from "@/app/(protected)/assets/constants";
import type { AssetWithCurrentUser } from "@/app/(protected)/assets/types";
import { DatePicker } from "../ui/date-picker";

const formSchema = z.object({
  name: z.string().min(1, "Tên tài sản không được để trống"),
  code: z.string().min(1, "Mã tài sản không được để trống"),
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
});

type FormValues = z.infer<typeof formSchema>;

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
      const payload = {
        ...values,
        purchaseDate: values.purchaseDate
          ? values.purchaseDate.toISOString()
          : undefined,
        warrantyEnd: values.warrantyEnd
          ? values.warrantyEnd.toISOString()
          : undefined,
      };
      if (mode === "edit" && asset) {
        return updateAsset(asset.id, payload as any);
      }
      return createAsset(payload as any);
    },
    onSuccess: () => {
      toast.success(
        mode === "create" ? "Đã thêm tài sản mới" : "Đã cập nhật tài sản",
      );
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Có lỗi xảy ra");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Thêm tài sản mới" : "Chỉnh sửa tài sản"}
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
                    <FormLabel>Mã tài sản *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: TS-001"
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
                    <FormLabel>Tên tài sản *</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Laptop Dell XPS 15" {...field} />
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
                    <FormLabel>Loại tài sản *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn loại" />
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
                    <FormLabel>Thương hiệu</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: Dell, Apple, Samsung"
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
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: XPS 15 9530" {...field} />
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
                    <FormLabel>Số serial</FormLabel>
                    <FormControl>
                      <Input placeholder="Số serial sản phẩm" {...field} />
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
                    <FormLabel>Ngày mua</FormLabel>
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
                    <FormLabel>Giá mua (VNĐ)</FormLabel>
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
                    <FormLabel>Bảo hành đến</FormLabel>
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
                    <FormLabel>Vị trí</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Tầng 3, VP Hà Nội" {...field} />
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
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả thêm về tài sản..."
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
                Hủy
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create" ? "Thêm" : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
