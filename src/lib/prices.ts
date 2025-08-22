type CacheEntry<T> = { value: T; expires: number };
const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL = 60_000; // 60s

function getCached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  if (hit) cache.delete(key);
  return null;
}
function setCached<T>(key: string, value: T, ttl = DEFAULT_TTL) {
  cache.set(key, { value, expires: Date.now() + ttl });
}
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Helper: fetch JSON with optional CoinGecko API key
async function cgFetch(url: string) {
  const key = process.env.COINGECKO_API_KEY;
  const withParam = key ? (url + (url.includes("?") ? "&" : "?") + `x_cg_demo_api_key=${encodeURIComponent(key)}`) : url;
  const res = await fetch(withParam, {
    headers: key ? { "x-cg-demo-api-key": key } as any : undefined,
    // no-cache here; we do our own caching
  });
  // If rate limited or error, return empty object
  if (!res.ok) return {};
  return res.json().catch(() => ({}));
}

/** Native coin price, e.g. "ethereum", "solana" */
export async function getUsdPrice(id: string): Promise<number> {
  const key = `cg:price:${id}`;
  const hit = getCached<number>(key);
  if (hit != null) return hit;
  const json: any = await cgFetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`);
  const usd = json?.[id]?.usd ?? 0;
  setCached(key, usd || 0, usd ? DEFAULT_TTL : 120_000); // cache zeros a bit longer to avoid hammering
  return usd || 0;
}

/** ERC-20 prices by contract on Ethereum (lowercased keys) */
export async function getUsdPricesErc20(contracts: string[]): Promise<Record<string, number>> {
  const uniq = Array.from(new Set(contracts.map(a => a.toLowerCase())));
  const out: Record<string, number> = {};
  const toFetch: string[] = [];

  for (const c of uniq) {
    const k = `cg:erc20:${c}`;
    const hit = getCached<number>(k);
    if (hit != null) out[c] = hit; else toFetch.push(c);
  }
  for (const batch of chunk(toFetch, 100)) {
    const json: any = await cgFetch(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${batch.join(",")}&vs_currencies=usd`
    );
    for (const [addr, obj] of Object.entries(json || {})) {
      const usd = (obj as any)?.usd ?? 0;
      const key = addr.toLowerCase();
      out[key] = usd || 0;
      setCached(`cg:erc20:${key}`, usd || 0, usd ? DEFAULT_TTL : 120_000);
    }
    for (const addr of batch) {
      const key = addr.toLowerCase();
      if (!(key in out)) setCached(`cg:erc20:${key}`, 0, 120_000);
    }
  }
  return out;
}

/** SPL token prices by mint on Solana (lowercased keys) */
export async function getUsdPricesSpl(mints: string[]): Promise<Record<string, number>> {
  const uniq = Array.from(new Set(mints.map(m => m.toLowerCase())));
  const out: Record<string, number> = {};
  const toFetch: string[] = [];

  for (const m of uniq) {
    const k = `cg:spl:${m}`;
    const hit = getCached<number>(k);
    if (hit != null) out[m] = hit; else toFetch.push(m);
  }
  for (const batch of chunk(toFetch, 100)) {
    const json: any = await cgFetch(
      `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${batch.join(",")}&vs_currencies=usd`
    );
    for (const [mint, obj] of Object.entries(json || {})) {
      const usd = (obj as any)?.usd ?? 0;
      const key = mint.toLowerCase();
      out[key] = usd || 0;
      setCached(`cg:spl:${key}`, usd || 0, usd ? DEFAULT_TTL : 120_000);
    }
    for (const mint of batch) {
      const key = mint.toLowerCase();
      if (!(key in out)) setCached(`cg:spl:${key}`, 0, 120_000);
    }
  }
  return out;
}