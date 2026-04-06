"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  getTimekeeperDevices,
  getShifts,
  getWorkCycles,
} from "../actions";

import type {
  AttendanceConfig,
  TimekeeperDevice,
  WorkCycle,
  Shift,
} from "../types";

import type { LeaveType } from "@/types";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { GeneralSettingsTab } from "@/components/attendance/settings/general-settings-tab";
import { MethodSettingsTab } from "@/components/attendance/settings/method-settings-tab";

import { DevicesTab } from "@/components/attendance/settings/devices-tab";
import { WorkCyclesTab } from "@/components/attendance/settings/work-cycles-tab";
import { LeaveTypesTab } from "@/components/attendance/settings/leave-types-tab";
import { getLeaveTypes } from "../actions";

// ─── Props ───

interface SettingsClientProps {
  initialConfig: AttendanceConfig | null;
  initialDevices: TimekeeperDevice[];
  initialWorkCycles: WorkCycle[];
  initialShifts: Shift[];
  initialLeaveTypes: LeaveType[];
}

export const TAB_TRIGGER_CLASS =
  "hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative w-full justify-start after:absolute after:inset-y-0 after:inset-s-0 after:-ms-1 after:w-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none";

// ─── Main Component ───

export function SettingsClient({
  initialConfig,
  initialDevices,
  initialWorkCycles,
  initialShifts,
  initialLeaveTypes,
}: SettingsClientProps) {
  const queryClient = useQueryClient();

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

  const { data: leaveTypes } = useQuery({
    queryKey: ["attendance", "leaveTypes"],
    queryFn: async () => {
      const res = await getLeaveTypes();
      return JSON.parse(JSON.stringify(res)) as LeaveType[];
    },
    initialData: initialLeaveTypes,
  });

  return (
    <div className="w-full min-h-0 max-w-7xl mx-auto h-full grow flex flex-col bg-background">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        {/* Header */}
        <section className="max-w-3xl w-full mx-auto">
          <header className="p-2 flex items-center">
            <h1 className="text-2xl font-bold truncate">Cài đặt</h1>
          </header>
        </section>

        <Tabs
          defaultValue="general"
          orientation="vertical"
          className="w-full gap-2 flex"
        >
          <TabsList variant={"line"} className="w-60">
            <TabsTrigger value="general" className={TAB_TRIGGER_CLASS}>
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Cài đặt chung</span>
              <span className="sm:hidden">Chung</span>
            </TabsTrigger>
            <TabsTrigger value="method" className={TAB_TRIGGER_CLASS}>
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Phương thức</span>
              <span className="sm:hidden">PT</span>
            </TabsTrigger>
            <TabsTrigger value="leaveTypes" className={TAB_TRIGGER_CLASS}>
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Loại nghỉ phép</span>
              <span className="sm:hidden">N.Phép</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className={TAB_TRIGGER_CLASS}>
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Thiết bị</span>
              <span className="sm:hidden">TB</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralSettingsTab config={config} queryClient={queryClient} />
          </TabsContent>

          <TabsContent value="method">
            <MethodSettingsTab config={config} queryClient={queryClient} />
          </TabsContent>

          <TabsContent value="devices">
            <DevicesTab devices={devices} queryClient={queryClient} />
          </TabsContent>

          <TabsContent value="leaveTypes">
            {leaveTypes && <LeaveTypesTab leaveTypes={leaveTypes} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
