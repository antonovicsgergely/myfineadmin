import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { requestedName, type } = data; // type: CATEGORY or FILTER

    if (!requestedName) {
      return NextResponse.json({ error: "Hiányzó név!" }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id }
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const newRequest = await prisma.categoryRequest.create({
      data: {
        vendorId: vendor.id,
        requestedName,
        type: type || "CATEGORY",
        status: "PENDING"
      }
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id }
    });

    if (!vendor) return NextResponse.json([]);

    const requests = await prisma.categoryRequest.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}
