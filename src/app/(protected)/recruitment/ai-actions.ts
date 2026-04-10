"use server";

/**
 * Recruitment AI Server Actions
 * AI-powered candidate analysis, interview questions, and recruitment insights
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

  if (!response.ok) {
    throw new Error(`AI Service error: ${response.status}`);
  }

  return response.json();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred";
}

interface CandidateFeedback {
  interviewer: string;
  feedback: string;
  rating?: number;
}

interface RecruitmentMetrics {
  totalCandidates?: number;
  totalInterviews?: number;
  totalOffers?: number;
  totalHires?: number;
  [key: string]: string | number | boolean | null | undefined;
}

interface CandidateRankingResult {
  candidateId: string;
  candidateName: string;
  score: number;
  summary?: string;
}

/**
 * Analyze candidate with AI
 * Provides score, strengths, weaknesses, and recommendations
 */
export async function analyzeCandidateWithAI(data: {
  candidateId: string;
  resumeText?: string;
  jobRequirements?: string;
  jobDescription?: string;
}) {
  try {
    let resumeText = data.resumeText;

    if (data.candidateId && !resumeText) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: data.candidateId },
      });
      if (candidate) {
        resumeText = [
          candidate.name,
          candidate.email,
          candidate.phone || "",
          candidate.address || "",
          candidate.gender || "",
          candidate.notes || "",
          candidate.cvUrl || "",
        ].join("\n");
      }
    }

    const result = await callAIService("/api/ai/analyze/resume", {
      resume_text: resumeText,
      job_requirements: data.jobRequirements,
      job_description: data.jobDescription,
    });

    return {
      success: true,
      score: result.score,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      skillsMatch: result.skills_match,
      recommendations: result.recommendations || [],
      summary: result.summary,
    };
  } catch (error: unknown) {
    console.error("Candidate AI Analysis error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Generate interview questions for a position
 */
export async function generateInterviewQuestions(data: {
  jobTitle: string;
  jobDescription: string;
  department?: string;
  experienceLevel?: "junior" | "mid" | "senior";
  questionTypes?: ("technical" | "behavioral" | "situational")[];
}) {
  try {
    const result = await callAIService("/api/ai/generate/interview-questions", {
      job_title: data.jobTitle,
      job_description: data.jobDescription,
      department: data.department,
      experience_level: data.experienceLevel,
      question_types: data.questionTypes || ["technical", "behavioral", "situational"],
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Interview Questions Generation error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Summarize interview feedback from multiple interviewers
 */
export async function summarizeInterviewFeedback(data: {
  candidateId: string;
  feedbacks: CandidateFeedback[];
}) {
  try {
    const result = await callAIService("/api/ai/summarize/feedback", {
      feedbacks: data.feedbacks,
      candidate_id: data.candidateId,
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Interview Feedback Summary error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Recommend candidates for a job posting
 */
export async function recommendCandidates(data: {
  jobPostingId: string;
  candidateIds: string[];
}) {
  try {
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: data.jobPostingId },
    });

    if (!jobPosting) {
      return {
        success: false,
        error: "Job posting not found",
      };
    }

    const candidates = await prisma.candidate.findMany({
      where: { id: { in: data.candidateIds } },
    });

    const candidateData = candidates.map((c) => ({
      name: c.name,
      rating: c.rating || 0,
      notes: c.notes || "",
    }));

    const result = await callAIService("/api/ai/recommend/candidate", {
      job_requirements: `${jobPosting.title}\n${jobPosting.description}\n${jobPosting.requirements}`,
      candidates: candidateData,
      top_n: Math.min(candidates.length, 10),
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Candidate Recommendation error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Optimize job description using AI
 */
export async function optimizeJobDescription(data: {
  currentDescription: string;
  jobTitle: string;
  department?: string;
}) {
  try {
    const result = await callAIService("/api/ai/generate/job-description", {
      job_title: data.jobTitle,
      department: data.department || "",
      employment_type: "Full-time",
      experience_level: "mid",
      key_responsibilities: [data.currentDescription],
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Job Description Optimization error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Predict candidate offer acceptance probability
 */
export async function predictOfferAcceptance(data: {
  candidateId: string;
  offeredSalary?: number;
  benefits?: string[];
}) {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: data.candidateId },
    });

    if (!candidate) {
      return {
        success: false,
        error: "Candidate not found",
      };
    }

    const result = await callAIService("/api/ai/analyze/resume", {
      resume_text: [candidate.name, candidate.notes || "", candidate.cvUrl || ""].join("\n"),
      job_description: `Offer: ${data.offeredSalary || "TBD"}\nBenefits: ${data.benefits?.join(", ") || "Standard"}`,
    });

    return {
      success: true,
      content: result.content,
      score: result.score,
    };
  } catch (error: unknown) {
    console.error("Offer Acceptance Prediction error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Analyze resume with AI
 */
export async function analyzeResumeWithAI(data: {
  resumeText: string;
  jobRequirements?: string;
}) {
  try {
    const result = await callAIService("/api/ai/analyze/resume", {
      resume_text: data.resumeText,
      job_requirements: data.jobRequirements,
    });

    return {
      success: true,
      score: result.score,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      summary: result.summary,
    };
  } catch (error: unknown) {
    console.error("Resume Analysis error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Generate recruitment report with AI insights
 */
export async function generateRecruitmentReport(data: {
  period: string;
  metrics: RecruitmentMetrics;
}) {
  try {
    const result = await callAIService("/api/ai/summarize/report", {
      report_type: "recruitment",
      report_data: data.metrics,
      period: data.period,
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: unknown) {
    console.error("Recruitment Report error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Extract and rank candidate skills
 */
export async function extractCandidateSkills(data: {
  resumeText: string;
}) {
  try {
    const result = await callAIService("/api/ai/extract/resume", {
      resume_text: data.resumeText,
      include_sections: ["skills", "certifications", "languages"],
    });

    const extractedData = result.data as Record<string, string[]> | undefined;

    return {
      success: true,
      skills: extractedData?.skills || [],
      certifications: extractedData?.certifications || [],
      languages: extractedData?.languages || [],
    };
  } catch (error: unknown) {
    console.error("Skills Extraction error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Rank candidates by fit score
 */
export async function rankCandidatesByFit(data: {
  jobPostingId: string;
  candidateIds: string[];
}) {
  try {
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: data.jobPostingId },
    });

    const candidates = await prisma.candidate.findMany({
      where: { id: { in: data.candidateIds } },
    });

    const rankings: CandidateRankingResult[] = await Promise.all(
      candidates.map(async (candidate) => {
        const analysis = await callAIService("/api/ai/analyze/resume", {
          resume_text: [candidate.name, candidate.notes || "", candidate.cvUrl || ""].join("\n"),
          job_requirements: jobPosting?.requirements,
          job_description: `${jobPosting?.title}\n${jobPosting?.description}`,
        });

        return {
          candidateId: candidate.id,
          candidateName: candidate.name,
          score: (analysis.score as number) || 0,
          summary: analysis.summary as string | undefined,
        };
      })
    );

    rankings.sort((a, b) => b.score - a.score);

    return {
      success: true,
      rankings,
    };
  } catch (error: unknown) {
    console.error("Candidate Ranking error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
