import { NextResponse } from "next/server";
import { plaid } from "@/lib/plaid";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  const conn = await prisma.connection.findFirst({ where: { kind: "plaid" } });
  if (!conn) return NextResponse.json({ accounts: [] });

  const access_token = (conn.metadata as any).access_token as string;
  const { data } = await plaid.accountsGet({ access_token });
  return NextResponse.json({ accounts: data.accounts });
}
