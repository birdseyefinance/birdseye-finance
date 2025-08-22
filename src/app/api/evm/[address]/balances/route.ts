import { NextResponse } from "next/server";
import { getUsdPrice } from "@/lib/prices";
export const runtime = "nodejs";

function hexToDecimal(hex: string) { return parseInt(hex, 16); }

export async function GET(_: Request, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;

  const ALCH = process.env.ALCHEMY_API_KEY!;
  if (!ALCH) return NextResponse.json({ error: "Missing ALCHEMY_API_KEY" }, { status: 500 });

  const url = `https://eth-mainnet.g.alchemy.com/v2/${ALCH}`;
  const ethBalance = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] }),
    cache: "no-store",
  }).then(r => r.json());

  const wei = hexToDecimal(ethBalance.result || "0x0");
  const eth = wei / 1e18;
  const price = await getUsdPrice("ethereum");
  return NextResponse.json({ address, wei, eth, usd: eth * price });
}