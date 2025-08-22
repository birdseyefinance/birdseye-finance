import { NextResponse } from "next/server";
import { getUsdPrice, getUsdPricesErc20 } from "@/lib/prices";
export const runtime = "nodejs";

// Safe hex -> BigInt (handles 0x… and empty/null)
function hexToBigInt(hex?: string | null): bigint {
  try {
    if (!hex) return 0n;
    return BigInt(hex);
  } catch {
    return 0n;
  }
}

export async function GET(_: Request, ctx: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await ctx.params; // Next.js 15: await params
    const ALCH = process.env.ALCHEMY_API_KEY!;
    if (!ALCH) return NextResponse.json({ error: "Missing ALCHEMY_API_KEY" }, { status: 500 });

    const url = `https://eth-mainnet.g.alchemy.com/v2/${ALCH}`;
    const headers = { "Content-Type": "application/json" } as const;

    // --- Native ETH ---
    const ethBalance = await fetch(url, {
      method: "POST", headers,
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] }),
    }).then(r => r.json());

    const wei = hexToBigInt(ethBalance?.result);
    const eth = Number(wei) / 1e18; // ok: magnitude << 1e308, precision is fine for USD calc
    const ethUsdPrice = await getUsdPrice("ethereum");
    const nativeUsd = eth * ethUsdPrice;

    // --- ERC-20s (Alchemy curated default set) ---
    const tokenResp = await fetch(url, {
      method: "POST", headers,
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "alchemy_getTokenBalances", params: [address, "DEFAULT_TOKENS"] }),
    }).then(r => r.json());

    const tokenBalances: Array<{ contractAddress: string; tokenBalance: string }> =
      tokenResp?.result?.tokenBalances || [];

    const nonZero = tokenBalances.filter(t => t.tokenBalance && t.tokenBalance !== "0x0");

    // Fetch token metadata (symbol/decimals)
    const metas = await Promise.all(nonZero.map((t, i) =>
      fetch(url, {
        method: "POST", headers,
        body: JSON.stringify({ jsonrpc: "2.0", id: 1000 + i, method: "alchemy_getTokenMetadata", params: [t.contractAddress] }),
      }).then(r => r.json()).catch(() => ({}))
    ));

    const contracts = nonZero.map(t => t.contractAddress.toLowerCase());
    const priceMap = await getUsdPricesErc20(contracts);

    const tokens = nonZero.map((t, i) => {
      const m = metas[i]?.result || {};
      const decimals: number = typeof m?.decimals === "number" ? m.decimals : 0;
      const symbol: string = m?.symbol || "TKN";
      const name: string = m?.name || t.contractAddress;

      const bal = hexToBigInt(t.tokenBalance);
      const denom = decimals > 0 ? Math.pow(10, decimals) : 1;
      const amount = denom > 0 ? Number(bal) / denom : 0;
      const usd = amount * (priceMap[t.contractAddress.toLowerCase()] ?? 0);

      return { contract: t.contractAddress, symbol, name, decimals, amount, usd };
    }).filter(x => x.amount > 0);

    const tokensUsd = tokens.reduce((a, b) => a + (b.usd || 0), 0);
    const totalUsd = nativeUsd + tokensUsd;

    return NextResponse.json({
      address,
      native: { wei: Number(wei), eth, usd: nativeUsd },
      tokens,
      totals: { usd: totalUsd, tokensUsd, nativeUsd },
      usd: totalUsd, // back-compat
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "EVM route failed" }, { status: 500 });
  }
}