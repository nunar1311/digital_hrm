# Digital HRM AI Service
# =======================

Python Microservice cho AI Integration vào hệ thống Digital HRM

## Tính năng

- **Multi-Provider Support**: OpenAI GPT-4o, Claude 3.5 Sonnet, Google Gemini 2.0
- **20 HR Modules**: Dashboard, Recruitment, Attendance, Payroll, Contracts, v.v.
- **Rate Limiting**: Redis-based rate limiting per user
- **Caching**: Smart response caching với Redis
- **Cost Tracking**: Token và cost tracking cho mỗi API call
- **Vietnamese Support**: Tối ưu cho tiếng Việt

## Cài đặt

### 1. Cài đặt dependencies

```bash
cd ai-service
pip install -r requirements.txt
```

### 2. Cấu hình Environment Variables

```bash
cp .env.example .env
# Edit .env and add your API keys
```

### 3. Cấu hình API Keys

Cần ít nhất 1 trong 3 API keys:

- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/settings/keys
- **Google**: https://aistudio.google.com/app/apikey

### 4. Chạy service

```bash
# Development
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 5. Kiểm tra

```bash
# Health check
curl http://localhost:8000/health

# API Docs
# Open http://localhost:8000/docs
```

## Docker Deployment

```bash
# Build image
docker build -t digital-hrm-ai:latest .

# Run with docker-compose
docker-compose up -d ai-service
```

## API Endpoints

### Chat
- `POST /api/ai/chat` - HR Chatbot
- `POST /api/ai/hr-question` - HR FAQ
- `POST /api/ai/leave-chat` - Leave management chat

### Analysis
- `POST /api/ai/analyze/resume` - Resume/CV analysis
- `POST /api/ai/analyze/attendance` - Attendance pattern analysis
- `POST /api/ai/analyze/payroll` - Payroll analysis
- `POST /api/ai/analyze/turnover` - Turnover risk prediction
- `POST /api/ai/analyze/sentiment` - Sentiment analysis

### Extraction
- `POST /api/ai/extract/document` - Generic document extraction
- `POST /api/ai/extract/id-card` - ID card (CMND/CCCD) extraction
- `POST /api/ai/extract/resume` - Resume parsing

### Generation
- `POST /api/ai/generate/contract` - Contract generation
- `POST /api/ai/generate/interview-questions` - Interview questions
- `POST /api/ai/generate/onboarding` - Onboarding plan
- `POST /api/ai/generate/leave-response` - Leave request response
- `POST /api/ai/generate/job-description` - Job description
- `POST /api/ai/generate/welcome-email` - Welcome email
- `POST /api/ai/generate/performance-review` - Performance review

### Summarization
- `POST /api/ai/summarize/content` - Generic content summarization
- `POST /api/ai/summarize/feedback` - Interview feedback summary
- `POST /api/ai/summarize/report` - Report summarization
- `POST /api/ai/summarize/notifications` - Notification digest

### Recommendations
- `POST /api/ai/recommend/salary` - Salary recommendation
- `POST /api/ai/recommend/training` - Training path
- `POST /api/ai/recommend/candidate` - Candidate ranking
- `POST /api/ai/recommend/onboarding-buddy` - Buddy matching

### Dashboard
- `POST /api/ai/dashboard/insights` - AI dashboard insights
- `POST /api/ai/dashboard/summary` - Executive summary
- `POST /api/ai/dashboard/query` - Natural language query
- `POST /api/ai/dashboard/anomaly-alert` - Anomaly detection
- `POST /api/ai/dashboard/predictive` - Predictive analytics

## Authentication

Internal calls từ Next.js cần header:

```
X-Internal-API-Key: your-internal-api-key
```

## Rate Limiting

- Default: 60 requests/minute, 1000 requests/day per user
- Configurable via environment variables
- Redis-backed (falls back to in-memory if Redis unavailable)

## Cost Estimation

| Module | Tokens/tháng | Chi phí ước tính |
|--------|-------------|-----------------|
| Dashboard AI | ~500K | ~$15 |
| Recruitment AI | ~2M | ~$60 |
| ESS Chatbot | ~1M | ~$30 |
| Attendance AI | ~300K | ~$9 |
| **Tổng** | **~5.3M** | **~$159/tháng** |

## Testing

```bash
pytest tests/ -v
```

## License

MIT
