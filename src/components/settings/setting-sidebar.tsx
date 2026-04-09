"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  UserCircle2,
  Bell,
  Building2,
  Package,
  UserCog2,
  Settings,
  Shield,
  Activity,
  Clock,
  Globe,
  Type,
  Palette,
  FileText,
  CreditCard,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsNavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  url: string;
  category: "personal" | "company" | "system";
}

const NAV_ITEMS: SettingsNavItem[] = [
  // Personal
  {
    id: "preferences",
    icon: UserCircle2,
    label: "Sở thích",
    description: "Giao diện, ngôn ngữ",
    url: "/settings/preferences",
    category: "personal",
  },
  {
    id: "notifications",
    icon: Bell,
    label: "Thông báo",
    description: "Cài đặt thông báo",
    url: "/settings/notifications",
    category: "personal",
  },
  // Company
  {
    id: "company",
    icon: Building2,
    label: "Công ty",
    description: "Thông tin công ty",
    url: "/settings/company",
    category: "company",
  },
  {
    id: "roles",
    icon: UserCog2,
    label: "Phân quyền",
    description: "Vai trò & quyền hạn",
    url: "/settings/roles",
    category: "company",
  },
];

interface SettingsSidebarProps {
  className?: string;
}

export default function SettingsSidebar({ className }: SettingsSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const personalItems = NAV_ITEMS.filter((item) => item.category === "personal");
  const companyItems = NAV_ITEMS.filter((item) => item.category === "company");

  const isActive = (url: string) => pathname === url;

  return (
    <aside
      className={cn(
        "flex flex-col h-full w-64 shrink-0 border-r bg-linear-to-b from-muted/30 to-background overflow-y-auto",
        className,
      )}
    >
      {/* Header */}
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm leading-tight">Cài đặt</h2>
            <p className="text-[10px] text-muted-foreground">Quản lý hệ thống</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-5">
        {/* Personal section */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Cá nhân
          </p>
          <div className="space-y-0.5">
            {personalItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.url);
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.url)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group",
                    active
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/70 text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      active
                        ? "bg-primary/15 text-primary"
                        : "bg-muted group-hover:bg-muted/80 text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs font-semibold leading-tight",
                        active && "text-primary",
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Company section */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Công ty
          </p>
          <div className="space-y-0.5">
            {companyItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.url);
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.url)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group",
                    active
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/70 text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      active
                        ? "bg-primary/15 text-primary"
                        : "bg-muted group-hover:bg-muted/80 text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs font-semibold leading-tight",
                        active && "text-primary",
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">
            Cần hỗ trợ?
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Liên hệ quản trị viên hoặc xem tài liệu hướng dẫn
          </p>
        </div>
      </div>
    </aside>
  );
}
