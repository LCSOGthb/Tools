import { useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import {
  randomBytes,
  bytesToBase64,
  aesEncrypt,
  aesDecrypt,
  generateAesKey,
  hmacHash,
  decodeJwt,
  generateRandomKey,
  type DecodedJwt,
} from "@/lib/tools/crypto";
import {
  Field,
  TextInput,
  NumInput,
  SelectInput,
  TextArea,
  ToggleInput,
  OutBox,
  PrimaryButton,
  GhostButton,
  Chip,
} from "@/components/tools/shared/fields";

function AesPanel() {
  const [mode, setMode] = useState("AES-GCM");
  const [bits, setBits] = useState("256");
  const [encrypting, setEncrypting] = useState(true);
  const [input, setInput] = useState("");
  const [key, setKey] = useState("");
  const [iv, setIv] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const genKey = () => setKey(generateAesKey(Number(bits), "base64"));
  const genIv = () =>
    setIv(bytesToBase64(randomBytes(mode === "AES-GCM" ? 12 : 16)));

  const run = async () => {
    setError(null);
    setOutput("");
    if (!input.trim() || !key.trim() || !iv.trim()) {
      setError("Text, key, and IV are all required");
      return;
    }
    setBusy(true);
    try {
      const m = mode as "AES-GCM" | "AES-CBC";
      setOutput(
        encrypting
          ? await aesEncrypt(input, key.trim(), iv.trim(), m)
          : await aesDecrypt(input, key.trim(), iv.trim(), m),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mode">
          <SelectInput
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            options={["AES-GCM", "AES-CBC"]}
          />
        </Field>
        <Field label="Key size">
          <SelectInput
            value={bits}
            onChange={(e) => setBits(e.target.value)}
            options={["128", "192", "256"]}
          />
        </Field>
      </div>
      <ToggleInput
        label={encrypting ? "Direction: Encrypt" : "Direction: Decrypt"}
        checked={encrypting}
        onChange={setEncrypting}
      />
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <Field label={encrypting ? "Plaintext" : "Ciphertext (base64)"}>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={
              encrypting ? "Top secret message…" : "base64 ciphertext…"
            }
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Key (base64)">
          <div className="flex gap-2">
            <TextInput
              value={key}
              onChange={(e) => setKey(e.target.value)}
              spellCheck={false}
              placeholder="generated or pasted key"
            />
            <GhostButton type="button" onClick={genKey}>
              Generate
            </GhostButton>
          </div>
        </Field>
        <Field
          label={`IV (base64 · ${mode === "AES-GCM" ? "12" : "16"} bytes)`}
        >
          <div className="flex gap-2">
            <TextInput
              value={iv}
              onChange={(e) => setIv(e.target.value)}
              spellCheck={false}
              placeholder="initialization vector"
            />
            <GhostButton type="button" onClick={genIv}>
              Generate
            </GhostButton>
          </div>
        </Field>
      </div>
      <PrimaryButton type="button" onClick={run} disabled={busy}>
        {busy ? "Working…" : encrypting ? "Encrypt" : "Decrypt"}
      </PrimaryButton>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {output && (
        <OutBox
          value={output}
          mono
          filename={encrypting ? "ciphertext.b64" : "plaintext.txt"}
        />
      )}
      <p className="text-xs text-muted-foreground/70">
        The same key and IV must be used to decrypt. GCM uses a 12-byte IV; CBC
        uses 16 bytes.
      </p>
    </div>
  );
}

function HmacPanel() {
  const [message, setMessage] = useState("");
  const [secret, setSecret] = useState("");
  const [algo, setAlgo] = useState("SHA-256");
  const [hex, setHex] = useState("");
  const [b64, setB64] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const compute = async () => {
    setError(null);
    setHex("");
    setB64("");
    if (!message) {
      setError("Message is required");
      return;
    }
    setBusy(true);
    try {
      const r = await hmacHash(
        message,
        secret,
        algo as "SHA-256" | "SHA-384" | "SHA-512",
      );
      setHex(r.hex);
      setB64(r.base64);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Chip color="bg-amber-500/15 text-amber-400">
        HMAC-MD5 is not supported by the Web Crypto API — SHA-2 only
      </Chip>
      <Field label="Message">
        <TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          spellCheck={false}
          placeholder="Message to sign"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Secret key">
          <TextInput
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            spellCheck={false}
            placeholder="shared secret"
          />
        </Field>
        <Field label="Algorithm">
          <SelectInput
            value={algo}
            onChange={(e) => setAlgo(e.target.value)}
            options={["SHA-256", "SHA-384", "SHA-512"]}
          />
        </Field>
      </div>
      <PrimaryButton type="button" onClick={compute} disabled={busy}>
        {busy ? "Computing…" : "Compute HMAC"}
      </PrimaryButton>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {(hex || b64) && (
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              hex
            </span>
            <OutBox value={hex} mono />
          </div>
          <div className="space-y-1.5">
            <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              base64
            </span>
            <OutBox value={b64} mono />
          </div>
        </div>
      )}
    </div>
  );
}

function JwtPanel() {
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [sig, setSig] = useState<"valid" | "invalid" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const decode = () => {
    setError(null);
    setDecoded(null);
    setSig(null);
    const t = token.trim();
    if (!t) return;
    try {
      setDecoded(decodeJwt(t));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const verify = async () => {
    setError(null);
    setSig(null);
    const parts = token.trim().split(".");
    if (!decoded || parts.length !== 3 || !secret.trim()) return;
    setBusy(true);
    try {
      const r = await hmacHash(`${parts[0]}.${parts[1]}`, secret, "SHA-256");
      const expected = r.base64
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      setSig(expected === parts[2].replace(/=+$/, "") ? "valid" : "invalid");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const exp = decoded?.expired;
  return (
    <div className="grid gap-4">
      <Field label="Token">
        <TextArea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          spellCheck={false}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…"
        />
      </Field>
      <PrimaryButton type="button" onClick={decode}>
        Decode
      </PrimaryButton>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {decoded && (
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              Header
            </span>
            <OutBox value={JSON.stringify(decoded.header, null, 2)} mono />
          </div>
          <div className="space-y-1.5">
            <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              Payload
            </span>
            <OutBox value={JSON.stringify(decoded.payload, null, 2)} mono />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Chip color="bg-blue-500/15 text-blue-400">
              alg {String(decoded.header.alg ?? "?")}
            </Chip>
            <Chip>sig {decoded.signature.slice(0, 18)}…</Chip>
            {decoded.issuedAt && <Chip>iat {decoded.issuedAt}</Chip>}
            {decoded.expiry && <Chip>exp {decoded.expiry}</Chip>}
            {decoded.secondsToExpiry !== undefined && (
              <Chip
                color={
                  exp
                    ? "bg-red-500/15 text-red-400"
                    : "bg-green-500/15 text-green-400"
                }
              >
                {exp
                  ? `expired ${Math.abs(decoded.secondsToExpiry)}s ago`
                  : `expires in ${decoded.secondsToExpiry}s`}
              </Chip>
            )}
            {decoded.expired !== undefined && (
              <Chip
                color={
                  decoded.expired
                    ? "bg-red-500/15 text-red-400"
                    : "bg-green-500/15 text-green-400"
                }
              >
                {decoded.expired ? "expired" : "not expired"}
              </Chip>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field label="Secret (for HMAC-SHA256 signature check)">
              <TextInput
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                spellCheck={false}
                placeholder="verify with this secret"
              />
            </Field>
            <div className="flex items-end gap-2">
              <GhostButton type="button" onClick={verify} disabled={busy}>
                {busy ? "Verifying…" : "Verify signature"}
              </GhostButton>
              {sig && (
                <Chip
                  color={
                    sig === "valid"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-red-500/15 text-red-400"
                  }
                >
                  {sig === "valid" ? "Valid signature" : "Invalid signature"}
                </Chip>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KeyGenPanel() {
  const [bits, setBits] = useState("256");
  const [format, setFormat] = useState("base64");
  const [count, setCount] = useState("3");
  const [keys, setKeys] = useState("");
  const [saltLen, setSaltLen] = useState("16");
  const [saltOut, setSaltOut] = useState("");
  const [error, setError] = useState<string | null>(null);

  const gen = () => {
    setError(null);
    setKeys("");
    try {
      const b = Number(bits) as 128 | 192 | 256 | 512;
      const f = format as "hex" | "base64";
      const c = Math.max(1, Math.min(20, Math.round(Number(count) || 1)));
      setKeys(
        Array.from({ length: c }, () => generateRandomKey(b, f)).join("\n"),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const genSalt = () => {
    setError(null);
    setSaltOut("");
    try {
      const n = Math.max(0, Math.min(256, Math.round(Number(saltLen) || 0)));
      const bytes = randomBytes(n);
      const hex = Array.from(bytes)
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
      setSaltOut(`${n} bytes\nhex:    ${hex}\nbase64: ${bytesToBase64(bytes)}`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Key size (bits)">
          <SelectInput
            value={bits}
            onChange={(e) => setBits(e.target.value)}
            options={["128", "192", "256", "512"]}
          />
        </Field>
        <Field label="Format">
          <SelectInput
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            options={["base64", "hex"]}
          />
        </Field>
        <Field label="Count">
          <NumInput
            value={count}
            onChange={(e) => setCount(e.target.value)}
            min={1}
            max={20}
          />
        </Field>
      </div>
      <PrimaryButton type="button" onClick={gen}>
        Generate keys
      </PrimaryButton>
      {keys && <OutBox value={keys} mono downloadable filename="keys.txt" />}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Field label="Salt / IV length (bytes) — 16 to 256 recommended">
          <NumInput
            value={saltLen}
            onChange={(e) => setSaltLen(e.target.value)}
            min={0}
            max={256}
          />
        </Field>
        <div className="flex items-end">
          <GhostButton type="button" onClick={genSalt}>
            Generate salt
          </GhostButton>
        </div>
      </div>
      {saltOut && (
        <OutBox value={saltOut} mono downloadable filename="salt.txt" />
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}

export default function CryptoTools({ tool }: ToolPageProps) {
  switch (tool.slug) {
    case "aes-cipher":
      return <AesPanel />;
    case "hmac-generator":
      return <HmacPanel />;
    case "jwt-decoder":
      return <JwtPanel />;
    case "crypto-key-gen":
      return <KeyGenPanel />;
    default:
      return null;
  }
}
