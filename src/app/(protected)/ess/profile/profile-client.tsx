"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { submitProfileUpdateRequest } from "../actions";
import { toast } from "sonner";

function formatDate(date: Date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "APPROVED":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Đã duyệt
        </Badge>
      );
    case "REJECTED":
      return <Badge variant="destructive">Từ chối</Badge>;
    default:
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          Đang chờ
        </Badge>
      );
  }
}

export function ProfileClient({
  profile,
  requests,
}: {
  profile: any;
  requests: any[];
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [phone, setPhone] = useState(profile.phone || "");
  const [address, setAddress] = useState(profile.address || "");
  const [personalEmail, setPersonalEmail] = useState(
    profile.personalEmail || "",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!phone && !address && !personalEmail) {
      toast.error("Vui lòng nhập thông tin cần cập nhật");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitProfileUpdateRequest({
        phone,
        address,
        personalEmail,
      });
      toast.success("Đã gửi yêu cầu cập nhật thành công.");
      setIsEditOpen(false);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi gửi yêu cầu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin chung</CardTitle>
          <CardDescription>
            Thông tin do Phòng nhân sự thiết lập
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-medium text-muted-foreground">Mã NV</div>
            <div className="col-span-2 font-semibold">
              {profile.employeeCode}
            </div>

            <div className="font-medium text-muted-foreground">Họ tên</div>
            <div className="col-span-2 font-semibold">
              {profile.fullName || profile.name}
            </div>

            <div className="font-medium text-muted-foreground">Email NV</div>
            <div className="col-span-2">{profile.email}</div>

            <div className="font-medium text-muted-foreground">Phòng ban</div>
            <div className="col-span-2">
              {profile.department?.name || "Chưa có"}
            </div>

            <div className="font-medium text-muted-foreground">Chức vụ</div>
            <div className="col-span-2">
              {profile.position?.name || "Chưa có"}
            </div>

            <div className="font-medium text-muted-foreground">Quản lý</div>
            <div className="col-span-2">
              {profile.manager?.name || "Chưa có"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Thông tin liên hệ</CardTitle>
            <CardDescription>
              Tự phục vụ: Bạn có thể yêu cầu cập nhật
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
          >
            Cập nhật
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-medium text-muted-foreground">
              Số điện thoại
            </div>
            <div className="col-span-2">{profile.phone || "Chưa cập nhật"}</div>

            <div className="font-medium text-muted-foreground">
              Email cá nhân
            </div>
            <div className="col-span-2">
              {profile.personalEmail || "Chưa cập nhật"}
            </div>

            <div className="font-medium text-muted-foreground">Địa chỉ</div>
            <div className="col-span-2">
              {profile.address || "Chưa cập nhật"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Lịch sử yêu cầu cập nhật hồ sơ</CardTitle>
          <CardDescription>
            Trạng thái các yêu cầu cập nhật thông tin của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Bạn chưa có yêu cầu nào.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 last:border-0 last:pb-0 gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      Yêu cầu ngày {formatDate(req.createdAt)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {/* Display requested changes nicely */}
                      {Object.keys(req.requestedData as any)
                        .filter((k) => (req.requestedData as any)[k])
                        .map((k, i) => (
                          <span key={k}>
                            {i > 0 && ", "}
                            {k === "phone"
                              ? "SĐT"
                              : k === "address"
                                ? "Địa chỉ"
                                : k === "personalEmail"
                                  ? "Email cá nhân"
                                  : k}
                            : {(req.requestedData as any)[k]}
                          </span>
                        ))}
                    </div>
                    {req.rejectReason && (
                      <div className="text-xs text-destructive mt-1">
                        Lý do từ chối: {req.rejectReason}
                      </div>
                    )}
                  </div>
                  <div>
                    <StatusBadge status={req.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Yêu cầu cập nhật thông tin liên hệ</DialogTitle>
              <DialogDescription>
                Thông tin mới sẽ được gửi tới Phòng Nhân sự để duyệt. Thay đổi
                chỉ có hiệu lực sau khi được phê duyệt.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalEmail">Email cá nhân</Label>
                <Input
                  id="personalEmail"
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  placeholder="Nhập email cá nhân"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ thường trú</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nhập địa chỉ của bạn"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
