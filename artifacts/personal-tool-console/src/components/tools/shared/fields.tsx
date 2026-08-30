import {
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { Check, Copy, Download } from "lucide-react";

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      {label && (
        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
          {label}
        </span>
      )}
      {children}
      {hint && (
        <span className="block text-xs text-muted-foreground/60">{hint}</span>
      )}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-ring focus:ring-2 focus:ring-ring/20";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`${inputCls} ${props.className ?? ""}`} />
  );
}

export function NumInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      {...props}
      className={`${inputCls} ${props.className ?? ""}`}
    />
  );
}

export function SelectInput({
  options,
  className = "",
  ...rest
}: { options: string[] } & InputHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={`${inputCls} appearance-none ${className}`}>
      {options.map((o) => (
        <option key={o} value={o} className="bg-background">
          {o}
        </option>
      ))}
    </select>
  );
}

export function ToggleInput({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition ${checked ? "border-ring/60 bg-ring/10 text-foreground" : "border-border bg-background/80 text-muted-foreground"} disabled:opacity-50`}
    >
      <span>{label}</span>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${checked ? "bg-foreground" : "bg-border"}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-background shadow transition ${checked ? "translate-x-4.5" : "translate-x-1"}`}
        />
      </span>
    </button>
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${inputCls} min-h-28 resize-y leading-relaxed ${props.className ?? ""}`}
    />
  );
}

export function OutBox({
  value,
  className = "",
  mono = true,
  downloadable,
  filename,
}: {
  value: string;
  className?: string;
  mono?: boolean;
  downloadable?: boolean;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };
  const download = () => {
    const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename ?? "output.txt";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div
      className={`relative rounded-xl border border-border bg-black/40 ${className}`}
    >
      <div className="absolute right-2.5 top-2.5 z-10 flex gap-1.5">
        {downloadable && (
          <button
            onClick={download}
            title="Download"
            className="rounded-lg border border-border bg-background/80 p-1.5 text-muted-foreground transition hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={copy}
          title="Copy"
          className="rounded-lg border border-border bg-background/80 p-1.5 text-muted-foreground transition hover:text-foreground"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <pre
        className={`max-h-[420px] overflow-auto whitespace-pre-wrap break-words px-4 py-3 pr-24 text-sm leading-relaxed text-foreground ${mono ? "font-mono" : "font-sans"}`}
      >
        {value}
      </pre>
    </div>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm text-foreground transition hover:bg-accent disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function Chip({
  children,
  color = "bg-border/60 text-muted-foreground",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {children}
    </span>
  );
}
