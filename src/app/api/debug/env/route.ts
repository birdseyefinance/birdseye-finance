import { NextResponse } from "next/server";

export async function GET() {
  const id = process.env.PLAID_CLIENT_ID || "";
  const sec = process.env.PLAID_SECRET || "";
  return NextResponse.json({
    plaid_env: process.env.PLAID_ENV || null,
    has_client_id: id.length > 4,
    has_secret: sec.length > 4,
  });
}
