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
    <div className="w-full min-h-0 h-full grow flex flex-col">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative bg-background">
        <div className="flex flex-col gap-0 border-b shrink-0">
          <section>
            <header className="p-2 sm:px-4 flex items-center h-10 border-b">
              <h1 className="font-bold text-sm sm:text-base">Cài đặt</h1>
            </header>
          </section>
        </div>

        <section className="flex-1 relative h-full min-h-0 overflow-hidden bg-muted/10">
          <Tabs
            defaultValue="general"
            orientation="vertical"
            className="w-full h-full flex flex-col sm:flex-row gap-0"
          >
            <div className="w-full sm:w-56 md:w-64 border-b sm:border-b-0 sm:border-r bg-background shrink-0 p-2 sm:p-4 overflow-y-auto">
              <h2 className="text-[10px] sm:text-xs font-semibold uppercase text-muted-foreground mb-2 sm:mb-4 tracking-wider hidden sm:block">
                Cấu hình hệ thống
              </h2>
              <TabsList
                variant={"line"}
                className="w-full flex-row sm:flex-col h-auto justify-start items-stretch gap-1 p-0 bg-transparent overflow-x-auto sm:overflow-visible no-scrollbar"
              >
                <TabsTrigger value="general" className={TAB_TRIGGER_CLASS}>
                  <Settings className="h-4 w-4 mr-2 shrink-0" />
                  <span className="hidden sm:inline">Cài đặt chung</span>
                  <span className="sm:hidden text-xs">Chung</span>
                </TabsTrigger>
                <TabsTrigger value="method" className={TAB_TRIGGER_CLASS}>
                  <MapPin className="h-4 w-4 mr-2 shrink-0" />
                  <span className="hidden sm:inline">Phương thức</span>
                  <span className="sm:hidden text-xs">Ph.thức</span>
                </TabsTrigger>
                <TabsTrigger value="leaveTypes" className={TAB_TRIGGER_CLASS}>
                  <CalendarDays className="h-4 w-4 mr-2 shrink-0" />
                  <span className="hidden sm:inline">Loại nghỉ phép</span>
                  <span className="sm:hidden text-xs">Nghỉ phép</span>
                </TabsTrigger>
                <TabsTrigger value="devices" className={TAB_TRIGGER_CLASS}>
                  <Monitor className="h-4 w-4 mr-2 shrink-0" />
                  <span className="hidden sm:inline">Thiết bị</span>
                  <span className="sm:hidden text-xs">Thiết bị</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 h-full overflow-y-auto p-3 sm:p-6 lg:p-8 no-scrollbar bg-background">
              <TabsContent value="general" className="mt-0 border-0 p-0 h-full">
                <GeneralSettingsTab config={config} queryClient={queryClient} />
              </TabsContent>

              <TabsContent value="method" className="mt-0 border-0 p-0 h-full">
                <MethodSettingsTab config={config} queryClient={queryClient} />
              </TabsContent>

              <TabsContent value="devices" className="mt-0 border-0 p-0 h-full">
                <DevicesTab devices={devices} queryClient={queryClient} />
              </TabsContent>

              <TabsContent value="leaveTypes" className="mt-0 border-0 p-0 h-full">
                {leaveTypes && <LeaveTypesTab leaveTypes={leaveTypes} />}
              </TabsContent>
            </div>
          </Tabs>
        </section>
      </div>
    </div>
  );
}
