"use client";

import {
    CalendarCheck2,
    ChevronsRightIcon,
    OrbitIcon,
    Settings,
} from "lucide-react";
import { Button } from "./ui/button";
import { useSidebar } from "./ui/sidebar";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

const SidebarMind = () => {
    const { toggleSidebar, open } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();

    const isCalendar = pathname.startsWith("/calendar");
    const isOrbit = pathname.startsWith("/orbit");
    const isSettings = pathname.startsWith("/settings");

    return (
        <div className="me-1.5 ms-1.5 rounded-lg grid grid-cols-[1fr_auto] bg-primary dark:bg-primary-dark shadow-xl relative">
            <div className="flex flex-col min-h-0 min-w-0 items-center w-12 justify-between py-2">
                <div className="flex flex-col items-center shrink-0 relative">
                    <div
                        className={cn(
                            "flex flex-col items-center shrink-0 relative gap-2 transition-all duration-300 ease-in-out",
                            !open
                                ? "opacity-100 h-13"
                                : "opacity-0 h-0",
                        )}
                    >
                        <Button
                            onClick={toggleSidebar}
                            variant="ghost"
                            size="icon-sm"
                            className=" hover:bg-white/20!"
                        >
                            <ChevronsRightIcon className="text-white" />
                        </Button>
                        <div className="w-5 h-px bg-border"></div>
                    </div>
                    <div
                        className={cn(
                            "flex flex-col items-center w-full min-h-0 overflow-clip shrink-0 relative transition-all transform-gpu duration-300 ease-in-out",
                            !open
                                ? " translate-y-0"
                                : " translate-y-0",
                        )}
                    >
                        <div className="flex flex-col items-center w-full">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="data-[active=false]:hover:bg-white/20 data-[active=true]:bg-white data-[active=true]:[&_svg]:text-primary data-[active=false]:text-white [&_svg]:text-white [&_svg]:hover:bg-white"
                            >
                                <CalendarCheck2 className="text-white" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="data-[active=false]:hover:bg-white/20 data-[active=true]:bg-white data-[active=true]:[&_svg]:text-primary data-[active=false]:text-white [&_svg]:text-white [&_svg]:hover:bg-white"
                            >
                                <OrbitIcon className="text-white" />
                            </Button>
                        </div>
                    </div>
                </div>
                <Button
                    tooltip={"Cài đặt"}
                    variant="ghost"
                    isActive={isSettings}
                    size="icon-sm"
                    className="data-[active=false]:hover:bg-white/20 data-[active=true]:bg-white data-[active=true]:[&_svg]:text-primary data-[active=false]:text-white [&_svg]:text-white [&_svg]:hover:bg-white"
                    onClick={() => router.push("/settings/company")}
                >
                    <Settings />
                </Button>
            </div>
        </div>
    );
};

export default SidebarMind;
