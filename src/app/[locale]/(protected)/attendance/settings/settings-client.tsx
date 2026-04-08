"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Settings,
  MapPin,
  CalendarDays,
  Monitor,
  RefreshCw,
  Clock,
} from "lucide-react";

import {
  getAttendanceConfig,
  getHolidays,
  getTimekeeperDevices,
  getShifts,
  getWorkCycles,
} from "../actions";

import type {
  AttendanceConfig,
  Holiday,
  TimekeeperDevice,
  WorkCycle,
  Shift,
} from "../types";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { GeneralSettingsTab } from "@/components/attendance/settings/general-settings-tab";
import { MethodSettingsTab } from "@/components/attendance/settings/method-settings-tab";

import { DevicesTab } from "@/components/attendance/settings/devices-tab";
import { WorkCyclesTab } from "@/components/attendance/settings/work-cycles-tab";
import { ShiftsTab } from "@/components/attendance/settings/shifts-tab";

// ─── Props ───

interface SettingsClientProps {
  initialConfig: AttendanceConfig | null;
  initialDevices: TimekeeperDevice[];
  initialWorkCycles: WorkCycle[];
  initialShifts: Shift[];
}

export const TAB_TRIGGER_CLASS =
  "hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative w-full justify-start after:absolute after:inset-y-0 after:inset-s-0 after:-ms-1 after:w-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none";

// ─── Main Component ───

export function SettingsClient({
  initialConfig,
  initialDevices,
  initialWorkCycles,
  initialShifts,
}: SettingsClientProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("ProtectedPages");

  const { data: config } = useQuery({
    queryKey: ["attendance", "config"],
    queryFn: async () => {
      const res = await getAttendanceConfig();
      return res ? (JSON.parse(JSON.stringify(res)) as AttendanceConfig) : null;
    },
    initialData: initialConfig,
  });

  const { data: devices } = useQuery({
    queryKey: ["attendance", "devices"],
    queryFn: async () => {
      const res = await getTimekeeperDevices();
      return JSON.parse(JSON.stringify(res)) as TimekeeperDevice[];
    },
    initialData: initialDevices,
  });

  const { data: workCycles } = useQuery({
    queryKey: ["attendance", "workCycles"],
    queryFn: async () => {
      const res = await getWorkCycles();
      return JSON.parse(JSON.stringify(res)) as WorkCycle[];
    },
    initialData: initialWorkCycles,
  });

  const { data: shifts } = useQuery({
    queryKey: ["attendance", "shifts"],
    queryFn: async () => {
      const res = await getShifts();
      return JSON.parse(JSON.stringify(res)) as Shift[];
    },
    initialData: initialShifts,
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("attendanceSettingsClientTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("attendanceSettingsClientDescription")}
        </p>
      </div>

      <Tabs
        defaultValue="general"
        orientation="vertical"
        className="w-full gap-2 flex"
      >
        <TabsList variant={"line"} className="w-60">
          <TabsTrigger value="general" className={TAB_TRIGGER_CLASS}>
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t("attendanceSettingsClientTabGeneral")}</span>
            <span className="sm:hidden">{t("attendanceSettingsClientTabGeneralShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="method" className={TAB_TRIGGER_CLASS}>
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">{t("attendanceSettingsClientTabMethod")}</span>
            <span className="sm:hidden">{t("attendanceSettingsClientTabMethodShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="holidays" className={TAB_TRIGGER_CLASS}>
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">{t("attendanceSettingsClientTabHolidays")}</span>
            <span className="sm:hidden">{t("attendanceSettingsClientTabHolidaysShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className={TAB_TRIGGER_CLASS}>
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">{t("attendanceSettingsClientTabDevices")}</span>
            <span className="sm:hidden">{t("attendanceSettingsClientTabDevicesShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="shifts" className={TAB_TRIGGER_CLASS}>
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{t("attendanceSettingsClientTabShifts")}</span>
            <span className="sm:hidden">{t("attendanceSettingsClientTabShiftsShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="workCycles" className={TAB_TRIGGER_CLASS}>
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">{t("attendanceSettingsClientTabWorkCycles")}</span>
            <span className="sm:hidden">{t("attendanceSettingsClientTabWorkCyclesShort")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettingsTab config={config} queryClient={queryClient} />
        </TabsContent>

        <TabsContent value="method">
          <MethodSettingsTab config={config} queryClient={queryClient} />
        </TabsContent>

        {/* <TabsContent value="holidays">
          <HolidaysTab holidays={holidays} queryClient={queryClient} />
        </TabsContent> */}

        <TabsContent value="devices">
          <DevicesTab devices={devices} queryClient={queryClient} />
        </TabsContent>

        <TabsContent value="shifts">
          <ShiftsTab shifts={shifts} queryClient={queryClient} />
        </TabsContent>

        <TabsContent value="workCycles">
          <WorkCyclesTab
            workCycles={workCycles}
            shifts={shifts}
            queryClient={queryClient}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
