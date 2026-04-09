"use server";

/**
 * Payroll AI Server Actions
 * AI-powered payroll analysis, salary recommendations, and insights
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
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
 * Analyze salary fairness across organization
 */
export async function analyzeSalaryFairness(data: {
  departmentId?: string;
  positionId?: string;
}) {
  try {
    const where: any = {};
    if (data.departmentId) where.departmentId = data.departmentId;
    if (data.positionId) where.positionId = data.positionId;

    const salaries = await prisma.salary.findMany({
      where,
      include: {
        user: { include: { department: true, position: true } },
      },
    });

    const payrollData = salaries.map((s) => ({
      employee_id: s.user.employeeCode,
      employee_name: s.user.name,
      department: s.user.department?.name,
      position: s.user.position?.title,
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
  } catch (error: any) {
    console.error("Salary Fairness Analysis error:", error);
    return {
      success: false,
      error: error.message || "Failed to analyze",
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
  } catch (error: any) {
    console.error("Salary Recommendation error:", error);
    return {
      success: false,
      error: error.message || "Failed to recommend",
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
  } catch (error: any) {
    console.error("Tax Optimization error:", error);
    return {
      success: false,
      error: error.message || "Failed to optimize",
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
      include: {
        payrollRecord: {
          include: {
            user: { include: { position: true, department: true } },
          },
        },
      },
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
- Nhân viên: ${payslip.payrollRecord.user.name}
- Phòng ban: ${payslip.payrollRecord.user.department?.name}
- Kỳ lương: ${payslip.payPeriod}
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
  } catch (error: any) {
    console.error("Payslip Explanation error:", error);
    return {
      success: false,
      error: error.message || "Failed to explain",
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
        details: true,
        user: { include: { position: true, department: true } },
      },
    });

    if (!record) {
      return { success: false, error: "Payroll record not found" };
    }

    const result = await callAIService("/api/ai/analyze/payroll", {
      payroll_data: {
        payroll_record: record,
        details: record.details,
      },
      employee_id: record.user.employeeCode,
      analysis_type: "anomaly",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: any) {
    console.error("Payroll Anomaly Detection error:", error);
    return {
      success: false,
      error: error.message || "Failed to detect anomalies",
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
      include: {
        details: true,
        user: { include: { department: true, position: true } },
      },
    });

    if (!record) {
      return { success: false, error: "Payroll record not found" };
    }

    const result = await callAIService("/api/ai/summarize/report", {
      report_type: "payroll",
      report_data: {
        employee: record.user.name,
        department: record.user.department?.name,
        period: record.period,
        total_gross: Number(record.totalGross),
        total_net: Number(record.totalNet),
        details: record.details.map((d) => ({
          type: d.componentType,
          amount: Number(d.amount),
        })),
      },
      period: record.period,
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: any) {
    console.error("Payroll Narrative error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate narrative",
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
    const where: any = {};
    if (data.departmentId) {
      const users = await prisma.user.findMany({
        where: { departmentId: data.departmentId },
        select: { id: true },
      });
      where.userId = { in: users.map((u) => u.id) };
    }

    const historicalRecords = await prisma.payrollRecord.findMany({
      where,
      orderBy: { period: "desc" },
      take: 6,
    });

    const result = await callAIService("/api/ai/analyze/payroll", {
      payroll_data: { historical: historicalRecords },
      analysis_type: "forecast",
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: any) {
    console.error("Payroll Forecast error:", error);
    return {
      success: false,
      error: error.message || "Failed to forecast",
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
        include: { salary: true },
      });
    }

    const result = await callAIService("/api/ai/recommend/salary", {
      position: position.title,
      experience_years: employee?.hireDate
        ? Math.floor((new Date().getTime() - employee.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 0,
      current_salary: employee?.salary?.baseSalary,
    });

    return {
      success: true,
      content: result.content,
      marketData: result.market_data,
    };
  } catch (error: any) {
    console.error("Market Salary Comparison error:", error);
    return {
      success: false,
      error: error.message || "Failed to compare",
    };
  }
}
