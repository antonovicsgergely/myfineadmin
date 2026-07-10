import prisma from "@/lib/prisma";
import SettingsForm from "./SettingsForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  
  let currentUser = null;
  if (session?.user?.id) {
    currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  }

  const settings = await prisma.systemSetting.findMany();
  
  const getSetting = (key: string, defaultValue: string = "") => {
    return settings.find((s) => s.key === key)?.value || defaultValue;
  };

  const unasApiKey = getSetting("UNAS_API_KEY", "");
  const unasPageId = getSetting("UNAS_MANUFAKTURAK_PAGE_ID", "");
  const unasBlogPageId = getSetting("UNAS_BLOG_PAGE_ID", "");

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-foreground">Beállítások</h2>
      
      <SettingsForm 
        initialApiKey={unasApiKey}
        initialPageId={unasPageId}
        initialBlogPageId={unasBlogPageId}
        user={currentUser}
      />
    </div>
  );
}
