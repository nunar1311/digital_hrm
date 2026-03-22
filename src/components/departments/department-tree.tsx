"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ChevronRight,
    Building2,
    Code,
    Users,
    Briefcase,
    GraduationCap,
    HeartPulse,
    Scale,
    Wallet,
    Settings,
    ShieldCheck,
    Megaphone,
    BarChart3,
    Truck,
    Factory,
    Wrench,
    Globe,
    Landmark,
    Store,
    HardHat,
    FlaskConical,
    Palette,
    Monitor,
    Server,
    Database,
    CloudCog,
    Phone,
    Mail,
    BookOpen,
    Lightbulb,
    Target,
    TrendingUp,
    PieChart,
    Layers,
    Boxes,
    Package,
    MoreHorizontal,
    Eye,
    PlusCircle,
    Pencil,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { DepartmentNode } from "@/types/org-chart";
import { buttonVariants } from "../ui/button";

// ─── Static icon registry ──────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
    Building2,
    Code,
    Users,
    Briefcase,
    GraduationCap,
    HeartPulse,
    Scale,
    Wallet,
    Settings,
    ShieldCheck,
    Megaphone,
    BarChart3,
    Truck,
    Factory,
    Wrench,
    Globe,
    Landmark,
    Store,
    HardHat,
    FlaskConical,
    Palette,
    Monitor,
    Server,
    Database,
    CloudCog,
    Phone,
    Mail,
    BookOpen,
    Lightbulb,
    Target,
    TrendingUp,
    PieChart,
    Layers,
    Boxes,
    Package,
};

function resolveIcon(logo: string | null): LucideIcon {
    if (!logo) return Building2;
    return ICON_MAP[logo] ?? Building2;
}

interface DepartmentTreeProps {
    item: DepartmentNode;
    level?: number;
    searchQuery?: string;
    onEdit?: (d: DepartmentNode) => void;
    onAddChild?: (id: string) => void;
    onDelete?: (d: DepartmentNode) => void;
}

function hasMatchingDescendant(
    node: DepartmentNode,
    query: string,
): boolean {
    if (!query) return false;
    if (node.name.toLowerCase().includes(query.toLowerCase()))
        return true;
    return (node.children ?? []).some((child) =>
        hasMatchingDescendant(child, query),
    );
}

const DepartmentTree = ({
    item,
    level = 0,
    searchQuery = "",
    onEdit,
    onAddChild,
    onDelete,
}: DepartmentTreeProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const hasChildren = item.children && item.children.length > 0;
    const [isOpen, setIsOpen] = useState(level === 0);

    const searchForceOpen = searchQuery
        ? hasMatchingDescendant(item, searchQuery)
        : false;

    const isActive = pathname === `/departments/${item.id}`;
    const LogoIcon = resolveIcon(item.logo);

    const handleClick = () => {
        router.push(`/departments/${item.id}`);
    };

    const iconClass = "size-3.5 shrink-0 text-muted-foreground";
    const logoNode = React.createElement(LogoIcon, {
        className: cn(iconClass),
    });

    return (
        <SidebarMenuItem>
            <Collapsible open={isOpen || searchForceOpen}>
                <CollapsibleTrigger asChild>
                    <div className="group/dept relative flex items-center w-full">
                        <SidebarMenuButton
                            className="flex-1 data-[active=true]:hover:bg-primary/10! data-[active=true]:hover:text-primary!"
                            isActive={isActive}
                            onClick={handleClick}
                        >
                            {hasChildren ? (
                                <>
                                    <div
                                        className={cn(
                                            buttonVariants({
                                                variant: "ghost",
                                                size: "icon-xs",
                                                className:
                                                    "hover:bg-transparent!",
                                            }),
                                            "group-hover/dept:flex hidden",
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsOpen(!isOpen);
                                        }}
                                    >
                                        <ChevronRight
                                            className={cn(
                                                "size-3.5 shrink-0 transition-transform duration-200",
                                                isOpen
                                                    ? "rotate-90"
                                                    : "",
                                            )}
                                        />
                                    </div>
                                    <div
                                        className={cn(
                                            buttonVariants({
                                                variant: "ghost",
                                                size: "icon-xs",
                                                className:
                                                    "hover:bg-transparent!",
                                            }),
                                            "group-hover/dept:hidden",
                                        )}
                                    >
                                        {logoNode}
                                    </div>
                                </>
                            ) : (
                                <div
                                    className={buttonVariants({
                                        variant: "ghost",
                                        size: "icon-xs",
                                    })}
                                >
                                    {logoNode}
                                </div>
                            )}
                            <span className="truncate flex-1 text-left">
                                {item.name}
                            </span>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div
                                        className={cn(
                                            buttonVariants({
                                                variant: "ghost",
                                                size: "icon-xs",
                                            }),
                                            "ml-1 opacity-0 group-hover/dept:opacity-100 focus:opacity-100 hover:bg-accent!",
                                        )}
                                        onClick={(e) =>
                                            e.stopPropagation()
                                        }
                                    >
                                        <MoreHorizontal className="size-3.5" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="start"
                                    side="right"
                                >
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(
                                                `/departments/${item.id}`,
                                            );
                                        }}
                                    >
                                        <Eye className="size-4 text-muted-foreground" />
                                        <span>Xem chi tiết</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddChild?.(item.id);
                                        }}
                                    >
                                        <PlusCircle className="size-4 text-muted-foreground" />
                                        <span>
                                            Thêm phòng ban con
                                        </span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit?.(item);
                                        }}
                                    >
                                        <Pencil className="size-4 text-muted-foreground" />
                                        <span>Chỉnh sửa</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete?.(item);
                                        }}
                                    >
                                        <Trash2 className="size-4" />
                                        <span>Xóa</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuButton>
                    </div>
                </CollapsibleTrigger>

                {hasChildren && (
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.children.map((child) => (
                                <DepartmentTree
                                    key={child.id}
                                    item={child}
                                    level={level + 1}
                                    searchQuery={searchQuery}
                                    onEdit={onEdit}
                                    onAddChild={onAddChild}
                                    onDelete={onDelete}
                                />
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                )}
            </Collapsible>
        </SidebarMenuItem>
    );
};

export default DepartmentTree;
