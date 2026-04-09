/**
 * AI Service Client - Kết nối Next.js với Python AI Service
 * Sử dụng API bên thứ ba: OpenAI, Claude, Google Gemini
 */

import { auth } from "@/lib/auth";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY || "";

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  provider?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIRequestOptions {
  provider?: "openai" | "anthropic" | "google";
  model?: string;
  temperature?: number;
  cache?: boolean;
}

class AIServiceClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor() {
    this.baseUrl = AI_SERVICE_URL;
    this.apiKey = AI_SERVICE_KEY;
    this.timeout = 120000; // 120 seconds
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.apiKey ? { "X-Internal-API-Key": this.apiKey } : {}),
      ...options.headers as Record<string, string>,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `AI Service error: ${response.status}`
        );
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("AI Service timeout");
      }
      throw error;
    }
  }

  // =====================
  // CHAT ENDPOINTS
  // =====================

  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: AIRequestOptions
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages, ...options }),
    });
  }

  async hrQuestion(
    question: string,
    context?: Record<string, any>,
    language: string = "vi"
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/hr-question", {
      method: "POST",
      body: JSON.stringify({ question, context, language }),
    });
  }

  async leaveChat(
    action: "ask" | "approve" | "reject" | "info",
    data: {
      employee_id?: string;
      leave_request_id?: string;
      message?: string;
    },
    language: string = "vi"
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/leave-chat", {
      method: "POST",
      body: JSON.stringify({ ...data, action, language }),
    });
  }

  // =====================
  // ANALYSIS ENDPOINTS
  // =====================

  async analyzeResume(
    resumeText: string,
    jobRequirements?: string,
    jobDescription?: string,
    candidateName?: string
  ): Promise<{
    success: boolean;
    score?: number;
    strengths?: string[];
    weaknesses?: string[];
    skills_match?: Record<string, string[]>;
    recommendations?: string[];
    summary?: string;
    error?: string;
  }> {
    return this.fetch("/api/ai/analyze/resume", {
      method: "POST",
      body: JSON.stringify({
        resume_text: resumeText,
        job_requirements: jobRequirements,
        job_description: jobDescription,
        candidate_name: candidateName,
      }),
    });
  }

  async analyzeAttendance(
    attendanceData: Record<string, any>,
    employeeId?: string,
    analysisType: "anomaly" | "pattern" | "overtime" = "anomaly"
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/analyze/attendance", {
      method: "POST",
      body: JSON.stringify({
        attendance_data: attendanceData,
        employee_id: employeeId,
        analysis_type: analysisType,
      }),
    });
  }

  async analyzePayroll(
    payrollData: Record<string, any>,
    employeeId?: string,
    analysisType: "fairness" | "anomaly" | "forecast" = "fairness"
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/analyze/payroll", {
      method: "POST",
      body: JSON.stringify({
        payroll_data: payrollData,
        employee_id: employeeId,
        analysis_type: analysisType,
      }),
    });
  }

  async analyzeTurnover(
    employeeData: Record<string, any>,
    employeeId?: string
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/analyze/turnover", {
      method: "POST",
      body: JSON.stringify({
        employee_data: employeeData,
        employee_id: employeeId,
      }),
    });
  }

  async analyzeSentiment(
    text: string,
    context?: string
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/analyze/sentiment", {
      method: "POST",
      body: JSON.stringify({ text, context }),
    });
  }

  // =====================
  // EXTRACTION ENDPOINTS
  // =====================

  async extractDocument(
    text: string,
    extractionType: "employee_id" | "resume" | "contract" | "certificate",
    schema?: Record<string, any>
  ): Promise<{
    success: boolean;
    data?: Record<string, any>;
    confidence?: number;
    warnings?: string[];
    error?: string;
  }> {
    return this.fetch("/api/ai/extract/document", {
      method: "POST",
      body: JSON.stringify({
        text,
        extraction_type: extractionType,
        schema,
      }),
    });
  }

  async extractIdCard(
    frontText: string,
    backText?: string
  ): Promise<{
    success: boolean;
    data?: Record<string, any>;
    confidence?: number;
    error?: string;
  }> {
    return this.fetch("/api/ai/extract/id-card", {
      method: "POST",
      body: JSON.stringify({
        front_text: frontText,
        back_text: backText,
      }),
    });
  }

  async extractResume(
    resumeText: string,
    includeSections?: string[]
  ): Promise<{
    success: boolean;
    data?: Record<string, any>;
    confidence?: number;
    error?: string;
  }> {
    return this.fetch("/api/ai/extract/resume", {
      method: "POST",
      body: JSON.stringify({
        resume_text: resumeText,
        include_sections: includeSections,
      }),
    });
  }

  // =====================
  // GENERATION ENDPOINTS
  // =====================

  async generateContract(
    prompt: string,
    context?: Record<string, any>
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/generate/contract", {
      method: "POST",
      body: JSON.stringify({ prompt, context }),
    });
  }

  async generateInterviewQuestions(params: {
    job_title: string;
    job_description: string;
    department?: string;
    experience_level?: string;
    question_types?: string[];
  }): Promise<AIResponse> {
    return this.fetch("/api/ai/generate/interview-questions", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async generateOnboardingPlan(params: {
    employee_name: string;
    position: string;
    department: string;
    start_date?: string;
    employment_type?: string;
    previous_experience?: string;
  }): Promise<AIResponse> {
    return this.fetch("/api/ai/generate/onboarding", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async generateLeaveResponse(params: {
    leave_type: string;
    start_date: string;
    end_date: string;
    reason?: string;
    employee_name?: string;
    leave_balance?: Record<string, number>;
  }): Promise<AIResponse> {
    return this.fetch("/api/ai/generate/leave-response", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async generateJobDescription(params: {
    job_title: string;
    department: string;
    employment_type?: string;
    experience_level?: string;
    key_responsibilities?: string[];
    requirements?: string[];
    benefits?: string[];
  }): Promise<AIResponse> {
    return this.fetch("/api/ai/generate/job-description", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async generateWelcomeEmail(params: {
    employee_name: string;
    position: string;
    department: string;
    start_date: string;
    manager_name?: string;
    buddy_name?: string;
  }): Promise<AIResponse> {
    return this.fetch("/api/ai/generate/welcome-email", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async generatePerformanceReview(params: {
    employee_name: string;
    position: string;
    period: string;
    achievements: string[];
    areas_for_improvement?: string[];
    goals?: string[];
  }): Promise<AIResponse> {
    return this.fetch("/api/ai/generate/performance-review", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // =====================
  // SUMMARIZATION ENDPOINTS
  // =====================

  async summarizeContent(
    content: string,
    summaryType: "brief" | "detailed" | "bullet_points" = "brief",
    maxLength: number = 500,
    focus?: string
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/summarize/content", {
      method: "POST",
      body: JSON.stringify({
        content,
        summary_type: summaryType,
        max_length: maxLength,
        focus,
      }),
    });
  }

  async summarizeFeedback(
    feedbacks: Array<Record<string, any>>,
    candidateName?: string
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/summarize/feedback", {
      method: "POST",
      body: JSON.stringify({
        feedbacks,
        candidate_name: candidateName,
      }),
    });
  }

  async summarizeReport(
    reportType: "attendance" | "payroll" | "recruitment" | "turnover",
    reportData: Record<string, any>,
    period?: string
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/summarize/report", {
      method: "POST",
      body: JSON.stringify({
        report_type: reportType,
        report_data: reportData,
        period,
      }),
    });
  }

  async summarizeNotifications(
    notifications: Array<Record<string, any>>,
    period: "today" | "this_week" | "this_month" = "today"
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/summarize/notifications", {
      method: "POST",
      body: JSON.stringify({
        notifications,
        period,
      }),
    });
  }

  // =====================
  // RECOMMENDATION ENDPOINTS
  // =====================

  async recommendSalary(params: {
    position: string;
    experience_years: number;
    education?: string;
    skills?: string[];
    location?: string;
    industry?: string;
  }): Promise<AIResponse> {
    return this.fetch("/api/ai/recommend/salary", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async recommendTraining(params: {
    employee_id?: string;
    position: string;
    goals?: string[];
    skill_gaps?: string[];
    experience_years?: number;
  }): Promise<AIResponse> {
    return this.fetch("/api/ai/recommend/training", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async recommendCandidates(params: {
    job_requirements: string;
    candidates: Array<Record<string, any>>;
    top_n?: number;
  }): Promise<AIResponse> {
    return this.fetch("/api/ai/recommend/candidate", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async recommendOnboardingBuddy(params: {
    new_employee_id: string;
    new_employee_skills?: string[];
    new_employee_interests?: string[];
    department_id: string;
    available_buddies: Array<Record<string, any>>;
  }): Promise<AIResponse> {
    return this.fetch("/api/ai/recommend/onboarding-buddy", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // =====================
  // DASHBOARD ENDPOINTS
  // =====================

  async getDashboardInsights(
    dashboardData: Record<string, any>,
    period?: string,
    focusAreas?: string[]
  ): Promise<{
    success: boolean;
    insights?: Array<{
      title: string;
      description: string;
      severity: "high" | "medium" | "low";
    }>;
    summary?: string;
    recommendations?: string[];
    error?: string;
  }> {
    return this.fetch("/api/ai/dashboard/insights", {
      method: "POST",
      body: JSON.stringify({
        dashboard_data: dashboardData,
        period,
        focus_areas: focusAreas,
      }),
    });
  }

  async generateDashboardSummary(
    metrics: Record<string, any>,
    period: string
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/dashboard/summary", {
      method: "POST",
      body: JSON.stringify({ metrics, period }),
    });
  }

  async queryNaturalLanguage(
    query: string,
    dashboardData?: Record<string, any>
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/dashboard/query", {
      method: "POST",
      body: JSON.stringify({
        query,
        dashboard_data: dashboardData,
      }),
    });
  }

  async detectAnomalies(
    metrics: Record<string, any>,
    historicalData?: Record<string, any>
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/dashboard/anomaly-alert", {
      method: "POST",
      body: JSON.stringify({
        metrics,
        historical_data: historicalData,
      }),
    });
  }

  async getPredictiveAnalytics(
    historicalData: Record<string, any>,
    predictionType: "headcount" | "turnover" | "payroll" | "attendance",
    forecastPeriods: number = 3
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/dashboard/predictive", {
      method: "POST",
      body: JSON.stringify({
        historical_data: historicalData,
        prediction_type: predictionType,
        forecast_periods: forecastPeriods,
      }),
    });
  }

  // =====================
  // SMART CHAT - Chat AI kết hợp dữ liệu thực từ DB
  // =====================

  async smartChat(
    message: string,
    history?: Array<{ role: string; content: string }>,
    options?: { provider?: string; model?: string; language?: string }
  ): Promise<{
    success: boolean;
    content?: string;
    data_sources?: string[];
    provider?: string;
    model?: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    error?: string;
  }> {
    return this.fetch("/api/ai/smart-chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        history,
        ...options,
      }),
    });
  }

  // =====================
  // AUTO INSIGHTS - Tự động lấy data từ DB và phân tích
  // =====================

  async getAutoInsights(
    focusAreas?: string[],
    month?: number,
    year?: number
  ): Promise<{
    success: boolean;
    insights?: Array<{
      title: string;
      description: string;
      severity: string;
      category?: string;
    }>;
    summary?: string;
    recommendations?: string[];
    health_score?: number;
    data_snapshot?: Record<string, any>;
    provider?: string;
    usage?: Record<string, any>;
    error?: string;
  }> {
    return this.fetch("/api/ai/dashboard/auto-insights", {
      method: "POST",
      body: JSON.stringify({
        focus_areas: focusAreas,
        month,
        year,
      }),
    });
  }

  // =====================
  // AUTO SUMMARY - Tóm tắt điều hành tự động từ DB
  // =====================

  async getAutoSummary(
    language: string = "vi",
    detailLevel: "brief" | "standard" | "detailed" = "standard"
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/dashboard/auto-summary", {
      method: "POST",
      body: JSON.stringify({
        language,
        detail_level: detailLevel,
      }),
    });
  }

  // =====================
  // WORKFORCE ANALYSIS - Phân tích lực lượng lao động từ DB
  // =====================

  async analyzeWorkforce(): Promise<AIResponse> {
    return this.fetch("/api/ai/analyze/workforce", {
      method: "POST",
    });
  }

  // =====================
  // DEPARTMENT ANALYSIS - Phân tích phòng ban từ DB
  // =====================

  async analyzeDepartment(departmentId: string): Promise<AIResponse> {
    return this.fetch(`/api/ai/analyze/department/${departmentId}`, {
      method: "POST",
    });
  }

  // =====================
  // EMPLOYEE 360° ANALYSIS - Phân tích nhân viên toàn diện từ DB
  // =====================

  async analyzeEmployee360(userId: string): Promise<AIResponse> {
    return this.fetch(`/api/ai/analyze/employee/${userId}`, {
      method: "POST",
    });
  }

  // =====================
  // WORKFORCE ANALYSIS (Dashboard) - Phân tích từ Dashboard
  // =====================

  async getWorkforceAnalysis(): Promise<AIResponse> {
    return this.fetch("/api/ai/dashboard/workforce-analysis", {
      method: "POST",
    });
  }

  // =====================
  // DATABASE STATUS - Kiểm tra trạng thái kết nối DB
  // =====================

  async getDbStatus(): Promise<{
    success: boolean;
    database: {
      status: string;
      pool_size?: number;
      pool_free?: number;
      error?: string;
    };
  }> {
    return this.fetch("/api/ai/db-status", { method: "GET" });
  }

  // =====================
  // UTILITY METHODS
  // =====================

  async healthCheck(): Promise<{
    status: string;
    service: string;
    version: string;
    default_provider: string;
  }> {
    return this.fetch("/health", { method: "GET" });
  }

  async getCostStats(): Promise<{
    monthly_cost_usd: number;
    monthly_tokens: number;
    request_count: number;
    cache_hit_rate: number;
  }> {
    return this.fetch("/api/ai/stats", { method: "GET" });
  }
}

// Singleton instance
export const aiService = new AIServiceClient();

// Export for direct use
export default aiService;
