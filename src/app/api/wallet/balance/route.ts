// src/app/api/wallet/balance/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Always fetch fresh from DB — no Redis cache
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.userId },
    });

    if (!wallet) {
      return NextResponse.json({ success: false, message: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      balance: wallet.balance,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("[balance]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}