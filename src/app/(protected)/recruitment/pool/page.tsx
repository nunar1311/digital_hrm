import { getCandidates, getJobPostings } from "../actions";
import { RecruitmentPoolClient } from "./pool-client";

export default async function RecruitmentPoolPage() {
    const [candidatesData, jobPostingsData] = await Promise.all([
        getCandidates({}, { limit: 500 }),
        getJobPostings({}, { limit: 100 }),
    ]);

    return (
        <RecruitmentPoolClient
            initialCandidates={candidatesData.items}
            initialJobPostings={jobPostingsData.items}
        />
    );
}
