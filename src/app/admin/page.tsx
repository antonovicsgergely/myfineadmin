import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const vendorsCount = await prisma.vendor.count();
  const pendingBrandsCount = await prisma.vendor.count({
    where: { brandStatus: "PENDING_APPROVAL" },
  });
  const pendingBlogsCount = await prisma.blogPost.count({
    where: { status: "PENDING_APPROVAL" },
  });
  const pendingProductsCount = await prisma.productSync.count({
    where: { qualityStatus: "PENDING_APPROVAL" },
  });
  const pendingCategoriesCount = await prisma.categoryRequest.count({
    where: { status: "PENDING" },
  });
  const productsCount = await prisma.productSync.count();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Központi Irányítópult</h2>
        <p className="text-sm text-foreground/60 mt-1">Kezeld a csatlakozott gyártókat, és tekintsd át a rendszer státuszát.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Cards */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-center h-full hover:-translate-y-1 transition-transform">
          <h3 className="text-sm font-semibold text-foreground/60 mb-2 uppercase tracking-wide">Összes Gyártó</h3>
          <p className="text-4xl font-extrabold text-foreground">{vendorsCount}</p>
        </div>
        
        <div className="glass p-6 rounded-2xl flex flex-col h-full border-accent/50 shadow-accent/10">
          <h3 className="text-sm font-semibold text-accent mb-4 uppercase tracking-wide">Jóváhagyásra vár</h3>
          <div className="space-y-2 flex-1 flex flex-col justify-center">
             <a href="/admin/approvals/brands" className="flex justify-between items-center hover:bg-accent/10 p-2 rounded-lg transition-colors group">
               <span className="text-foreground/80 font-medium group-hover:text-accent">Márkaoldalak</span>
               <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">{pendingBrandsCount}</span>
             </a>
             <a href="/admin/approvals/blogs" className="flex justify-between items-center hover:bg-accent/10 p-2 rounded-lg transition-colors group">
               <span className="text-foreground/80 font-medium group-hover:text-accent">Blogbejegyzések</span>
               <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">{pendingBlogsCount}</span>
             </a>
             <a href="/admin/approvals/products" className="flex justify-between items-center hover:bg-accent/10 p-2 rounded-lg transition-colors group">
               <span className="text-foreground/80 font-medium group-hover:text-accent">Termékek</span>
               <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">{pendingProductsCount}</span>
             </a>
             <a href="/admin/approvals/categories" className="flex justify-between items-center hover:bg-accent/10 p-2 rounded-lg transition-colors group">
               <span className="text-foreground/80 font-medium group-hover:text-accent">Kategóriák / Szűrők</span>
               <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">{pendingCategoriesCount}</span>
             </a>
          </div>
        </div>
        
        <div className="glass p-6 rounded-2xl flex flex-col justify-center h-full hover:-translate-y-1 transition-transform">
          <h3 className="text-sm font-semibold text-foreground/60 mb-2 uppercase tracking-wide">Szinkronizált Termékek</h3>
          <p className="text-4xl font-extrabold text-foreground">{productsCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-primary rounded-2xl p-8 text-white relative overflow-hidden shadow-lg shadow-primary/30 flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Gyorsműveletek</h3>
            <p className="text-white/80 text-sm mb-6">Navigálj gyorsan a legfontosabb beállításokhoz.</p>
          </div>
          <div className="flex gap-4">
             <a href="/admin/vendors" className="bg-white text-primary text-sm font-semibold py-2 px-4 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">Gyártók kezelése</a>
             <a href="/admin/settings" className="bg-white/10 text-white text-sm font-semibold py-2 px-4 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">Beállítások</a>
          </div>
        </div>

        <div className="glass p-8 rounded-2xl">
          <h3 className="text-xl font-bold text-foreground mb-4">Rendszer Státusz</h3>
          <ul className="space-y-4">
             <li className="flex items-center gap-3">
               <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
               <span className="text-foreground/80 font-medium">Adatbázis kapcsolat stabil</span>
             </li>
             <li className="flex items-center gap-3">
               <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
               <span className="text-foreground/80 font-medium">Autentikációs szerver aktív</span>
             </li>
             <li className="flex items-center gap-3">
               <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
               <span className="text-foreground/80 font-medium">Unas API (Készenlét)</span>
             </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
