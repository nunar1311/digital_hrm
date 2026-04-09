"use server";

/**
 * Assets AI Server Actions
 */

import { prisma } from "@/lib/prisma";

async function callAIService(endpoint: string, data: any) {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
  const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY || "";

  const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AI_SERVICE_KEY ? { "X-Internal-API-Key": AI_SERVICE_KEY } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error(`AI Service error: ${response.status}`);
  return response.json();
}

/**
 * Predict maintenance needs
 */
export async function predictMaintenance(data: { assetId: string }) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: data.assetId },
      include: { assignments: true },
    });

    if (!asset) return { success: false, error: "Asset not found" };

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia về quản lý bảo trì tài sản.",
        },
        {
          role: "user",
          content: `Dự đoán bảo trì cho tài sản:\n- Tên: ${asset.name}\n- Loại: ${asset.category}\n- Ngày mua: ${asset.purchaseDate?.toISOString()}\n- Tình trạng: ${asset.condition}\n- Số lần bảo trì: ${asset.maintenanceHistory?.length || 0}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Maintenance Prediction error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Recommend asset allocation
 */
export async function recommendAssetAllocation(data: { employeeId: string }) {
  try {
    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
      include: { position: true, department: true },
    });

    if (!employee) return { success: false, error: "Employee not found" };

    const availableAssets = await prisma.asset.findMany({
      where: { status: "AVAILABLE" },
    });

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia phân bổ tài sản hiệu quả.",
        },
        {
          role: "user",
          content: `Gợi ý tài sản cho nhân viên ${employee.name} - ${employee.position?.title}:\nTài sản khả dụng: ${availableAssets.map((a) => `${a.name} (${a.category})`).join(", ") || "Không có"}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Asset Allocation error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Analyze asset lifecycle
 */
export async function analyzeAssetLifecycle(data: { assetId: string }) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: data.assetId },
      include: { assignments: true },
    });

    if (!asset) return { success: false, error: "Asset not found" };

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Phân tích vòng đời tài sản: Mua -> Triển khai -> Bảo trì -> Thay thế -> Thanh lý.",
        },
        {
          role: "user",
          content: `Phân tích vòng đời tài sản ${asset.name}:\n- Ngày mua: ${asset.purchaseDate?.toISOString()}\n- Ngày hết hạn bảo hành: ${asset.warrantyExpiry?.toISOString()}\n- Tình trạng: ${asset.condition}\n- Giá trị hiện tại: ${asset.currentValue}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Asset Lifecycle error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Assess loss risk
 */
export async function assessLossRisk(data: { assetId?: string }) {
  try {
    const where = data.assetId ? { id: data.assetId } : {};
    const highValueAssets = await prisma.asset.findMany({
      where: { ...where, status: "ASSIGNED", currentValue: { gte: 10000000 } },
      include: { assignments: { include: { user: true } } },
    });

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Đánh giá nguy cơ mất mát tài sản dựa trên giá trị, tracking history, và patterns.",
        },
        {
          role: "user",
          content: `Đánh giá nguy cơ mất mát:\n${highValueAssets.map((a) => `${a.name}: ${a.currentValue} VND, Đang sử dụng bởi ${a.assignments[0]?.user.name}`).join("\n")}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Loss Risk Assessment error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate asset report
 */
export async function generateAssetReport() {
  try {
    const assets = await prisma.asset.findMany({
      include: { assignments: true },
    });

    const stats = {
      total: assets.length,
      available: assets.filter((a) => a.status === "AVAILABLE").length,
      assigned: assets.filter((a) => a.status === "ASSIGNED").length,
      maintenance: assets.filter((a) => a.status === "MAINTENANCE").length,
      retired: assets.filter((a) => a.status === "RETIRED").length,
      totalValue: assets.reduce((sum, a) => sum + Number(a.currentValue), 0),
    };

    const result = await callAIService("/api/ai/summarize/report", {
      report_type: "asset",
      report_data: stats,
      period: "current",
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Asset Report error:", error);
    return { success: false, error: error.message };
  }
}
