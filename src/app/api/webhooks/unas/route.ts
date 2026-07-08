import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { syncOrdersFromUnas } from "@/lib/unas/orders";
import { syncCategoriesFromUnas } from "@/lib/unas/categories";

/**
 * UNAS Webhook receiver endpoint.
 * UNAS sends POST requests here when events occur (e.g., new order, status change).
 * The payload is in JSON format (unlike the rest of the API which uses XML).
 * Must respond with HTTP 200 OK.
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();
    let payload: any;

    try {
      payload = JSON.parse(body);
    } catch {
      console.error("[UNAS Webhook] Invalid JSON payload:", body);
      return NextResponse.json({ status: "error", message: "Invalid JSON" }, { status: 400 });
    }

    // Verify HMAC signature if configured
    const hmacHeader = req.headers.get("x-unas-hmac") || req.headers.get("HTTP_X_UNAS_HMAC");
    const hmacSecret = await prisma.systemSetting.findUnique({ where: { key: "UNAS_WEBHOOK_SECRET" } });

    if (hmacSecret?.value && hmacHeader) {
      const computedHmac = crypto
        .createHmac("sha256", hmacSecret.value)
        .update(body)
        .digest("hex");

      if (computedHmac !== hmacHeader) {
        console.error("[UNAS Webhook] HMAC mismatch!");
        return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 401 });
      }
    }

    console.log("[UNAS Webhook] Received event:", JSON.stringify(payload).substring(0, 500));

    // Determine event type and handle accordingly
    const eventType = payload.event || payload.type || payload.action || "";

    // Log the webhook event
    await prisma.syncLog.create({
      data: {
        type: "WEBHOOK",
        status: "SUCCESS",
        message: `Webhook esemény: ${eventType || "ismeretlen"}`,
        details: JSON.stringify(payload).substring(0, 2000),
        itemCount: 1,
      },
    });

    // Handle specific events
    if (eventType.toLowerCase().includes("order")) {
      // New order or order status change → sync recent orders
      console.log("[UNAS Webhook] Order event detected, syncing recent orders...");
      // Sync last 1 day of orders
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      await syncOrdersFromUnas(yesterday, today);
    }

    if (eventType.toLowerCase().includes("category")) {
      console.log("[UNAS Webhook] Category event detected, syncing categories...");
      await syncCategoriesFromUnas();
    }

    // Always respond with 200 OK (UNAS requirement)
    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("[UNAS Webhook] Error:", error);
    // Still return 200 to prevent UNAS retry storms
    return NextResponse.json({ status: "ok", note: "Processed with errors" });
  }
}
