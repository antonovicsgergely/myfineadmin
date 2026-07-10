import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { syncBlogPostToUnas } from "@/lib/unas/pages";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { status } = data; // "PUBLISHED" | "INACTIVE" | "ARCHIVED" | "DRAFT" | "PENDING_APPROVAL" | "REJECTED"

    if (!["PUBLISHED", "INACTIVE", "ARCHIVED", "DRAFT", "PENDING_APPROVAL", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Érvénytelen státusz." }, { status: 400 });
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: { status }
    });

    try {
      await syncBlogPostToUnas(post.id);
    } catch (err: any) {
      console.error("UNAS sync hiba:", err);
      return NextResponse.json({ 
        error: `Státusz módosítva, de az UNAS szinkronizáció sikertelen: ${err.message}` 
      }, { status: 500 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}
