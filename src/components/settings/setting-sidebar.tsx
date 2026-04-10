"use client";

/**
 * SettingsSidebar Component
 *
 * Sidebar cho trang cài đặt hệ thống HRM.
 * Sử dụng shadcn/ui sidebar pattern, tích hợp RBAC để kiểm soát quyền truy cập.
 *
 * @component
 * @example
 * <SettingsSidebar />
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserCircle2,
  Bell,
  Building2,
  Users,
  Shield,
  Palette,
  Plug,
  KeyRound,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Permission } from "@/lib/rbac/permissions";

/** Interface định nghĩa cấu trúc một mục menu cài đặt */
interface SettingsNavItem {
  /** ID duy nhất cho mục menu */
  id: string;
  /** Icon component từ lucide-react */
  icon: LucideIcon;
  /** Nhãn hiển thị cho mục menu */
  label: string;
  /** URL đường dẫn của mục menu */
  url: string;
  /** Nhóm category của mục menu */
  category: "personal" | "company" | "system";
  /** Danh sách permissions cần thiết để hiển thị mục này */
  permissions: Permission[];
}

/** Danh sách tất cả các mục menu cài đặt với permissions tương ứng */
const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  // === Personal Section - Cài đặt cá nhân ===
  {
    id: "preferences",
    icon: UserCircle2,
    label: "Sở thích",
    url: "/settings/preferences",
    category: "personal",
    permissions: [Permission.SETTINGS_VIEW],
  },
  {
    id: "notifications",
    icon: Bell,
    label: "Thông báo",
    url: "/settings/notifications",
    category: "personal",
    permissions: [Permission.SETTINGS_VIEW],
  },

  // === Company Section - Cài đặt công ty ===
  {
    id: "company",
    icon: Building2,
    label: "Công ty",
    url: "/settings/company",
    category: "company",
    permissions: [Permission.SETTINGS_VIEW],
  },
  {
    id: "roles",
    icon: Users,
    label: "Phân quyền",
    url: "/settings/roles",
    category: "company",
    permissions: [Permission.SETTINGS_ROLES_MANAGE],
  },
  {
    id: "audit-log",
    icon: ScrollText,
    label: "Nhật ký hệ thống",
    url: "/settings/audit-log",
    category: "company",
    permissions: [Permission.SETTINGS_AUDIT_LOG],
  },

  // === System Section - Cài đặt hệ thống ===
  {
    id: "security",
    icon: Shield,
    label: "Bảo mật",
    url: "/settings/security",
    category: "system",
    permissions: [Permission.SETTINGS_SYSTEM],
  },
  {
    id: "appearance",
    icon: Palette,
    label: "Giao diện",
    url: "/settings/appearance",
    category: "system",
    permissions: [Permission.SETTINGS_VIEW],
  },
  {
    id: "integrations",
    icon: Plug,
    label: "Tích hợp",
    url: "/settings/integrations",
    category: "system",
    permissions: [Permission.SETTINGS_VIEW],
  },
  {
    id: "api-keys",
    icon: KeyRound,
    label: "API Keys",
    url: "/settings/api-keys",
    category: "system",
    permissions: [Permission.SETTINGS_SYSTEM],
  },
];

/** Component chính SettingsSidebar */
export default function SettingsSidebar() {
  const pathname = usePathname();
  const { canAny } = useAuth();
  const { setOpenMobile } = useSidebar();

  /**
   * Lọc các mục menu theo category và permissions
   * @param category - Category cần lọc
   * @returns Mảng các mục menu hợp lệ
   */
  const getFilteredItems = (category: SettingsNavItem["category"]) => {
    return SETTINGS_NAV_ITEMS.filter(
      (item) => item.category === category && canAny(item.permissions),
    );
  };

  /**
   * Kiểm tra xem URL hiện tại có đang active không
   * @param url - URL cần kiểm tra
   * @returns true nếu URL active
   */
  const isActive = (url: string) => {
    if (url === "/settings") {
      return pathname === "/settings" || pathname === "/settings/";
    }
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  /**
   * Xử lý khi click vào mục menu - đóng mobile sidebar
   */
  const handleMenuItemClick = () => {
    setOpenMobile(false);
  };

  const personalItems = getFilteredItems("personal");
  const companyItems = getFilteredItems("company");
  const systemItems = getFilteredItems("system");

  return (
    <Sidebar collapsible="offcanvas" className="absolute h-full! group/sidebar">
      {/* Header - Tiêu đề sidebar */}
      <SidebarHeader className="flex-row h-11 items-center justify-between px-4">
        <div className="group-data-[collapsible=icon]:hidden font-bold">
          Cài đặt
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Personal Section - Cài đặt cá nhân */}
        {personalItems.length > 0 && (
          <SidebarGroup className="gap-1 px-2">
            <SidebarGroupLabel className="px-2 mb-1">Cá nhân</SidebarGroupLabel>
            <SidebarMenu>
              {personalItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.label}
                  >
                    <Link href={item.url} onClick={handleMenuItemClick}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Company Section - Cài đặt công ty */}
        {companyItems.length > 0 && (
          <SidebarGroup className="gap-1 px-2">
            <SidebarGroupLabel className="px-2 mb-1">Công ty</SidebarGroupLabel>
            <SidebarMenu>
              {companyItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.label}
                  >
                    <Link href={item.url} onClick={handleMenuItemClick}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* System Section - Cài đặt hệ thống */}
        {systemItems.length > 0 && (
          <SidebarGroup className="gap-1 px-2">
            <SidebarGroupLabel className="px-2 mb-1">
              Hệ thống
            </SidebarGroupLabel>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.label}
                  >
                    <Link href={item.url} onClick={handleMenuItemClick}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer - Thông tin hỗ trợ */}
      <SidebarFooter className="p-2 border-t mb-12">
        <div className="rounded-lg bg-muted/50 p-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Cần hỗ trợ?
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Liên hệ quản trị viên hoặc xem tài liệu hướng dẫn.
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
