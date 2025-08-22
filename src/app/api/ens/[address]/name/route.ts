import { NextResponse } from "next/server";
export const runtime = "nodejs";

/** Minimal ENS reverse lookup using a public resolver API. */
export async function GET(_: Request, ctx: { params: Promise<{ address: string }> }) {
  const { address: addr } = await ctx.params;

  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
    return NextResponse.json({ address: addr, name: null }, { status: 400 });
  }

  const j = await fetch(`https://api.ensideas.com/ens/resolve/${addr}`, { cache: "no-store" })
    .then(r => r.json()).catch(() => null);

  return NextResponse.json({ address: addr, name: j?.name ?? null, avatar: j?.avatar ?? null });
}