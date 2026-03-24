import {
  getRecruitmentStats,
  getJobPostings,
  getCandidates,
  getInterviews,
} from "../actions";
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
      initialJobPostings={jobPostingsData.items as any}
      initialCandidates={candidatesData.items as any}
      initialInterviews={interviewsData.items as any}
    />
  );
}
