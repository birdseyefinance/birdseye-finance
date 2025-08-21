import { NextResponse } from "next/server";
import { plaid } from "@/lib/plaid";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/** Convert Plaid transaction into DB shape */
function txToDb(t: any, connectionId: string) {
  return {
    connectionId,
    plaidItemId: t.item_id ?? null,
    plaidAccountId: t.account_id ?? null,
    plaidTransactionId: t.transaction_id ?? null,
    name: t.name ?? null,
    merchantName: t.merchant_name ?? null,
    // Plaid: positive = money moving out; negative = credit/refund
    amount: t.amount ?? 0,
    isoCurrency: t.iso_currency_code ?? "USD",
    pending: !!t.pending,
    categories: t.category ? JSON.parse(JSON.stringify(t.category)) : undefined,
    authorizedDate: t.authorized_date ? new Date(t.authorized_date) : null,
    postedDate: t.date ? new Date(t.date) : null,
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const itemIdFromReq: string | undefined = body?.itemId;

  // Find Plaid connection
  const where = itemIdFromReq ? { providerId: itemIdFromReq } : { kind: "plaid" as const };
  const conn = await prisma.connection.findFirst({ where });
  if (!conn) return NextResponse.json({ error: "No Plaid connection found" }, { status: 404 });

  let { access_token, cursor } = (conn.metadata as any) || {};
  if (!access_token) return NextResponse.json({ error: "Missing access_token" }, { status: 400 });

  let has_more = true;
  let added: any[] = [], modified: any[] = [], removed: any[] = [];
  while (has_more) {
    const resp = await plaid.transactionsSync({ access_token, cursor: cursor ?? null, count: 500 });
    added.push(...resp.data.added);
    modified.push(...resp.data.modified);
    removed.push(...resp.data.removed);
    has_more = resp.data.has_more;
    cursor = resp.data.next_cursor;
  }

  // Persist cursor
  await prisma.connection.update({
    where: { id: conn.id },
    data: { metadata: { access_token, cursor } },
  });

  // Map Plaid account_id -> local Account.id if present (optional)
  const accounts = await prisma.account.findMany({ where: { connectionId: conn.id }, select: { id: true, referenceId: true } });
  const byPlaidId = new Map(accounts.map(a => [a.referenceId ?? "", a.id]));

  // Upsert added & modified
  for (const t of [...added, ...modified]) {
    const data = txToDb(t, conn.id);
    const accountId = byPlaidId.get(t.account_id ?? "");
    await prisma.transaction.upsert({
      where: { plaidTransactionId: t.transaction_id },
      create: { ...data, accountId: accountId ?? null },
      update: { ...data, accountId: accountId ?? null },
    });
  }

  // Delete removed by plaidTransactionId
  if (removed.length) {
    const ids = removed.map((r: any) => r.transaction_id).filter(Boolean);
    await prisma.transaction.deleteMany({ where: { plaidTransactionId: { in: ids } } });
  }

  return NextResponse.json({
    item_id: conn.providerId,
    counts: { added: added.length, modified: modified.length, removed: removed.length },
  });
}