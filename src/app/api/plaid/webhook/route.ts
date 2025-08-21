import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { plaid } from "@/lib/plaid";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();
  // Minimal logging (beware of PII in real logs)
  // console.log("PLAID WEBHOOK", body);

  // Only act on Transactions delta signal
  if (body?.webhook_type === "TRANSACTIONS" && body?.webhook_code === "SYNC_UPDATES_AVAILABLE") {
    const item_id = body.item_id as string;
    // Find the connection and run a sync immediately
    const conn = await prisma.connection.findFirst({ where: { providerId: item_id } });
    if (conn) {
      let { access_token, cursor } = (conn.metadata as any) || {};
      let has_more = true;
      while (has_more) {
        const resp = await plaid.transactionsSync({ access_token, cursor: cursor ?? null, count: 500 });
        has_more = resp.data.has_more;
        cursor = resp.data.next_cursor;
      }
      await prisma.connection.update({
        where: { id: conn.id },
        data: { metadata: { access_token, cursor } },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
