// =============================================================================
// ExportEmployeesDialog — Dialog chọn trường và xuất danh sách nhân viên ra Excel
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { Download, Loader2, Check, FileSpreadsheet, Info } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { exportEmployees } from "@/app/(protected)/employees/actions";

interface ExportEmployeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search?: string;
  departmentId?: string;
  status?: string;
  employmentType?: string;
}

interface ExportField {
  key: string;
  label: string;
  group: string;
  defaultChecked: boolean;
}

const EXPORT_FIELDS: ExportField[] = [
  // Thông tin cơ bản
  {
    key: "username",
    label: "Mã nhân viên",
    group: "Thông tin cơ bản",
    defaultChecked: true,
  },
  {
    key: "fullName",
    label: "Họ và tên",
    group: "Thông tin cơ bản",
    defaultChecked: true,
  },
  {
    key: "gender",
    label: "Giới tính",
    group: "Thông tin cơ bản",
    defaultChecked: true,
  },
  {
    key: "dateOfBirth",
    label: "Ngày sinh",
    group: "Thông tin cơ bản",
    defaultChecked: true,
  },
  {
    key: "nationalId",
    label: "Số CCCD",
    group: "Thông tin cơ bản",
    defaultChecked: false,
  },
  {
    key: "nationalIdDate",
    label: "Ngày cấp CCCD",
    group: "Thông tin cơ bản",
    defaultChecked: false,
  },
  {
    key: "nationalIdPlace",
    label: "Nơi cấp CCCD",
    group: "Thông tin cơ bản",
    defaultChecked: false,
  },
  {
    key: "maritalStatus",
    label: "Tình trạng hôn nhân",
    group: "Thông tin cơ bản",
    defaultChecked: false,
  },
  {
    key: "nationality",
    label: "Quốc tịch",
    group: "Thông tin cơ bản",
    defaultChecked: false,
  },
  {
    key: "ethnicity",
    label: "Dân tộc",
    group: "Thông tin cơ bản",
    defaultChecked: false,
  },
  {
    key: "religion",
    label: "Tôn giáo",
    group: "Thông tin cơ bản",
    defaultChecked: false,
  },

  // Liên lạc
  {
    key: "phone",
    label: "Số điện thoại",
    group: "Liên lạc",
    defaultChecked: true,
  },
  {
    key: "personalEmail",
    label: "Email cá nhân",
    group: "Liên lạc",
    defaultChecked: true,
  },
  {
    key: "email",
    label: "Email công ty",
    group: "Liên lạc",
    defaultChecked: false,
  },
  {
    key: "address",
    label: "Địa chỉ",
    group: "Liên lạc",
    defaultChecked: true,
  },

  // Công việc
  {
    key: "departmentName",
    label: "Phòng ban",
    group: "Công việc",
    defaultChecked: true,
  },
  {
    key: "positionName",
    label: "Chức vụ",
    group: "Công việc",
    defaultChecked: true,
  },
  {
    key: "employmentType",
    label: "Loại hình lao động",
    group: "Công việc",
    defaultChecked: true,
  },
  {
    key: "hireDate",
    label: "Ngày vào làm",
    group: "Công việc",
    defaultChecked: true,
  },
  {
    key: "employeeStatus",
    label: "Trạng thái",
    group: "Công việc",
    defaultChecked: true,
  },

  // Tài khoản ngân hàng
  {
    key: "bankName",
    label: "Tên ngân hàng",
    group: "Tài khoản ngân hàng",
    defaultChecked: false,
  },
  {
    key: "bankAccount",
    label: "Số tài khoản",
    group: "Tài khoản ngân hàng",
    defaultChecked: false,
  },
  {
    key: "bankBranch",
    label: "Chi nhánh",
    group: "Tài khoản ngân hàng",
    defaultChecked: false,
  },

  // Bảo hiểm & thuế
  {
    key: "socialInsuranceNo",
    label: "Số BHXH",
    group: "Bảo hiểm & Thuế",
    defaultChecked: false,
  },
  {
    key: "healthInsuranceNo",
    label: "Số BHYT",
    group: "Bảo hiểm & Thuế",
    defaultChecked: false,
  },
  {
    key: "taxCode",
    label: "Mã số thuế",
    group: "Bảo hiểm & Thuế",
    defaultChecked: false,
  },

  // Học vấn
  {
    key: "educationLevel",
    label: "Trình độ",
    group: "Học vấn",
    defaultChecked: false,
  },
  {
    key: "university",
    label: "Trường",
    group: "Học vấn",
    defaultChecked: false,
  },
  {
    key: "major",
    label: "Chuyên ngành",
    group: "Học vấn",
    defaultChecked: false,
  },
];

