// Dữ liệu giả cho Chính sách nghỉ phép (Tiêu chí 4)
export const mockLeavePolicies = [
  { id: "P1", name: "Phép năm", days: 12, isPaid: true, description: "Phép tiêu chuẩn hàng năm" },
  { id: "P2", name: "Nghỉ ốm", days: 5, isPaid: true, description: "Cần giấy tờ bệnh viện" },
  { id: "P3", name: "Nghỉ không lương", days: 0, isPaid: false, description: "Không giới hạn ngày" },
  { id: "P4", name: "Nghỉ thai sản", days: 180, isPaid: true, description: "Theo luật BHXH" },
  { id: "P5", name: "Nghỉ cưới", days: 3, isPaid: true, description: "Áp dụng cho bản thân kết hôn" },
];

// Dữ liệu giả cho Tính phép tự động (Tiêu chí 2)
export const mockAutoCalculations = [
  { id: "EMP01", name: "Nguyễn Văn A", standardDays: 12, seniorityDays: 0, carryOver: 2, total: 14, used: 3, remain: 11 },
  { id: "EMP02", name: "Nguyễn Văn B", standardDays: 12, seniorityDays: 1, carryOver: 0, total: 13, used: 1, remain: 12 },
  { id: "EMP03", name: "Nguyễn Văn C", standardDays: 12, seniorityDays: 5, carryOver: 5, total: 22, used: 10, remain: 12 },
];

// Dữ liệu giả cho Luồng duyệt phép (Tiêu chí 1)
export const mockApprovalWorkflows = [
  { id: "REQ101", employee: "Nguyễn Văn A", type: "Phép năm", days: 2, currentStep: "Chờ Trưởng phòng duyệt", status: "PENDING" },
  { id: "REQ102", employee: "Nguyễn Văn B", type: "Nghỉ không lương", days: 5, currentStep: "Chờ Giám đốc duyệt", status: "PENDING" },
  { id: "REQ103", employee: "Nhân viên Mới", type: "Nghỉ ốm", days: 1, currentStep: "Hoàn tất", status: "APPROVED" },
];

// Dữ liệu giả cho Lịch Team (Tiêu chí 3)
export const mockCalendarEvents = [
  { id: 1, title: "Nguyễn Văn D (Nghỉ phép)", date: "2026-03-10", dept: "IT" },
  { id: 2, title: "Nguyễn Văn T (Ốm)", date: "2026-03-12", dept: "IT" },
  { id: 3, title: "Trần Văn A (Nghỉ cưới)", date: "2026-03-15", dept: "HR" },
];