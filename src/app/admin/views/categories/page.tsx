import prisma from "@/lib/prisma";
import CategoryTreeView from "./CategoryTreeView";

export const dynamic = "force-dynamic";

export default async function AdminViewsCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  // Handle orphans (if a parent was set to inactive, the child's parentId would point to nothing in this list)
  const categoryIds = new Set(categories.map(c => c.id));
  const normalizedCategories = categories.map(c => {
    if (c.parentId && !categoryIds.has(c.parentId)) {
      return { ...c, parentId: null };
    }
    return c;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Kategóriák (Nézet)</h2>
        <p className="text-sm text-foreground/60 mt-1">Az aktív kategóriák fa struktúrában.</p>
      </div>

      <div className="w-full">
        {normalizedCategories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
            Nincs még egyetlen aktív kategória sem.
          </div>
        ) : (
          <div className="max-w-4xl">
            <CategoryTreeView categories={normalizedCategories} />
          </div>
        )}
      </div>
    </div>
  );
}
