import { getSettingsForAllUsers } from "@/app/(protected)/settings/preferences/actions";
import { SettingsClient } from "@/app/(protected)/settings/preferences/settings-client";

export default async function ESSPreferencesPage() {
  const settings = await getSettingsForAllUsers();
  return <SettingsClient initialSettings={settings} canEdit={true} />;
}
