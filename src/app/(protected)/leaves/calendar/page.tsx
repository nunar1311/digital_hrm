"use client";

import { ChevronLeft, ChevronRight, Filter, Palmtree, Pill, Heart } from "lucide-react";

// ===== MOCK DATA =====
const mockCalendarEvents = [
  { id: "1", date: 10, name: "Nguyễn Văn D", type: "annual", label: "Phép năm (Sáng)" },
  { id: "2", date: 12, name: "Nguyễn Văn T", type: "sick", label: "Nghỉ ốm (Cả ngày)" },
  { id: "3", date: 15, name: "Trần Văn A", type: "marriage", label: "Nghỉ cưới" },
];

// ===== CONFIG =====
const eventConfig = {
  annual: {
    icon: Palmtree,
    bg: "bg-blue-50 border-blue-100",
    text: "text-blue-800",
    subText: "text-blue-600",
    iconColor: "text-blue-500",
  },
  sick: {
    icon: Pill,
    bg: "bg-red-50 border-red-100",
    text: "text-red-800",
    subText: "text-red-600",
    iconColor: "text-red-500",
  },
  marriage: {
    icon: Heart,
    bg: "bg-yellow-50 border-yellow-100",
    text: "text-yellow-800",
    subText: "text-yellow-600",
    iconColor: "text-yellow-500",
  },
};

export default function FinalCalendarPage() {
  const days = [9, 10, 11, 12, 13, 14, 15];

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span>Trang chủ</span> <span>&gt;</span> <span>Nghỉ phép</span> <span>&gt;</span>
        <span className="font-bold text-gray-800">Lịch Team</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lịch nghỉ phép Team</h1>
          <p className="text-gray-500 mt-1">Theo dõi lịch vắng mặt của nhân sự để sắp xếp công việc hiệu quả.</p>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 border rounded-lg bg-white font-medium shadow-sm">Hôm nay</button>

          <div className="flex items-center border rounded-lg bg-white shadow-sm overflow-hidden">
            <button className="p-2 border-r"><ChevronLeft size={20} /></button>
            <span className="px-4 font-bold">Tháng 3, 2026</span>
            <button className="p-2 border-l"><ChevronRight size={20} /></button>
          </div>

          <button className="px-4 py-2 border rounded-lg bg-white font-medium shadow-sm flex items-center gap-2">
            <Filter size={16} /> Lọc Phòng Ban
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b bg-white">
          <h2 className="text-lg font-bold">Tuần 11 (09/03 - 15/03)</h2>
        </div>

        {/* Header days */}
        <div className="grid grid-cols-7 border-b bg-gray-50/50">
          {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"].map((d) => (
            <div key={d} className="p-3 text-center font-bold text-gray-500 border-r last:border-0">
              {d}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="grid grid-cols-7 h-[200px]">
          {days.map((day) => {
            const events = mockCalendarEvents.filter((e) => e.date === day);

            return (
              <div key={day} className="p-4 border-r border-b last:border-r-0">
                <div className="mb-3">{day}</div>

                {events.map((event) => {
                  const config = eventConfig[event.type as keyof typeof eventConfig];
                  const Icon = config.icon;

                  return (
                    <div
                      key={event.id}
                      className={`rounded-lg p-2 border mb-2 ${config.bg}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`font-bold text-xs ${config.text}`}>
                          {event.name}
                        </span>
                        <Icon size={14} className={config.iconColor} />
                      </div>

                      <p className={`text-[10px] ${config.subText}`}>
                        {event.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}