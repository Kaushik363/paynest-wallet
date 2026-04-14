// src/app/api/wallet/topup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redisDel } from "@/lib/redis";

const schema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be positive")
    .max(100000, "Maximum top-up is ₹1,00,000"),
});

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { amount } = result.data;

    const updatedWallet = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { userId: user.userId },
        data: { balance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          amount,
          type: "TOPUP",
          status: "SUCCESS",
          receiverId: user.userId,
          note: "Wallet top-up",
        },
      });

      return wallet;
    });

    // Invalidate cache
    await redisDel(`balance:${user.userId}`);

    return NextResponse.json({
      success: true,
      message: `₹${amount.toLocaleString("en-IN")} added to your wallet`,
      newBalance: updatedWallet.balance,
    });
  } catch (error) {
    console.error("[topup]", error);
    return NextResponse.json({ success: false, message: "Top-up failed" }, { status: 500 });
  }
}
