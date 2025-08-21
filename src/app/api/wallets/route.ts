import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const ALLOWED = new Set(["evm","solana","btc","tron"]);
const USER_ID = "demo-user-1"; // swap to real auth later

function normalize(kind: string, addr: string) {
  const a = (addr || "").trim();
  if (kind === "evm") return a.toLowerCase();
  return a;
}

export async function GET() {
  const rows = await prisma.connection.findMany({
    where: { userId: USER_ID, kind: { in: ["evm","solana","btc","tron"] } },
    select: { id: true, kind: true, providerId: true, label: true, createdAt: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ wallets: rows });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const kind = String(body?.kind || "").toLowerCase();
    const address = normalize(kind, String(body?.address || ""));
    const label = body?.label ? String(body.label) : null;

    if (!ALLOWED.has(kind)) {
      return NextResponse.json({ error: "kind must be one of evm|solana|btc|tron" }, { status: 400 });
    }
    if (!address) {
      return NextResponse.json({ error: "address required" }, { status: 400 });
    }

    // de-dupe per user/kind/address
    const existing = await prisma.connection.findFirst({
      where: { userId: USER_ID, kind, providerId: address }
    });
    if (existing) return NextResponse.json({ wallet: existing, existed: true });

    const row = await prisma.connection.create({
      data: {
        userId: USER_ID,
        kind,
        providerId: address,
        label: label || `${kind.toUpperCase()} wallet`,
        metadata: { address }
      },
      select: { id: true, kind: true, providerId: true, label: true, createdAt: true }
    });
    return NextResponse.json({ wallet: row });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}