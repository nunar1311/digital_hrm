"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Building2,
    Briefcase,
    Calendar,
    Cake,
    Users,
    FileText,
    Edit,
    Save,
    X,
    Camera,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { submitProfileUpdateRequest } from "../actions";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    employeeCode?: string | null;
    avatar?: string | null;
    gender?: string | null;
    dateOfBirth?: Date | null;
    address?: string | null;
    personalEmail?: string | null;
    idCard?: string | null;
    taxCode?: string | null;
    bankAccount?: string | null;
    bankName?: string | null;
    emergencyContact?: string | null;
    emergencyPhone?: string | null;
    hireDate?: Date | null;
    employeeStatus?: string | null;
    employmentType?: string | null;
    department?: { id: string; name: string } | null;
    position?: { id: string; name: string } | null;
    manager?: { id: string; name: string } | null;
}

interface ESSProfileClientProps {
    initialProfile: UserProfile | null;
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

const genderLabels: Record<string, string> = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline"; className?: string }> = {
    ACTIVE: { label: "Đang làm việc", variant: "default", className: "bg-emerald-100 text-emerald-800" },
    INACTIVE: { label: "Không hoạt động", variant: "secondary" },
    ON_LEAVE: { label: "Đang nghỉ phép", variant: "outline" },
    RESIGNED: { label: "Đã nghỉ việc", variant: "secondary" },
};

const employmentTypeLabels: Record<string, string> = {
    FULL_TIME: "Toàn thời gian",
    PART_TIME: "Bán thời gian",
    CONTRACT: "Hợp đồng",
    INTERN: "Thực tập sinh",
    REMOTE: "Từ xa",
};

function InfoCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
        </Card>
    );
}

