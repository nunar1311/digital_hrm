"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, ChevronLeft, ChevronRight, Palmtree, Pill, Heart } from "lucide-react";

export default function CalendarPage() {
  // Mock data trực quan cho lịch tuần
  const weekDays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
  const dates = [9, 10, 11, 12, 13, 14, 15];

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50/50 min-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Lịch nghỉ phép Team</h2>
          <p className="text-muted-foreground mt-1">Theo dõi lịch vắng mặt của nhân sự để sắp xếp công việc hiệu quả.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white">Hôm nay</Button>
          <div className="flex items-center bg-white border rounded-md shadow-sm">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border-r"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-4 font-medium text-sm">Tháng 3, 2026</span>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border-l"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Button variant="outline" className="bg-white"><Filter className="mr-2 h-4 w-4" /> Lọc Phòng Ban</Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b pb-4">
          <CardTitle className="text-lg">Tuần 11 (09/03 - 15/03)</CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-slate-100">
          {/* Header các ngày trong tuần */}
          <div className="grid grid-cols-7 border-b bg-white">
            {weekDays.map((day, index) => (
              <div key={day} className="py-3 text-center border-r last:border-r-0">
                <span className="text-sm font-medium text-slate-500">{day}</span>
              </div>
            ))}
          </div>

          {/* Grid hiển thị các ô ngày */}
          <div className="grid grid-cols-7 bg-slate-200 gap-px">
            {dates.map((date, index) => (
              <div key={date} className="min-h-[160px] bg-white p-2 transition-colors hover:bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${date === 10 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'}`}>
                    {date}
                  </span>
                </div>

                {/* Khu vực render sự kiện (Mock) */}
                <div className="space-y-1.5">
                  {/* Ngày 10: Phép năm */}
                  {date === 10 && (
                    <div className="px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-md shadow-sm flex flex-col gap-1 cursor-pointer hover:bg-blue-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-blue-700">Nguyễn Văn D</span>
                        <Palmtree className="h-3 w-3 text-blue-500" />
                      </div>
                      <span className="text-[10px] text-blue-600">Phép năm (Sáng)</span>
                    </div>
                  )}

                  {/* Ngày 12: Nghỉ ốm */}
                  {date === 12 && (
                    <div className="px-2 py-1.5 bg-rose-50 border border-rose-100 rounded-md shadow-sm flex flex-col gap-1 cursor-pointer hover:bg-rose-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-rose-700">Nguyễn Văn T</span>
                        <Pill className="h-3 w-3 text-rose-500" />
                      </div>
                      <span className="text-[10px] text-rose-600">Nghỉ ốm (Cả ngày)</span>
                    </div>
                  )}

                  {/* Ngày 15: Nghỉ cưới */}
                  {date === 15 && (
                    <div className="px-2 py-1.5 bg-amber-50 border border-amber-100 rounded-md shadow-sm flex flex-col gap-1 cursor-pointer hover:bg-amber-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-700">Trần Văn A</span>
                        <Heart className="h-3 w-3 text-amber-500" />
                      </div>
                      <span className="text-[10px] text-amber-600">Nghỉ cưới</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}