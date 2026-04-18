"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  MessageSquare,
  MoreHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useAiChatStore } from "@/hooks/use-ai-chat-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteChatSession as deleteChatSessionDb } from "@/lib/ai/chat-db-actions";
import { SidebarMenuAction } from "@/components/ui/sidebar";
import { useAiCredits } from "@/hooks/use-ai-credits";
import { Progress } from "@/components/ui/progress";

import Link from "next/link";

const AI_MENU = [
  {
    title: "Trợ lý AI",
    icon: Sparkles,
    url: "/ai",
  },
];

const AISidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const sessions = useAiChatStore((state) => state.sessions);
  const pageActiveSessionId = useAiChatStore(
    (state) => state.pageActiveSessionId,
  );
  const setPageActiveSessionId = useAiChatStore(
    (state) => state.setPageActiveSessionId,
  );
  const deleteSessionState = useAiChatStore((state) => state.deleteSession);

  const { data: creditsData } = useAiCredits();

  const searchParams = useSearchParams();

  const isActive = (url: string) => {
    if (url === "/ai") {
      return pathname === "/ai" && !searchParams.has("conversationId");
    }
    return false;
  };

  const handleMenuItemClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="offcanvas" className="absolute h-full! group/sidebar">
      <SidebarHeader className="flex-row h-11 items-center justify-between">
        <h2 className="text-base font-bold group-data-[collapsible=icon]:hidden">
          AI
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
            {AI_MENU.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.url)}
                  tooltip={item.title}
                >
                  <Link href={item.url} onClick={handleMenuItemClick}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="px-2 mt-4">
          <SidebarGroupLabel className="text-xs group-data-[collapsible=icon]:hidden">
            Trò chuyện gần đây
          </SidebarGroupLabel>
          <SidebarMenu>
            {sessions.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                Không có lịch sử
              </div>
            )}

            {sessions.slice(0, 10).map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton
                  asChild
                  isActive={pageActiveSessionId === chat.id}
                  tooltip={chat.title}
                >
                  <button
                    onClick={() => {
                      setPageActiveSessionId(chat.id);
                      handleMenuItemClick();
                      router.push(`/ai?conversationId=${chat.id}`);
                    }}
                    className="w-full text-left flex items-center gap-2"
                  >
                    <MessageSquare className="size-4 shrink-0" />
                    <span className="truncate flex-1">{chat.title}</span>
                  </button>
                </SidebarMenuButton>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal className="size-3.5" />
                      <span className="sr-only">Tùy chọn</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48 rounded-lg"
                    side="bottom"
                    align="end"
                  >
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSessionState(chat.id);
                        deleteChatSessionDb(chat.id);
                        if (pageActiveSessionId === chat.id) {
                          setPageActiveSessionId(null);
                        }
                      }}
                      className="cursor-pointer"
                      variant="destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Xóa đoạn chat</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <div className="px-3 py-2 border-t shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Credits</span>
          <span className="font-medium">
            {creditsData ? creditsData.credits : "..."}
          </span>
        </div>
        <Progress
          value={((creditsData?.credits ?? 100) / 100) * 100}
          className="h-1 mt-1"
        />
      </div>

      <SidebarRail />
    </Sidebar>
  );
};

export default AISidebar;
