# AI Integration Guide for Digital HRM
# Hướng dẫn tích hợp AI vào hệ thống Digital HRM

## Tổng quan

Hệ thống Digital HRM đã được tích hợp với **Python AI Microservice** sử dụng API bên thứ ba (OpenAI GPT-4o, Claude 3.5, Google Gemini).

## Kiến trúc

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Next.js       │────▶│   AI Service    │
│   (React)       │     │   (API Routes)  │     │   (FastAPI)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                            ┌─────────────────────────────┤
                            ▼                             ▼
                    ┌───────────────┐           ┌───────────────┐
                    │  OpenAI       │           │  Claude/      │
                    │  GPT-4o       │           │  Gemini       │
                    └───────────────┘           └───────────────┘
```

## Cài đặt nhanh

### 1. Cấu hình API Keys

Thêm vào file `.env`:

```bash
# AI Provider API Keys
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key

# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000
AI_INTERNAL_API_KEY=your-secure-internal-key

# AI Defaults
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-4o
```

### 2. Khởi động AI Service

**Cách 1: Docker (Khuyến nghị)**

```bash
# Build và chạy AI service
docker-compose --profile ai up -d ai-service

# Hoặc chạy tất cả services
docker-compose --profile ai up -d
```

**Cách 2: Local Development**

```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env
# Edit .env với API keys của bạn
uvicorn app.main:app --reload --port 8000
```

### 3. Kiểm tra

```bash
# Health check
curl http://localhost:8000/health

# API Docs
# Open http://localhost:8000/docs
```

## Các tính năng AI đã tích hợp

### Dashboard AI
- `getDashboardAIInsights()` - Phân tích insights từ dữ liệu HR
- `generateDashboardSummary()` - Tạo tóm tắt điều hành
- `askDashboardNaturalLanguage()` - Hỏi bằng ngôn ngữ tự nhiên
- `getPredictiveAnalytics()` - Dự đoán xu hướng

### Recruitment AI
- `analyzeCandidateWithAI()` - Phân tích CV ứng viên
- `generateInterviewQuestions()` - Tạo câu hỏi phỏng vấn
- `summarizeInterviewFeedback()` - Tóm tắt feedback phỏng vấn
- `recommendCandidates()` - Đề xuất ứng viên phù hợp
- `optimizeJobDescription()` - Tối ưu mô tả công việc

### ESS Chatbot
- `chatWithHRBot()` - Chatbot HR 24/7
- `askHRQuestion()` - Trả lời câu hỏi HR
- `getPersonalizedDashboard()` - Dashboard cá nhân hóa
- `suggestLeaveDays()` - Gợi ý ngày nghỉ
- `getPersonalDevelopmentPlan()` - Kế hoạch phát triển

### Attendance AI
- `detectAttendanceAnomalies()` - Phát hiện bất thường chấm công
- `analyzeCheckInPatterns()` - Phân tích mẫu chấm công
- `predictOvertimeNeeds()` - Dự đoán nhu cầu OT
- `suggestOptimalShift()` - Gợi ý ca tối ưu

### Payroll AI
- `analyzeSalaryFairness()` - Phân tích công bằng lương
- `recommendSalary()` - Gợi ý mức lương
- `optimizeTaxStrategy()` - Tối ưu chiến lược thuế
- `explainPayslip()` - Giải thích phiếu lương

### Contracts AI
- `analyzeContractRisks()` - Phân tích rủi ro hợp đồng
- `checkContractCompliance()` - Kiểm tra tuân thủ
- `generateContractDraft()` - Tạo dự thảo hợp đồng

### Onboarding AI
- `generateOnboardingPlan()` - Tạo kế hoạch onboarding
- `recommendOnboardingBuddy()` - Gợi ý buddy
- `generateWelcomeContent()` - Tạo nội dung chào mừng

### Offboarding AI
- `analyzeExitInterview()` - Phân tích phỏng vấn nghỉ việc
- `detectResignationRisk()` - Phát hiện nguy cơ nghỉ
- `generateKnowledgeTransfer()` - Tạo kế hoạch chuyển giao

### Employees AI
- `extractEmployeeFromID()` - Trích xuất từ CMND/CCCD
- `extractEmployeeFromResume()` - Trích xuất từ CV
- `predictTurnoverRisk()` - Dự đoán nguy cơ nghỉ việc
- `suggestCareerPath()` - Gợi ý lộ trình nghề
- `analyzeSkillGap()` - Phân tích khoảng trống kỹ năng

### Org Chart AI
- `analyzeOrgHealth()` - Phân tích sức khỏe tổ chức
- `suggestSuccessor()` - Gợi ý người kế nhiệm
- `optimizeOrgStructure()` - Tối ưu cấu trúc

### Assets AI
- `predictMaintenance()` - Dự đoán bảo trì
- `recommendAssetAllocation()` - Gợi ý phân bổ tài sản
- `assessLossRisk()` - Đánh giá nguy cơ mất mát

### Notifications AI
- `generateNotificationSummary()` - Tóm tắt thông báo
- `prioritizeNotifications()` - Ưu tiên thông báo
- `draftNotification()` - Soạn thông báo

## Sử dụng trong Server Actions

```typescript
// Ví dụ: Phân tích CV ứng viên
import { analyzeCandidateWithAI } from "./recruitment/ai-actions";

