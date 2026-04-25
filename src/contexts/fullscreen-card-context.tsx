"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  PanelRightOpen,
  RefreshCcw,
  X,
  Search,
  Settings,
  ListFilter,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cardRegistry } from "./fullscreen-card-registry";
import { getAutoAISummary } from "@/app/(protected)/dashboard/ai-actions";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface FullscreenCardContextValue {
  openFullscreen: (startIndex?: number, withSidebar?: boolean) => void;
  fullscreenOpen: boolean;
  currentFullscreenCardId: string | null;
  setCardSidebarOpen: (open: boolean) => void;
}

const FullscreenCardContext = createContext<FullscreenCardContextValue | null>(
  null,
);

export function useFullscreenCardContext() {
  const ctx = useContext(FullscreenCardContext);
  if (!ctx) {
    throw new Error(
      "useFullscreenCardContext must be used within FullscreenCardProvider",
    );
  }
  return ctx;
}

export function FullscreenCardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenCardIndex, setFullscreenCardIndex] = useState(0);
  const [cards, setCards] = useState(() => cardRegistry.getAll());
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const [cardSettingsPanelOpen, setCardSettingsPanelOpen] = useState(false);

  // ── 2-phase rendering: dialog shell first, content deferred ──
  const [contentReady, setContentReady] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (fullscreenOpen) {
      // Defer content rendering until after the dialog shell has painted
      setContentReady(false);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setContentReady(true);
        });
      });
    } else {
      setContentReady(false);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fullscreenOpen, fullscreenCardIndex]);
  useEffect(() => {
    const unsub = cardRegistry.subscribe(() => {
      setCards([...cardRegistry.getAll()]);
    });
    return () => {
      unsub();
    };
  }, []);

  const prevTitle = cards[fullscreenCardIndex - 1]?.title;
  const nextTitle = cards[fullscreenCardIndex + 1]?.title;
  // Read directly from registry to pick up silent content updates
  // (sidebarContent changes don't trigger notify, so cards state may be stale)
  const currentCard = cardRegistry.getAll()[fullscreenCardIndex] ?? null;

  const openFullscreen = useCallback((startIndex = 0, withSidebar = false) => {
    const totalCards = cardRegistry.getAll().length;
    if (totalCards === 0) return;
    setFullscreenCardIndex(Math.max(0, Math.min(startIndex, totalCards - 1)));
    if (withSidebar) setCardSettingsPanelOpen(true);
    setFullscreenOpen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setFullscreenOpen(false);
  }, []);

  const nextCard = useCallback(() => {
    setFullscreenCardIndex((prev) => {
      const totalCards = cardRegistry.getAll().length;
      return prev < totalCards - 1 ? prev + 1 : prev;
    });
  }, []);

  const prevCard = useCallback(() => {
    setFullscreenCardIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["dashboard-stats"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard-attendance-trend"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard-department-distribution"],
        }),
        queryClient.fetchQuery({
          queryKey: ["dashboard-ai-summary"],
          queryFn: () => getAutoAISummary("standard", true),
        }),
      ]);
      setLastRefreshed(new Date());
      setIsRefreshing(false);
    } catch {
      // silent
    }
  }, [queryClient]);

  const value = useMemo<FullscreenCardContextValue>(
    () => ({
      openFullscreen,
      fullscreenOpen,
      currentFullscreenCardId: fullscreenOpen
        ? (currentCard?.id ?? null)
        : null,
      setCardSidebarOpen: setCardSettingsPanelOpen,
    }),
    [openFullscreen, fullscreenOpen, currentCard?.id],
  );

  return (
    <FullscreenCardContext.Provider value={value}>
      {children}

      {/* ── Fullscreen Dialog (lazy: content only mounts when open) ── */}
      {fullscreenOpen && (
        <Dialog
          open={fullscreenOpen}
          onOpenChange={(open) => {
            if (!open) setFullscreenOpen(false);
          }}
        >
          <DialogContent
            showCloseButton={false}
            className="sm:max-w-[95vw] sm:max-h-[90vh] h-[90vh] w-[95vw] p-2 overflow-hidden flex flex-col gap-0"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={() => setFullscreenOpen(false)}
            onOpenAutoFocus={(e) => e.preventDefault()}
            data-fullscreen-open={fullscreenOpen ? "true" : undefined}
          >
            {/* Dialog header */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={prevCard}
                  tooltip={prevTitle}
                  disabled={fullscreenCardIndex === 0 || cards.length <= 1}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={nextCard}
                  tooltip={nextTitle}
                  disabled={
                    fullscreenCardIndex === cards.length - 1 ||
                    cards.length <= 1
                  }
                >
                  <ChevronRight />
                </Button>
              </div>
              <DialogTitle className="text-sm font-bold flex items-center gap-1">
                <div
                  className="text-muted-foreground cursor-pointer"
                  onClick={() => setFullscreenOpen(false)}
                >
                  Bảng điều khiển /
                </div>
                {currentCard?.title}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {lastRefreshed &&
                    `Làm mới ${formatDistanceToNow(lastRefreshed, { addSuffix: true, locale: vi })}`}
                </p>
                <Button size="icon-sm" variant="ghost" onClick={handleRefresh}>
                  <RefreshCcw className={cn(isRefreshing && "animate-spin")} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() =>
                    setCardSettingsPanelOpen(!cardSettingsPanelOpen)
                  }
                >
                  <PanelRightOpen />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={closeFullscreen}
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>

            {/* Dialog content — deferred until shell has painted */}
            <ResizablePanelGroup
              orientation="horizontal"
              className="flex-1 min-h-0 min-w-0 flex overflow-auto mt-2 border rounded-lg"
            >
              <ResizablePanel
                defaultSize={cardSettingsPanelOpen ? 100 : 100}
                minSize={30}
                className="flex-1 p-6"
              >
                {contentReady ? (
                  currentCard?.content
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="w-10 h-10 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                      <span className="text-xs">Đang tải...</span>
                    </div>
                  </div>
                )}
              </ResizablePanel>
              {cardSettingsPanelOpen && (
                <>
                  <ResizableHandle />
                  <ResizablePanel
                    defaultSize={40}
                    minSize={25}
                    className="flex flex-col bg-background"
                  >
                    {contentReady ? (
                      currentCard?.sidebarContent || (
                        <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground text-sm">
                          Chưa có dữ liệu hiển thị
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full animate-pulse bg-muted/30 rounded-lg" />
                    )}
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </DialogContent>
        </Dialog>
      )}
    </FullscreenCardContext.Provider>
  );
}
