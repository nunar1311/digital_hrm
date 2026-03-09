import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/types";
import { mockEmergencyContacts, mockDependents } from "@/mock/employees";

interface Props {
    employee: Employee;
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 py-3 border-b last:border-0 border-border/50 gap-1 sm:gap-4">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="sm:col-span-2 text-sm text-foreground">{value || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</div>
    </div>
);

export function GeneralTab({ employee }: Props) {
    const emergencyContacts = mockEmergencyContacts.filter(c => c.employeeId === employee.id);
    const dependents = mockDependents.filter(d => d.employeeId === employee.id);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Thông tin cá nhân */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
                </CardHeader>
                <CardContent>
                    <InfoRow label="Ngày sinh" value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('vi-VN') : null} />
                    <InfoRow label="Giới tính" value={employee.gender === 'MALE' ? 'Nam' : employee.gender === 'FEMALE' ? 'Nữ' : 'Khác'} />
                    <InfoRow label="Số CCCD/CMND" value={employee.nationalId} />
                    <InfoRow label="Ngày cấp" value={employee.nationalIdDate ? new Date(employee.nationalIdDate).toLocaleDateString('vi-VN') : null} />
                    <InfoRow label="Nơi cấp" value={employee.nationalIdPlace} />
                    <InfoRow label="Quốc tịch" value={employee.nationality} />
                    <InfoRow label="Dân tộc" value={employee.ethnicity} />
                    <InfoRow label="Tôn giáo" value={employee.religion} />
                    <InfoRow label="Tình trạng hôn nhân" value={employee.maritalStatus === 'MARRIED' ? 'Đã kết hôn' : employee.maritalStatus === 'SINGLE' ? 'Độc thân' : employee.maritalStatus === 'DIVORCED' ? 'Ly hôn' : null} />
                </CardContent>
            </Card>

            <div className="space-y-6">
                {/* Thông tin liên hệ */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Liên hệ & Địa chỉ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <InfoRow label="Số điện thoại" value={employee.phone} />
                        <InfoRow label="Email cá nhân" value={employee.personalEmail} />
                        <InfoRow label="Nơi ở hiện nay" value={employee.address} />
                        <InfoRow label="Hộ khẩu thường trú" value={employee.permanentAddress} />
                    </CardContent>
                </Card>

                {/* Học vấn */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Học vấn & Bằng cấp</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <InfoRow label="Trình độ cao nhất" value={
                            employee.educationLevel && (
                                <Badge variant="secondary">
                                    {employee.educationLevel === 'BACHELOR' ? 'Cử nhân / Kỹ sư' :
                                        employee.educationLevel === 'MASTER' ? 'Thạc sĩ' :
                                            employee.educationLevel === 'PHD' ? 'Tiến sĩ' :
                                                employee.educationLevel === 'COLLEGE' ? 'Cao đẳng' : 'Trung học'}
                                </Badge>
                            )
                        } />
                        <InfoRow label="Chuyên ngành" value={employee.major} />
                        <InfoRow label="Nơi đào tạo" value={employee.university} />
                    </CardContent>
                </Card>
            </div>

            {/* Liên hệ khẩn cấp */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg">Liên hệ khẩn cấp</CardTitle>
                </CardHeader>
                <CardContent>
                    {emergencyContacts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {emergencyContacts.map(contact => (
                                <div key={contact.id} className="p-4 rounded-lg border bg-muted/30">
                                    <div className="font-semibold text-foreground mb-1">{contact.name}</div>
                                    <div className="text-sm text-muted-foreground flex items-center justify-between mb-2">
                                        <Badge variant="outline">{contact.relationship}</Badge>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <div><span className="text-muted-foreground">SĐT:</span> {contact.phone}</div>
                                        {contact.address && <div><span className="text-muted-foreground">Địa chỉ:</span> {contact.address}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-center py-6 text-muted-foreground">Chưa có thông tin liên hệ khẩn cấp.</div>
                    )}
                </CardContent>
            </Card>

            {/* Người phụ thuộc */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg">Người phụ thuộc (Giảm trừ gia cảnh)</CardTitle>
                </CardHeader>
                <CardContent>
                    {dependents.length > 0 ? (
                        <div className="rounded-md border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="h-10 px-4 text-left font-medium text-muted-foreground w-1/3">Họ và tên</th>
                                        <th className="h-10 px-4 text-left font-medium text-muted-foreground">Quan hệ</th>
                                        <th className="h-10 px-4 text-left font-medium text-muted-foreground">Ngày sinh</th>
                                        <th className="h-10 px-4 text-left font-medium text-muted-foreground">CCCD/CMND</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dependents.map(dep => (
                                        <tr key={dep.id} className="border-b last:border-0 hover:bg-muted/20">
                                            <td className="p-4 font-medium">{dep.name}</td>
                                            <td className="p-4">{dep.relationship === 'SPOUSE' ? 'Vợ/Chồng' : dep.relationship === 'CHILD' ? 'Con cái' : 'Bố/Mẹ'}</td>
                                            <td className="p-4">{dep.dateOfBirth ? new Date(dep.dateOfBirth).toLocaleDateString('vi-VN') : '-'}</td>
                                            <td className="p-4">{dep.nationalId || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-sm text-center py-6 text-muted-foreground">Chưa có thông tin người phụ thuộc.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
