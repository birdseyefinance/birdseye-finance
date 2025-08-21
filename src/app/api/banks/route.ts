import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { plaid } from "@/lib/plaid";
const prisma = new PrismaClient();
const USER_ID = "demo-user-1";

export async function GET() {
  const conns = await prisma.connection.findMany({
    where: { userId: USER_ID, kind: "plaid" },
    select: { id: true, providerId: true, metadata: true }
  });

  const items: any[] = [];
  for (const c of conns) {
    const access_token = (c.metadata as any)?.access_token as string | undefined;
    if (!access_token) continue;

    const { data } = await plaid.accountsGet({ access_token });
    // Map DB account rows for cross-ref (optional)
    const dbAccts = await prisma.account.findMany({
      where: { connectionId: c.id },
      select: { id: true, referenceId: true }
    });
    const byRef = new Map(dbAccts.map(a => [a.referenceId || "", a.id]));
    items.push({
      connectionId: c.id,
      item_id: c.providerId,
      accounts: data.accounts.map(a => ({
        account_id: a.account_id,
        db_account_id: byRef.get(a.account_id) || null,
        name: a.name || a.official_name || a.mask || a.subtype,
        type: a.type, subtype: a.subtype,
        balances: a.balances,
        mask: a.mask,
        verification_status: a.verification_status || null
      }))
    });
  }

  return NextResponse.json({ items });
}