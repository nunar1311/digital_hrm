import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "@/lib/auth";
import { Role, ROLE_PERMISSIONS } from "@/lib/rbac/permissions";
import { getRoutePermissions } from "@/lib/rbac/route-permissions";

const PUBLIC_PATHS = [
    "/login",
    "/register",
    "/forgot-password",
    "/403",
];
const STATIC_PREFIXES = ["/_next", "/favicon.ico", "/api/auth"];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accept = request.headers.get("accept") || "";
    const isServerAction = request.headers.has("next-action");
    const isRscRequest =
        request.headers.has("rsc") ||
        accept.includes("text/x-component");

    // 1. Bỏ qua static files
    if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // 2. Public routes
    if (
        PUBLIC_PATHS.some(
            (p) => pathname === p || pathname.startsWith(p + "/"),
        )
    ) {
        return NextResponse.next();
    }

    // 2.5. Bỏ qua internal requests của App Router để tránh redirect login khi fetch nền
    if (isServerAction || isRscRequest) {
        return NextResponse.next();
    }

    // 3. Kiểm tra session qua Better Auth API
    let session: Session | null = null;
    try {
        const { data } = await betterFetch<Session>(
            "/api/auth/get-session",
            {
                baseURL: request.nextUrl.origin,
                headers: {
                    cookie: request.headers.get("cookie") || "",
                },
            },
        );
        session = data ?? null;
    } catch (error) {
        console.error("[Proxy] Session check failed:", error);
        return NextResponse.next();
    }

    // 4. Chưa đăng nhập
    if (!session) {
        // Không redirect trong proxy để tránh đá user khỏi trang hiện tại
        // khi các request nền (infinite scroll / prefetch / server action) lỗi phiên tạm thời.
        // Việc chặn truy cập vẫn được xử lý ở layout/page và server actions.
        return NextResponse.next();
    }

    // 5. Kiểm tra RBAC theo route
    const role =
        ((session.user as Record<string, unknown>)
            ?.hrmRole as Role) ?? Role.EMPLOYEE;
    const requiredPermissions = getRoutePermissions(pathname);

    if (requiredPermissions) {
        // SUPER_ADMIN luôn được qua
        if (role !== Role.SUPER_ADMIN) {
            const userPermissions = ROLE_PERMISSIONS[role] ?? [];
            const hasAccess = requiredPermissions.some((perm) =>
                userPermissions.includes(perm),
            );

            if (!hasAccess) {
                return NextResponse.redirect(
                    new URL("/403", request.url),
                );
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
