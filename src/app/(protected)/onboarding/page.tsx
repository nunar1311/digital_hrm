"use client"
import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, Laptop, Mail, CreditCard, LayoutDashboard, UserCheck } from "lucide-react"

// --- MOCK DATA: DANH SÁCH VIỆC CẦN LÀM (CHO NHÂN VIÊN MỚI) ---
const onboardingTasks = [
  { id: "ot1", title: "Cấp Laptop & Cài đặt phần mềm", dept: "IT", assignee: "Anh Quân IT", status: true },
  { id: "ot2", title: "Tạo Email công ty & Phân quyền Slack", dept: "IT", assignee: "Anh Quân IT", status: true },
  { id: "ot3", title: "Cấp Thẻ nhân viên & Gửi dấu vân tay", dept: "Admin", assignee: "Chị Lan Admin", status: false },
  { id: "ot4", title: "Chuẩn bị chỗ ngồi & Văn phòng phẩm", dept: "Admin", assignee: "Chị Lan Admin", status: false },
  { id: "ot5", title: "Hướng dẫn văn hóa doanh nghiệp", dept: "HR", assignee: "Thảo HR", status: false },
]

export default function OnboardingChecklistPage() {
  const employeeName = "Nguyễn Thuỳ Trang" // Đồng nghiệp của Thảo
  const completedCount = onboardingTasks.filter(t => t.status).length
  const progress = (completedCount / onboardingTasks.length) * 100

  return (
    <div className="h-screen overflow-y-auto bg-slate-50/50 p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <UserPlus className="text-blue-600" size={32} /> Onboarding Checklist
          </h1>
          <p className="text-slate-500 mt-1">Tự động hóa danh sách việc cần làm cho nhân sự mới.</p>
        </div>
        <div className="flex gap-2">
           <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-4 py-1 text-sm font-bold">
            Phase 1: Giao diện
          </Badge>
        </div>
      </div>

      {/* Thẻ tiến độ & Nhân viên */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
              <UserCheck className="w-5 h-5" /> Nhân viên: {employeeName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>Tiến độ hoàn thành checklist</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3 bg-blue-50" />
            <p className="text-xs text-slate-400">Đã xong {completedCount} trên {onboardingTasks.length} đầu việc.</p>
          </CardContent>
        </Card>

        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-center">
          <p className="text-blue-100 text-sm">Hành động tiếp theo</p>
          <h2 className="text-xl font-bold mt-1 tracking-tight italic">Chờ Admin cấp thẻ...</h2>
        </div>
      </div>

      {/* Checklist tự động giao cho các bộ phận */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b bg-slate-50/30 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard size={18} /> Danh sách tác vụ tự động
          </h3>
        </div>
        <Table>
          <TableHeader className="bg-white">
            <TableRow>
              <TableHead className="w-16 text-center font-bold">Xong</TableHead>
              <TableHead className="font-bold">Hạng mục triển khai</TableHead>
              <TableHead className="font-bold">Bộ phận</TableHead>
              <TableHead className="font-bold text-right">Người phụ trách</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {onboardingTasks.map((task) => (
              <TableRow key={task.id} className="hover:bg-blue-50/20 transition-all">
                <TableCell className="text-center">
                  <Checkbox 
                    checked={task.status} 
                    className="h-5 w-5 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" 
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {task.title.includes("Laptop") && <Laptop size={18} className="text-blue-500" />}
                    {task.title.includes("Email") && <Mail size={18} className="text-blue-500" />}
                    {task.title.includes("Thẻ") && <CreditCard size={18} className="text-blue-500" />}
                    <span className={`font-medium ${task.status ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {task.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`font-bold text-[10px] ${task.dept === 'IT' ? 'border-blue-200 text-blue-600 bg-blue-50' : 'border-slate-200 text-slate-600'}`}>
                    {task.dept}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-600 text-sm">
                  {task.assignee}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}