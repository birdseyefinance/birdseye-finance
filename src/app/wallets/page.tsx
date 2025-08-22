"use client";
import useSWR from "swr";
import { useState } from "react";

type Wallet = { id: string; kind: "evm" | "solana" | "btc" | "tron"; providerId: string; label?: string };
type Bal = { usd?: number, [k: string]: any };

const fetcher = (u:string)=>fetch(u).then(r=>r.json());

const apiFor = (w: Wallet) => {
  if (w.kind === "evm")    return `/api/evm/${w.providerId}/balances`;
  if (w.kind === "solana") return `/api/solana/${w.providerId}/balances`;
  if (w.kind === "btc")    return `/api/btc/${w.providerId}/balances`;
  return null; // tron not wired yet
};

export default function Wallets() {
  const { data, isLoading, mutate } = useSWR<{wallets: Wallet[]}>("/api/wallets", fetcher);
  const wallets = data?.wallets ?? [];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Wallets</h1>
        <button onClick={()=>mutate()} className="px-3 py-2 rounded-xl bg-black text-white">Refresh list</button>
      </header>

      <AddWalletForm onAdded={mutate} />

      {isLoading ? <p>Loading wallets…</p> :
        <div className="grid gap-4 md:grid-cols-2">
          {wallets.map((w) => <WalletRow key={w.id} w={w} onDeleted={mutate} />)}
          {wallets.length === 0 && <p className="text-sm text-gray-600">No wallets yet. Add one above.</p>}
        </div>
      }
    </div>
  );
}

function WalletRow({ w, onDeleted }: { w: Wallet, onDeleted: ()=>void }) {
  const url = apiFor(w);
  const { data, isLoading, mutate } = useSWR<Bal>(url ?? "", url ? (u)=>fetch(u).then(r=>r.json()) : null);

  // ENS reverse for EVM
  const { data: ens } = useSWR<{ name?: string }>(
    w.kind === "evm" ? `/api/ens/${w.providerId}/name` : null,
    (u)=>fetch(u).then(r=>r.json())
  );

  async function remove() {
    await fetch(`/api/wallets/${w.id}`, { method: "DELETE" });
    onDeleted();
  }

  const nice = w.kind === "evm" && ens?.name ? ens.name : (w.label || w.providerId);
  const usd = data?.usd ?? 0;

  return (
    <div className="rounded-xl border bg-white p-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-xs text-gray-500 uppercase tracking-wide">{w.kind}</div>
        <div className="font-medium break-all">{nice}</div>
        <div className="text-sm text-gray-600">{isLoading ? "Fetching…" : `$${usd.toLocaleString(undefined,{maximumFractionDigits:2})}`}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={()=>mutate()} className="px-3 py-2 rounded-lg border">Refresh</button>
        <button onClick={remove} className="px-3 py-2 rounded-lg border text-red-600">Remove</button>
      </div>
    </div>
  );
}

function AddWalletForm({ onAdded }: { onAdded: ()=>void }) {
  const [kind, setKind] = useState<Wallet["kind"]>("evm");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!address.trim()) { setErr("Address is required"); return; }

    // Minimal client-side validation
    if (kind === "evm" && !/^0x[0-9a-fA-F]{40}$/.test(address.trim())) {
      setErr("EVM address must be 0x + 40 hex chars"); return;
    }
    if (kind === "solana" && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address.trim())) {
      setErr("Solana address looks invalid"); return;
    }
    if (kind === "btc" && address.length < 26) {
      setErr("BTC address looks too short"); return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, providerId: address.trim(), label: label.trim() || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      setAddress(""); setLabel("");
      onAdded();
    } catch (e:any) {
      setErr(e.message || "Failed to add wallet");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white p-4 space-y-3">
      <div className="flex flex-wrap gap-3">
        <select value={kind} onChange={e=>setKind(e.target.value as any)} className="border rounded-lg px-3 py-2">
          <option value="evm">EVM (Ethereum)</option>
          <option value="solana">Solana</option>
          <option value="btc">Bitcoin</option>
          <option value="tron" disabled>Tron (coming soon)</option>
        </select>
        <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Address" className="border rounded-lg px-3 py-2 flex-1 min-w-[280px]" />
        <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Optional label" className="border rounded-lg px-3 py-2 flex-1 min-w-[200px]" />
        <button disabled={busy} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">Add</button>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <p className="text-xs text-gray-500">Tip: EVM addresses show their ENS name automatically if one exists.</p>
    </form>
  );
}