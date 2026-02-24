"use client";

import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">Đã xảy ra lỗi!</h1>
            <p className="text-muted-foreground">{error.message}</p>
            <Button onClick={reset}>Thử lại</Button>
        </div>
    );
}
