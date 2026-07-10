import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { syncBlogPostToUnas } from "@/lib/unas/pages";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.blogPost.findMany({
      where: {
        status: "PENDING_APPROVAL"
      },
      include: {
        vendor: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        updatedAt: 'asc'
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, action, rejectReason } = await req.json();

    const post = await prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      await prisma.blogPost.update({
        where: { id: postId },
        data: {
          status: "PUBLISHED",
          title: post.draftTitle,
          content: post.draftContent,
          coverUrl: post.draftCoverUrl,
          shortDescription: post.draftShortDescription,
          publishedAt: new Date()
        }
      });
      
      try {
        await syncBlogPostToUnas(postId);
      } catch (syncError: any) {
        console.error("Hiba az UNAS szinkronizáció során:", syncError);
        return NextResponse.json({ message: "Blog sikeresen publikálva, de az UNAS szinkronizáció sikertelen: " + syncError.message });
      }

      return NextResponse.json({ success: true, message: "Blog sikeresen publikálva és szinkronizálva az UNAS-szal!" });
    } else if (action === "REJECT") {
      await prisma.blogPost.update({
        where: { id: postId },
        data: {
          status: "REJECTED",
          rejectReason: rejectReason || "Nem felelt meg az irányelveknek."
        }
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}
