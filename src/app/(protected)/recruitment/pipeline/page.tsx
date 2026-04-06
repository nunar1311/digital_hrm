import { getCandidates, getJobPostings } from "../actions";
import { RecruitmentPipelineClient } from "./pipeline-client";

export default async function RecruitmentPipelinePage() {
  const [candidatesData, jobPostingsData] = await Promise.all([
    getCandidates({}, { limit: 500 }),
    getJobPostings({}, { limit: 100 }),
  ]);

  return (
    <RecruitmentPipelineClient
      initialCandidates={candidatesData.items as any}
      initialJobPostings={jobPostingsData.items as any}
    />
  );
}
