"use client";

import { useState } from "react";
import { useNotificationPreferences, useUpdatePreferences } from "../use-notifications";
import { Bell, Mail, Smartphone, Moon, Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const NOTIFICATION_TYPES = [
  { id: "ATTENDANCE", label: "Chấm công", description: "Nhắc nhở chấm công, attendance records" },
  { id: "LEAVE", label: "Nghỉ phép", description: "Đơn nghỉ phép được duyệt/từ chối" },
  { id: "PAYROLL", label: "Lương", description: "Phiếu lương, thay đổi lương" },
  { id: "OVERTIME", label: "Tăng ca", description: "Đơn tăng ca được duyệt/từ chối" },
  { id: "CONTRACT", label: "Hợp đồng", description: "Cảnh báo hợp đồng sắp hết hạn" },
  { id: "SYSTEM", label: "Hệ thống", description: "Thông báo từ hệ thống" },
];

export function NotificationSettingsPage() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdatePreferences();
  
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [browserEnabled, setBrowserEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("08:00");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  if (preferences && !quietHoursEnabled) {
    setEmailEnabled(preferences.emailEnabled);
    setBrowserEnabled(preferences.browserEnabled);
    setQuietHoursEnabled(preferences.quietHoursEnabled);
    if (preferences.quietHoursStart) setQuietHoursStart(preferences.quietHoursStart);
    if (preferences.quietHoursEnd) setQuietHoursEnd(preferences.quietHoursEnd);
    setSelectedTypes(preferences.notificationTypes);
  }

  const handleSave = async () => {
    await updatePreferences.mutateAsync({
      emailEnabled,
      browserEnabled,
      quietHoursEnabled,
      quietHoursStart: quietHoursEnabled ? quietHoursStart : undefined,
      quietHoursEnd: quietHoursEnabled ? quietHoursEnd : undefined,
      notificationTypes: selectedTypes,
    });
    toast.success("Đã lưu cài đặt thông báo");
  };

  const toggleType = (typeId: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt thông báo</h1>
        <p className="text-muted-foreground">Quản lý cách bạn nhận thông báo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Kênh thông báo
          </CardTitle>
          <CardDescription>Chọn cách bạn muốn nhận thông báo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Trình duyệt
              </Label>
              <p className="text-sm text-muted-foreground">Nhận thông báo đẩy trên trình duyệt</p>
            </div>
            <Switch checked={browserEnabled} onCheckedChange={setBrowserEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Giờ yên tĩnh
          </CardTitle>
          <CardDescription>Tắt thông báo trong khung giờ này</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bật giờ yên tĩnh</Label>
              <p className="text-sm text-muted-foreground">Tạm dừng thông báo trong thời gian quy định</p>
            </div>
            <Switch checked={quietHoursEnabled} onCheckedChange={setQuietHoursEnabled} />
          </div>
          
          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giờ bắt đầu</Label>
                <Input 
                  type="time" 
                  value={quietHoursStart} 
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Giờ kết thúc</Label>
                <Input 
                  type="time" 
                  value={quietHoursEnd} 
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loại thông báo</CardTitle>
          <CardDescription>
            Chọn loại thông báo bạn muốn nhận (để trống = nhận tất cả)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {NOTIFICATION_TYPES.map((type) => (
              <Badge
                key={type.id}
                variant={selectedTypes.includes(type.id) ? "default" : "outline"}
                className="cursor-pointer px-4 py-2"
                onClick={() => toggleType(type.id)}
              >
                {type.label}
              </Badge>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Nhấn vào badge để chọn/bỏ chọn loại thông báo
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updatePreferences.isPending} className="w-full">
        <Save className="mr-2 h-4 w-4" />
        {updatePreferences.isPending ? "Đang lưu..." : "Lưu cài đặt"}
      </Button>
    </div>
  );
}
