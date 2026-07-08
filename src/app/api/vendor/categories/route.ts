import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const allCategories = await prisma.category.findMany({ 
      where: { isActive: true }, 
      orderBy: { name: 'asc' } 
    });
    
    // Build tree
    const categoryMap = new Map();
    allCategories.forEach(c => categoryMap.set(c.id, { ...c, children: [] }));
    
    const tree: any[] = [];
    allCategories.forEach(c => {
      if (c.parentId) {
        const parent = categoryMap.get(c.parentId);
        if (parent) {
          parent.children.push(categoryMap.get(c.id));
        } else {
          tree.push(categoryMap.get(c.id)); // Orphan, push to root just in case
        }
      } else {
        tree.push(categoryMap.get(c.id));
      }
    });

    const filters = await prisma.filter.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    const regions = await prisma.region.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    
    return NextResponse.json({ categories: tree, filters, regions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}
