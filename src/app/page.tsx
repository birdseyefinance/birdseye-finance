import NetWorthTile from "@/components/NetWorthTile";

export default function Home() {
  return (
    <div className="space-y-6">
      <NetWorthTile />

      <div className="grid gap-4 md:grid-cols-2">
        <a href="/link-bank" className="rounded-xl border bg-white p-4 hover:shadow">
          <h2 className="font-medium mb-1">Link a bank</h2>
          <p className="text-sm text-gray-600">Connect a Plaid sandbox bank to pull balances and transactions.</p>
        </a>
        <a href="/wallets" className="rounded-xl border bg-white p-4 hover:shadow">
          <h2 className="font-medium mb-1">Add wallets</h2>
          <p className="text-sm text-gray-600">Track ETH, SOL, and BTC balances by address.</p>
        </a>
        <a href="/banks" className="rounded-xl border bg-white p-4 hover:shadow">
          <h2 className="font-medium mb-1">Banks overview</h2>
          <p className="text-sm text-gray-600">See linked Items and per-account balances.</p>
        </a>
        <a href="/transactions" className="rounded-xl border bg-white p-4 hover:shadow">
          <h2 className="font-medium mb-1">Transactions</h2>
          <p className="text-sm text-gray-600">Recent activity with CSV export.</p>
        </a>
      </div>
    </div>
  );
}