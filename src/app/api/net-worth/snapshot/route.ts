import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

const USER_ID = "demo-user-1";

export async function POST() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || "3001"}`;
  const j = await fetch(`${base}/api/net-worth`, { cache: "no-store" }).then(r => r.json()).catch(()=>null);
  if (!j?.totals) return NextResponse.json({ error: "Could not compute net worth" }, { status: 500 });

  const { banksUSD, walletsUSD, netWorthUSD } = j.totals;
  const today = new Date(); today.setHours(0,0,0,0);

  const row = await prisma.netWorthSnapshot.upsert({
    where: { userId_asOf: { userId: USER_ID, asOf: today } as any },
    update: { banksUSD, walletsUSD, netWorthUSD },
    create: { userId: USER_ID, asOf: today, banksUSD, walletsUSD, netWorthUSD }
  });

  return NextResponse.json({ ok: true, row });
}