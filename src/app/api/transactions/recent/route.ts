import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

  const rows = await prisma.transaction.findMany({
    orderBy: [{ postedDate: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  // Convert Decimal to number for JSON
  const out = rows.map(r => ({
    ...r,
    amount: Number(r.amount),
  }));

  return NextResponse.json({ transactions: out });
}