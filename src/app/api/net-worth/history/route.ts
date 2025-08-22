import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

const USER_ID = "demo-user-1";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = Math.max(1, Math.min(365, Number(searchParams.get("days") ?? 30)));

  const since = new Date(Date.now() - days*24*60*60*1000);
  since.setHours(0,0,0,0);

  const rows = await prisma.netWorthSnapshot.findMany({
    where: { userId: USER_ID, asOf: { gte: since } },
    orderBy: { asOf: "asc" },
    select: { asOf: true, netWorthUSD: true, banksUSD: true, walletsUSD: true }
  });

  const series = rows.map(r => ({
    date: r.asOf.toISOString().slice(0,10),
    net:  r.netWorthUSD,
    banks: r.banksUSD,
    wallets: r.walletsUSD,
  }));

  return NextResponse.json({ days, series });
}