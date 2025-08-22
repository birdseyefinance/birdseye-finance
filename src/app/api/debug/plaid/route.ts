import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    env: process.env.PLAID_ENV,
    hasClientId: !!process.env.PLAID_CLIENT_ID,
    hasSecret: !!process.env.PLAID_SECRET,
    products: process.env.PLAID_PRODUCTS ?? "transactions",
    hasRedirectUri: !!process.env.PLAID_REDIRECT_URI,
  });
}