import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { plaid } from "@/lib/plaid";
const prisma = new PrismaClient();

const USER_ID = "demo-user-1";

function mapType(a: any): string {
  const t = a.type, st = a.subtype;
  if (t === "credit") return "credit";
  if (t === "depository") return st === "savings" ? "savings" : st === "checking" ? "checking" : "deposit";
  if (t === "investment") return "brokerage";
  if (t === "loan") return "loan";
  return t || "other";
}

export async function POST() {
  // get all Plaid connections for this user
  const conns = await prisma.connection.findMany({
    where: { userId: USER_ID, kind: "plaid" },
    select: { id: true, metadata: true }
  });
  if (conns.length === 0) return NextResponse.json({ synced: 0, details: [] });

  const details: any[] = [];
  for (const c of conns) {
    const access_token = (c.metadata as any)?.access_token as string | undefined;
    if (!access_token) continue;

    const { data } = await plaid.accountsGet({ access_token });
    let count = 0;
    for (const a of data.accounts) {
      const referenceId = a.account_id;
      const displayName = a.name || a.official_name || a.mask || a.subtype || "Account";
      const accountType = mapType(a);
      const currency = a.balances?.iso_currency_code || "USD";

      const existing = await prisma.account.findFirst({
        where: { userId: USER_ID, connectionId: c.id, referenceId }
      });

      if (existing) {
        await prisma.account.update({
          where: { id: existing.id },
          data: { displayName, accountType, currency }
        });
      } else {
        await prisma.account.create({
          data: {
            userId: USER_ID,
            connectionId: c.id,
            referenceId,
            displayName,
            accountType,
            currency
          }
        });
      }
      count++;
    }
    details.push({ connectionId: c.id, accounts: count });
  }

  return NextResponse.json({ synced: details.reduce((s,d)=>s+d.accounts,0), details });
}