function InfoRow({ label, value, editable, onEdit }: { label: string; value: React.ReactNode; editable?: boolean; onEdit?: () => void }) {
    return (
        <div className="flex items-center justify-between py-2 border-b last:border-0">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{value || "-"}</span>
                {editable && onEdit && (
                    <Button variant="ghost" size="sm" onClick={onEdit} className="h-6 w-6 p-0">
                        <Edit className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    );
}

export function ESSProfileClient({ initialProfile }: ESSProfileClientProps) {
    const queryClient = useQueryClient();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editField, setEditField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const profile = initialProfile;

    if (!profile) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Không thể tải thông tin hồ sơ</p>
            </div>
        );
    }

    const statusConfig = profile.employeeStatus ? statusLabels[profile.employeeStatus] || { label: profile.employeeStatus, variant: "secondary" as const } : { label: "Không xác định", variant: "secondary" as const };

    const handleEditField = (field: string, currentValue: string) => {
        setEditField(field);
        setEditValue(currentValue || "");
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editField) return;
        
        setIsSubmitting(true);
        try {
            await submitProfileUpdateRequest({
                field: editField,
                value: editValue,
            });
            toast.success("Đã gửi yêu cầu cập nhật");
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            setEditDialogOpen(false);
            setEditField(null);
        } catch (error) {
            toast.error("Không thể gửi yêu cầu");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
            {/* Header */}
            <div className="shrink-0 border-b bg-linear-to-r from-purple-50/50 to-primary/5">
                <div className="px-4 md:px-6 py-4">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <User className="h-6 w-6 text-purple-600" />
                        Hồ sơ cá nhân
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Xem và quản lý thông tin cá nhân của bạn
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                {/* Profile Header Card */}
                <Card className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 border-purple-100">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* Avatar */}
                            <div className="relative">
                                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                                    <AvatarImage src={profile.avatar || undefined} alt={profile.name} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                        {getInitials(profile.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md"
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Basic Info */}
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-2xl font-bold">{profile.name}</h2>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                                    <Badge variant={statusConfig.variant} className={statusConfig.className}>
                                        {statusConfig.label}
                                    </Badge>
                                    {profile.department && (
                                        <Badge variant="outline">
                                            {profile.department.name}
                                        </Badge>
                                    )}
                                    {profile.position && (
                                        <Badge variant="outline">
                                            {profile.position.name}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Mã nhân viên: <strong>{profile.employeeCode || "N/A"}</strong>
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex gap-4 text-center">
                                <div className="px-4">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {profile.hireDate 
                                            ? Math.floor((Date.now() - new Date(profile.hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                                            : 0}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Năm kinh nghiệm</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Cards Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Work Information */}
                    <InfoCard icon={Briefcase} title="Thông tin công việc">
                        <InfoRow 
                            label="Phòng ban" 
                            value={profile.department?.name || "-"} 
                        />
                        <InfoRow 
                            label="Vị trí/Chức vụ" 
                            value={profile.position?.name || "-"} 
                        />
                        <InfoRow 
                            label="Quản lý trực tiếp" 
                            value={profile.manager?.name || "-"} 
                        />
                        <InfoRow 
                            label="Loại hình lao động" 
                            value={employmentTypeLabels[profile.employmentType || ""] || profile.employmentType || "-"} 
                        />
                        <InfoRow 
                            label="Ngày vào làm" 
                            value={profile.hireDate 
                                ? new Date(profile.hireDate).toLocaleDateString("vi-VN")
                                : "-"} 
                        />
                    </InfoCard>

                    {/* Contact Information */}
                    <InfoCard icon={Mail} title="Thông tin liên hệ">
                        <InfoRow 
                            label="Email công ty" 
                            value={profile.email} 
                            editable 
                            onEdit={() => handleEditField("email", profile.email)} 
                        />
                        <InfoRow 
                            label="Email cá nhân" 
                            value={profile.personalEmail || "-"} 
                            editable 
                            onEdit={() => handleEditField("personalEmail", profile.personalEmail || "")} 
                        />
                        <InfoRow 
                            label="Số điện thoại" 
                            value={profile.phone || "-"} 
                            editable 
                            onEdit={() => handleEditField("phone", profile.phone || "")} 
                        />
                        <InfoRow 
                            label="Địa chỉ" 
                            value={profile.address || "-"} 
                            editable 
                            onEdit={() => handleEditField("address", profile.address || "")} 
                        />
                    </InfoCard>

                    {/* Personal Information */}
                    <InfoCard icon={Users} title="Thông tin cá nhân">
                        <InfoRow 
                            label="Giới tính" 
                            value={genderLabels[profile.gender || ""] || profile.gender || "-"} 
                        />
                        <InfoRow 
                            label="Ngày sinh" 
                            value={profile.dateOfBirth 
                                ? new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")
                                : "-"} 
                            editable 
                            onEdit={() => handleEditField("dateOfBirth", profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split("T")[0] : "")} 
                        />
                        <InfoRow 
                            label="Số CCCD/CMND" 
                            value={profile.idCard || "-"} 
                            editable 
                            onEdit={() => handleEditField("idCard", profile.idCard || "")} 
                        />
                    </InfoCard>

                    {/* Banking & Tax */}
                    <InfoCard icon={FileText} title="Thông tin ngân hàng & thuế">
                        <InfoRow 
                            label="Mã số thuế" 
                            value={profile.taxCode || "-"} 
                            editable 
                            onEdit={() => handleEditField("taxCode", profile.taxCode || "")} 
                        />
                        <InfoRow 
                            label="Số tài khoản" 
                            value={profile.bankAccount || "-"} 
                            editable 
                            onEdit={() => handleEditField("bankAccount", profile.bankAccount || "")} 
                        />
                        <InfoRow 
                            label="Ngân hàng" 
                            value={profile.bankName || "-"} 
                            editable 
                            onEdit={() => handleEditField("bankName", profile.bankName || "")} 
                        />
                    </InfoCard>

                    {/* Emergency Contact */}
                    <InfoCard icon={Phone} title="Liên hệ khẩn cấp">
                        <InfoRow 
                            label="Tên người liên hệ" 
                            value={profile.emergencyContact || "-"} 
                            editable 
                            onEdit={() => handleEditField("emergencyContact", profile.emergencyContact || "")} 
                        />
                        <InfoRow 
                            label="Số điện thoại" 
                            value={profile.emergencyPhone || "-"} 
                            editable 
                            onEdit={() => handleEditField("emergencyPhone", profile.emergencyPhone || "")} 
                        />
                    </InfoCard>
                </div>

                {/* Request Update Button */}
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="font-medium">Cần cập nhật thông tin?</h3>
                                <p className="text-sm text-muted-foreground">
                                    Gửi yêu cầu cập nhật thông tin cá nhân đến bộ phận HCNS
                                </p>
                            </div>
                            <Button>
                                <FileText className="h-4 w-4 mr-2" />
                                Gửi yêu cầu cập nhật
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cập nhật thông tin</DialogTitle>
                        <DialogDescription>
                            Nhập thông tin mới và gửi yêu cầu cập nhật đến HCNS để xác nhận.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-value">
                                {editField === "email" && "Email công ty"}
                                {editField === "personalEmail" && "Email cá nhân"}
                                {editField === "phone" && "Số điện thoại"}
                                {editField === "address" && "Địa chỉ"}
                                {editField === "dateOfBirth" && "Ngày sinh"}
                                {editField === "idCard" && "Số CCCD/CMND"}
                                {editField === "taxCode" && "Mã số thuế"}
                                {editField === "bankAccount" && "Số tài khoản"}
                                {editField === "bankName" && "Tên ngân hàng"}
                                {editField === "emergencyContact" && "Tên người liên hệ"}
                                {editField === "emergencyPhone" && "Số điện thoại khẩn cấp"}
                            </Label>
                            {editField === "address" || editField === "emergencyContact" ? (
                                <Textarea
                                    id="edit-value"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    placeholder="Nhập thông tin mới..."
                                    rows={3}
                                />
                            ) : editField === "dateOfBirth" ? (
                                <Input
                                    id="edit-value"
                                    type="date"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                />
                            ) : (
                                <Input
                                    id="edit-value"
                                    type={editField === "phone" || editField === "emergencyPhone" ? "tel" : "text"}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    placeholder="Nhập thông tin mới..."
                                />
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Gửi yêu cầu
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
