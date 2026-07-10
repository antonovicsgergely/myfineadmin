import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { vendor: true }
    });

    if (!post || post.vendor?.userId !== session.user.id) {
      return NextResponse.json({ error: "Bejegyzés nem található vagy nincs jogosultságod." }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { draftTitle, draftContent, draftCoverUrl, draftShortDescription } = data;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { vendor: true }
    });

    if (!post || post.vendor?.userId !== session.user.id) {
      return NextResponse.json({ error: "Bejegyzés nem található." }, { status: 404 });
    }

    if (post.status === "PENDING_APPROVAL") {
      return NextResponse.json({ error: "Jóváhagyás alatt álló bejegyzést nem lehet szerkeszteni." }, { status: 400 });
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        draftTitle,
        draftContent,
        draftCoverUrl,
        draftShortDescription,
        status: "DRAFT" // Resets to draft if it was REJECTED
      }
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Blogbejegyzés mentve",
        message: `A(z) "${draftTitle || 'Névtelen'}" bejegyzés mentésre került.`,
        link: `/dashboard/blog/${id}`
      }
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}
