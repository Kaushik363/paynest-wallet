// src/app/api/wallet/transfer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redisDel } from "@/lib/redis";

const schema = z.object({
  recipientEmail: z.string().email("Invalid recipient email"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be positive")
    .max(50000, "Maximum single transfer is ₹50,000"),
  note: z.string().max(100).optional(),
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

    const { recipientEmail, amount, note } = result.data;

    if (recipientEmail.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: "You cannot transfer money to yourself" },
        { status: 400 }
      );
    }

    // ATOMIC TRANSACTION
    // PostgreSQL row-level locking prevents race conditions.
    // Both debit + credit happen together — or neither does.
    const txResult = await prisma.$transaction(async (tx) => {
      // Find recipient
      const recipient = await tx.user.findUnique({
        where: { email: recipientEmail },
        include: { wallet: true },
      });

      if (!recipient || !recipient.wallet) {
        throw Object.assign(new Error("RECIPIENT_NOT_FOUND"), { code: "RECIPIENT_NOT_FOUND" });
      }

      // Read sender wallet
      const senderWallet = await tx.wallet.findUnique({
        where: { userId: user.userId },
      });

      if (!senderWallet) {
        throw Object.assign(new Error("WALLET_NOT_FOUND"), { code: "WALLET_NOT_FOUND" });
      }

      if (senderWallet.balance < amount) {
        throw Object.assign(new Error("INSUFFICIENT_BALANCE"), { code: "INSUFFICIENT_BALANCE" });
      }

      // Debit sender
      const updatedSender = await tx.wallet.update({
        where: { userId: user.userId },
        data: { balance: { decrement: amount } },
      });

      // Credit receiver
      await tx.wallet.update({
        where: { userId: recipient.id },
        data: { balance: { increment: amount } },
      });

      // Record transaction
      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: "TRANSFER",
          status: "SUCCESS",
          senderId: user.userId,
          receiverId: recipient.id,
          note: note || null,
        },
      });

      return {
        transaction,
        recipientName: recipient.name,
        receiverId: recipient.id,
        newBalance: updatedSender.balance,
      };
    });

    // Invalidate both parties' cache
    await redisDel(`balance:${user.userId}`, `balance:${txResult.receiverId}`);

    return NextResponse.json({
      success: true,
      message: `₹${amount.toLocaleString("en-IN")} sent to ${txResult.recipientName}`,
      transactionId: txResult.transaction.id,
      newBalance: txResult.newBalance,
    });
  } catch (error: any) {
    const code = error?.code;
    if (code === "RECIPIENT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "No user found with that email" },
        { status: 404 }
      );
    }
    if (code === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        { success: false, message: "Insufficient balance" },
        { status: 400 }
      );
    }
    console.error("[transfer]", error);
    return NextResponse.json({ success: false, message: "Transfer failed" }, { status: 500 });
  }
}
