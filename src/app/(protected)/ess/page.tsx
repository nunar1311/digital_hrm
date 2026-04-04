import { getESSDashboardData } from "./actions";
import { ESSClient } from "./ess-client";

export default async function ESSPage() {
  const data = await getESSDashboardData();

  return <ESSClient initialData={JSON.parse(JSON.stringify(data))} />;
}
