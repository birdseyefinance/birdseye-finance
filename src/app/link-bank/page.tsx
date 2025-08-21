"use client";
import useSWR from "swr";
import { usePlaidLink } from "react-plaid-link";

const post = (url: string) => fetch(url, { method: "POST" }).then(r => r.json());

export default function LinkBank() {
  const { data } = useSWR("/api/plaid/link-token", post);
  const onSuccess = async (public_token: string) => {
    await fetch("/api/plaid/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_token }),
    });
    alert("Bank linked in Plaid sandbox!");
  };
  const { open, ready } = usePlaidLink({ token: data?.link_token, onSuccess });

  async function loadAccounts() {
    const res = await fetch("/api/plaid/accounts");
    const json = await res.json();
    alert(JSON.stringify(json.accounts, null, 2));
  }

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Link a bank (Plaid Sandbox)</h1>
      <div className="flex gap-3">
        <button
          onClick={() => open()}
          disabled={!ready}
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
        >
          Link bank
        </button>
        <button
          onClick={loadAccounts}
          className="px-4 py-2 rounded-xl bg-white shadow border"
        >
          Show accounts
        </button>
      </div>
      <p className="text-sm text-gray-600">Use Plaid sandbox test credentials when the widget opens.</p>
    </main>
  );
}
