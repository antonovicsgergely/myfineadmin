"use client";

import { useState } from "react";

type Category = {
  id: string;
  name: string;
  unasId: string | null;
  parentId: string | null;
  isActive: boolean;
  commissionRate: number | null;
};

// Segédfüggvény, ami levágja a (123456) azonosítót a név végéről, ha van
const cleanName = (name: string, unasId: string | null) => {
  if (!unasId) return name;
  const suffix = ` (${unasId})`;
  if (name.endsWith(suffix)) {
    return name.slice(0, -suffix.length);
  }
  return name;
};

export default function CategoryTreeView({ categories: initialCategories }: { categories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCommissionSave = async (id: string, value: string) => {
    const rate = value.trim() === "" ? null : parseFloat(value);
    if (isNaN(rate as number) && rate !== null) return; // Invalid number
    
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate: rate })
      });
      if (res.ok) {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, commissionRate: rate } : c));
      }
    } catch (error) {
      console.error("Hiba a jutalék mentésekor", error);
    }
    setSavingId(null);
  };

  const childrenMap = new Map<string | null, Category[]>();
  categories.forEach(cat => {
    const parent = cat.parentId;
    if (!childrenMap.has(parent)) {
      childrenMap.set(parent, []);
    }
    childrenMap.get(parent)!.push(cat);
  });

  const renderTree = (parentId: string | null, level: number = 0) => {
    const children = childrenMap.get(parentId) || [];
    if (children.length === 0) return null;

    return (
      <ul className={level > 0 ? "border-l border-slate-200 ml-3 pl-2 space-y-0.5 my-1" : "space-y-1"}>
        {children.map(cat => {
          const hasChildren = (childrenMap.get(cat.id) || []).length > 0;
          const isExpanded = expandedIds.has(cat.id) || level === 0; // Root is expanded by default
          const displayName = cleanName(cat.name, cat.unasId);

          return (
            <li key={cat.id} className="text-sm">
              <div 
                className={`flex items-center gap-2 py-2 px-3 rounded-md transition-colors ${
                  level === 0 ? "bg-slate-100 text-slate-900 font-bold border-l-4 border-primary" : 
                  level === 1 ? "bg-slate-50 text-slate-800 font-medium" : 
                  "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                } ${hasChildren ? "cursor-pointer" : ""}`}
                onClick={() => hasChildren && toggleExpand(cat.id)}
              >
                <div className="w-5 flex items-center justify-center text-slate-400">
                  {hasChildren ? (
                    <svg 
                      className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                  )}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span>{displayName}</span>
                  
                  {!hasChildren && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Jutalék:</span>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.1"
                          defaultValue={cat.commissionRate !== null ? cat.commissionRate : ""}
                          onBlur={(e) => handleCommissionSave(cat.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className={`w-16 h-7 text-xs px-2 py-1 rounded border outline-none transition-colors ${savingId === cat.id ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary'}`}
                          placeholder="%"
                          disabled={savingId === cat.id}
                        />
                        {savingId === cat.id && (
                          <div className="absolute right-1 top-1.5 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {level === 0 && (
                   <div className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500 ml-2">
                     UNAS ID: {cat.unasId || "-"}
                   </div>
                )}
              </div>
              
              {hasChildren && isExpanded && (
                <div>
                  {renderTree(cat.id, level + 1)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Kategória struktúra</h3>
        <div className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded border border-slate-200">
          Összesen: {categories.length} kategória
        </div>
      </div>
      <div className="p-4 md:p-6 overflow-x-auto">
        <div className="min-w-[300px]">
          {renderTree(null)}
        </div>
      </div>
    </div>
  );
}
