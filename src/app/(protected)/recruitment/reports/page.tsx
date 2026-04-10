import {
  getRecruitmentStats,
  getJobPostings,
  getCandidates,
  getInterviews,
} from "../actions";
import type { JobPostingBasic, CandidateBasic, InterviewBasic } from "../types";
import { RecruitmentReportsClient } from "./reports-client";

export default async function RecruitmentReportsPage() {
  const [statsData, jobPostingsData, candidatesData, interviewsData] =
    await Promise.all([
      getRecruitmentStats(),
      getJobPostings({}, { limit: 100 }),
      getCandidates({}, { limit: 1000 }),
      getInterviews({}, { limit: 1000 }),
    ]);

  return (
    <RecruitmentReportsClient
      initialStats={statsData}
      initialJobPostings={jobPostingsData.items as JobPostingBasic[]}
      initialCandidates={candidatesData.items as CandidateBasic[]}
      initialInterviews={interviewsData.items as InterviewBasic[]}
    />
  );
}
