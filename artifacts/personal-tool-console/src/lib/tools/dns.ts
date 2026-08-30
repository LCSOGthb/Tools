interface DnsRecord { name: string; type: number; TTL: number; data: string; }
interface DnsResponse { Status: number; Answer?: DnsRecord[]; }

export async function dnsLookup(domain: string) {
  const t0 = performance.now();
  const [resA, resAAAA] = await Promise.all([
    fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
      headers: { Accept: 'application/dns-json' },
    }),
    fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=AAAA`, {
      headers: { Accept: 'application/dns-json' },
    }),
  ]);
  const responseMs = Math.round(performance.now() - t0);
  const [dataA, dataAAAA] = await Promise.all([
    resA.json() as Promise<DnsResponse>,
    resAAAA.json() as Promise<DnsResponse>,
  ]);
  const ipv4 = (dataA.Answer ?? []).filter((r) => r.type === 1).map((r) => r.data);
  const ipv6 = (dataAAAA.Answer ?? []).filter((r) => r.type === 28).map((r) => r.data);
  const ttl = dataA.Answer?.[0]?.TTL ?? null;
  const status = dataA.Status === 0 ? 'resolved' : `NXDOMAIN (${dataA.Status})`;
  return { domain, ipv4, ipv6, ttl, responseMs, status };
}
