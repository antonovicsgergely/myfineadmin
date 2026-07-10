import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { syncBlogPostToUnas } from "@/lib/unas/pages";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { status } = data; // "INACTIVE" | "ARCHIVED" | "DRAFT"

    if (!["INACTIVE", "ARCHIVED", "DRAFT"].includes(status)) {
      return NextResponse.json({ error: "Érvénytelen státusz." }, { status: 400 });
    }

    const currentPost = await prisma.blogPost.findUnique({
      where: { id },
      include: { vendor: true }
    });

    if (!currentPost || currentPost.vendor?.userId !== session.user.id) {
      return NextResponse.json({ error: "Bejegyzés nem található vagy nincs jogosultságod." }, { status: 404 });
    }

    const wasPublished = currentPost.status === "PUBLISHED";
    const isNowPublished = status === "PUBLISHED"; // Vendor should not be able to publish directly, but keeping logic consistent

    const post = await prisma.blogPost.update({
      where: { id },
      data: { status }
    });

    // If it was published and is now INACTIVE or ARCHIVED, we must sync to UNAS to hide it
    if (wasPublished || isNowPublished) {
      try {
        await syncBlogPostToUnas(post.id);
      } catch (err: any) {
        console.error("UNAS sync hiba státuszváltáskor:", err);
        return NextResponse.json({ 
          error: `Sikeres státuszváltás, de az UNAS szinkronizáció sikertelen: ${err.message}` 
        }, { status: 500 });
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}
