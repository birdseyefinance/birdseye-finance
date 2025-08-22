import { NextResponse } from "next/server";
import type { LinkTokenCreateRequest } from "plaid";
import { plaid } from "@/lib/plaid";
export const runtime = "nodejs";

const USER_ID = "demo-user-1";

export async function POST() {
  try {
    const products = (process.env.PLAID_PRODUCTS ?? "transactions")
      .split(",").map(s => s.trim()).filter(Boolean);

    const cfg: LinkTokenCreateRequest = {
      user: { client_user_id: USER_ID },
      client_name: "Birdseye Finance",
      products,
      language: "en",
      country_codes: ["US"],
    };

    // Only include redirect_uri if you have it whitelisted in Plaid dashboard
    if (process.env.PLAID_REDIRECT_URI) cfg.redirect_uri = process.env.PLAID_REDIRECT_URI!;
    if (process.env.PLAID_WEBHOOK_URL)  cfg.webhook = process.env.PLAID_WEBHOOK_URL!;

    const resp = await plaid.linkTokenCreate(cfg);
    return NextResponse.json({ link_token: resp.data.link_token });
  } catch (e: any) {
    const detail = e?.response?.data ?? { message: e?.message ?? "Unknown error" };
    // Return details so you can see the exact Plaid error code/type
    return NextResponse.json({ error: "plaid_link_token_create_failed", detail }, { status: 500 });
  }
}
