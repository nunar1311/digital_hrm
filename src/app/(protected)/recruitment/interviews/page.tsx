import { getInterviews, getJobPostings } from "../actions";
import { RecruitmentCalendarClient } from "./calendar-client";

export default async function RecruitmentCalendarPage() {
    const [interviewsData, jobPostingsData] = await Promise.all([
        getInterviews({}, { limit: 500 }),
        getJobPostings({}, { limit: 100 }),
    ]);

    return (
        <RecruitmentCalendarClient
            initialInterviews={interviewsData.items}
            initialJobPostings={jobPostingsData.items}
        />
    );
}
