"use client";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function Transactions() {
  const [loading, setLoading] = useState(false);
  const { data, mutate, isLoading } = useSWR("/api/transactions/recent?limit=100", fetcher);

  async function syncNow() {
    setLoading(true);
    try {
      await fetch("/api/plaid/transactions/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      await mutate();
      alert("Synced!");
    } catch (e:any) {
      alert("Sync failed: " + String(e));
    } finally {
      setLoading(false);
    }
  }

  const txns = data?.transactions || [];

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <button onClick={syncNow} disabled={loading} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">
          {loading ? "Syncing..." : "Sync now"}
        </button>
      </div>

      <div className="overflow-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Merchant</th>
              <th className="text-right px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Currency</th>
              <th className="text-left px-4 py-2">Pending</th>
              <th className="text-left px-4 py-2">Categories</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-3" colSpan={7}>Loading…</td></tr>
            ) : txns.length === 0 ? (
              <tr><td className="px-4 py-3" colSpan={7}>No transactions yet. Click “Sync now”.</td></tr>
            ) : (
              txns.map((t:any) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-2">{t.postedDate?.slice?.(0,10) || ""}</td>
                  <td className="px-4 py-2">{t.name || ""}</td>
                  <td className="px-4 py-2">{t.merchantName || ""}</td>
                  <td className="px-4 py-2 text-right">{(t.amount >= 0 ? "-" : "+") + "$" + Math.abs(t.amount).toFixed(2)}</td>
                  <td className="px-4 py-2">{t.isoCurrency}</td>
                  <td className="px-4 py-2">{t.pending ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">{Array.isArray(t.categories) ? t.categories.join(" > ") : ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}