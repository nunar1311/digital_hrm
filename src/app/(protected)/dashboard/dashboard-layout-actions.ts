"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import type { SavedWidget } from "@/components/dashboard/widget-registry";

/**
 * Lấy dashboard layout từ database cho user hiện tại.
 * Trả về mảng SavedWidget[] (chỉ widgetType + vị trí) hoặc null nếu chưa có.
 */
export async function getDashboardLayout(): Promise<SavedWidget[] | null> {
  const session = await requireAuth();

  try {
    const record = await prisma.dashboardLayout.findUnique({
      where: { userId: session.user.id },
      select: { layout: true },
    });

    if (!record || !record.layout) return null;

    const layout = record.layout;

    // Validate: must be an array
    if (!Array.isArray(layout)) return null;

    // Validate: items must have widgetType (new format)
    // If old format (has 'content' field but no 'widgetType'), discard stale data
    const firstItem = layout[0] as Record<string, unknown> | undefined;
    if (layout.length > 0 && (!firstItem || !firstItem.widgetType)) {
      // Old format detected — delete stale data
      await prisma.dashboardLayout.delete({ where: { userId: session.user.id } });
      return null;
    }

    return layout as unknown as SavedWidget[];
  } catch (error) {
    console.error("[getDashboardLayout] Error:", error);
    return null;
  }
}

/**
 * Lưu dashboard layout — chỉ lưu widgetType + vị trí (x, y, w, h).
 * Không lưu content/props/HTML.
 */
export async function saveDashboardLayout(widgets: SavedWidget[]) {
  const session = await requireAuth();

  try {
    // Validate: chỉ lưu các trường cần thiết
    const cleanWidgets = widgets.map((w) => ({
      widgetType: w.widgetType,
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
    }));

    await prisma.dashboardLayout.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        layout: cleanWidgets as any,
      },
      update: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        layout: cleanWidgets as any,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[saveDashboardLayout] Error:", error);
    return { success: false, error: "Không thể lưu bố cục dashboard" };
  }
}

/**
 * Xóa dashboard layout → quay về bố cục mặc định.
 */
export async function resetDashboardLayout() {
  const session = await requireAuth();

  try {
    await prisma.dashboardLayout.deleteMany({
      where: { userId: session.user.id },
    });
    return { success: true };
  } catch (error) {
    console.error("[resetDashboardLayout] Error:", error);
    return { success: false, error: "Không thể xóa bố cục dashboard" };
  }
}
