import { z } from "zod";

export const formSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
  name: z.string().min(1, "Vui lòng nhập tên mẫu"),
  description: z.string().optional(),
  content: z.string().min(1, "Vui lòng nhập nội dung"),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export type FormValues = z.infer<typeof formSchema>;

export const EMPTY_FORM: FormValues = {
  code: "",
  name: "",
  description: "",
  content: "",
  isDefault: false,
  isActive: true,
};

export const CONTRACT_VARIABLES = [
  // --- Thông tin công ty ---
  { key: "{{companyName}}", label: "Tên công ty" },
  { key: "{{companyTaxCode}}", label: "Mã số thuế" },
  { key: "{{companyAddress}}", label: "Địa chỉ công ty" },
  { key: "{{companyPhone}}", label: "SĐT công ty" },
  { key: "{{companyEmail}}", label: "Email công ty" },
  { key: "{{companyRepresentative}}", label: "Đại diện công ty" },
  { key: "{{companyRepRole}}", label: "Chức vụ đại diện" },
  { key: "{{companyRepNationality}}", label: "Quốc tịch đại diện" },
  { key: "{{companyRepIdCard}}", label: "CMND/CCCD đại diện" },

  // --- Thông tin nhân viên ---
  { key: "{{employeeName}}", label: "Tên nhân viên" },
  { key: "{{employeeGender}}", label: "Giới tính" },
  { key: "{{employeeDateOfBirth}}", label: "Ngày sinh" },
  { key: "{{employeeNationality}}", label: "Quốc tịch" },
  { key: "{{employeeIdCard}}", label: "CMND/CCCD" },
  { key: "{{employeeIdCardDate}}", label: "Ngày cấp CMND/CCCD" },
  { key: "{{employeeIdCardPlace}}", label: "Nơi cấp CMND/CCCD" },
  { key: "{{employeeAddress}}", label: "Địa chỉ thường trú" },
  { key: "{{employeeCurrentAddress}}", label: "Chỗ ở hiện tại" },
  { key: "{{employeePhone}}", label: "SĐT nhân viên" },
  { key: "{{employeeEmail}}", label: "Email nhân viên" },

  // --- Thông tin công việc & hợp đồng ---
  { key: "{{contractNumber}}", label: "Số hợp đồng" },
  { key: "{{contractType}}", label: "Loại hợp đồng" },
  { key: "{{employeeDepartment}}", label: "Phòng ban/Bộ phận" },
  { key: "{{employeePosition}}", label: "Chức vụ/Chức danh" },
  { key: "{{employeeJobTitle}}", label: "Chuyên môn" },
  { key: "{{workingLocation}}", label: "Địa điểm làm việc" },
  { key: "{{workingHours}}", label: "Thời giờ làm việc" },
  { key: "{{startDate}}", label: "Ngày bắt đầu" },
  { key: "{{endDate}}", label: "Ngày kết thúc" },
  { key: "{{probationStartDate}}", label: "Ngày bắt đầu thử việc" },
  { key: "{{probationEndDate}}", label: "Ngày kết thúc thử việc" },
  
  // --- Lương & Phụ cấp ---
  { key: "{{salary}}", label: "Mức lương chính" },
  { key: "{{probationSalary}}", label: "Lương thử việc" },
  { key: "{{allowance}}", label: "Phụ cấp" },
  { key: "{{bankAccountNumber}}", label: "Số tài khoản" },
  { key: "{{bankName}}", label: "Tên ngân hàng" },
];

export const PREVIEW_DUMMY_DATA: Record<string, string> = {
  // --- Thông tin công ty ---
  "{{companyName}}": "Công ty TNHH Digital HRM",
  "{{companyTaxCode}}": "0101234567",
  "{{companyAddress}}": "Tầng 10, Tòa nhà ABC, Phường X, Quận Y, TP. HCM",
  "{{companyPhone}}": "028 3838 3838",
  "{{companyEmail}}": "contact@digitalhrm.com",
  "{{companyRepresentative}}": "Trần Văn Sếp",
  "{{companyRepRole}}": "Giám đốc",
  "{{companyRepNationality}}": "Việt Nam",
  "{{companyRepIdCard}}": "079012345678",

  // --- Thông tin nhân viên ---
  "{{employeeName}}": "Nguyễn Văn A",
  "{{employeeGender}}": "Nam",
  "{{employeeDateOfBirth}}": "15/08/1995",
  "{{employeeNationality}}": "Việt Nam",
  "{{employeeIdCard}}": "079012345678",
  "{{employeeIdCardDate}}": "10/10/2020",
  "{{employeeIdCardPlace}}": "Cục Cảnh sát QLHC về TTXH",
  "{{employeeAddress}}": "123 Đường Số 1, Khu Phố 2, Phường 3, Quận 4, TP. HCM",
  "{{employeeCurrentAddress}}": "456 Đường ABC, Phường XYZ, Quận 1, TP. HCM",
  "{{employeePhone}}": "0909 123 456",
  "{{employeeEmail}}": "nguyenvana@gmail.com",

  // --- Thông tin công việc & hợp đồng ---
  "{{contractNumber}}": "HD-2026-0001",
  "{{contractType}}": "Hợp đồng lao động xác định thời hạn 12 tháng",
  "{{employeeDepartment}}": "Phòng Kỹ thuật",
  "{{employeePosition}}": "Nhân viên",
  "{{employeeJobTitle}}": "Lập trình viên",
  "{{workingLocation}}": "Trụ sở chính công ty",
  "{{workingHours}}": "Từ 08:00 đến 17:30, từ Thứ Hai đến Thứ Sáu",
  "{{startDate}}": "01/01/2026",
  "{{endDate}}": "31/12/2026",
  "{{probationStartDate}}": "01/01/2026",
  "{{probationEndDate}}": "28/02/2026",

  // --- Lương & Phụ cấp ---
  "{{salary}}": "15,000,000 VNĐ",
  "{{probationSalary}}": "12,750,000 VNĐ",
  "{{allowance}}": "1,000,000 VNĐ",
  "{{bankAccountNumber}}": "19031234567890",
  "{{bankName}}": "Techcombank",
};


