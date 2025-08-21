import { NextResponse } from "next/server";

function hexToDecimal(hex: string) {
  return parseInt(hex, 16);
}

export async function GET(_: Request, ctx: { params: { address: string } }) {
  const address = ctx.params.address;
  const ALCH = process.env.ALCHEMY_API_KEY!;
  if (!ALCH) return NextResponse.json({ error: "Missing ALCHEMY_API_KEY" }, { status: 500 });

  const url = `https://eth-mainnet.g.alchemy.com/v2/${ALCH}`;

  const ethBalance = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] }),
  }).then(r => r.json());

  const wei = hexToDecimal(ethBalance.result || "0x0");
  const eth = wei / 1e18;

  const price = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd").then(r => r.json());
  const usd = eth * (price?.ethereum?.usd ?? 0);

  return NextResponse.json({ address, wei, eth, usd });
}