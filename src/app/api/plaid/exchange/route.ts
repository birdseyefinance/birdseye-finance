import { NextResponse } from "next/server";
import { plaid } from "@/lib/plaid";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { public_token } = await req.json();

  // 1) Exchange public_token -> access_token + item_id
  const exchange = await plaid.itemPublicTokenExchange({ public_token });
  const access_token = exchange.data.access_token;
  const item_id = exchange.data.item_id;

  // 2) Ensure demo user exists
  await prisma.user.upsert({
    where: { id: "demo-user-1" },
    update: {},
    create: { id: "demo-user-1" },
  });

  // 3) Create the Connection row (stores access_token in metadata)
  const conn = await prisma.connection.create({
    data: {
      userId: "demo-user-1",
      kind: "plaid",
      providerId: item_id,
      label: "Plaid Item",
      metadata: { access_token, cursor: null },
    },
  });

  // 4) Seed the initial Transactions cursor (first sync, may be empty)
  const seed = await plaid.transactionsSync({ access_token, count: 500 });
  const next_cursor = seed.data.next_cursor;

  await prisma.connection.update({
    where: { id: conn.id },
    data: { metadata: { access_token, cursor: next_cursor } },
  });

  return NextResponse.json({ ok: true, item_id });
}
