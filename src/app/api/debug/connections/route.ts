import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  const rows = await prisma.connection.findMany({ select: { id: true, kind: true, providerId: true, metadata: true }});
  return NextResponse.json({ connections: rows });
}
