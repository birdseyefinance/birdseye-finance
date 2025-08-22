import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
export const runtime = "nodejs";

const prisma = new PrismaClient();
const USER_ID = "demo-user-1";

export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  await prisma.wallet.deleteMany({ where: { id, userId: USER_ID } });
  return new NextResponse(null, { status: 204 });
}