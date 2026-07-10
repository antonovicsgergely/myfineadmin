import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminViewsFiltersPage() {
  const filters = await prisma.filter.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Szűrők (Nézet)</h2>
        <p className="text-sm text-foreground/60 mt-1">Az összes rendszerben lévő szűrő listája.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Szűrő Név</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Típus</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Értékek</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">UNAS ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Státusz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Nincs még egyetlen szűrő sem.
                  </td>
                </tr>
              ) : (
                filters.map((filter) => {
                  let parsedValues: string[] = [];
                  try {
                    if (filter.values) parsedValues = JSON.parse(filter.values);
                  } catch (e) {}
                  
                  return (
                    <tr key={filter.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-900">{filter.name}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">
                        {filter.type}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500 max-w-xs truncate">
                        {parsedValues.length > 0 ? parsedValues.join(", ") : "-"}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">
                        {filter.unasId || "-"}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          filter.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {filter.isActive ? 'Aktív' : 'Inaktív'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
