import {
  CalendarClock,
  Circle,
  FileText,
  HandCoins,
  ShieldCheck,
  TrendingUp,
  UserCog2,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const items = [
  {
    name: "Quản lý nhân sự",
    description: "Hồ sơ, hợp đồng, vị trí và thông tin nhân viên",
    icon: Users,
  },
  {
    name: "Chấm công & lương",
    description: "Theo dõi giờ làm, tính lương và phúc lợi tự động",
    icon: CalendarClock,
  },
  {
    name: "Nghỉ phép",
    description: "Quản lý đơn xin nghỉ, phê duyệt và số dư ngày",
    icon: HandCoins,
  },
  {
    name: "Hợp đồng",
    description: "Soạn thảo, gia hạn và lưu trữ hợp đồng lao động",
    icon: FileText,
  },
  {
    name: "Báo cáo HR",
    description: "Thống kê nhân sự, chi phí và tỷ lệ nghỉ việc",
    icon: TrendingUp,
  },
  {
    name: "Bảo mật & phân quyền",
    description: "Phân quyền theo vai trò, mã hóa dữ liệu nhạy cảm",
    icon: ShieldCheck,
  },
];

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="flex h-screen flex-1 flex-row-reverse overflow-hidden">
      {/* Panel tính năng - chỉ hiển thị trên md (768px+) */}
      <section className="hidden md:flex md:w-2/5 lg:w-3/5 items-center transition-all">
        <div className="relative m-auto flex w-full max-w-lg min-w-min flex-row items-start lg:gap-6 md:gap-10 md:flex-col md:-left-5 lg:-left-2 md:mx-0 z-100">
          <Link
            href="/"
            className="bg-background flex items-center gap-2.5 py-6 text-2xl"
          >
            <p className="font-bold">Digital HRM</p>
          </Link>

          <div className="relative -right-10 grid grid-cols-2 gap-4">
            {items.map((item) => (
              <Card key={item.name} className="lg:gap-1 lg:p-0">
                <CardContent className="flex flex-col items-start gap-2 lg:p-2">
                  <div className="size-10 lg:size-8 rounded-lg border-primary border-1 flex items-center justify-center">
                    <item.icon className="lg:size-4 size-5 text-primary" />
                  </div>

                  <h3 className="text-sm font-semibold">{item.name}</h3>

                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className={cn("-bottom-20 flex w-full items-start gap-x-4")}>
            <div className="bg-background text-primary">
              <Circle strokeWidth={2.3} className="m-1 h-2 w-2" />
            </div>
            <p className="-mt-1 text-sm">
              Báo cáo lỗi, góp ý:{" "}
              <Link href={"mailto:quqn100dd@gmail.com"} className="underline">
                quqn100dd@gmail.com
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Form đăng nhập - chiếm full width trên mobile, 3/5 trên desktop */}
      <div className="relative flex w-full items-center justify-center border-r transition-all">
        {/* Header mobile - chỉ hiển thị trên mobile */}
        <div className="md:hidden absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
          <p className="font-bold text-lg">Digital HRM</p>
        </div>
        {children}

        <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
          <p className="-mt-1 text-sm text-center">
            Báo cáo lỗi, góp ý:{" "}
            <Link href={"mailto:contact@breadflow.com"} className="underline">
              support@digitalhrm.com
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Layout;
