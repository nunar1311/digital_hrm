"use server";

/**
 * Payroll AI Server Actions
 * AI-powered payroll analysis, salary recommendations, and insights
 */


import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";

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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred";
}

/**
 * Analyze salary fairness across organization
 */
export async function analyzeSalaryFairness(data: {
  departmentId?: string;
  positionId?: string;
}) {
  try {
    const where: Prisma.SalaryWhereInput = {};
    if (data.departmentId) where.user = { departmentId: data.departmentId };
    if (data.positionId) where.user = { positionId: data.positionId };

    const salaries = await prisma.salary.findMany({
      where,
      include: {
        user: { include: { department: true, position: true } },
      },
    });

    const payrollData = salaries.map((s) => ({
      employee_id: s.user.username,
      employee_name: s.user.name,
      department: s.user.department?.name,
      position: s.user.position?.name,
      basic_salary: Number(s.baseSalary),
      experience_years: s.user.hireDate
        ? Math.floor((new Date().getTime() - s.user.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 0,
    }));

    const result = await callAIService("/api/ai/analyze/payroll", {
      payroll_data: { salaries: payrollData },
      analysis_type: "fairness",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Salary Fairness Analysis error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Get salary recommendation for a position
 */
export async function recommendSalary(data: {
  position: string;
  experienceYears: number;
  education?: string;
  skills?: string[];
  location?: string;
  industry?: string;
}) {
  try {
    const result = await callAIService("/api/ai/recommend/salary", {
      position: data.position,
      experience_years: data.experienceYears,
      education: data.education,
      skills: data.skills,
      location: data.location || "Hồ Chí Minh",
      industry: data.industry || "Technology",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Salary Recommendation error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Optimize tax strategy for employee
 */
export async function optimizeTaxStrategy(data: {
  employeeId: string;
  annualIncome: number;
  dependants?: number;
}) {
  try {
    const result = await callAIService("/api/ai/analyze/payroll", {
      payroll_data: {
        annual_income: data.annualIncome,
        dependants: data.dependants || 0,
      },
      employee_id: data.employeeId,
      analysis_type: "tax_optimization",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Tax Optimization error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Explain payslip to employee
 */
export async function explainPayslip(data: {
  payslipId: string;
}) {
  try {
    const payslip = await prisma.payslip.findUnique({
      where: { id: data.payslipId },
    });

    if (!payslip) {
      return { success: false, error: "Payslip not found" };
    }

    const result = await callAIService("/api/ai/chat", {
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia giải thích phiếu lương cho nhân viên Việt Nam.",
        },
        {
          role: "user",
          content: `Giải thích phiếu lương:
- Nhân viên: ${payslip.employeeName}
- Phòng ban: ${payslip.departmentName}
- Kỳ lương: ${payslip.month}/${payslip.year}
- Lương gross: ${payslip.grossSalary}
- Lương net: ${payslip.netSalary}
- Các khoản khấu trừ: ${JSON.stringify(payslip.deductions || {})}

Giải thích chi tiết từng khoản mục và cách tính.`,
        },
      ],
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Payslip Explanation error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Detect payroll anomalies
 */
export async function detectPayrollAnomalies(data: {
  payrollRecordId: string;
}) {
  try {
    const record = await prisma.payrollRecord.findUnique({
      where: { id: data.payrollRecordId },
      include: {
        payslips: {
          include: {
            user: { include: { position: true, department: true } },
          },
        },
      },
    });

    if (!record) {
      return { success: false, error: "Payroll record not found" };
    }

    const details = await prisma.payrollRecordDetail.findMany({
      where: { payrollRecordId: data.payrollRecordId },
      include: { user: { include: { position: true, department: true } } },
    });

    const result = await callAIService("/api/ai/analyze/payroll", {
      payroll_data: {
        payroll_record: record,
        details: details,
      },
      employee_id: details[0]?.user.username,
      analysis_type: "anomaly",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Payroll Anomaly Detection error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Generate payroll narrative (AI explanation)
 */
export async function generatePayrollNarrative(data: {
  payrollRecordId: string;
}) {
  try {
    const record = await prisma.payrollRecord.findUnique({
      where: { id: data.payrollRecordId },
    });

    if (!record) {
      return { success: false, error: "Payroll record not found" };
    }

    const details = await prisma.payrollRecordDetail.findMany({
      where: { payrollRecordId: data.payrollRecordId },
      include: { user: { include: { department: true, position: true } } },
    });

    const result = await callAIService("/api/ai/summarize/report", {
      report_type: "payroll",
      report_data: {
        employee: details[0]?.user.name,
        department: details[0]?.user.department?.name,
        period: `${record.month}/${record.year}`,
        total_gross: Number(record.totalGross),
        total_net: Number(record.totalNet),
        details: details.map((d) => ({
          type: d.componentTypeId,
          gross: Number(d.grossSalary),
          net: Number(d.netSalary),
        })),
      },
      period: `${record.month}/${record.year}`,
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Payroll Narrative error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Forecast payroll costs
 */
export async function forecastPayroll(data: {
  departmentId?: string;
  periods: number;
}) {
  try {
    const historicalRecords = await prisma.payrollRecord.findMany({
      where: data.departmentId ? { departmentId: data.departmentId } : {},
      orderBy: [
        { year: "desc" },
        { month: "desc" },
      ],
      take: data.periods,
    });

    const result = await callAIService("/api/ai/analyze/payroll", {
      payroll_data: { historical: historicalRecords },
      analysis_type: "forecast",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Payroll Forecast error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Compare salary with market data
 */
export async function compareMarketSalary(data: {
  positionId: string;
  employeeId?: string;
}) {
  try {
    const position = await prisma.position.findUnique({
      where: { id: data.positionId },
      include: { department: true },
    });

    if (!position) {
      return { success: false, error: "Position not found" };
    }

    let employee = null;
    if (data.employeeId) {
      employee = await prisma.user.findUnique({
        where: { id: data.employeeId },
        include: { salaries: true },
      });
    }

    const result = await callAIService("/api/ai/recommend/salary", {
      position: position.name,
      experience_years: employee?.hireDate
        ? Math.floor((new Date().getTime() - employee.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 0,
      current_salary: employee?.salaries?.baseSalary,
    });

    return {
      success: true,
      content: result.content,
      marketData: result.market_data,
    };
  } catch (error: unknown) {
    console.error("Market Salary Comparison error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
