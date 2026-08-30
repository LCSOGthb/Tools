export interface SpeedTestResult {
  downloadMbps: string;
  uploadMbps: string;
  pingMs: string;
  message: string;
}

export type SpeedProgress = {
  running: boolean;
  dl: string | null;
  ul: string | null;
  ping: string | null;
  message?: string;
};

export async function runSpeedTest(onProgress: (s: SpeedProgress) => void): Promise<SpeedTestResult> {
  const pingUrl = 'https://speed.cloudflare.com/__down?bytes=0';
  const downloadUrl = 'https://speed.cloudflare.com/__down?bytes=5000000';
  const uploadUrl = '/api/upload-test';

  onProgress({ running: true, dl: null, ul: null, ping: null, message: 'Testing ping…' });

  let pingMs = '—';
  let dlMbps = '—';
  let ulMbps = '—';

  try {
    const pingTimes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      await fetch(pingUrl, { cache: 'no-store' });
      pingTimes.push(performance.now() - t0);
    }
    pingTimes.sort((a, b) => a - b);
    const avg = pingTimes.slice(0, 4).reduce((s, v) => s + v, 0) / 4;
    pingMs = avg.toFixed(0);
    onProgress({ running: true, dl: null, ul: null, ping: pingMs, message: `Ping ${pingMs} ms — testing download…` });
  } catch {
    onProgress({ running: true, dl: null, ul: null, ping: '—', message: 'Ping failed — testing download…' });
  }

  try {
    const dlStart = performance.now();
    const res = await fetch(downloadUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Streaming not supported');
    let loaded = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      loaded += value.byteLength;
    }
    const dlSec = (performance.now() - dlStart) / 1000;
    dlMbps = ((loaded * 8) / dlSec / 1_000_000).toFixed(2);
    onProgress({ running: true, dl: dlMbps, ul: null, ping: pingMs, message: `↓ ${dlMbps} Mbps — testing upload…` });
  } catch {
    onProgress({ running: true, dl: '—', ul: null, ping: pingMs, message: 'Download failed — testing upload…' });
  }

  let ulError = '';
  try {
    const payload = JSON.stringify({ d: Array.from({ length: 2000 }, () => Math.random().toString(36)).join('') });
    const byteCount = new TextEncoder().encode(payload).byteLength;
    await fetch(uploadUrl, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' } });
    const ROUNDS = 12;
    let totalBytes = 0;
    const ulStart = performance.now();
    for (let i = 0; i < ROUNDS; i++) {
      const res = await fetch(uploadUrl, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      totalBytes += byteCount;
    }
    const ulSec = (performance.now() - ulStart) / 1000;
    ulMbps = ((totalBytes * 8) / ulSec / 1_000_000).toFixed(2);
  } catch (e) {
    ulError = (e as Error).message;
    ulMbps = '—';
  }

  const message = ulError ? `Upload failed: ${ulError}` : 'Test complete';
  onProgress({ running: false, dl: dlMbps, ul: ulMbps, ping: pingMs, message });
  return { downloadMbps: dlMbps, uploadMbps: ulMbps, pingMs, message };
}

export function downloadQuality(mbps: string) {
  const v = parseFloat(mbps);
  if (isNaN(v)) return { label: '—', color: 'text-slate-400' };
  if (v >= 100) return { label: 'Excellent', color: 'text-cyan-400' };
  if (v >= 25) return { label: 'Good', color: 'text-green-400' };
  if (v >= 5) return { label: 'Fair', color: 'text-amber-400' };
  return { label: 'Poor', color: 'text-red-400' };
}

export function uploadQuality(mbps: string) {
  const v = parseFloat(mbps);
  if (isNaN(v)) return { label: '—', color: 'text-slate-400' };
  if (v >= 50) return { label: 'Excellent', color: 'text-cyan-400' };
  if (v >= 10) return { label: 'Good', color: 'text-green-400' };
  if (v >= 2) return { label: 'Fair', color: 'text-amber-400' };
  return { label: 'Poor', color: 'text-red-400' };
}

export function pingQuality(ms: string) {
  const v = parseFloat(ms);
  if (isNaN(v)) return { label: '—', color: 'text-slate-400' };
  if (v < 20) return { label: 'Excellent', color: 'text-cyan-400' };
  if (v < 50) return { label: 'Good', color: 'text-green-400' };
  if (v < 100) return { label: 'Fair', color: 'text-amber-400' };
  return { label: 'Poor', color: 'text-red-400' };
}
