
"use client";

import React, { useEffect, useRef } from "react";
import { Cpu, Globe, Shield, Zap, Database } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: { x: number; y: number; radius: number; speed: number; opacity: number }[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticles = () => {
            particles = [];
            for (let i = 0; i < 100; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 2 + 1,
                    speed: Math.random() * 1 + 0.5,
                    opacity: Math.random() * 0.5 + 0.3,
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            particles.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.globalAlpha = p.opacity;
                ctx.fill();
                p.y += p.speed;
                if (p.y > canvas.height) p.y = -10;
            });
            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener("resize", resize);
        resize();
        createParticles();
        draw();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="relative flex min-h-svh items-center justify-center bg-slate-950 p-4 overflow-hidden">
            {/* Lớp Tuyết rơi (Canvas) */}
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

            {/* Các đốm màu loang (Glow) */}
            <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px] animate-pulse" />
            <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-purple-600/20 blur-[100px] animate-pulse delay-700" />

            {/* Hình ảnh công nghệ trôi lơ lửng */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <Cpu className="absolute top-10 left-[10%] text-blue-500/10 w-20 h-20 animate-bounce transition-all duration-1000" />
                <Globe className="absolute bottom-20 left-[15%] text-purple-500/10 w-24 h-24 animate-pulse" />
                <Shield className="absolute top-1/4 right-[10%] text-blue-400/10 w-16 h-16 animate-spin-slow" />
                <Zap className="absolute bottom-1/4 right-[15%] text-yellow-400/10 w-12 h-12 animate-bounce" />
                <Database className="absolute top-10 right-1/4 text-indigo-500/10 w-14 h-14 animate-pulse" />
            </div>

            {/* Container Chính */}
            <div className="relative z-10 w-full max-w-md">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-xl transition-all hover:border-white/20">
                    <div className="rounded-xl bg-slate-900/60 p-6 sm:p-8 shadow-inner border border-white/5">
                        {children}
                    </div>
                </div>
                
                <p className="mt-8 text-center text-sm text-zinc-500 font-medium tracking-wide">
                    &copy; {new Date().getFullYear()} Digital HRM System. <span className="text-blue-500/50">Tech-Driven Excellence.</span>
                </p>
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 15s linear infinite;
                }
            `}</style>
        </div>
    );
}
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
            <div className="size-6 flex items-center justify-center md:size-10 sm:size-8 rounded-md bg-blue-500">
              <UserCog2 className="size-4 md:size-5 text-white" />
            </div>
            <p className="font-bold">Digital HRM</p>
          </Link>

          <div className="relative -right-10 grid grid-cols-2 gap-4">
            {items.map((item) => (
              <Card key={item.name} className="lg:gap-1 lg:p-0">
                <CardContent className="flex flex-col items-start gap-2 lg:p-2">
                  <div className="size-10 lg:size-8 rounded-lg border-primary border-2 flex items-center justify-center">
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
              <Link href={"mailto:contact@breadflow.com"} className="underline">
                support@breadit.com
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Form đăng nhập - chiếm full width trên mobile, 3/5 trên desktop */}
      <div className="relative flex w-full md:w-3/5 items-center justify-center border-r transition-all">
        {/* Header mobile - chỉ hiển thị trên mobile */}
        <div className="md:hidden absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
          <div className="size-8 rounded-md bg-blue-500"></div>
          <p className="font-bold text-lg">Digital HRM</p>
        </div>
        {children}
      </div>
    </main>
  );
};



