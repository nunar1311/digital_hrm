import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="space-y-6 text-center">
                <ShieldX className="mx-auto size-20 text-destructive" />
                <h1 className="text-4xl font-bold">403</h1>
                <p className="text-xl text-muted-foreground">
                    Bạn không có quyền truy cập trang này
                </p>
                <p className="text-sm text-muted-foreground">
                    Vui lòng liên hệ quản trị viên nếu bạn cho rằng
                    đây là lỗi.
                </p>
                <Button asChild>
                    <Link href="/">Về trang chủ</Link>
                </Button>
            </div>
        </div>
    );
}
