"use client";

import { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import {
  FileText,
  FileSignature,
} from "lucide-react";

import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";
import { Permission } from "@/lib/rbac/permissions";

const CONTRACTS_MENU = [
  {
    title: "Danh sách",
    icon: FileText,
    url: "/contracts",
    permissions: [Permission.CONTRACT_VIEW_SELF, Permission.CONTRACT_VIEW_ALL],
  },
  {
    title: "Mẫu hợp đồng",
    icon: FileSignature,
    url: "/contracts/templates",
    permissions: [Permission.CONTRACT_TEMPLATE_MANAGE],
  },
];

const ContractsSidebar = () => {
  const pathname = usePathname();
  const { canAny } = useAuth();
  const { setOpen } = useSidebar();

  useEffect(() => {
    const isDetailView = pathname !== "/contracts" && pathname !== "/contracts/templates";
    if (isDetailView) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [pathname, setOpen]);

  const visibleItems = CONTRACTS_MENU.filter((item) =>
    canAny(item.permissions),
  );

  const isActive = (url: string) => {
    if (url === "/contracts") {
      return pathname === "/contracts";
    }
    return pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="offcanvas" className="absolute h-full! group/sidebar">
      <SidebarHeader className="flex-row h-[44px] items-center justify-between">
        <h2 className="text-base font-bold group-data-[collapsible=icon]:hidden">
          Hợp đồng
        </h2>
        <div className="flex items-center gap-0.5">
          <div className="flex items-center transition-all duration-150 transform-gpu translate-x-2 group-hover:translate-x-0 gap-0.5 ease-linear opacity-0 group-hover:opacity-100">
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden gap-0!" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="gap-1 px-2">
          <SidebarMenu>
            {visibleItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.url)}
                  tooltip={item.title}
                >
                  <Link href={item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
};

export default ContractsSidebar;
