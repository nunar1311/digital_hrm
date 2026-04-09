"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { mockLeavePolicies } from "@/lib/mock-data/leaves";

export default function LeavePoliciesPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Chính sách nghỉ phép</h2>
      </div>

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
    </div>
  );
}