"use client";

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
} from "../ui/sidebar";
import { Bell, Building, LucideIcon, Package, UserCircle2, UserCog2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface SettingsItem {
  icon: LucideIcon;
  nameKey: string;
  url: string;
}

const MySettings: SettingsItem[] = [
  {
    icon: UserCircle2,
    nameKey: "settingsPreferences",
    url: "/settings/preferences",
  },
  {
    icon: Bell,
    nameKey: "settingsNotifications",
    url: "/settings/notifications",
  },
] as const;

const MyCompanySettings: SettingsItem[] = [
  {
    icon: Building,
    nameKey: "settingsCompany",
    url: "/settings/company",
  },
  {
    icon: Package,
    nameKey: "sidebarNavAssets",
    url: "/settings/assets",
  },
  {
    icon: UserCog2,
    nameKey: "sidebarNavPermissions",
    url: "/settings/roles",
  }
] as const;
const SettingSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("ProtectedPages");

  return (
    <Sidebar collapsible="offcanvas" className="absolute h-full!">
      <SidebarHeader className="flex-row items-center justify-between">
        <h1 className="text-base font-bold">{t("settingsAll")}</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("settingsPersonal")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MySettings.map((item) => (
                <SidebarMenuItem key={item.nameKey}>
                  <SidebarMenuButton
                    isActive={item.url === pathname}
                    tooltip={t(item.nameKey)}
                    onClick={() => router.push(item.url)}
                    className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary dark:data-[active=true]:text-accent-foreground dark:data-[active=true]:bg-primary/80 data-[active=true]:font-semibold"
                  >
                    <item.icon />
                    {t(item.nameKey)}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("settingsMyCompany")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MyCompanySettings.map((item) => (
                <SidebarMenuItem key={item.nameKey}>
                  <SidebarMenuButton
                    isActive={item.url === pathname}
                    tooltip={t(item.nameKey)}
                    onClick={() => router.push(item.url)}
                    className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary dark:data-[active=true]:text-accent-foreground dark:data-[active=true]:bg-primary/80 data-[active=true]:font-semibold"
                  >
                    <item.icon />
                    {t(item.nameKey)}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default SettingSidebar;
