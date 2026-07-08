import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
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

    if (!post || post.vendor.userId !== session.user.id) {
      return NextResponse.json({ error: "Bejegyzés nem található." }, { status: 404 });
    }

    if (!post.draftTitle || !post.draftContent) {
      return NextResponse.json({ error: "Hiányzó tartalom. A beküldés előtt töltsd ki a címet és a tartalmat." }, { status: 400 });
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        status: "PENDING_APPROVAL"
      }
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}
