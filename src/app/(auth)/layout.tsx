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