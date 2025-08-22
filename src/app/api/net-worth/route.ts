import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { plaid } from "@/lib/plaid";
import { extractAccessToken } from "@/lib/crypto";
export const runtime = "nodejs";

const USER_ID = "demo-user-1";

async function banksTotalUSD() {
  let total = 0;
  try {
    const conns = await prisma.connection.findMany({
      where: { userId: USER_ID, kind: "plaid" },
      select: { metadata: true }
    });
    for (const c of conns) {
      const access = extractAccessToken(c.metadata);
      if (!access) continue;
      const { data } = await plaid.accountsGet({ access_token: access });
      for (const a of data.accounts) {
        const cur = a.balances?.current ?? 0;
        const t = a.type;
        // treat liabilities as negative
        if (t === "credit" || t === "loan") total -= cur; else total += cur;
      }
    }
  } catch {}
  return total;
}

async function walletsTotalUSD(baseUrl: string) {
  let total = 0;
  let count = 0;
  try {
    const ws = await prisma.wallet.findMany({
      where: { userId: USER_ID },
      select: { kind: true, providerId: true }
    });
    count = ws.length;
    for (const w of ws) {
      const ep =
        w.kind === "evm"    ? `/api/evm/${w.providerId}/balances` :
        w.kind === "solana" ? `/api/solana/${w.providerId}/balances` :
        w.kind === "btc"    ? `/api/btc/${w.providerId}/balances` : null;
      if (!ep) continue;
      const j = await fetch(baseUrl + ep).then(r => r.json()).catch(() => null);
      if (j?.usd) total += Number(j.usd) || 0;
    }
  } catch {}
  return { total, count };
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || "3001"}`;
  const [banksUSD, wallets] = await Promise.all([banksTotalUSD(), walletsTotalUSD(base)]);
  const net = banksUSD + wallets.total;
  return NextResponse.json({
    totals: { banksUSD, walletsUSD: wallets.total, netWorthUSD: net },
    counts: { wallets: wallets.count }
  });
}