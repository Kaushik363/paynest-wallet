// src/app/api/users/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: user.userId } },
          {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 5,
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("[users/search]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
