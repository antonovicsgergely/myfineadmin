import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { syncBlogPostToUnas } from "@/lib/unas/pages";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { title, content, coverUrl, shortDescription, status } = data;

    const post = await prisma.blogPost.create({
      data: {
        title: status === "PUBLISHED" ? title : null,
        content: status === "PUBLISHED" ? content : null,
        coverUrl: status === "PUBLISHED" ? coverUrl : null,
        shortDescription: status === "PUBLISHED" ? shortDescription : null,
        draftTitle: title,
        draftContent: content,
        draftCoverUrl: coverUrl,
        draftShortDescription: shortDescription,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      }
    });

    if (status === "PUBLISHED") {
      try {
        await syncBlogPostToUnas(post.id);
      } catch (err: any) {
        console.error("UNAS sync hiba:", err);
        return NextResponse.json({ 
          error: `Sikeres mentés, de az UNAS szinkronizáció sikertelen: ${err.message}` 
        }, { status: 500 });
      }
    }

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("POST Hiba:", error);
    return NextResponse.json({ error: `Szerverhiba: ${error?.message || "Ismeretlen hiba"}` }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { title, content, coverUrl, shortDescription, status } = data;

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: status === "PUBLISHED" ? title : undefined,
        content: status === "PUBLISHED" ? content : undefined,
        coverUrl: status === "PUBLISHED" ? coverUrl : undefined,
        shortDescription: status === "PUBLISHED" ? shortDescription : undefined,
        draftTitle: title,
        draftContent: content,
        draftCoverUrl: coverUrl,
        draftShortDescription: shortDescription,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : undefined,
      }
    });

    if (status === "PUBLISHED" || status === "INACTIVE") {
      try {
        await syncBlogPostToUnas(post.id);
      } catch (err: any) {
        console.error("UNAS sync hiba:", err);
        return NextResponse.json({ 
          error: `Sikeres mentés, de az UNAS szinkronizáció sikertelen: ${err.message}` 
        }, { status: 500 });
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}
