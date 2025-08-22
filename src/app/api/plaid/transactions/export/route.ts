import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { plaid } from "@/lib/plaid";
import { extractAccessToken } from "@/lib/crypto";
export const runtime = "nodejs";

const prisma = new PrismaClient();
const USER_ID = "demo-user-1";

function csvEscape(v: any) {
  const s = (v ?? "").toString();
  if (s.includes('"') || s.includes(',') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  const start_date = start.toISOString().slice(0,10);
  const end_date = end.toISOString().slice(0,10);

  const conns = await prisma.connection.findMany({ where: { userId: USER_ID, kind: "plaid" }, select: { metadata: true } });
  let rows: any[] = [];

  for (const c of conns) {
    const access = extractAccessToken(c.metadata);
    if (!access) continue;

    // page through transactions (Plaid default limit is 100)
    let cursor: string | null = null;
    const pageSize = 100;
    while (true) {
      const { data } = await plaid.transactionsGet({
        access_token: access,
        start_date,
        end_date,
        options: { count: pageSize, offset: rows.length }
      });

      rows.push(...data.transactions.map(t => ({
        date: t.date,
        name: t.name,
        merchant_name: t.merchant_name,
        amount: t.amount,
        iso_currency_code: t.iso_currency_code,
        pending: t.pending,
        account_id: t.account_id,
        category: t.category?.join(" > "),
        payment_channel: t.payment_channel
      })));

      if (data.total_transactions <= rows.length) break;
      // else loop with next offset
    }
  }

  const header = ["date","name","merchant_name","amount","iso_currency_code","pending","account_id","category","payment_channel"];
  const csv = [header.join(",")]
    .concat(rows.map(r => header.map(h => csvEscape((r as any)[h])).join(",")))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions-${end_date}.csv"`
    }
  });
}