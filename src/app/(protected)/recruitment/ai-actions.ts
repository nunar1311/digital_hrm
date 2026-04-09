"use server";

/**
 * Recruitment AI Server Actions
 * AI-powered candidate analysis, interview questions, and recruitment insights
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
    // Get candidate from database if ID provided
    let resumeText = data.resumeText;

    if (data.candidateId && !resumeText) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: data.candidateId },
      });
      if (candidate) {
        resumeText = `${candidate.name}\n${candidate.email}\n${candidate.phone || ""}\n${
          candidate.skills || ""
        }\n${candidate.experience || ""}\n${candidate.education || ""}`;
      }
    }

    const result = await callAIService("/api/ai/analyze/resume", {
      resume_text: resumeText,
      job_requirements: data.jobRequirements,
      job_description: data.jobDescription,
      candidate_name: data.candidateId,
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
  } catch (error: any) {
    console.error("Candidate AI Analysis error:", error);
    return {
      success: false,
      error: error.message || "Failed to analyze candidate",
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
  } catch (error: any) {
    console.error("Interview Questions Generation error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate questions",
    };
  }
}

/**
 * Summarize interview feedback from multiple interviewers
 */
export async function summarizeInterviewFeedback(data: {
  candidateId: string;
  feedbacks: Array<{
    interviewer: string;
    feedback: string;
    rating?: number;
  }>;
}) {
  try {
    const result = await callAIService("/api/ai/summarize/feedback", {
      feedbacks: data.feedbacks,
      candidate_name: data.candidateId,
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: any) {
    console.error("Interview Feedback Summary error:", error);
    return {
      success: false,
      error: error.message || "Failed to summarize feedback",
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
    // Get job posting details
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: data.jobPostingId },
    });

    if (!jobPosting) {
      return {
        success: false,
        error: "Job posting not found",
      };
    }

    // Get candidates
    const candidates = await prisma.candidate.findMany({
      where: { id: { in: data.candidateIds } },
    });

    const candidateData = candidates.map((c) => ({
      name: c.name,
      skills: c.skills?.split(",").map((s: string) => s.trim()) || [],
      experience: c.experience,
      score: 0,
    }));

    const result = await callAIService("/api/ai/recommend/candidate", {
      job_requirements: `${jobPosting.title}\n${jobPosting.description}\n${
        jobPosting.requirements || ""
      }`,
      candidates: candidateData,
      top_n: Math.min(candidates.length, 10),
    });

    return {
      success: true,
      content: result.content,
    };
  } catch (error: any) {
    console.error("Candidate Recommendation error:", error);
    return {
      success: false,
      error: error.message || "Failed to recommend candidates",
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
  } catch (error: any) {
    console.error("Job Description Optimization error:", error);
    return {
      success: false,
      error: error.message || "Failed to optimize description",
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
      resume_text: `${candidate.name}\n${candidate.experience}\nExpected: ${candidate.expectedSalary}`,
      job_description: `Offer: ${data.offeredSalary || "TBD"}\nBenefits: ${data.benefits?.join(", ") || "Standard"}`,
    });

    return {
      success: true,
      content: result.content,
      score: result.score,
    };
  } catch (error: any) {
    console.error("Offer Acceptance Prediction error:", error);
    return {
      success: false,
      error: error.message || "Failed to predict",
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
  } catch (error: any) {
    console.error("Resume Analysis error:", error);
    return {
      success: false,
      error: error.message || "Failed to analyze resume",
    };
  }
}

/**
 * Generate recruitment report with AI insights
 */
export async function generateRecruitmentReport(data: {
  period: string;
  metrics: Record<string, any>;
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
  } catch (error: any) {
    console.error("Recruitment Report error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate report",
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

    return {
      success: true,
      skills: result.data?.skills || [],
      certifications: result.data?.certifications || [],
      languages: result.data?.languages || [],
    };
  } catch (error: any) {
    console.error("Skills Extraction error:", error);
    return {
      success: false,
      error: error.message || "Failed to extract skills",
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

    const rankings = await Promise.all(
      candidates.map(async (candidate) => {
        const analysis = await callAIService("/api/ai/analyze/resume", {
          resume_text: `${candidate.name}\n${candidate.skills || ""}\n${candidate.experience || ""}`,
          job_requirements: jobPosting?.requirements,
          job_description: `${jobPosting?.title}\n${jobPosting?.description}`,
        });

        return {
          candidateId: candidate.id,
          candidateName: candidate.name,
          score: analysis.score || 0,
          summary: analysis.summary,
        };
      })
    );

    // Sort by score descending
    rankings.sort((a, b) => b.score - a.score);

    return {
      success: true,
      rankings,
    };
  } catch (error: any) {
    console.error("Candidate Ranking error:", error);
    return {
      success: false,
      error: error.message || "Failed to rank candidates",
    };
  }
}
