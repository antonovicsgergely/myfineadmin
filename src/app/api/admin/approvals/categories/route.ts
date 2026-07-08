import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.categoryRequest.findMany({
      include: { vendor: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, action, rejectReason } = await req.json();

    const catReq = await prisma.categoryRequest.findUnique({ where: { id: requestId } });
    if (!catReq) return NextResponse.json({ error: "Nem található igénylés" }, { status: 404 });

    if (action === "APPROVE") {
      // Create the actual category or filter
      if (catReq.type === "CATEGORY") {
        await prisma.category.upsert({
          where: { name: catReq.requestedName },
          update: {},
          create: { name: catReq.requestedName }
        });
      } else {
        await prisma.filter.upsert({
          where: { name: catReq.requestedName },
          update: {},
          create: { name: catReq.requestedName }
        });
      }

      await prisma.categoryRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED", adminResponse: "Elfogadva és létrehozva." }
      });
    } else if (action === "REJECT") {
      await prisma.categoryRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED", adminResponse: rejectReason || "Elutasítva." }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}
