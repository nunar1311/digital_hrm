// =============================================================================
// Mock Dashboard Data — KPIs, Charts, Events
// =============================================================================

export const kpiData = {
    totalEmployees: 35,
    newHiresThisMonth: 3,
    turnoverRate: 3.2,
    totalPayroll: 695_000_000, // Year or accumulative
    currentMonthPayroll: 500_000_000,
    avgSalary: 19_857_143,
    pendingLeaves: 4,
};

export const departmentDistribution = [
    { name: 'Kỹ thuật', value: 12, color: '#6366f1' },
    { name: 'Kinh doanh', value: 8, color: '#8b5cf6' },
    { name: 'Nhân sự', value: 4, color: '#a78bfa' },
    { name: 'Kế toán', value: 3, color: '#c4b5fd' },
    { name: 'Marketing', value: 3, color: '#f59e0b' },
    { name: 'Hành chính', value: 2, color: '#22c55e' },
    { name: 'Ban Giám đốc', value: 3, color: '#ef4444' },
];

export const monthlyHeadcount = [
    { month: 'T1', employees: 30, newHires: 2, resigned: 0 },
    { month: 'T2', employees: 31, newHires: 1, resigned: 0 },
    { month: 'T3', employees: 32, newHires: 2, resigned: 1 },
    { month: 'T4', employees: 32, newHires: 1, resigned: 1 },
    { month: 'T5', employees: 33, newHires: 2, resigned: 1 },
    { month: 'T6', employees: 33, newHires: 1, resigned: 1 },
    { month: 'T7', employees: 34, newHires: 3, resigned: 2 },
    { month: 'T8', employees: 34, newHires: 1, resigned: 1 },
    { month: 'T9', employees: 35, newHires: 3, resigned: 2 },
    { month: 'T10', employees: 35, newHires: 1, resigned: 1 },
    { month: 'T11', employees: 35, newHires: 2, resigned: 2 },
    { month: 'T12', employees: 35, newHires: 3, resigned: 3 },
];

export const payrollSummary = [
    { month: 'T1', totalPayroll: 580_000_000, avgSalary: 19_333_333 },
    { month: 'T2', totalPayroll: 600_000_000, avgSalary: 19_354_839 },
    { month: 'T3', totalPayroll: 620_000_000, avgSalary: 19_375_000 },
    { month: 'T4', totalPayroll: 615_000_000, avgSalary: 19_218_750 },
    { month: 'T5', totalPayroll: 640_000_000, avgSalary: 19_393_939 },
    { month: 'T6', totalPayroll: 638_000_000, avgSalary: 19_333_333 },
    { month: 'T7', totalPayroll: 660_000_000, avgSalary: 19_411_765 },
    { month: 'T8', totalPayroll: 658_000_000, avgSalary: 19_352_941 },
    { month: 'T9', totalPayroll: 680_000_000, avgSalary: 19_428_571 },
    { month: 'T10', totalPayroll: 678_000_000, avgSalary: 19_371_429 },
    { month: 'T11', totalPayroll: 690_000_000, avgSalary: 19_714_286 },
    { month: 'T12', totalPayroll: 695_000_000, avgSalary: 19_857_143 },
];

export const todayAttendance = {
    present: 28,
    late: 3,
    absent: 2,
    onLeave: 2,
    total: 35,
};

export const pendingApprovals = {
    leaveRequests: 4,
    overtimeRequests: 2,
    explanations: 1,
    total: 7,
};

export const upcomingEvents = [
    { type: 'birthday' as const, name: 'Trần Thị Linh', date: '2026-03-08', description: 'Sinh nhật' },
    { type: 'contract' as const, name: 'Hoàng Minh Đạt', date: '2026-03-15', description: 'Hết hạn HĐ thử việc' },
    { type: 'probation' as const, name: 'Nguyễn Thị Hạnh', date: '2026-03-20', description: 'Kết thúc thử việc' },
    { type: 'birthday' as const, name: 'Phạm Đức Cường', date: '2026-03-22', description: 'Sinh nhật' },
    { type: 'anniversary' as const, name: 'Lê Thị Mai', date: '2026-04-01', description: '6 năm công tác' },
];

export const genderDistribution = [
    { name: 'Nam', value: 20, color: '#6366f1' },
    { name: 'Nữ', value: 15, color: '#ec4899' },
];

export const employmentTypeDistribution = [
    { name: 'Toàn thời gian', value: 28, color: '#6366f1' },
    { name: 'Bán thời gian', value: 2, color: '#8b5cf6' },
    { name: 'Hợp đồng', value: 3, color: '#f59e0b' },
    { name: 'Thực tập', value: 2, color: '#22c55e' },
];

export const ageDistribution = [
    { range: '18-25', value: 10, color: '#ec4899' },
    { range: '26-35', value: 18, color: '#8b5cf6' },
    { range: '36-45', value: 5, color: '#3b82f6' },
    { range: '45+', value: 2, color: '#10b981' },
];

export const seniorityDistribution = [
    { range: '<1 năm', value: 8, color: '#f59e0b' },
    { range: '1-3 năm', value: 15, color: '#6366f1' },
    { range: '3-5 năm', value: 7, color: '#8b5cf6' },
    { range: '>5 năm', value: 5, color: '#10b981' },
];
