import { NextResponse } from "next/server";
import { getUsdPrice } from "@/lib/prices";
export const runtime = "nodejs";

export async function GET(_: Request, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;
  const HELIUS = process.env.HELIUS_API_KEY;
  if (!HELIUS) return NextResponse.json({ error: "Missing HELIUS_API_KEY" }, { status: 500 });

  const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS}`;
  const body = { jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] };
  const j = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" })
    .then(r => r.json()).catch(() => null);

  const lamports = j?.result?.value ?? 0;
  const sol = lamports / 1e9;
  const price = await getUsdPrice("solana");
  return NextResponse.json({ address, lamports, sol, usd: sol * price });
}