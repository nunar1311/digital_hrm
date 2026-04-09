"use server";

/**
 * Contracts AI Server Actions
 * AI-powered contract analysis, risk detection, and compliance checking
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// AI Service integration
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

  if (!response.ok) {
    throw new Error(`AI Service error: ${response.status}`);
  }

  return response.json();
}

/**
 * Analyze contract risks
 */
export async function analyzeContractRisks(data: { contractId: string }) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        employee: { include: { position: true, department: true } },
        contractType: true,
      },
    });

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: "Phân tích rủi ro hợp đồng",
      context: {
        contract_type: contract.contractType.name,
        start_date: contract.startDate?.toISOString(),
        end_date: contract.endDate?.toISOString(),
        salary: contract.salary,
        employee_position: contract.employee.position?.title,
        department: contract.employee.department?.name,
        terms: contract.terms,
      },
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Contract Risk Analysis error:", error);
    return { success: false, error: error.message };
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
    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
      include: { position: true, department: true, salary: true },
    });

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: "Gợi ý điều khoản hợp đồng",
      context: {
        employee_name: employee.name,
        position: employee.position?.title,
        department: employee.department?.name,
        contract_type: data.contractType,
        current_salary: employee.salary?.baseSalary,
        hire_date: employee.hireDate?.toISOString(),
      },
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Contract Terms Suggestion error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Check contract compliance with labor law
 */
export async function checkContractCompliance(data: { contractId: string }) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: { employee: true, contractType: true },
    });

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: "Kiểm tra tuân thủ Bộ luật Lao động Việt Nam 2019",
      context: {
        contract_type: contract.contractType.name,
        duration_months: contract.endDate && contract.startDate
          ? Math.round((contract.endDate.getTime() - contract.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
          : null,
        start_date: contract.startDate?.toISOString(),
        salary: contract.salary,
        terms: contract.terms,
        probation_period: contract.probationPeriod,
      },
    });

    return { success: true, content: result.content, compliance: result.compliance };
  } catch (error: any) {
    console.error("Contract Compliance error:", error);
    return { success: false, error: error.message };
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
    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
      include: { position: true, department: true },
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
        position: employee.position?.title,
        department: employee.department?.name,
        contract_type: data.contractType,
      },
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Contract Draft error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Predict contract renewal needed
 */
export async function predictRenewalNeeded(data: { contractId: string }) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        employee: { include: { position: true } },
        contractType: true,
      },
    });

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const result = await callAIService("/api/ai/generate/contract", {
      prompt: "Dự đoán cần gia hạn hợp đồng",
      context: {
        contract_type: contract.contractType.name,
        end_date: contract.endDate?.toISOString(),
        position: contract.employee.position?.title,
        tenure: contract.startDate
          ? Math.round((new Date().getTime() - contract.startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 0,
      },
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Renewal Prediction error:", error);
    return { success: false, error: error.message };
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
    const [oldContract, newContract] = await Promise.all([
      prisma.contract.findUnique({ where: { id: data.oldContractId } }),
      prisma.contract.findUnique({ where: { id: data.newContractId } }),
    ]);

    if (!oldContract || !newContract) {
      return { success: false, error: "Contract not found" };
    }

    const result = await callAIService("/api/ai/summarize/content", {
      content: `Thay đổi hợp đồng:\nTrước: Lương ${oldContract.salary}, Từ ${oldContract.startDate?.toISOString()} đến ${oldContract.endDate?.toISOString()}\nSau: Lương ${newContract.salary}, Từ ${newContract.startDate?.toISOString()} đến ${newContract.endDate?.toISOString()}`,
      summary_type: "detailed",
    });

    return { success: true, content: result.content };
  } catch (error: any) {
    console.error("Contract Changes Summary error:", error);
    return { success: false, error: error.message };
  }
}
