import { useState, type ReactNode } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import {
  runSpeedTest,
  downloadQuality,
  uploadQuality,
  pingQuality,
  type SpeedTestResult,
  type SpeedProgress,
} from "@/lib/tools/speed-test";
import { PrimaryButton } from "@/components/tools/shared/fields";
import { Terminal, Download, Upload, Zap } from "lucide-react";

function MetricCard({
  title,
  value,
  quality,
  icon,
}: {
  title: string;
  value: string;
  quality: { label: string; color: string };
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
        {icon}
        {title}
      </div>
      <div className="font-mono text-3xl text-foreground">
        {value}
        <span className="ml-1 text-sm text-muted-foreground">Mbps</span>
      </div>
      <div className={`mt-1 text-sm font-medium ${quality.color}`}>
        {quality.label}
      </div>
    </div>
  );
}

export default function SpeedTestPage({ tool }: ToolPageProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SpeedTestResult | null>(null);
  const [status, setStatus] = useState("");

  const run = async () => {
    setRunning(true);
    setResult(null);
    setStatus("Starting…");
    try {
      const onProgress = (s: SpeedProgress) => {
        if (s.message) setStatus(s.message);
      };
      const res = await runSpeedTest(onProgress);
      setResult(res);
      setStatus(res.message);
    } catch (e) {
      setStatus((e as Error).message || "Test failed");
    } finally {
      setRunning(false);
    }
  };

  const dl = downloadQuality(result?.downloadMbps ?? "—");
  const ul = uploadQuality(result?.uploadMbps ?? "—");
  const ping = pingQuality(result?.pingMs ?? "—");

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <span>
              {status ||
                "Ready — press Run to measure download, upload and ping."}
            </span>
          </div>
          <PrimaryButton onClick={run} disabled={running}>
            {running ? "Running…" : "Run speed test"}
          </PrimaryButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          title="Download"
          value={result?.downloadMbps ?? "—"}
          quality={dl}
          icon={<Download className="h-3.5 w-3.5 text-cyan-400" />}
        />
        <MetricCard
          title="Upload"
          value={result?.uploadMbps ?? "—"}
          quality={ul}
          icon={<Upload className="h-3.5 w-3.5 text-green-400" />}
        />
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Ping
          </div>
          <div className="font-mono text-3xl text-foreground">
            {result?.pingMs ?? "—"}
            <span className="ml-1 text-sm text-muted-foreground">ms</span>
          </div>
          <div className={`mt-1 text-sm font-medium ${ping.color}`}>
            {ping.label}
          </div>
        </div>
      </div>

      <p className="rounded-xl border border-dashed border-border bg-black/30 p-3 text-xs text-muted-foreground">
        Results are a rough estimate. Upload runs against the app's API
        endpoint; download and ping hit speed.cloudflare.com. Large transfers
        may vary with network conditions.
      </p>
    </div>
  );
}
