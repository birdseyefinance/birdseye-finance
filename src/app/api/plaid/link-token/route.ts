import { NextResponse } from "next/server";
import { plaid, plaidProducts } from "@/lib/plaid";

export async function POST() {
  const cfg: any = {
    user: { client_user_id: "demo-user-1" },
    client_name: "BirdsEye MVP",
    products: plaidProducts,
    country_codes: ["US"],
    language: "en",
  };
  if (process.env.PLAID_WEBHOOK_URL) cfg.webhook = process.env.PLAID_WEBHOOK_URL;
  if (process.env.PLAID_REDIRECT_URI) cfg.redirect_uri = process.env.PLAID_REDIRECT_URI;

  const resp = await plaid.linkTokenCreate(cfg);
  return NextResponse.json({ link_token: resp.data.link_token });
}
