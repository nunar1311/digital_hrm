"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, SearchIcon } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { sidebarNav } from "@/config/sidebar-nav";
import { useAuth } from "@/hooks/use-auth";
import Logo from "./logo";
import { Button } from "./ui/button";

export function AppSidebar() {
    const pathname = usePathname();
    const { canAny } = useAuth();

    const isSettings = pathname.includes("/settings");
    const isDashboard = pathname.includes("/dashboard");

    if (isSettings || isDashboard) {
        return null;
    }

    return (
        <Sidebar
            collapsible="offcanvas"
            className="absolute h-full! group/sidebar"
        >
            <SidebarHeader className="flex-row h-[44px] items-center justify-between">
                <div className="group-data-[collapsible=icon]:hidden px-2 font-bold">
                    Home
                </div>
                <div className="flex items-center gap-0.5">
                    <div className="flex items-center transition-all duration-150 transform-gpu translate-x-2 group-hover:translate-x-0 gap-0.5 ease-linear opacity-0 group-hover:opacity-100">
                        <SidebarTrigger className="group-data-[collapsible=icon]:hidden gap-0!" />
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {sidebarNav.map((group) => {
                    const visibleItems = group.items.filter((item) =>
                        canAny(item.permissions),
                    );

                    if (visibleItems.length === 0) return null;

                    return (
                        <SidebarGroup key={group.label}>
                            <SidebarGroupLabel>
                                {group.label}
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {visibleItems.map((item) => {
                                        const isActive =
                                            pathname === item.url ||
                                            (item.url !== "/" &&
                                                pathname.startsWith(
                                                    item.url + "/",
                                                ));

                                        const visibleChildren =
                                            item.children?.filter(
                                                (child) =>
                                                    canAny(
                                                        child.permissions,
                                                    ),
                                            );

                                        if (
                                            visibleChildren &&
                                            visibleChildren.length > 0
                                        ) {
                                            return (
                                                <Collapsible
                                                    key={item.title}
                                                    asChild
                                                    defaultOpen={
                                                        isActive
                                                    }
                                                    className="group/collapsible"
                                                >
                                                    <SidebarMenuItem>
                                                        <CollapsibleTrigger
                                                            asChild
                                                        >
                                                            <SidebarMenuButton
                                                                tooltip={
                                                                    item.title
                                                                }
                                                                isActive={
                                                                    isActive
                                                                }
                                                            >
                                                                <item.icon />
                                                                <span>
                                                                    {
                                                                        item.title
                                                                    }
                                                                </span>
                                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                            </SidebarMenuButton>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <SidebarMenuSub>
                                                                {visibleChildren.map(
                                                                    (
                                                                        child,
                                                                    ) => (
                                                                        <SidebarMenuSubItem
                                                                            key={
                                                                                child.url
                                                                            }
                                                                        >
                                                                            <SidebarMenuSubButton
                                                                                asChild
                                                                                isActive={
                                                                                    pathname ===
                                                                                    child.url
                                                                                }
                                                                            >
                                                                                <Link
                                                                                    href={
                                                                                        child.url
                                                                                    }
                                                                                >
                                                                                    <span>
                                                                                        {
                                                                                            child.title
                                                                                        }
                                                                                    </span>
                                                                                </Link>
                                                                            </SidebarMenuSubButton>
                                                                        </SidebarMenuSubItem>
                                                                    ),
                                                                )}
                                                            </SidebarMenuSub>
                                                        </CollapsibleContent>
                                                    </SidebarMenuItem>
                                                </Collapsible>
                                            );
                                        }

                                        return (
                                            <SidebarMenuItem
                                                key={item.title}
                                            >
                                                <SidebarMenuButton
                                                    asChild
                                                    tooltip={
                                                        item.title
                                                    }
                                                    isActive={
                                                        isActive
                                                    }
                                                >
                                                    <Link
                                                        href={
                                                            item.url
                                                        }
                                                    >
                                                        <item.icon />
                                                        <span>
                                                            {
                                                                item.title
                                                            }
                                                        </span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    );
                })}
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
}
