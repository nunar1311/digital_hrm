import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
            <h1 className="text-6xl font-bold text-muted-foreground">
                404
            </h1>
            <p className="text-xl text-muted-foreground">
                Trang bạn tìm kiếm không tồn tại
            </p>
            <Button asChild>
                <Link href="/">Về trang chủ</Link>
            </Button>
        </div>
    );
}
