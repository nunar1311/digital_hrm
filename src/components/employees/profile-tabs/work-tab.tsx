import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import type { Employee } from "@/types";
import { mockWorkHistory } from "@/mock/employees";

interface Props {
    employee: Employee;
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 py-3 border-b last:border-0 border-border/50 gap-1 sm:gap-4">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="sm:col-span-2 text-sm text-foreground">{value || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</div>
    </div>
);

export function WorkTab({ employee }: Props) {
    const workHistories = mockWorkHistory.filter(wh => wh.employeeId === employee.id).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Thông tin nội bộ */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Thông tin công việc nội bộ</CardTitle>
                </CardHeader>
                <CardContent>
                    <InfoRow label="Phòng ban" value={<span className="font-medium text-primary">{employee.department?.name}</span>} />
                    <InfoRow label="Chức vụ" value={<span className="font-medium">{employee.position?.name}</span>} />
                    <InfoRow label="Quản lý trực tiếp" value={
                        employee.manager ? (
                            <Link href={`/employees/${employee.manager.id}`} className="flex items-center gap-2 hover:underline text-primary">
                                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                                    {employee.manager.fullName.split(' ').pop()?.[0]}
                                </div>
                                <span>{employee.manager.fullName} - {employee.manager.employeeCode}</span>
                            </Link>
                        ) : <span className="text-muted-foreground">Báo cáo trực tiếp lên Ban Giám đốc</span>
                    } />
                    <InfoRow label="Trạng thái" value={<EmployeeStatusBadge status={employee.status} />} />
                    <InfoRow label="Loại hình" value={
                        <Badge variant="outline">
                            {employee.employmentType === 'FULL_TIME' ? 'Chính thức' :
                                employee.employmentType === 'PART_TIME' ? 'Bán thời gian' :
                                    employee.employmentType === 'INTERN' ? 'Thực tập sinh' : 'Cộng tác viên'}
                        </Badge>
                    } />
                    <InfoRow label="Ngày gia nhập" value={employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('vi-VN') : null} />
                    <InfoRow label="Hết hạn thử việc" value={employee.probationEnd ? new Date(employee.probationEnd).toLocaleDateString('vi-VN') : null} />
                    {employee.resignDate && (
                        <InfoRow label="Ngày nghỉ việc" value={<span className="text-destructive font-medium">{new Date(employee.resignDate).toLocaleDateString('vi-VN')}</span>} />
                    )}
                </CardContent>
            </Card>

            <div className="space-y-6">
                {/* Ngân hàng */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Tài khoản Ngân hàng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <InfoRow label="Tên Ngân hàng" value={employee.bankName} />
                        <InfoRow label="Số tài khoản" value={<span className="font-mono">{employee.bankAccount}</span>} />
                        <InfoRow label="Chi nhánh" value={employee.bankBranch} />
                    </CardContent>
                </Card>

                {/* Thuế & Bảo hiểm */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Thuế & Bảo hiểm xã hội</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <InfoRow label="Mã số thuế cá nhân" value={<span className="font-mono">{employee.taxCode}</span>} />
                        <InfoRow label="Số sổ BHXH" value={<span className="font-mono">{employee.socialInsuranceNo}</span>} />
                        <InfoRow label="Số thẻ BHYT" value={<span className="font-mono">{employee.healthInsuranceNo}</span>} />
                    </CardContent>
                </Card>
            </div>

            {/* Kinh nghiệm làm việc */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg">Kinh nghiệm làm việc trước đây</CardTitle>
                </CardHeader>
                <CardContent>
                    {workHistories.length > 0 ? (
                        <div className="relative border-l ml-4 space-y-8 py-2">
                            {workHistories.map((wh) => (
                                <div key={wh.id} className="relative pl-6">
                                    {/* Timeline dot */}
                                    <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                                        <h3 className="text-base font-semibold">{wh.position}</h3>
                                        <time className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
                                            {new Date(wh.startDate).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })} -
                                            {wh.endDate ? new Date(wh.endDate).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }) : 'Hiện tại'}
                                        </time>
                                    </div>
                                    <div className="text-sm font-medium text-primary/80 mb-2">{wh.company}</div>
                                    {wh.description && <p className="text-sm text-muted-foreground">{wh.description}</p>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-center py-6 text-muted-foreground">Chưa có thông tin kinh nghiệm làm việc trước đây.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
