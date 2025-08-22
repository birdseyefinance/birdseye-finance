const cache = new Map<string, { v: number, t: number }>();
const TTL = 60_000; // 60s

export async function getUsdPrice(id: "bitcoin" | "ethereum" | "solana") {
  const now = Date.now();
  const hit = cache.get(id);
  if (hit && now - hit.t < TTL) return hit.v;

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;
  const data = await fetch(url, { next: { revalidate: 60 } }).then(r => r.json());
  const usd = data?.[id]?.usd ?? 0;
  cache.set(id, { v: usd, t: now });
  return usd;
}