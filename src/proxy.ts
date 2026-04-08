import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "@/lib/auth";
import { Role, ROLE_PERMISSIONS } from "@/lib/rbac/permissions";
import { getRoutePermissions } from "@/lib/rbac/route-permissions";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/403"];
const STATIC_PREFIXES = ["/_next", "/favicon.ico", "/api/auth", "/api"];

function stripLocale(pathname: string) {
    const segments = pathname.split("/").filter(Boolean);
    const first = segments[0];

    if (
        first &&
        routing.locales.includes(first as (typeof routing.locales)[number])
    ) {
        const rest = segments.slice(1).join("/");
        return "/" + rest;
    }

    return pathname;
}

function withLocalePrefix(path: string, locale: string) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `/${locale}${normalized}`;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const segments = pathname.split("/");
    const pathLocale = segments[1];
    const isValidLocale = routing.locales.includes(
        pathLocale as (typeof routing.locales)[number],
    );
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
    const localeFromCookie = routing.locales.includes(
        cookieLocale as (typeof routing.locales)[number],
    )
        ? cookieLocale
        : undefined;
    const locale: string = isValidLocale
        ? (pathLocale as string)
        : localeFromCookie ?? routing.defaultLocale;

    const normalizedPath = stripLocale(pathname);

    if (STATIC_PREFIXES.some((p) => normalizedPath.startsWith(p))) {
        return NextResponse.next();
    }

    const intlResponse = intlMiddleware(request);

    if (
        PUBLIC_PATHS.some(
            (p) => normalizedPath === p || normalizedPath.startsWith(p + "/"),
        )
    ) {
        return intlResponse;
    }

    const authUrl = new URL(
        "/api/auth/get-session",
        request.nextUrl.origin,
    ).toString();

    const { data: session } = await betterFetch<Session>(authUrl, {
        headers: {
            cookie: request.headers.get("cookie") || "",
        },
    });

    if (!session) {
        const loginUrl = new URL(withLocalePrefix("/login", locale), request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    const role =
        ((session.user as Record<string, unknown>)?.hrmRole as Role) ??
        Role.EMPLOYEE;
    const requiredPermissions = getRoutePermissions(normalizedPath);

    if (requiredPermissions && role !== Role.SUPER_ADMIN) {
        const userPermissions = ROLE_PERMISSIONS[role] ?? [];
        const hasAccess = requiredPermissions.some((perm) =>
            userPermissions.includes(perm),
        );

        if (!hasAccess) {
            return NextResponse.redirect(
                new URL(withLocalePrefix("/403", locale), request.url),
            );
        }
    }

    return intlResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
