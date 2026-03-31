import { requireAuth } from "@/lib/auth-session";
import { getESSDashboardData } from "./actions";
import { ESSClient } from "./ess-client";

export default async function ESSPage() {
    const session = await requireAuth();
    const data = await getESSDashboardData();
    
    return <ESSClient initialData={data} />;
}
