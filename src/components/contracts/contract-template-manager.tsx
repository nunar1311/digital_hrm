"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteContractTemplate,
  getContractTemplates,
  upsertContractTemplate,
} from "@/app/(protected)/contracts/actions";
import type { ContractTemplateItem } from "@/types/contract";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  initialTemplates: ContractTemplateItem[];
}

interface FormState {
  id?: string;
  code: string;
  name: string;
  description: string;
  content: string;
  isDefault: boolean;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  code: "",
  name: "",
  description: "",
  content: "",
  isDefault: false,
  isActive: true,
};

export function ContractTemplateManager({ initialTemplates }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: templates = [] } = useQuery({
    queryKey: ["contracts", "templates"],
    queryFn: () => getContractTemplates({ includeInactive: true }),
    initialData: initialTemplates,
  });

  const saveMutation = useMutation({
    mutationFn: upsertContractTemplate,
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.message || "Không thể lưu mẫu hợp đồng");
        return;
      }
      toast.success("Đã lưu mẫu hợp đồng");
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ["contracts", "templates"] });
    },
    onError: () => toast.error("Không thể lưu mẫu hợp đồng"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContractTemplate,
    onSuccess: () => {
      toast.success("Đã xóa hoặc khóa mẫu hợp đồng");
      queryClient.invalidateQueries({ queryKey: ["contracts", "templates"] });
    },
    onError: () => toast.error("Không thể xóa mẫu hợp đồng"),
  });

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === form.id),
    [templates, form.id],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {selectedTemplate
              ? "Chỉnh sửa mẫu hợp đồng"
              : "Tạo mẫu hợp đồng mới"}
          </CardTitle>
          <CardDescription>
            Hỗ trợ placeholder theo cú pháp {"{{employeeName}}"},{" "}
            {"{{contractNumber}}"}, {"{{startDate}}"},{" {{endDate}}"},{" "}
            {"{{salary}}"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Tên mẫu</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Ví dụ: Mẫu hợp đồng thử việc"
              />
            </div>
            <div>
              <Label>Mã mẫu (tùy chọn)</Label>
              <Input
                value={form.code}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, code: event.target.value }))
                }
                placeholder="Viết thường, có dấu gạch ngang"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Mô tả</Label>
              <Input
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Mục đích sử dụng mẫu hợp đồng"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Nội dung mail merge</Label>
              <Textarea
                rows={12}
                value={form.content}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, content: event.target.value }))
                }
                placeholder="Nhập nội dung mẫu hợp đồng..."
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.isDefault}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isDefault: checked }))
                }
              />
              Đặt làm mẫu mặc định
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isActive: checked }))
                }
              />
              Kích hoạt mẫu
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setForm(EMPTY_FORM)}
              disabled={saveMutation.isPending}
            >
              <Plus className="h-4 w-4" />
              Mẫu mới
            </Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu mẫu
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách mẫu hợp đồng</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên mẫu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Mặc định</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    Chưa có mẫu hợp đồng nào.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-mono text-xs">
                      {template.code}
                    </TableCell>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>
                      {template.isActive ? "Đang hoạt động" : "Đã khóa"}
                    </TableCell>
                    <TableCell>{template.isDefault ? "Có" : "Không"}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            setForm({
                              id: template.id,
                              code: template.code,
                              name: template.name,
                              description: template.description || "",
                              content: template.content,
                              isDefault: template.isDefault,
                              isActive: template.isActive,
                            })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(template.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
