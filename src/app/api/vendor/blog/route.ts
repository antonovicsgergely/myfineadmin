import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!vendor) {
      return NextResponse.json({ error: "Nincs gyártói profilod." }, { status: 400 });
    }

    const blogPosts = await prisma.blogPost.findMany({
      where: { vendorId: vendor.id },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(blogPosts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!vendor) {
      return NextResponse.json({ error: "Nincs gyártói profilod." }, { status: 400 });
    }

    const newPost = await prisma.blogPost.create({
      data: {
        vendorId: vendor.id,
        draftTitle: "Új bejegyzés címe",
        draftContent: "",
        status: "DRAFT"
      }
    });

    return NextResponse.json(newPost);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}
