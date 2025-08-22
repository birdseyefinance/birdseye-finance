import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
export const runtime = "nodejs"; // Prisma needs Node runtime

const prisma = new PrismaClient();
const USER_ID = "demo-user-1";
const KINDS = new Set(["evm","solana","btc","tron"]);

function validate(kind: string, address: string) {
  if (!KINDS.has(kind)) return "Invalid kind";
  const a = address?.trim();
  if (!a) return "Address required";
  if (kind === "evm"    && !/^0x[0-9a-fA-F]{40}$/.test(a)) return "EVM address must be 0x + 40 hex chars";
  if (kind === "solana" && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)) return "Solana address looks invalid";
  if (kind === "btc"    && a.length < 26) return "BTC address looks too short";
  return null;
}

export async function GET() {
  const wallets = await prisma.wallet.findMany({
    where: { userId: USER_ID },
    orderBy: { createdAt: "desc" },
    select: { id: true, kind: true, providerId: true, label: true }
  });
  return NextResponse.json({ wallets });
}

export async function POST(req: Request) {
  try {
    const { kind, providerId, label } = await req.json();
    const err = validate(kind, providerId);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    // Optional: prevent exact duplicates for this user
    const exists = await prisma.wallet.findFirst({ where: { userId: USER_ID, kind, providerId } });
    if (exists) return NextResponse.json({ error: "Wallet already exists" }, { status: 409 });

    const created = await prisma.wallet.create({
      data: { userId: USER_ID, kind, providerId: providerId.trim(), label: (label?.trim() || null) as any },
      select: { id: true, kind: true, providerId: true, label: true }
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Bad Request" }, { status: 400 });
  }
}