/**
 * AI Service Client - Kết nối Next.js với Python AI Service
 * Su dung boi API routes trong src/app/api/ai/
 *
 * NOTE: Hai layer goi AI service:
 *   - src/lib/ai/actions.ts   : Server Actions, dung boi AI component (chat, websocket)
 *   - ai-service-client.ts   : AI Service Client, dung boi Next.js API routes
 */

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

/**
 * User context được forward tới AI Service để phân quyền truy cập database.
 * Next.js lấy từ session và truyền xuống đây.
 */
export interface AIUserContext {
  userId: string;
  userRole: string;  // SUPER_ADMIN, DIRECTOR, HR_MANAGER, EMPLOYEE, v.v.
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
    options: RequestInit = {},
    userContext?: AIUserContext
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.apiKey ? { "X-Internal-API-Key": this.apiKey } : {}),
      // Forward user context cho Python AI Service phân quyền DB access
      ...(userContext?.userId ? { "X-User-Id": userContext.userId } : {}),
      ...(userContext?.userRole ? { "X-User-Role": userContext.userRole } : {}),
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
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if ((error as { name?: string }).name === "AbortError") {
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
    options?: AIRequestOptions,
    userContext?: AIUserContext
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages, ...options }),
    }, userContext);
  }

  // @deprecated - endpoint /api/ai/hr-question da xoa, dung smartChat() thay the
  async hrQuestion(
    question: string,
    context?: Record<string, unknown>,
    language: string = "vi"
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/hr-question", {
      method: "POST",
      body: JSON.stringify({ question, context, language }),
    });
  }

  // @deprecated - endpoint /api/ai/leave-chat khong ton tai, dung smartChat() thay the
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
    attendanceData: Record<string, unknown>,
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
    payrollData: Record<string, unknown>,
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
    employeeData: Record<string, unknown>,
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
    schema?: Record<string, unknown>
) {
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
    data?: Record<string, unknown>;
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
    data?: Record<string, unknown>;
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
    context?: Record<string, unknown>
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
    feedbacks: Array<Record<string, unknown>>,
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
    reportData: Record<string, unknown>,
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
    notifications: Array<Record<string, unknown>>,
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
    candidates: Array<Record<string, unknown>>;
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
    available_buddies: Array<Record<string, unknown>>;
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
    dashboardData: Record<string, unknown>,
    period?: string,
    focusAreas?: string[],
    userContext?: AIUserContext
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
    }, userContext);
  }

  async generateDashboardSummary(
    metrics: Record<string, unknown>,
    period: string,
    userContext?: AIUserContext
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/dashboard/summary", {
      method: "POST",
      body: JSON.stringify({ metrics, period }),
    }, userContext);
  }

  async queryNaturalLanguage(
    query: string,
    dashboardData?: Record<string, unknown>,
    userContext?: AIUserContext
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/dashboard/query", {
      method: "POST",
      body: JSON.stringify({
        query,
        dashboard_data: dashboardData,
      }),
    }, userContext);
  }

  async detectAnomalies(
    metrics: Record<string, unknown>,
    historicalData?: Record<string, unknown>,
    userContext?: AIUserContext
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/dashboard/anomaly-alert", {
      method: "POST",
      body: JSON.stringify({
        metrics,
        historical_data: historicalData,
      }),
    }, userContext);
  }

  async getPredictiveAnalytics(
    historicalData: Record<string, unknown>,
    predictionType: "headcount" | "turnover" | "payroll" | "attendance",
    forecastPeriods: number = 3,
    userContext?: AIUserContext
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/dashboard/predictive", {
      method: "POST",
      body: JSON.stringify({
        historical_data: historicalData,
        prediction_type: predictionType,
        forecast_periods: forecastPeriods,
      }),
    }, userContext);
  }

  // =====================
  // SMART CHAT - Chat AI kết hợp dữ liệu thực từ DB
  // =====================

  async smartChat(
    message: string,
    history?: Array<{ role: string; content: string }>,
    options?: { provider?: string; model?: string; language?: string },
    userContext?: AIUserContext
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
    }, userContext);
  }

  // =====================
  // AUTO INSIGHTS - Tự động lấy data từ DB và phân tích
  // =====================

  async getAutoInsights(
    focusAreas?: string[],
    month?: number,
    year?: number,
    userContext?: AIUserContext
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
    data_snapshot?: Record<string, unknown>;
    provider?: string;
    usage?: Record<string, number>;
    error?: string;
  }> {
    return this.fetch("/api/ai/dashboard/auto-insights", {
      method: "POST",
      body: JSON.stringify({
        focus_areas: focusAreas,
        month,
        year,
      }),
    }, userContext);
  }

  // =====================
  // AUTO SUMMARY - Tóm tắt điều hành tự động từ DB
  // =====================

  async getAutoSummary(
    language: string = "vi",
    detailLevel: "brief" | "standard" | "detailed" = "standard",
    userContext?: AIUserContext
  ): Promise<AIResponse> {
    return this.fetch("/api/ai/dashboard/auto-summary", {
      method: "POST",
      body: JSON.stringify({
        language,
        detail_level: detailLevel,
      }),
    }, userContext);
  }

  // =====================
  // WORKFORCE ANALYSIS - Phân tích lực lượng lao động từ DB
  // =====================

  // @deprecated - endpoint /api/ai/analyze/workforce khong ton tai
  async analyzeWorkforce(userContext?: AIUserContext): Promise<AIResponse> {
    return this.fetch("/api/ai/analyze/workforce", {
      method: "POST",
    }, userContext);
  }

  // @deprecated - endpoint /api/ai/analyze/department/{id} khong ton tai
  async analyzeDepartment(departmentId: string): Promise<AIResponse> {
    return this.fetch(`/api/ai/analyze/department/${departmentId}`, {
      method: "POST",
    });
  }

  // @deprecated - endpoint /api/ai/analyze/employee/{userId} khong ton tai
  async analyzeEmployee360(userId: string): Promise<AIResponse> {
    return this.fetch(`/api/ai/analyze/employee/${userId}`, {
      method: "POST",
    });
  }

  // =====================
  // WORKFORCE ANALYSIS (Dashboard) - Phân tích từ Dashboard
  // =====================

  async getWorkforceAnalysis(userContext?: AIUserContext): Promise<AIResponse> {
    return this.fetch("/api/ai/dashboard/workforce-analysis", {
      method: "POST",
    }, userContext);
  }

  // =====================
  // DATABASE STATUS - Kiểm tra trạng thái kết nối DB
  // =====================

  // @deprecated - endpoint /api/ai/db-status khong ton tai
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

  // @deprecated - endpoint /api/ai/stats khong ton tai
  async getCostStats(): Promise<{
    monthly_cost_usd: number;
    monthly_tokens: number;
    request_count: number;
    cache_hit_rate: number;
  }> {
    return this.fetch("/api/ai/stats", { method: "GET" });
  }

  // =====================
  // DATA ANALYST ENDPOINTS
  // =====================

  /**
   * Natural Language Query - Trả lời câu hỏi về dữ liệu HR
   * Phân tích intent và gợi ý biểu đồ phù hợp
   *
   * @param intentOnly - Khi true, chỉ phân tích intent mà không thực thi full query
   */
  async dataAnalystQuery(
    question: string,
    options?: {
      language?: string;
      includeChart?: boolean;
      intentOnly?: boolean;
    },
    userContext?: AIUserContext
  ): Promise<{
    success: boolean;
    answer?: string;
    chartType?: "bar" | "line" | "pie" | "scatter" | "none" | null;
    chartData?: Array<Record<string, unknown>>;
    chartTitle?: string;
    xAxis?: string;
    yAxis?: string;
    metrics?: Array<{ label: string; value: unknown; unit?: string }>;
    insights?: Array<{
      title: string;
      description: string;
      severity?: string;
      metric?: string;
      recommendation?: string;
    }>;
    intent?: string;
    confidence?: number;
    dataSources?: string[];
    error?: string;
  }> {
    return this.fetch("/api/ai/data-analyst/query", {
      method: "POST",
      body: JSON.stringify({
        question,
        language: options?.language ?? "vi",
        include_chart: options?.includeChart ?? true,
        intent_only: options?.intentOnly ?? false,
      }),
    }, userContext);
  }

  /**
   * Chart Recommendation - Gợi ý loại biểu đồ phù hợp
   * Dùng để preview trước khi gửi câu hỏi
   */
  async recommendChart(
    question: string,
    dataPreview?: Record<string, unknown>
  ): Promise<{
    success: boolean;
    chart_type: string;
    title: string;
    x_axis: string;
    y_axis: string;
    reasoning: string;
    confidence: number;
  }> {
    return this.fetch("/api/ai/data-analyst/chart-recommend", {
      method: "POST",
      body: JSON.stringify({
        question,
        data_preview: dataPreview,
      }),
    });
  }

  // @deprecated - endpoint /api/ai/data-analyst/insights khong ton tai
  async getDeepInsights(
    question: string,
    options?: { language?: string },
    userContext?: AIUserContext
  ): Promise<{
    success: boolean;
    answer?: string;
    insights?: Array<{
      title: string;
      description: string;
      severity?: string;
      metric?: string;
      recommendation?: string;
    }>;
    metrics?: Array<{ label: string; value: unknown; unit?: string }>;
    dataSources?: string[];
    error?: string;
  }> {
    return this.fetch("/api/ai/data-analyst/insights", {
      method: "POST",
      body: JSON.stringify({
        question,
        language: options?.language ?? "vi",
      }),
    }, userContext);
  }
}

// Singleton instance
export const aiService = new AIServiceClient();

// Export for direct use
export default aiService;
