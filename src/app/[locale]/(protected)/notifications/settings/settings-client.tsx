"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useNotificationPreferences, useUpdatePreferences } from "../use-notifications";
import { Bell, Mail, Smartphone, Moon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const NOTIFICATION_TYPES = [
  {
    id: "ATTENDANCE",
    labelKey: "notificationsTypeAttendance",
    descriptionKey: "notificationsSettingsTypeAttendanceDescription",
  },
  {
    id: "LEAVE",
    labelKey: "notificationsTypeLeave",
    descriptionKey: "notificationsSettingsTypeLeaveDescription",
  },
  {
    id: "PAYROLL",
    labelKey: "notificationsTypePayroll",
    descriptionKey: "notificationsSettingsTypePayrollDescription",
  },
  {
    id: "OVERTIME",
    labelKey: "notificationsTypeOvertime",
    descriptionKey: "notificationsSettingsTypeOvertimeDescription",
  },
  {
    id: "CONTRACT",
    labelKey: "notificationsTypeContract",
    descriptionKey: "notificationsSettingsTypeContractDescription",
  },
  {
    id: "SYSTEM",
    labelKey: "notificationsTypeSystem",
    descriptionKey: "notificationsSettingsTypeSystemDescription",
  },
] as const;

export function NotificationSettingsPage() {
  const t = useTranslations("ProtectedPages");
  const { data: preferences } = useNotificationPreferences();
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
    toast.success(t("notificationsSettingsSaved"));
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
        <h1 className="text-2xl font-bold">{t("notificationsSettingsTitle")}</h1>
        <p className="text-muted-foreground">{t("notificationsSettingsDescription")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("notificationsSettingsChannelsTitle")}
          </CardTitle>
          <CardDescription>{t("notificationsSettingsChannelsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t("notificationsSettingsChannelEmailLabel")}
              </Label>
              <p className="text-sm text-muted-foreground">{t("notificationsSettingsChannelEmailDescription")}</p>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                {t("notificationsSettingsChannelBrowserLabel")}
              </Label>
              <p className="text-sm text-muted-foreground">{t("notificationsSettingsChannelBrowserDescription")}</p>
            </div>
            <Switch checked={browserEnabled} onCheckedChange={setBrowserEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            {t("notificationsSettingsQuietHoursTitle")}
          </CardTitle>
          <CardDescription>{t("notificationsSettingsQuietHoursDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("notificationsSettingsQuietHoursEnableLabel")}</Label>
              <p className="text-sm text-muted-foreground">{t("notificationsSettingsQuietHoursEnableDescription")}</p>
            </div>
            <Switch checked={quietHoursEnabled} onCheckedChange={setQuietHoursEnabled} />
          </div>
          
          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("notificationsSettingsQuietHoursStartLabel")}</Label>
                <Input 
                  type="time" 
                  value={quietHoursStart} 
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("notificationsSettingsQuietHoursEndLabel")}</Label>
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
          <CardTitle>{t("notificationsSettingsTypesTitle")}</CardTitle>
          <CardDescription>
            {t("notificationsSettingsTypesDescription")}
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
                title={t(type.descriptionKey)}
              >
                {t(type.labelKey)}
              </Badge>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("notificationsSettingsTypesHint")}
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updatePreferences.isPending} className="w-full">
        <Save className="mr-2 h-4 w-4" />
        {updatePreferences.isPending ? t("notificationsSettingsSaving") : t("notificationsSettingsSave")}
      </Button>
    </div>
  );
}