const GENDER_MAP: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const STATUS_MAP: Record<string, string> = {
  ACTIVE: "Đang làm",
  ON_LEAVE: "Nghỉ phép",
  RESIGNED: "Đã nghỉ",
  TERMINATED: "Đã chấm dứt",
};

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  CONTRACT: "Hợp đồng",
  INTERN: "Thực tập",
};

const EDUCATION_MAP: Record<string, string> = {
  HIGHSCHOOL: "THPT",
  COLLEGE: "Cao đẳng",
  BACHELOR: "Đại học",
  MASTER: "Thạc sĩ",
  PHD: "Tiến sĩ",
};

const MARITAL_STATUS_MAP: Record<string, string> = {
  SINGLE: "Độc thân",
  MARRIED: "Đã kết hôn",
  DIVORCED: "Ly hôn",
};

function formatDateForExcel(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

async function exportToExcel(
  employees: Record<string, unknown>[],
  selectedFields: string[],
) {
  const XLSX = await import("xlsx");

  const displayLabels: Record<string, string> = {
    username: "Mã nhân viên",
    fullName: "Họ và tên",
    name: "Tên",
    gender: "Giới tính",
    dateOfBirth: "Ngày sinh",
    nationalId: "Số CCCD",
    nationalIdDate: "Ngày cấp CCCD",
    nationalIdPlace: "Nơi cấp CCCD",
    maritalStatus: "Tình trạng hôn nhân",
    nationality: "Quốc tịch",
    ethnicity: "Dân tộc",
    religion: "Tôn giáo",
    phone: "Số điện thoại",
    personalEmail: "Email cá nhân",
    email: "Email công ty",
    address: "Địa chỉ",
    departmentName: "Phòng ban",
    positionName: "Chức vụ",
    employmentType: "Loại hình",
    hireDate: "Ngày vào",
    employeeStatus: "Trạng thái",
    bankName: "Ngân hàng",
    bankAccount: "Số TK",
    bankBranch: "Chi nhánh",
    socialInsuranceNo: "BHXH",
    healthInsuranceNo: "BHYT",
    taxCode: "Mã số thuế",
    educationLevel: "Trình độ",
    university: "Trường",
    major: "Chuyên ngành",
    createdAt: "Ngày tạo",
  };

  const vietnameseData = employees.map((emp) => {
    const row: Record<string, unknown> = {};
    for (const field of selectedFields) {
      let value = emp[field];

      if (field === "fullName" && !value) {
        value = emp.name;
      }

      // Format dates
      if (
        field === "dateOfBirth" ||
        field === "nationalIdDate" ||
        field === "hireDate" ||
        field === "createdAt"
      ) {
        value = formatDateForExcel(value as Date | string | null);
      }
      // Format enums
      else if (field === "gender" && value) {
        value = GENDER_MAP[String(value)] || value;
      } else if (field === "employeeStatus" && value) {
        value = STATUS_MAP[String(value)] || value;
      } else if (field === "employmentType" && value) {
        value = EMPLOYMENT_TYPE_MAP[String(value)] || value;
      } else if (field === "educationLevel" && value) {
        value = EDUCATION_MAP[String(value)] || value;
      } else if (field === "maritalStatus" && value) {
        value = MARITAL_STATUS_MAP[String(value)] || value;
      } else if (value === null || value === undefined) {
        value = "";
      }

      row[displayLabels[field] || field] = value;
    }
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(vietnameseData);

  // Auto column widths
  const colWidths: { wch: number }[] = [];
  const headers = Object.keys(vietnameseData[0] || {});
  for (const header of headers) {
    const maxLen = Math.max(
      header.length,
      ...vietnameseData.map((r) => String(r[header] ?? "").length),
    );
    colWidths.push({ wch: Math.min(maxLen + 2, 40) });
  }
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách nhân viên");

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}${String(now.getDate()).padStart(2, "0")}`;
  XLSX.writeFile(workbook, `danh-sach-nhan-vien-${dateStr}.xlsx`);
}

const formSchema = z.object({
  selectedFields: z
    .array(z.string())
    .min(1, "Vui lòng chọn ít nhất một trường để xuất"),
});

type FormValues = z.infer<typeof formSchema>;

export function ExportEmployeesDialog({
  open,
  onOpenChange,
  search,
  departmentId,
  status,
  employmentType,
}: ExportEmployeesDialogProps) {
  const [isExporting, setIsExporting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedFields: EXPORT_FIELDS.filter((f) => f.defaultChecked).map(
        (f) => f.key,
      ),
    },
  });

  const selectedFields = form.watch("selectedFields");

  const groupedFields = useCallback(() => {
    const groups: Record<string, ExportField[]> = {};
    for (const field of EXPORT_FIELDS) {
      if (!groups[field.group]) groups[field.group] = [];
      groups[field.group].push(field);
    }
    return groups;
  }, []);

  const handleToggleGroup = useCallback(
    (group: string, checked: boolean) => {
      const groupKeys = EXPORT_FIELDS.filter((f) => f.group === group).map(
        (f) => f.key,
      );
      const currentSelected = form.getValues("selectedFields");
      if (checked) {
        form.setValue(
          "selectedFields",
          Array.from(new Set([...currentSelected, ...groupKeys])),
          { shouldValidate: true },
        );
      } else {
        form.setValue(
          "selectedFields",
          currentSelected.filter((f) => !groupKeys.includes(f)),
          { shouldValidate: true },
        );
      }
    },
    [form],
  );

  const isGroupAllChecked = useCallback(
    (group: string) => {
      const groupKeys = EXPORT_FIELDS.filter((f) => f.group === group).map(
        (f) => f.key,
      );
      return groupKeys.every((k) => selectedFields.includes(k));
    },
    [selectedFields],
  );

  const isGroupSomeChecked = useCallback(
    (group: string) => {
      const groupKeys = EXPORT_FIELDS.filter((f) => f.group === group).map(
        (f) => f.key,
      );
      const checkedCount = groupKeys.filter((k) =>
        selectedFields.includes(k),
      ).length;
      return checkedCount > 0 && checkedCount < groupKeys.length;
    },
    [selectedFields],
  );

  const onSubmit = async (values: FormValues) => {
    setIsExporting(true);
    try {
      const employees = await exportEmployees({
        search,
        departmentId,
        status,
        employmentType,
      });

      if (!employees || employees.length === 0) {
        toast.warning("Không có nhân viên nào phù hợp với điều kiện lọc");
        return;
      }

      await exportToExcel(employees, values.selectedFields);
      toast.success(
        `Đã xuất thành công ${employees.length} nhân viên ra file Excel`,
      );
      onOpenChange(false);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Lỗi khi xuất file. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Xuất danh sách nhân viên</DialogTitle>
          <DialogDescription>
            Chọn các trường cần xuất và tải về file Excel.
          </DialogDescription>
        </DialogHeader>

        {/* Preview count */}
        <div className="flex items-center gap-2 px-1 py-2 rounded-md bg-muted/50 text-sm">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            File sẽ chứa toàn bộ nhân viên phù hợp với điều kiện lọc hiện tại.
            Bạn có thể chọn các trường muốn xuất bên dưới.
          </span>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 min-h-0 flex flex-col"
          >
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-4 pt-1">
                <FormField
                  control={form.control}
                  name="selectedFields"
                  render={() => (
                    <FormItem>
                      {Object.entries(groupedFields()).map(
                        ([group, fields]) => (
                          <div key={group}>
                            {/* Group header */}
                            <div className="flex items-center gap-2 mb-2">
                              <Checkbox
                                id={`group-${group}`}
                                checked={isGroupAllChecked(group)}
                                ref={
                                  isGroupSomeChecked(group)
                                    ? undefined
                                    : undefined
                                }
                                onCheckedChange={(checked) =>
                                  handleToggleGroup(group, !!checked)
                                }
                                className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary"
                              />
                              <Label
                                htmlFor={`group-${group}`}
                                className="text-sm font-semibold cursor-pointer select-none"
                              >
                                {group}
                              </Label>
                            </div>

                            {/* Group fields */}
                            <div className="grid grid-cols-2 gap-1.5 ml-6">
                              {fields.map((field) => (
                                <FormField
                                  key={field.key}
                                  control={form.control}
                                  name="selectedFields"
                                  render={({ field: formField }) => (
                                    <FormItem className="flex items-center gap-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={formField.value?.includes(
                                            field.key,
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? formField.onChange([
                                                  ...formField.value,
                                                  field.key,
                                                ])
                                              : formField.onChange(
                                                  formField.value?.filter(
                                                    (val) => val !== field.key,
                                                  ),
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm cursor-pointer select-none font-normal">
                                        {field.label}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                      <FormMessage className="mt-4" />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>

            {/* Selected count */}
            <div className="flex items-center justify-between px-1 py-2 border-t mt-4">
              <span className="text-xs text-muted-foreground">
                Đã chọn{" "}
                <strong className="text-foreground">
                  {selectedFields.length}
                </strong>{" "}
                / {EXPORT_FIELDS.length} trường
              </span>
              {selectedFields.length === 0 && (
                <span className="text-xs text-destructive">
                  Cần chọn ít nhất 1 trường
                </span>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size={"sm"}
                onClick={handleClose}
                disabled={isExporting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size={"sm"}
                disabled={isExporting || selectedFields.length === 0}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Xuất Excel
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