const result = await analyzeCandidateWithAI({
  candidateId: "candidate-123",
  jobDescription: "Yêu cầu công việc...",
});

if (result.success) {
  console.log("Điểm phù hợp:", result.score);
  console.log("Điểm mạnh:", result.strengths);
  console.log("Khuyến nghị:", result.recommendations);
}
```

## AI Sidebar Component

Component `AISidebar` có thể được thêm vào bất kỳ trang nào:

```tsx
import { AISidebar } from "@/components/ai";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <AISidebar />
    </>
  );
}
```

## Cost Tracking

### Ước tính chi phí hàng tháng

| Module | Tokens/tháng | Chi phí (OpenAI) |
|--------|-------------|-----------------|
| Dashboard AI | ~500K | ~$15 |
| Recruitment AI | ~2M | ~$60 |
| ESS Chatbot | ~1M | ~$30 |
| Attendance AI | ~300K | ~$9 |
| Payroll AI | ~200K | ~$6 |
| Contracts AI | ~300K | ~$9 |
| Onboarding AI | ~200K | ~$6 |
| Employee AI | ~500K | ~$15 |
| Offboarding AI | ~200K | ~$6 |
| Org Chart AI | ~100K | ~$3 |
| **Tổng** | **~5.3M** | **~$159/tháng** |

### Tối ưu chi phí

1. **Sử dụng Cache**: Responses được cache 1 giờ mặc định
2. **Chọn model phù hợp**:
   - GPT-4o-mini cho tasks đơn giản
   - GPT-4o cho tasks phức tạp
   - Claude 3.5 Sonnet cho long-form analysis
3. **Giới hạn tokens**: Sử dụng `max_tokens` hợp lý

## Troubleshooting

### AI Service không khởi động được

```bash
# Kiểm tra logs
docker-compose logs ai-service

# Kiểm tra API key
docker-compose exec ai-service env | grep API_KEY
```

### Lỗi "AI Service unavailable"

1. Kiểm tra AI service đang chạy: `curl http://localhost:8000/health`
2. Kiểm tra biến môi trường `AI_SERVICE_URL`
3. Kiểm tra network trong Docker

### Chi phí quá cao

1. Bật caching: `REDIS_ENABLED=true`
2. Giảm rate limit: `RATE_LIMIT_PER_MINUTE=30`
3. Sử dụng model rẻ hơn: `DEFAULT_MODEL=gpt-4o-mini`
4. Giảm `CACHE_TTL_SECONDS` để cache ít hơn

## Development

### Thêm tính năng AI mới

1. **Python Service**: Thêm endpoint trong `ai-service/app/routers/`
2. **Next.js API Route**: Thêm route trong `src/app/api/ai/`
3. **Client**: Thêm method trong `src/lib/ai-service-client.ts`
4. **Server Action**: Thêm action trong module tương ứng
5. **Prompts**: Thêm prompt trong `ai-service/app/prompts/`

### Testing

```bash
# Python service tests
cd ai-service
pytest tests/ -v

# API endpoint tests
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Xin chào"}]}'
```

## Security

- API keys được lưu trong environment variables
- Internal API key xác thực giữa Next.js và AI service
- Rate limiting ngăn chặn abuse
- Input sanitization trong prompts
- Không lưu trữ sensitive data trong logs
