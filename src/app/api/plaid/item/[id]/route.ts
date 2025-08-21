import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { plaid } from "@/lib/plaid";
const prisma = new PrismaClient();
const USER_ID = "demo-user-1";

export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  const connectionId = ctx.params.id;

  const conn = await prisma.connection.findFirst({
    where: { id: connectionId, userId: USER_ID, kind: "plaid" }
  });
  if (!conn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access_token = (conn.metadata as any)?.access_token as string | undefined;
  if (access_token) {
    try { await plaid.itemRemove({ access_token }); } catch { /* ignore sandbox hiccups */ }
  }

  // Remove dependent data then the connection
  await prisma.transaction.deleteMany({ where: { connectionId } });
  await prisma.account.deleteMany({ where: { connectionId } });
  await prisma.connection.delete({ where: { id: connectionId } });

  return NextResponse.json({ ok: true });
}