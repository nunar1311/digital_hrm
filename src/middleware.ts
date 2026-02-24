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

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

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

    // 3. Kiểm tra session qua Better Auth API
    const { data: session } = await betterFetch<Session>(
        "/api/auth/get-session",
        {
            baseURL: request.nextUrl.origin,
            headers: {
                cookie: request.headers.get("cookie") || "",
            },
        },
    );

    // 4. Chưa đăng nhập → redirect login
    if (!session) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
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
