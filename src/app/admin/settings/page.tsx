import prisma from "@/lib/prisma";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await prisma.systemSetting.findMany();
  
  const getSetting = (key: string, defaultValue: string = "") => {
    return settings.find((s) => s.key === key)?.value || defaultValue;
  };

  const unasApiKey = getSetting("UNAS_API_KEY", "");
  const unasPageId = getSetting("UNAS_MANUFAKTURAK_PAGE_ID", "");

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-foreground">Rendszerbeállítások</h2>
      
      <SettingsForm 
        initialApiKey={unasApiKey}
        initialPageId={unasPageId}
      />
    </div>
  );
}
