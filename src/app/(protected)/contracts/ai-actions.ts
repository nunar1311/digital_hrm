"use server";

/**
 * Contracts AI Server Actions
 * AI-powered contract analysis, risk detection, and compliance checking
 */

import { getServerSession } from "@/lib/auth-session";
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

  if (!response.ok) {
    throw new Error(`AI Service error: ${response.status}`);
  }

  return response.json();
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "An unexpected error occurred";
}

/**
 * Analyze contract risks
 */
export async function analyzeContractRisks(data: { contractId: string }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        user: {
          include: {
            position: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
        contractType: { select: { name: true } },
      },
    });

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: "Phân tích rủi ro hợp đồng",
      context: {
        contract_type: contract.contractType?.name || "Không xác định",
        contract_number: contract.contractNumber,
        title: contract.title,
        start_date: contract.startDate?.toISOString(),
        end_date: contract.endDate?.toISOString(),
        salary: contract.salary,
        employee_position: contract.user.position?.name,
        department: contract.user.department?.name,
        notes: contract.notes,
      },
    });

    return { success: true, content: result.content };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Contract Risk Analysis error:", err);
    return { success: false, error: message };
  }
}

/**
 * Suggest contract terms
 */
export async function suggestContractTerms(data: {
  employeeId: string;
  contractType: string;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        hireDate: true,
        nationalId: true,
        address: true,
        dateOfBirth: true,
        position: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: "Gợi ý điều khoản hợp đồng",
      context: {
        employee_name: employee.name,
        employee_code: employee.employeeCode,
        position: employee.position?.name,
        department: employee.department?.name,
        contract_type: data.contractType,
        hire_date: employee.hireDate?.toISOString(),
      },
    });

    return { success: true, content: result.content };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Contract Terms Suggestion error:", err);
    return { success: false, error: message };
  }
}

/**
 * Check contract compliance with labor law
 */
export async function checkContractCompliance(data: { contractId: string }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        user: { select: { name: true } },
        contractType: { select: { name: true } },
      },
    });

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const durationMonths =
      contract.endDate && contract.startDate
        ? Math.round(
            (contract.endDate.getTime() - contract.startDate.getTime()) /
              (30 * 24 * 60 * 60 * 1000)
          )
        : null;

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: "Kiểm tra tuân thủ Bộ luật Lao động Việt Nam 2019",
      context: {
        contract_type: contract.contractType?.name || "Không xác định",
        contract_number: contract.contractNumber,
        duration_months: durationMonths,
        start_date: contract.startDate?.toISOString(),
        salary: contract.salary,
        probation_salary: contract.probationSalary,
        notes: contract.notes,
      },
    });

    return {
      success: true,
      content: result.content,
      compliance: result.compliance,
    };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Contract Compliance error:", err);
    return { success: false, error: message };
  }
}

/**
 * Generate contract draft
 */
export async function generateContractDraft(data: {
  employeeId: string;
  contractType: string;
  customTerms?: string;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
      include: {
        position: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: `Tạo dự thảo hợp đồng lao động theo mẫu công ty.\n${data.customTerms || ""}`,
      context: {
        employee_name: employee.name,
        date_of_birth: employee.dateOfBirth?.toISOString(),
        id_card: employee.nationalId,
        address: employee.address,
        position: employee.position?.name,
        department: employee.department?.name,
        contract_type: data.contractType,
      },
    });

    return { success: true, content: result.content };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Contract Draft error:", err);
    return { success: false, error: message };
  }
}

/**
 * Predict contract renewal needed
 */
export async function predictRenewalNeeded(data: { contractId: string }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        user: { include: { position: { select: { name: true } } } },
        contractType: { select: { name: true } },
      },
    });

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const tenure = contract.startDate
      ? Math.round(
          (new Date().getTime() - contract.startDate.getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : 0;

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: "Dự đoán cần gia hạn hợp đồng",
      context: {
        contract_type: contract.contractType?.name,
        contract_number: contract.contractNumber,
        end_date: contract.endDate?.toISOString(),
        position: contract.user.position?.name,
        tenure_years: tenure,
        salary: contract.salary,
      },
    });

    return { success: true, content: result.content };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Renewal Prediction error:", err);
    return { success: false, error: message };
  }
}

/**
 * Summarize contract changes
 */
export async function summarizeContractChanges(data: {
  oldContractId: string;
  newContractId: string;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [oldContract, newContract] = await Promise.all([
      prisma.contract.findUnique({
        where: { id: data.oldContractId },
        include: { contractType: { select: { name: true } } },
      }),
      prisma.contract.findUnique({
        where: { id: data.newContractId },
        include: { contractType: { select: { name: true } } },
      }),
    ]);

    if (!oldContract || !newContract) {
      return { success: false, error: "Contract not found" };
    }

    const summaryContent = [
      "Thay đổi hợp đồng:",
      `Loại: ${oldContract.contractType?.name} → ${newContract.contractType?.name}`,
      `Lương: ${oldContract.salary} → ${newContract.salary}`,
      `Ngày bắt đầu: ${oldContract.startDate?.toISOString()} → ${newContract.startDate?.toISOString()}`,
      `Ngày kết thúc: ${oldContract.endDate?.toISOString()} → ${newContract.endDate?.toISOString()}`,
      oldContract.notes || newContract.notes
        ? `Ghi chú trước: ${oldContract.notes}\nGhi chú sau: ${newContract.notes}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const result = await callAIService("/api/ai/summarize/content", {
      content: summaryContent,
      summary_type: "detailed",
    });

    return { success: true, content: result.content };
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Contract Changes Summary error:", err);
    return { success: false, error: message };
  }
}
