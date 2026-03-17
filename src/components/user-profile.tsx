"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    ChevronDownIcon,
    LogOutIcon,
    PaintRollerIcon,
    SettingsIcon,
    UserCircle2Icon,
    XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useClickOutside } from "@mantine/hooks";
import { cn } from "@/lib/utils";
import ModeSelection from "./themes/mode-selection";
import Shepherd from "shepherd.js";
import { useEffect } from "react";
import { offset } from "@floating-ui/dom";

import "shepherd.js/dist/css/shepherd.css";
import "./shepherd.css";
import ThemePreset from "./themes/theme-preset";
import { NotificationBell } from "./notifications/notification-bell";

const UserProfile = () => {
    const router = useRouter();
    const { user, isPending } = useAuth();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
         
        setIsMounted(true);
    }, []);

    const ref = useClickOutside(() => {
        setIsDropdownOpen(false);
        setIsThemeOpen(false);
    });

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    const initials = user?.name
        ? user.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "??";

    useEffect(() => {
        const tour = new Shepherd.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                classes: "shadow-lg rounded-md",
                cancelIcon: {
                    enabled: true,
                },
            },
        });

        tour.addStep({
            id: "theme-customization",
            title: "Tùy chỉnh giao diện",
            text: "Tại đây bạn có thể tuỳ chỉnh giao diện và màu sắc của ứng dụng theo sở thích của mình.",
            attachTo: {
                element: "[data-tour='theme-customization']",
                on: "bottom",
            },
            floatingUIOptions: {
                middleware: [offset(10)],
            },
            buttons: [
                {
                    text: "Đóng",
                    action: tour.complete,
                    classes: "shepherd-button-secondary",
                },
                {
                    text: "Bắt đầu tùy chỉnh",
                    action: () => {
                        setIsThemeOpen(true);
                        tour.complete();
                    },
                },
            ],
        });

        const hasSeenTour = localStorage.getItem(
            "theme-customize-tour-completed",
        );

        if (!hasSeenTour) {
            tour.start();
            tour.on("complete", () => {
                localStorage.setItem(
                    "theme-customize-tour-completed",
                    "true",
                );
            });
        }

        return () => {
            tour.complete();
        };
    }, [isThemeOpen]);
    return (
        <DropdownMenu open={isDropdownOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={"ghost"}
                    className="rounded-full border-0 bg-transparent has-[>svg]:px-1 h-8 focus:ring-0 gap-1 [&[data-state=open]>svg]:rotate-180"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <Avatar className="size-6 rounded-full">
                        <AvatarImage
                            src={user?.image ?? undefined}
                            alt={user?.name ?? "User"}
                        />
                        <AvatarFallback className="rounded-lg bg-amber-300 text-xs">
                            {isMounted ? (isPending ? "..." : initials) : <UserCircle2Icon className="size-4 text-muted-foreground" />}
                        </AvatarFallback>
                    </Avatar>

                    <ChevronDownIcon className="ml-auto size-3 text-muted-foreground transition-transform" />
                </Button>
            </DropdownMenuTrigger>
            {!isThemeOpen && (
                <DropdownMenuContent
                    className={cn(
                        "w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg",
                        !isDropdownOpen && "hidden",
                    )}
                    side="top"
                    align="end"
                    sideOffset={4}
                    ref={ref}
                >
                    <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                            <Avatar className="size-8 rounded-lg">
                                <AvatarImage
                                    src={user?.image ?? undefined}
                                    alt={user?.name ?? "User"}
                                />
                                <AvatarFallback className="rounded-lg text-xs">
                                    {isMounted ? initials : <UserCircle2Icon className="size-4 text-muted-foreground" />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left leading-tight">
                                <span className="truncate text-sm font-semibold">
                                    {user?.name ?? "Người dùng"}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user?.email ?? ""}
                                </span>
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <UserCircle2Icon />
                        Hồ sơ của tôi
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setIsThemeOpen(true)}
                        data-tour="theme-customization"
                    >
                        <PaintRollerIcon />
                        Chủ đề
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <SettingsIcon />
                        Cài đặt
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                        <LogOutIcon className="mr-2 size-4" />
                        Đăng xuất
                    </DropdownMenuItem>
                </DropdownMenuContent>
            )}

            {isThemeOpen && (
                <DropdownMenuContent
                    className={cn(
                        "w-[--radix-dropdown-menu-trigger-width] max-w-80 rounded-lg p-4",
                        !isThemeOpen && "hidden",
                    )}
                    side="top"
                    align="end"
                    sideOffset={4}
                    ref={ref}
                >
                    <Button
                        className="absolute size-6 top-4 right-4 p-1 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30 transition-colors text-muted-foreground hover:text-muted-foreground"
                        variant="ghost"
                        size={"icon"}
                        onClick={() => {
                            setIsThemeOpen(false);
                            setIsDropdownOpen(false);
                        }}
                    >
                        <XIcon />
                    </Button>
                    <DropdownMenuLabel className="p-0 text-base">
                        Chủ đề
                    </DropdownMenuLabel>
                    <p className="text-xs text-muted-foreground">
                        Tuỳ chỉnh chủ đề của bạn bằng cách thay đổi
                        giao diện và màu sắc.
                    </p>

                    <DropdownMenuLabel className="p-0 mt-4 text-xs">
                        Giao diện
                    </DropdownMenuLabel>
                    {/* Appearance */}
                    <div className="my-2">
                        <ModeSelection />
                    </div>

                    <DropdownMenuLabel className="p-0 text-xs">
                        Chủ đề
                    </DropdownMenuLabel>
                    {/* Color theme */}
                    <div className="mt-2">
                        <ThemePreset />
                    </div>
                </DropdownMenuContent>
            )}
        </DropdownMenu>
    );
};

export default UserProfile;
