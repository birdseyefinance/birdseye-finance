import { NextResponse } from "next/server";
import { getUsdPrice } from "@/lib/prices";
export const runtime = "nodejs";

export async function GET(_: Request, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;
  const url = `https://blockstream.info/api/address/${address}`;
  const j = await fetch(url, { cache: "no-store" }).then(r => r.json()).catch(() => null);

  const funded = j?.chain_stats?.funded_txo_sum ?? 0;
  const spent  = j?.chain_stats?.spent_txo_sum ?? 0;
  const sats   = funded - spent;
  const btc    = sats / 1e8;
  const price  = await getUsdPrice("bitcoin");
  return NextResponse.json({ address, sats, btc, usd: btc * price });
}