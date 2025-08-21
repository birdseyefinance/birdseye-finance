"use client";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function Wallets() {
  const { data, mutate, isLoading } = useSWR("/api/wallets", fetcher);
  const [kind, setKind] = useState("evm");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");

  async function add() {
    const res = await fetch("/api/wallets", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ kind, address, label })
    });
    const json = await res.json();
    if (!res.ok) { alert("Add failed:\n" + JSON.stringify(json, null, 2)); return; }
    setAddress(""); setLabel("");
    await mutate();
  }

  async function remove(id: string) {
    if (!confirm("Remove this wallet?")) return;
    const res = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
    if (!res.ok) { const j = await res.json(); alert("Delete failed: " + JSON.stringify(j)); return; }
    await mutate();
  }

  const wallets = data?.wallets || [];

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Wallets</h1>
        <a href="/net-worth" className="px-3 py-2 rounded-xl bg-black text-white">Go to Net Worth</a>
      </div>

      <div className="p-4 rounded-xl border bg-white space-y-3">
        <h2 className="font-medium">Add wallet</h2>
        <div className="flex flex-col gap-3 md:flex-row">
          <select className="px-3 py-2 rounded-lg border" value={kind} onChange={e=>setKind(e.target.value)}>
            <option value="evm">Ethereum (EVM)</option>
            <option value="solana">Solana</option>
            <option value="btc">Bitcoin</option>
            <option value="tron">Tron</option>
          </select>
          <input className="flex-1 px-3 py-2 rounded-lg border" placeholder="Address (0x..., Sol, bc1..., TRX...)" value={address} onChange={e=>setAddress(e.target.value)} />
          <input className="flex-1 px-3 py-2 rounded-lg border" placeholder="Label (optional)" value={label} onChange={e=>setLabel(e.target.value)} />
          <button onClick={add} className="px-4 py-2 rounded-xl bg-black text-white">Add</button>
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-white">
        <h2 className="font-medium mb-2">Saved wallets</h2>
        {isLoading ? <p>Loading…</p> : wallets.length === 0 ? <p className="text-gray-600">No wallets yet.</p> :
          <ul className="divide-y">
            {wallets.map((w:any) => (
              <li key={w.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{w.label || w.kind.toUpperCase()}</div>
                  <div className="text-sm text-gray-600">{w.kind.toUpperCase()} · {w.providerId}</div>
                </div>
                <button onClick={()=>remove(w.id)} className="px-3 py-2 rounded-lg border">Remove</button>
              </li>
            ))}
          </ul>
        }
      </div>
    </main>
  );
}