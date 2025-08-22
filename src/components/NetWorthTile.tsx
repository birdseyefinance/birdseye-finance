"use client";
import useSWR from "swr";

const fetcher = (u:string)=>fetch(u).then(r=>r.json());

export default function NetWorthTile() {
  const { data, isLoading, mutate } = useSWR("/api/net-worth", fetcher, { refreshInterval: 60_000 });
  const t = data?.totals || { banksUSD: 0, walletsUSD: 0, netWorthUSD: 0 };

  return (
    <div className="rounded-2xl border bg-white p-5 flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-600">Net worth</div>
        <div className="text-3xl font-semibold">
          {isLoading ? "Calculating…" : `$${t.netWorthUSD.toLocaleString(undefined,{maximumFractionDigits:2})}`}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Banks ${t.banksUSD.toLocaleString(undefined,{maximumFractionDigits:2})} · Wallets ${t.walletsUSD.toLocaleString(undefined,{maximumFractionDigits:2})}
        </div>
      </div>
      <button onClick={()=>mutate()} className="px-3 py-2 rounded-xl bg-black text-white">Recalc</button>
    </div>
  );
}