import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { plaid } from "@/lib/plaid";

export const runtime = "nodejs";

function ok(ok: boolean, meta: any = {}) { return { ok, ...meta }; }

export async function GET(req: Request) {
  const url = new URL(req.url);
  const deep = ["1","true","yes"].includes((url.searchParams.get("deep") || "").toLowerCase());
  const base = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || "3001"}`;

  const env = {
    PLAID_CLIENT_ID: !!process.env.PLAID_CLIENT_ID,
    PLAID_SECRET: !!process.env.PLAID_SECRET,
    PLAID_ENV: process.env.PLAID_ENV || null,
    PLAID_PRODUCTS: process.env.PLAID_PRODUCTS || null,
    ALCHEMY_API_KEY: !!process.env.ALCHEMY_API_KEY,
    HELIUS_API_KEY: !!process.env.HELIUS_API_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || null,
  };

  const checks: any = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = ok(true);
  } catch (e: any) {
    checks.db = ok(false, { error: e?.message });
  }

  if (env.PLAID_CLIENT_ID && env.PLAID_SECRET) {
    if (deep) {
      try {
        const r = await plaid.linkTokenCreate({
          user: { client_user_id: "health-check" },
          client_name: "Birdseye Health",
          products: [(process.env.PLAID_PRODUCTS || "transactions") as any],
          language: "en",
          country_codes: ["US"],
        });
        checks.plaid = ok(!!r?.data?.link_token, { hasToken: !!r?.data?.link_token });
      } catch (e: any) {
        checks.plaid = ok(false, { error: e?.response?.data || e?.message });
      }
    } else {
      checks.plaid = ok(true);
    }
  } else {
    checks.plaid = ok(false, { reason: "missing env" });
  }

  if (deep) {
    const evm = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
    const sol = "5En1CxJwjMUM6itAFeaC2VCkwmmDrijM6ikWUZx14pcb";
    const btc = "1KFHE7w8BhaENAswwryaoccDb6qcT6DbYY";

    try {
      const r = await fetch(`${base}/api/evm/${evm}/balances`).then(r=>r.json());
      checks.evm = ok(!r?.error, { sample: r });
    } catch (e: any) { checks.evm = ok(false, { error: e?.message }); }

    try {
      const r = await fetch(`${base}/api/solana/${sol}/balances`).then(r=>r.json());
      checks.solana = ok(!r?.error, { sample: r });
    } catch (e: any) { checks.solana = ok(false, { error: e?.message }); }

    try {
      const r = await fetch(`${base}/api/btc/${btc}/balances`).then(r=>r.json());
      checks.btc = ok(!r?.error, { sample: r });
    } catch (e: any) { checks.btc = ok(false, { error: e?.message }); }
  }

  try {
    const r = await fetch(`${base}/api/net-worth`).then(r=>r.json());
    checks.netWorth = ok(!!r?.totals, r);
  } catch (e: any) { checks.netWorth = ok(false, { error: e?.message }); }

  try {
    const count = await prisma.netWorthSnapshot.count().catch(()=>null);
    checks.snapshots = ok(count !== null, { count });
  } catch (e: any) { checks.snapshots = ok(false, { error: e?.message }); }

  return NextResponse.json({ env, checks });
}