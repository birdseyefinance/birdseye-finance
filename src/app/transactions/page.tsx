"use client";
import useSWR from "swr";
const fetcher = (u:string)=>fetch(u).then(r=>r.json());

export default function Transactions() {
  const { data, isLoading, mutate } = useSWR("/api/transactions/recent", fetcher);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions (Recent)</h1>
        <div className="flex gap-2">
          <a href="/api/plaid/transactions/export" className="px-3 py-2 rounded-xl bg-white border">Download CSV</a>
          <button onClick={()=>mutate()} className="px-3 py-2 rounded-xl bg-black text-white">Refresh</button>
        </div>
      </div>
      {isLoading ? <p>Loading…</p> :
        <div className="rounded-xl border bg-white p-3">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-600">
              <th className="py-2">Date</th><th>Name</th><th className="text-right">Amount</th><th>Category</th>
            </tr></thead>
            <tbody>
              {data?.transactions?.map((t:any)=>(
                <tr key={t.transaction_id} className="border-t">
                  <td className="py-2">{t.date}</td>
                  <td>{t.name}</td>
                  <td className="text-right">{t.amount?.toLocaleString?.() ?? t.amount}</td>
                  <td className="text-gray-500">{t.category?.join(" > ")}</td>
                </tr>
              ))}
              {!data?.transactions?.length && <tr><td colSpan={4} className="py-4 text-gray-500">No transactions</td></tr>}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}