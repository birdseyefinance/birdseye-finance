import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const USER_ID = "demo-user-1";

export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  const row = await prisma.connection.findFirst({
    where: { id, userId: USER_ID, kind: { in: ["evm","solana","btc","tron"] } },
    select: { id: true }
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.connection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}