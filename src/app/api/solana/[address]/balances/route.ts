import { NextResponse } from "next/server";
import { getUsdPrice, getUsdPricesSpl } from "@/lib/prices";
export const runtime = "nodejs";

export async function GET(_: Request, ctx: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await ctx.params;
    const key = process.env.HELIUS_API_KEY!;
    if (!key) return NextResponse.json({ error: "Missing HELIUS_API_KEY" }, { status: 500 });

    const url = `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${key}`;
    const json = await fetch(url).then(r => r.json()).catch(() => ({} as any));

    const lamports = json?.nativeBalance?.lamports ?? 0;
    const sol = (typeof lamports === "number" ? lamports : Number(lamports || 0)) / 1e9;
    const solUsdPrice = await getUsdPrice("solana");
    const nativeUsd = sol * solUsdPrice;

    const list: Array<{ mint: string; amount?: number; decimals?: number; tokenAmount?: { amount: string; decimals: number } }> = json?.tokens || [];
    const normalized = list.map(t => {
      const decimals = typeof t?.decimals === "number" ? t.decimals : (t?.tokenAmount?.decimals ?? 0);
      const amount = typeof t?.amount === "number" ? t.amount :
                     (t?.tokenAmount?.amount ? (Number(t.tokenAmount.amount) / Math.pow(10, decimals)) : 0);
      return { mint: t.mint, amount, decimals };
    }).filter(t => t.mint && t.amount && t.amount > 0);

    const mints = normalized.map(t => t.mint.toLowerCase());
    const prices = await getUsdPricesSpl(mints);

    const tokens = normalized.map(t => ({
      mint: t.mint,
      amount: t.amount!,
      decimals: t.decimals ?? 0,
      usd: t.amount! * (prices[t.mint.toLowerCase()] ?? 0),
    }));

    const tokensUsd = tokens.reduce((a, b) => a + (b.usd || 0), 0);
    const totalUsd = nativeUsd + tokensUsd;

    return NextResponse.json({
      address,
      native: { lamports, sol, usd: nativeUsd },
      tokens,
      totals: { usd: totalUsd, tokensUsd, nativeUsd },
      usd: totalUsd,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Solana route failed" }, { status: 500 });
  }
}