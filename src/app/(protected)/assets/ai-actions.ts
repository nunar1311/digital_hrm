"use server";

/**
 * Assets AI Server Actions
 */

import { prisma } from "@/lib/prisma";

type AIServicePayload = Record<string, unknown>;

async function callAIService(endpoint: string, data: AIServicePayload): Promise<Record<string, unknown>> {
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred";
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
          content: `Dự đoán bảo trì cho tài sản:\n- Tên: ${asset.name}\n- Loại: ${asset.category}\n- Ngày mua: ${asset.purchaseDate?.toISOString() || "Không rõ"}\n- Tình trạng: ${asset.status}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Maintenance Prediction error:", error);
    return { success: false, error: getErrorMessage(error) };
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
          content: `Gợi ý tài sản cho nhân viên ${employee.name} - ${employee.position?.name}:\nTài sản khả dụng: ${availableAssets.map((a) => `${a.name} (${a.category})`).join(", ") || "Không có"}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Asset Allocation error:", error);
    return { success: false, error: getErrorMessage(error) };
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
          content: `Phân tích vòng đời tài sản ${asset.name}:\n- Ngày mua: ${asset.purchaseDate?.toISOString() || "Không rõ"}\n- Ngày hết hạn bảo hành: ${asset.warrantyEnd?.toISOString() || "Không rõ"}\n- Tình trạng: ${asset.status}\n- Giá trị mua: ${asset.purchasePrice?.toString() || "Không rõ"}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Asset Lifecycle error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Assess loss risk
 */
export async function assessLossRisk(data: { assetId?: string }) {
  try {
    const highValueAssets = await prisma.asset.findMany({
      where: data.assetId
        ? { id: data.assetId, status: "ASSIGNED", purchasePrice: { gte: 10000000 } }
        : { status: "ASSIGNED", purchasePrice: { gte: 10000000 } },
      include: { assignments: true },
    });

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Đánh giá nguy cơ mất mát tài sản dựa trên giá trị, tracking history, và patterns.",
        },
        {
          role: "user",
          content: `Đánh giá nguy cơ mất mát:\n${highValueAssets.map((a) => `${a.name}: ${a.purchasePrice} VND, ID người dùng đang gán: ${a.assignments[0]?.userId || 'Không có'}`).join("\n")}`,
        },
      ],
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Loss Risk Assessment error:", error);
    return { success: false, error: getErrorMessage(error) };
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
      totalValue: assets.reduce((sum, a) => sum + Number(a.purchasePrice || 0), 0),
    };

    const result = await callAIService("/api/ai/summarize/report", {
      report_type: "asset",
      report_data: stats,
      period: "current",
    });

    return { success: true, content: result.content };
  } catch (error: unknown) {
    console.error("Asset Report error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}
