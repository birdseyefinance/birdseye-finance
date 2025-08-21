"use client";
import useSWR from "swr";
const fetcher = (u:string)=>fetch(u).then(r=>r.json());

export default function Banks() {
  const { data, mutate, isLoading } = useSWR("/api/banks", fetcher);

  async function sync() {
    const r = await fetch("/api/plaid/accounts/sync", { method: "POST" });
    if (!r.ok) { const j = await r.json(); alert("Sync failed: " + JSON.stringify(j)); return; }
    await mutate();
  }
  async function remove(connectionId: string) {
    if (!confirm("Remove this bank? (This revokes Plaid access)")) return;
    const r = await fetch(`/api/plaid/item/${connectionId}`, { method: "DELETE" });
    if (!r.ok) { const j = await r.json(); alert("Remove failed: " + JSON.stringify(j)); return; }
    await mutate();
  }

  const items = data?.items || [];

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Banks</h1>
        <div className="flex gap-2">
          <a href="/link-bank" className="px-3 py-2 rounded-xl border bg-white">Link new bank</a>
          <button onClick={sync} className="px-3 py-2 rounded-xl bg-black text-white">Sync accounts</button>
        </div>
      </div>

      {isLoading ? <p>Loading…</p> : items.length === 0 ? (
        <p className="text-gray-600">No banks linked yet. Link one on the Link Bank page.</p>
      ) : (
        <div className="space-y-5">
          {items.map((it:any)=>(
            <div key={it.connectionId} className="rounded-xl border bg-white">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div>
                  <div className="font-medium">Item: {it.item_id}</div>
                  <div className="text-sm text-gray-600">Connection: {it.connectionId}</div>
                </div>
                <button onClick={()=>remove(it.connectionId)} className="px-3 py-2 rounded-lg border">Remove bank</button>
              </div>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-2">Name</th>
                      <th className="text-left px-4 py-2">Type</th>
                      <th className="text-left px-4 py-2">Mask</th>
                      <th className="text-right px-4 py-2">Available</th>
                      <th className="text-right px-4 py-2">Current</th>
                      <th className="text-left px-4 py-2">Currency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {it.accounts.map((a:any)=>(
                      <tr key={a.account_id} className="border-t">
                        <td className="px-4 py-2">{a.name}</td>
                        <td className="px-4 py-2">{a.type}/{a.subtype}</td>
                        <td className="px-4 py-2">{a.mask || "-"}</td>
                        <td className="px-4 py-2 text-right">{a.balances?.available ?? "-"}</td>
                        <td className="px-4 py-2 text-right">{a.balances?.current ?? "-"}</td>
                        <td className="px-4 py-2">{a.balances?.iso_currency_code || "USD"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}