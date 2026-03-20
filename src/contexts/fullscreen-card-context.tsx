"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    useEffect,
} from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    RefreshCcw,
    X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cardRegistry } from "./fullscreen-card-registry";
import { cn } from "@/lib/utils";

interface FullscreenCardContextValue {
    fullscreenOpen: boolean;
    fullscreenCardIndex: number;
    openFullscreen: (startIndex?: number) => void;
    closeFullscreen: () => void;
    nextCard: () => void;
    prevCard: () => void;
    currentCard: { title: string; content: React.ReactNode } | null;
    totalCards: number;
    prevTitle: string | undefined;
    nextTitle: string | undefined;
}

const FullscreenCardContext =
    createContext<FullscreenCardContextValue | null>(null);

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
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(
        null,
    );
    const [isRefreshing, setIsRefreshing] = useState(false);
    const queryClient = useQueryClient();

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
    const currentCard = useMemo(
        () => cards[fullscreenCardIndex] ?? null,
        [cards, fullscreenCardIndex],
    );

    const openFullscreen = useCallback(
        (startIndex = 0) => {
            if (cards.length === 0) return;
            setFullscreenCardIndex(
                Math.max(0, Math.min(startIndex, cards.length - 1)),
            );
            setFullscreenOpen(true);
        },
        [cards.length],
    );

    const closeFullscreen = useCallback(() => {
        setFullscreenOpen(false);
    }, []);

    const nextCard = useCallback(() => {
        setFullscreenCardIndex((prev) =>
            prev < cards.length - 1 ? prev + 1 : prev,
        );
    }, [cards.length]);

    const prevCard = useCallback(() => {
        setFullscreenCardIndex((prev) =>
            prev > 0 ? prev - 1 : prev,
        );
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
            ]);
            setLastRefreshed(new Date());
            setIsRefreshing(false);
        } catch {
            // silent
        }
    }, [queryClient]);

    const value = useMemo<FullscreenCardContextValue>(
        () => ({
            fullscreenOpen,
            fullscreenCardIndex,
            openFullscreen,
            closeFullscreen,
            nextCard,
            prevCard,
            currentCard,
            totalCards: cards.length,
            prevTitle,
            nextTitle,
        }),
        [
            fullscreenOpen,
            fullscreenCardIndex,
            openFullscreen,
            closeFullscreen,
            nextCard,
            prevCard,
            currentCard,
            cards.length,
            prevTitle,
            nextTitle,
        ],
    );

    return (
        <FullscreenCardContext.Provider value={value}>
            {children}

            {/* ── Fullscreen Dialog (rendered at top level) ── */}
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
                >
                    {/* Dialog header */}
                    <div className="flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={prevCard}
                                tooltip={prevTitle}
                                disabled={
                                    fullscreenCardIndex === 0 ||
                                    cards.length <= 1
                                }
                            >
                                <ChevronLeft />
                            </Button>
                            <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={nextCard}
                                tooltip={nextTitle}
                                disabled={
                                    fullscreenCardIndex ===
                                        cards.length - 1 ||
                                    cards.length <= 1
                                }
                            >
                                <ChevronRight />
                            </Button>
                        </div>
                        <DialogTitle className="text-sm font-bold flex items-center gap-1">
                            <div
                                className="text-muted-foreground cursor-pointer"
                                onClick={() =>
                                    setFullscreenOpen(false)
                                }
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
                            <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={handleRefresh}
                            >
                                <RefreshCcw
                                    className={cn(
                                        isRefreshing &&
                                            "animate-spin",
                                    )}
                                />
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

                    {/* Dialog content */}
                    <div className="flex-1 min-h-0 min-w-0 overflow-auto px-6 py-4 border rounded-lg">
                        {currentCard?.content}
                    </div>
                </DialogContent>
            </Dialog>
        </FullscreenCardContext.Provider>
    );
}
