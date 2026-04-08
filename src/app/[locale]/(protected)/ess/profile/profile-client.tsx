"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
    User,
    Mail,
    Phone,
    Briefcase,
    Users,
    FileText,
    Edit,
    Save,
    Camera,
    Loader2,
    LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    MALE: "essProfileGenderMale",
    FEMALE: "essProfileGenderFemale",
    OTHER: "essProfileGenderOther",
};

const statusLabels: Record<string, { labelKey: string; variant: "default" | "secondary" | "outline"; className?: string }> = {
    ACTIVE: { labelKey: "essProfileStatusActive", variant: "default", className: "bg-emerald-100 text-emerald-800" },
    INACTIVE: { labelKey: "essProfileStatusInactive", variant: "secondary" },
    ON_LEAVE: { labelKey: "essProfileStatusOnLeave", variant: "outline" },
    RESIGNED: { labelKey: "essProfileStatusResigned", variant: "secondary" },
};

const employmentTypeLabels: Record<string, string> = {
    FULL_TIME: "essProfileEmploymentFullTime",
    PART_TIME: "essProfileEmploymentPartTime",
    CONTRACT: "essProfileEmploymentContract",
    INTERN: "essProfileEmploymentIntern",
    REMOTE: "essProfileEmploymentRemote",
};

function InfoCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
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
    const t = useTranslations("ProtectedPages");
    const queryClient = useQueryClient();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editField, setEditField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const profile = initialProfile;

    if (!profile) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">{t("essProfileLoadError")}</p>
            </div>
        );
    }

    const statusConfig = profile.employeeStatus
        ? statusLabels[profile.employeeStatus] || { labelKey: "essProfileStatusUnknown", variant: "secondary" as const }
        : { labelKey: "essProfileStatusUnknown", variant: "secondary" as const };

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
            toast.success(t("essProfileUpdateSubmitSuccess"));
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            setEditDialogOpen(false);
            setEditField(null);
        } catch {
            toast.error(t("essProfileUpdateSubmitError"));
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
                        {t("essProfileTitle")}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("essProfileDescription")}
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
                                        {t(statusConfig.labelKey)}
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
                                    {t("essProfileEmployeeCode")}: <strong>{profile.employeeCode || "N/A"}</strong>
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
                                    <div className="text-xs text-muted-foreground">{t("essProfileYearsExperience")}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Cards Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Work Information */}
                    <InfoCard icon={Briefcase} title={t("essProfileWorkInfoTitle")}>
                        <InfoRow 
                            label={t("essProfileDepartment")}
                            value={profile.department?.name || "-"} 
                        />
                        <InfoRow 
                            label={t("essProfilePosition")}
                            value={profile.position?.name || "-"} 
                        />
                        <InfoRow 
                            label={t("essProfileDirectManager")}
                            value={profile.manager?.name || "-"} 
                        />
                        <InfoRow 
                            label={t("essProfileEmploymentType")}
                            value={employmentTypeLabels[profile.employmentType || ""] ? t(employmentTypeLabels[profile.employmentType || ""]) : profile.employmentType || "-"}
                        />
                        <InfoRow 
                            label={t("essProfileHireDate")}
                            value={profile.hireDate 
                                ? new Date(profile.hireDate).toLocaleDateString("vi-VN")
                                : "-"} 
                        />
                    </InfoCard>

                    {/* Contact Information */}
                    <InfoCard icon={Mail} title={t("essProfileContactInfoTitle")}>
                        <InfoRow 
                            label={t("essProfileCompanyEmail")}
                            value={profile.email} 
                            editable 
                            onEdit={() => handleEditField("email", profile.email)} 
                        />
                        <InfoRow 
                            label={t("essProfilePersonalEmail")}
                            value={profile.personalEmail || "-"} 
                            editable 
                            onEdit={() => handleEditField("personalEmail", profile.personalEmail || "")} 
                        />
                        <InfoRow 
                            label={t("essProfilePhone")}
                            value={profile.phone || "-"} 
                            editable 
                            onEdit={() => handleEditField("phone", profile.phone || "")} 
                        />
                        <InfoRow 
                            label={t("essProfileAddress")}
                            value={profile.address || "-"} 
                            editable 
                            onEdit={() => handleEditField("address", profile.address || "")} 
                        />
                    </InfoCard>

                    {/* Personal Information */}
                    <InfoCard icon={Users} title={t("essProfilePersonalInfoTitle")}>
                        <InfoRow 
                            label={t("essProfileGender")}
                            value={genderLabels[profile.gender || ""] ? t(genderLabels[profile.gender || ""]) : profile.gender || "-"}
                        />
                        <InfoRow 
                            label={t("essProfileDateOfBirth")}
                            value={profile.dateOfBirth 
                                ? new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")
                                : "-"} 
                            editable 
                            onEdit={() => handleEditField("dateOfBirth", profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split("T")[0] : "")} 
                        />
                        <InfoRow 
                            label={t("essProfileIdCard")}
                            value={profile.idCard || "-"} 
                            editable 
                            onEdit={() => handleEditField("idCard", profile.idCard || "")} 
                        />
                    </InfoCard>

                    {/* Banking & Tax */}
                    <InfoCard icon={FileText} title={t("essProfileBankTaxInfoTitle")}>
                        <InfoRow 
                            label={t("essProfileTaxCode")}
                            value={profile.taxCode || "-"} 
                            editable 
                            onEdit={() => handleEditField("taxCode", profile.taxCode || "")} 
                        />
                        <InfoRow 
                            label={t("essProfileBankAccount")}
                            value={profile.bankAccount || "-"} 
                            editable 
                            onEdit={() => handleEditField("bankAccount", profile.bankAccount || "")} 
                        />
                        <InfoRow 
                            label={t("essProfileBankName")}
                            value={profile.bankName || "-"} 
                            editable 
                            onEdit={() => handleEditField("bankName", profile.bankName || "")} 
                        />
                    </InfoCard>

                    {/* Emergency Contact */}
                    <InfoCard icon={Phone} title={t("essProfileEmergencyContactTitle")}>
                        <InfoRow 
                            label={t("essProfileEmergencyContactName")}
                            value={profile.emergencyContact || "-"} 
                            editable 
                            onEdit={() => handleEditField("emergencyContact", profile.emergencyContact || "")} 
                        />
                        <InfoRow 
                            label={t("essProfileEmergencyContactPhone")}
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
                                <h3 className="font-medium">{t("essProfileNeedUpdateTitle")}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t("essProfileNeedUpdateDescription")}
                                </p>
                            </div>
                            <Button>
                                <FileText className="h-4 w-4 mr-2" />
                                {t("essProfileSendUpdateRequest")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("essProfileUpdateDialogTitle")}</DialogTitle>
                        <DialogDescription>
                            {t("essProfileUpdateDialogDescription")}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-value">
                                {editField === "email" && t("essProfileCompanyEmail")}
                                {editField === "personalEmail" && t("essProfilePersonalEmail")}
                                {editField === "phone" && t("essProfilePhone")}
                                {editField === "address" && t("essProfileAddress")}
                                {editField === "dateOfBirth" && t("essProfileDateOfBirth")}
                                {editField === "idCard" && t("essProfileIdCard")}
                                {editField === "taxCode" && t("essProfileTaxCode")}
                                {editField === "bankAccount" && t("essProfileBankAccount")}
                                {editField === "bankName" && t("essProfileBankName")}
                                {editField === "emergencyContact" && t("essProfileEmergencyContactName")}
                                {editField === "emergencyPhone" && t("essProfileEmergencyContactPhone")}
                            </Label>
                            {editField === "address" || editField === "emergencyContact" ? (
                                <Textarea
                                    id="edit-value"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    placeholder={t("essProfileInputPlaceholder")}
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
                                    placeholder={t("essProfileInputPlaceholder")}
                                />
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            {t("essProfileCancel")}
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("essProfileSubmitting")}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {t("essProfileSendRequest")}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
