import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/attendance/check-wifi
 *
 * Kiểm tra IP của client có nằm trong dải IP mạng nội bộ công ty không.
 *
 * Flow:
 * 1. Lấy IP thực của client từ request headers
 * 2. Lấy danh sách WiFi whitelist từ AttendanceConfig
 *    - Trường `bssid` giờ được dùng để lưu dải IP (VD: "192.168.1.0/24")
 * 3. So khớp IP client với các dải IP đã cấu hình
 * 4. Trả về { ip, matched, ssid? }
 */
export async function GET(request: NextRequest) {
    // 1. Lấy IP thực của client
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp =
        forwarded?.split(",")[0]?.trim() || realIp || "127.0.0.1";

    try {
        // 2. Lấy config + whitelist
        const config = await prisma.attendanceConfig.findFirst({
            include: { wifiWhitelist: true },
        });

        if (!config || !config.requireWifi) {
            return NextResponse.json({
                ip: clientIp,
                matched: true,
                ssid: "WiFi check disabled",
            });
        }

        const whitelist = config.wifiWhitelist;

        if (whitelist.length === 0) {
            return NextResponse.json({
                ip: clientIp,
                matched: false,
                ssid: null,
            });
        }

        // 3. So khớp IP
        for (const entry of whitelist) {
            // entry.bssid chứa dải IP dạng CIDR (VD: "192.168.1.0/24")
            // hoặc IP đơn lẻ (VD: "192.168.1.100")
            // entry.ssid chứa tên WiFi (dùng cho label hiển thị)
            const ipRange = entry.bssid || entry.ssid;

            if (isIpInRange(clientIp, ipRange)) {
                return NextResponse.json({
                    ip: clientIp,
                    matched: true,
                    ssid: entry.ssid,
                });
            }
        }

        // 4. Không khớp
        return NextResponse.json({
            ip: clientIp,
            matched: false,
            ssid: null,
        });
    } catch (error) {
        console.error("WiFi check error:", error);
        return NextResponse.json(
            { ip: clientIp, matched: false, error: "Internal error" },
            { status: 500 },
        );
    }
}

// ─── IP Range Matching Utilities ───

/**
 * Kiểm tra IP có nằm trong range hay không.
 * Hỗ trợ:
 * - CIDR notation: "192.168.1.0/24"
 * - IP đơn lẻ: "192.168.1.100"
 * - Wildcard: "192.168.1.*"
 * - Range: "192.168.1.1-192.168.1.254"
 * - Subnet dạng prefix: "192.168.1." (khớp tất cả IP bắt đầu bằng prefix)
 */
function isIpInRange(ip: string, range: string): boolean {
    if (!ip || !range) return false;

    const trimmedRange = range.trim();

    // Exact match
    if (ip === trimmedRange) return true;

    // CIDR notation (e.g., "192.168.1.0/24")
    if (trimmedRange.includes("/")) {
        return isIpInCidr(ip, trimmedRange);
    }

    // Wildcard (e.g., "192.168.1.*")
    if (trimmedRange.includes("*")) {
        const prefix = trimmedRange.replace(/\*/g, "");
        return ip.startsWith(prefix);
    }

    // Range (e.g., "192.168.1.1-192.168.1.254")
    if (trimmedRange.includes("-")) {
        const [startIp, endIp] = trimmedRange
            .split("-")
            .map((s) => s.trim());
        const ipNum = ipToNumber(ip);
        const startNum = ipToNumber(startIp);
        const endNum = ipToNumber(endIp);
        return ipNum >= startNum && ipNum <= endNum;
    }

    // Prefix match (e.g., "192.168.1.")
    if (trimmedRange.endsWith(".")) {
        return ip.startsWith(trimmedRange);
    }

    return false;
}

/** CIDR matching: check if IP falls within CIDR block */
function isIpInCidr(ip: string, cidr: string): boolean {
    const [rangeIp, prefixLenStr] = cidr.split("/");
    const prefixLen = parseInt(prefixLenStr, 10);
    if (isNaN(prefixLen) || prefixLen < 0 || prefixLen > 32)
        return false;

    const ipNum = ipToNumber(ip);
    const rangeNum = ipToNumber(rangeIp);
    const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;

    return (ipNum & mask) === (rangeNum & mask);
}

/** Convert IPv4 string to 32-bit unsigned integer */
function ipToNumber(ip: string): number {
    const parts = ip.split(".").map(Number);
    if (
        parts.length !== 4 ||
        parts.some((p) => isNaN(p) || p < 0 || p > 255)
    ) {
        return 0;
    }
    return (
        ((parts[0] << 24) |
            (parts[1] << 16) |
            (parts[2] << 8) |
            parts[3]) >>>
        0
    );
}
