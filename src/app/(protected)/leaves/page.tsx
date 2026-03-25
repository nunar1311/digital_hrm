"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Filter } from "lucide-react";
// import { mockLeavePolicies, mockAutoCalculations, mockApprovalWorkflows } from "@/lib/mock-data/leaves";

export const mockLeavePolicies = [
  {
    id: "1",
    name: "Nghỉ phép năm",
    description: "Nghỉ phép thường niên",
    days: 12,
    isPaid: true,
  },
  {
    id: "2",
    name: "Nghỉ không lương",
    description: "Nghỉ cá nhân không hưởng lương",
    days: 0,
    isPaid: false,
  },
];

// ✅ Mock: Tính phép tự động
export const mockAutoCalculations = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    standardDays: 12,
    seniorityDays: 2,
    carryOver: 3,
    total: 17,
    used: 5,
    remain: 12,
  },
  {
    id: "2",
    name: "Trần Thị B",
    standardDays: 12,
    seniorityDays: 1,
    carryOver: 0,
    total: 13,
    used: 4,
    remain: 9,
  },
];

// ✅ Mock: Luồng duyệt phép
export const mockApprovalWorkflows = [
  {
    id: "REQ-001",
    employee: "Phương Thảo",
    type: "Nghỉ phép năm",
    days: 2,
    currentStep: "Trưởng phòng",
    status: "PENDING",
  },
  {
    id: "REQ-002",
    employee: "Thuỳ Trang",
    type: "Nghỉ ốm",
    days: 1,
    currentStep: "Hoàn tất",
    status: "APPROVED",
  },
];

export default function LeaveManagementPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Cấu hình & Quản lý phép</h2>
      </div>

      <Tabs defaultValue="workflow" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
          <TabsTrigger value="workflow">Luồng duyệt phép</TabsTrigger>
          <TabsTrigger value="calculation">Tính phép tự động</TabsTrigger>
          <TabsTrigger value="calendar">Lịch Team</TabsTrigger>
          <TabsTrigger value="policies">Chính sách phép</TabsTrigger>
        </TabsList>

        {/* TIÊU CHÍ 1: LUỒNG DUYỆT PHÉP */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cấu hình luồng duyệt & Theo dõi</CardTitle>
                <CardDescription>Hỗ trợ duyệt nhiều cấp (Trưởng phòng &rarr; Giám đốc).</CardDescription>
              </div>
              <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Cấu hình luồng</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Loại phép</TableHead>
                    <TableHead>Số ngày</TableHead>
                    <TableHead>Tiến trình duyệt</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockApprovalWorkflows.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.id}</TableCell>
                      <TableCell>{req.employee}</TableCell>
                      <TableCell>{req.type}</TableCell>
                      <TableCell>{req.days}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-blue-600 bg-blue-50">{req.currentStep}</Badge>
                      </TableCell>
                      <TableCell>
                        {req.status === "APPROVED" ? (
                          <Badge className="bg-green-500">Đã duyệt</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-yellow-600 bg-yellow-100">Đang chờ</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">Chi tiết</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIÊU CHÍ 2: TÍNH PHÉP TỰ ĐỘNG */}
        <TabsContent value="calculation">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Quản lý quỹ phép</CardTitle>
                <CardDescription>Tự động cộng phép thâm niên, reset tồn cuối năm.</CardDescription>
              </div>
              <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Rule Engine</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Phép chuẩn</TableHead>
                    <TableHead>Thâm niên</TableHead>
                    <TableHead>Tồn năm trước</TableHead>
                    <TableHead className="font-bold">Tổng quỹ</TableHead>
                    <TableHead>Đã dùng</TableHead>
                    <TableHead className="text-green-600">Còn lại</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAutoCalculations.map((calc) => (
                    <TableRow key={calc.id}>
                      <TableCell className="font-medium">{calc.name}</TableCell>
                      <TableCell>{calc.standardDays}</TableCell>
                      <TableCell>+{calc.seniorityDays}</TableCell>
                      <TableCell>+{calc.carryOver}</TableCell>
                      <TableCell className="font-bold">{calc.total}</TableCell>
                      <TableCell className="text-red-500">{calc.used}</TableCell>
                      <TableCell className="text-green-600 font-bold">{calc.remain}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIÊU CHÍ 3: LỊCH TEAM */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lịch Team (Calendar View)</CardTitle>
                <CardDescription>Xem ai vắng mặt để sắp xếp công việc.</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Lọc Phòng Ban</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 bg-slate-50 min-h-[400px] flex flex-col items-center justify-center text-slate-400">
                <p className="mb-4 text-lg">Giao diện Calendar Tích hợp</p>
                <div className="grid grid-cols-7 gap-2 w-full max-w-3xl opacity-60">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-24 border bg-white p-2 rounded relative">
                      <span className="text-xs absolute top-1 right-2">{i + 10}</span>
                      {i === 2 && (
                         <div className="mt-4 text-[10px] bg-red-100 text-red-700 p-1 rounded truncate">Phương Thảo (Off)</div>
                      )}
                      {i === 4 && (
                         <div className="mt-4 text-[10px] bg-yellow-100 text-yellow-700 p-1 rounded truncate">Thuỳ Trang (Ốm)</div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs italic">*Note cho Dev: Vị trí này sẽ mount FullCalendar.js ở Phase 1</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIÊU CHÍ 4: CHÍNH SÁCH NGHỈ PHÉP */}
        <TabsContent value="policies">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cấu hình loại phép</CardTitle>
                <CardDescription>Cấu hình động các loại phép: năm, ốm, không lương, thai sản...</CardDescription>
              </div>
              <Button><Plus className="mr-2 h-4 w-4" /> Thêm loại phép mới</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên loại phép</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Số ngày mặc định</TableHead>
                    <TableHead>Hưởng lương</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLeavePolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">{policy.name}</TableCell>
                      <TableCell>{policy.description}</TableCell>
                      <TableCell>{policy.days > 0 ? `${policy.days} ngày` : "Không giới hạn"}</TableCell>
                      <TableCell>
                        {policy.isPaid ? (
                          <Badge className="bg-green-500">Có lương</Badge>
                        ) : (
                          <Badge variant="secondary">Không lương</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Sửa</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}