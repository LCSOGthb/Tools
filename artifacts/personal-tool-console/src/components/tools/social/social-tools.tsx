import { useEffect, useMemo, useRef, useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
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

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function copyText(text: string) {
  try {
    navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

async function readFileAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image file"));
    };
    img.src = url;
  });
}

function copyRow({ value, fallback }: { value: string; fallback?: string }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-black/40 p-3">
      <div
        className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm text-foreground"
        style={fallback ? { minHeight: 20 } : undefined}
      >
        {value}
      </div>
      <button
        onClick={doCopy}
        className="shrink-0 rounded-lg border border-border bg-background/80 px-2.5 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function OgMetaGenerator() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [type, setType] = useState("website");
  const [siteName, setSiteName] = useState("");

  const meta = useMemo(() => {
    const lines: string[] = [];
    if (title) lines.push(`<meta property="og:title" content="${title}" />`);
    if (description)
      lines.push(`<meta property="og:description" content="${description}" />`);
    if (url) lines.push(`<meta property="og:url" content="${url}" />`);
    if (image) lines.push(`<meta property="og:image" content="${image}" />`);
    lines.push(`<meta property="og:type" content="${type}" />`);
    if (siteName)
      lines.push(`<meta property="og:site_name" content="${siteName}" />`);
    const twitter: string[] = [
      `<meta name="twitter:card" content="summary_large_image" />`,
    ];
    if (title) twitter.push(`<meta name="twitter:title" content="${title}" />`);
    if (description)
      twitter.push(
        `<meta name="twitter:description" content="${description}" />`,
      );
    if (image) twitter.push(`<meta name="twitter:image" content="${image}" />`);
    return [...lines, "", ...twitter].join("\n");
  }, [url, title, description, image, type, siteName]);

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-4">
          <Field label="URL">
            <TextInput
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
            />
          </Field>
          <Field label="Title" hint={`${title.length}/60 characters`}>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            />
          </Field>
          <Field
            label="Description"
            hint={`${description.length}/155 characters`}
          >
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 155))}
            />
          </Field>
          <Field label="Image URL">
            <TextInput
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/og.png"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <SelectInput
                value={type}
                onChange={(e) => setType(e.target.value)}
                options={["website", "article"]}
              />
            </Field>
            <Field label="Site name">
              <TextInput
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </div>
      {(title || image || url) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Preview</p>
            <div className="max-w-sm overflow-hidden rounded-2xl border border-border bg-black/40">
              {image && (
                <img
                  src={image}
                  alt="og"
                  className="aspect-[1.91/1] w-full object-cover"
                />
              )}
              <div className="p-3">
                <p className="truncate text-xs text-muted-foreground">
                  {url.replace(/^https?:\/\//, "")}
                </p>
                <p className="mt-1 truncate text-base font-semibold text-foreground">
                  {title || "Title preview"}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {description || "Description preview"}
                </p>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Meta tags</p>
            <OutBox value={meta} mono downloadable filename="og-meta.txt" />
          </div>
        </div>
      )}
    </div>
  );
}

function CustomTwitterCard() {
  const [card, setCard] = useState("summary_large_image");
  const [site, setSite] = useState("");
  const [creator, setCreator] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  const meta = useMemo(
    () =>
      [
        `<meta name="twitter:card" content="${card}" />`,
        site && `<meta name="twitter:site" content="${site}" />`,
        creator && `<meta name="twitter:creator" content="${creator}" />`,
        title && `<meta name="twitter:title" content="${title}" />`,
        description &&
          `<meta name="twitter:description" content="${description}" />`,
        image && `<meta name="twitter:image" content="${image}" />`,
      ]
        .filter(Boolean)
        .join("\n"),
    [card, site, creator, title, description, image],
  );

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Card type">
              <SelectInput
                value={card}
                onChange={(e) => setCard(e.target.value)}
                options={["summary", "summary_large_image"]}
              />
            </Field>
            <Field label="@site">
              <TextInput
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="@handle"
              />
            </Field>
            <Field label="@creator">
              <TextInput
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="@handle"
              />
            </Field>
          </div>
          <Field label="Title" hint={`${title.length}/70`}>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 70))}
            />
          </Field>
          <Field label="Description" hint={`${description.length}/200`}>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
            />
          </Field>
          <Field label="Image URL">
            <TextInput
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </Field>
        </div>
      </div>
      {(title || image) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Preview</p>
            <div className="overflow-hidden rounded-2xl border border-border bg-black/40">
              {image && card === "summary_large_image" && (
                <img
                  src={image}
                  alt="card"
                  className="aspect-[2/1] w-full object-cover"
                />
              )}
              <div className="flex items-start gap-3 p-3">
                {image && card === "summary" && (
                  <img
                    src={image}
                    alt="card"
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {site || "@yourhandle"}
                  </p>
                  <p className="mt-1 truncate text-base font-semibold text-foreground">
                    {title || "Title preview"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {description || "Description preview"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Twitter meta tags
            </p>
            <OutBox
              value={meta}
              mono
              downloadable
              filename="twitter-meta.txt"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function extractYtId(input: string): string | null {
  if (/^[\w-]{11}$/.test(input.trim())) return input.trim();
  const m = input.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function YoutubeThumbnail() {
  const [input, setInput] = useState("");
  const [w, setW] = useState(1200);
  const [h, setH] = useState(675);
  const id = extractYtId(input);

  const sizes = [
    { name: "maxresdefault", label: "Max (1280×720)", w: 1280, h: 720 },
    { name: "hqdefault", label: "High (480×360)", w: 480, h: 360 },
    { name: "mqdefault", label: "Medium (320×180)", w: 320, h: 180 },
    { name: "sddefault", label: "SD (640×480)", w: 640, h: 480 },
    { name: "default", label: "Default (120×90)", w: 120, h: 90 },
  ];

  const embed = id
    ? `<iframe width="${w}" height="${h}" src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    : "";

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <Field
          label="Video URL or ID"
          hint="https://youtube.com/watch?v=... , youtu.be/..., or 11-char ID"
        >
          <TextInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://youtu.be/dQw4w9WgXcQ"
          />
        </Field>
        {id && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Embed width">
              <NumInput
                value={w}
                min={100}
                onChange={(e) => setW(Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Embed height">
              <NumInput
                value={h}
                min={100}
                onChange={(e) => setH(Number(e.target.value) || 0)}
              />
            </Field>
          </div>
        )}
      </div>
      {id && (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Video ID: <span className="font-mono text-foreground">{id}</span>
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sizes.map((s) => {
                const u = `https://i.ytimg.com/vi/${id}/${s.name}.jpg`;
                return (
                  <div
                    key={s.name}
                    className="overflow-hidden rounded-xl border border-border bg-black/40"
                  >
                    <img src={u} alt={s.name} className="w-full" />
                    <div className="flex items-center justify-between p-2">
                      <div className="text-xs">
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-muted-foreground">
                          {s.w}×{s.h}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <a
                          href={u}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Open
                        </a>
                        <button
                          onClick={() => copyText(u)}
                          className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Embed code</p>
            <OutBox
              value={embed}
              mono
              downloadable
              filename="youtube-embed.txt"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function VimeoThumbnail() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<{
    thumbnail: string;
    title: string;
    width: number;
    height: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cache = useRef<
    Record<
      string,
      { thumbnail: string; title: string; width: number; height: number }
    >
  >({});

  const fetchThumb = async () => {
    if (!input.trim()) return;
    const norm = input.trim();
    if (cache.current[norm]) {
      setData(cache.current[norm]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "https://vimeo.com/api/oembed.json?url=" + encodeURIComponent(norm),
      );
      if (!res.ok) throw new Error("Network error or invalid video ID");
      const j = await res.json();
      const d = {
        thumbnail: j.thumbnail_url ?? "",
        title: j.title ?? "",
        width: j.width ?? 1280,
        height: j.height ?? 720,
      };
      cache.current[norm] = d;
      setData(d);
    } catch (e) {
      setError((e as Error).message || "Could not fetch Vimeo thumbnail");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const sizes = useMemo(() => {
    if (!data?.thumbnail)
      return [
        {
          name: "thumbnail_url",
          w: `${data?.width ?? ""}`,
          h: `${data?.height ?? ""}`,
          url: data?.thumbnail ?? "",
        },
      ];
    const list: { name: string; w: string; h: string; url: string }[] = [];
    const t = data.thumbnail;
    const dims: [string, string][] = [
      ["640", "360"],
      ["200", "150"],
      ["295", "166"],
    ];
    dims.forEach(([w, h]) => {
      const re = new RegExp(`/\\d+x\\d+/`);
      if (re.test(t))
        list.push({
          name: `${w}x${h}`,
          w,
          h,
          url: t.replace(re, `/${w}x${h}/`),
        });
    });
    if (list.length === 0)
      list.push({
        name: "thumbnail_url",
        w: `${data.width}`,
        h: `${data.height}`,
        url: t,
      });
    return list;
  }, [data]);

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <Field label="Vimeo video URL" hint="https://vimeo.com/123456789">
          <TextInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://vimeo.com/76979871"
          />
        </Field>
        <div className="mt-3">
          <PrimaryButton onClick={fetchThumb} disabled={loading}>
            {loading ? "Fetching..." : "Fetch thumbnail"}
          </PrimaryButton>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            {data.thumbnail && (
              <img
                src={data.thumbnail}
                alt="vimeo thumb"
                className="w-full rounded-xl"
              />
            )}
            <p className="mt-3 font-medium text-foreground">{data.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Native size: {data.width}×{data.height}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <p className="mb-3 text-xs text-muted-foreground">
              Available sizes
            </p>
            <div className="space-y-2">
              {sizes.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-xl border border-border bg-black/40 p-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {s.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.w}×{s.h}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Open
                    </a>
                    <button
                      onClick={() => copyText(s.url)}
                      className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function OgImageGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [background, setBackground] = useState("#1e1b4b");
  const [gradient, setGradient] = useState(false);
  const [colorA, setColorA] = useState("#1e1b4b");
  const [colorB, setColorB] = useState("#7c3aed");
  const [title, setTitle] = useState("Your Headline Goes Here");
  const [subtitle, setSubtitle] = useState("A short subtitle");
  const [accent, setAccent] = useState("#f59e0b");
  const [fontSize, setFontSize] = useState("72");
  const [align, setAlign] = useState("center");

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = 1200,
      H = 630;
    c.width = W;
    c.height = H;
    if (gradient) {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, colorA);
      g.addColorStop(1, colorB);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = background;
    }
    ctx.fillRect(0, 0, W, H);

    let tSize = Number(fontSize);
    ctx.font = `800 ${tSize}px system-ui, sans-serif`;
    ctx.textAlign = align === "left" ? "left" : "center";
    ctx.textBaseline = "middle";
    const leftOnly = align === "left";
    const maxW = W - 160;
    let lines = wrapLines(ctx, title, maxW);
    while (lines.length > 2 && tSize > 30) {
      tSize -= 4;
      ctx.font = `800 ${tSize}px system-ui, sans-serif`;
      lines = wrapLines(ctx, title, maxW);
    }
    const lineH = tSize * 1.2;
    const startY = H / 2 - ((lines.length - 1) * lineH) / 2;
    ctx.font = `800 ${tSize}px system-ui, sans-serif`;
    ctx.fillStyle = "#ffffff";
    const tx = leftOnly ? 80 : W / 2;
    lines.forEach((line, i) => ctx.fillText(line, tx, startY + i * lineH));

    ctx.font = "500 34px system-ui, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(
      subtitle,
      tx,
      lines.length > 1
        ? startY + lines.length * lineH - 30
        : startY + lineH * 1.4,
    );

    ctx.fillStyle = accent;
    ctx.fillRect(leftOnly ? 80 : W / 2 - 40, H - 130, 80, 10);
  };

  useEffect(() => {
    draw();
  });

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Title">
            <TextArea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Subtitle">
            <TextInput
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </Field>
          <Field label="Font size">
            <SelectInput
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              options={["48", "56", "64", "72", "80", "90"]}
            />
          </Field>
          <Field label="Alignment">
            <SelectInput
              value={align}
              onChange={(e) => setAlign(e.target.value)}
              options={["center", "left"]}
            />
          </Field>
          <Field label="Accent">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background"
            />
          </Field>
          <div className="sm:pt-6">
            <ToggleInput
              label="Gradient background"
              checked={gradient}
              onChange={setGradient}
            />
          </div>
        </div>
        {gradient && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Gradient color A">
              <input
                type="color"
                value={colorA}
                onChange={(e) => setColorA(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background"
              />
            </Field>
            <Field label="Gradient color B">
              <input
                type="color"
                value={colorB}
                onChange={(e) => setColorB(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background"
              />
            </Field>
          </div>
        )}
        {!gradient && (
          <div className="mt-4 max-w-xs">
            <Field label="Background">
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background"
              />
            </Field>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <canvas
          ref={canvasRef}
          className="w-full rounded-xl"
          style={{ maxWidth: 720, aspectRatio: "1200/630" }}
        />
      </div>
      <div>
        <PrimaryButton
          onClick={() => {
            draw();
            if (canvasRef.current)
              triggerDownload(
                canvasRef.current.toDataURL("image/png"),
                "og-image-1200x630.png",
              );
          }}
        >
          Download PNG 1200×630
        </PrimaryButton>
      </div>
    </div>
  );
}

function QuoteGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState(
    "Simplicity is the ultimate sophistication.",
  );
  const [author, setAuthor] = useState("Leonardo da Vinci");
  const [bg, setBg] = useState("#0f172a");
  const [accent, setAccent] = useState("#f59e0b");
  const [fontSize, setFontSize] = useState("56");
  const [style, setStyle] = useState("minimal");

  const randColor = () =>
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0");

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = 1080;
    c.height = 1080;
    if (style === "gradient") {
      const g = ctx.createLinearGradient(0, 0, 1080, 1080);
      g.addColorStop(0, bg);
      g.addColorStop(1, accent);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, 1080, 1080);

    if (style === "retro") {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 6;
      ctx.strokeRect(60, 60, 1080 - 120, 1080 - 120);
      ctx.strokeRect(80, 80, 1080 - 160, 1080 - 160);
    }

    let tSize = Number(fontSize);
    ctx.font = `700 ${tSize}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let lines = wrapLines(ctx, text, 820);
    while (lines.length > 5 && tSize > 26) {
      tSize -= 3;
      ctx.font = `700 ${tSize}px Georgia, serif`;
      lines = wrapLines(ctx, text, 820);
    }
    const lineH = tSize * 1.35;
    const startY =
      1080 / 2 - ((lines.length - 1) * lineH) / 2 - (author ? 40 : 0);
    ctx.font = `700 ${tSize}px Georgia, serif`;
    ctx.fillStyle = "#ffffff";
    lines.forEach((line, i) => {
      if (style === "quote-mark") {
        const y = startY + i * lineH;
        ctx.fillText(line, 540, y);
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.font = `${tSize * 2.4}px Georgia, serif`;
        ctx.fillText(
          "“",
          540 - ctx.measureText(text).width / 2,
          y - tSize * 1.6,
        );
        ctx.fillStyle = "#ffffff";
        ctx.font = `700 ${tSize}px Georgia, serif`;
      } else {
        ctx.fillText(line, 540, startY + i * lineH);
      }
    });

    if (style === "retro") {
      ctx.fillStyle = accent;
      ctx.font = `600 ${tSize * 0.5}px Georgia, serif`;
    }

    ctx.fillStyle = accent;
    ctx.fillRect(540 - 60, startY + lines.length * lineH + 20, 120, 6);
    if (author) {
      ctx.fillStyle = accent;
      ctx.font = "600 44px Georgia, serif";
      ctx.fillText(`— ${author}`, 540, startY + lines.length * lineH + 120);
    }
  };

  useEffect(() => {
    draw();
  });

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-4">
          <Field label="Quote text">
            <TextArea value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <Field label="Author">
            <TextInput
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Style">
              <SelectInput
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                options={["minimal", "quote-mark", "gradient", "retro frame"]}
              />
            </Field>
            <Field label="Font size">
              <SelectInput
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                options={["40", "48", "56", "64", "72"]}
              />
            </Field>
            <Field label="Backgound">
              <input
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background"
              />
            </Field>
            <Field label="Accent">
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background"
              />
            </Field>
            <div className="sm:pt-6">
              <GhostButton onClick={() => setBg(randColor())}>
                Randomize bg
              </GhostButton>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <canvas
          ref={canvasRef}
          className="w-full rounded-xl"
          style={{ maxWidth: 480, aspectRatio: "1/1" }}
        />
      </div>
      <div>
        <PrimaryButton
          onClick={() => {
            draw();
            if (canvasRef.current)
              triggerDownload(
                canvasRef.current.toDataURL("image/png"),
                "quote-card.png",
              );
          }}
        >
          Download PNG
        </PrimaryButton>
      </div>
    </div>
  );
}

function captionTemplates(topic: string, emoji: boolean) {
  const t = topic.trim() || "your topic";
  const tt = t.charAt(0).toUpperCase() + t.slice(1);
  const e1 = emoji ? " ✨" : "";
  const e2 = emoji ? " 🔥" : "";
  const base = [
    `${tt} — the simple way to make it happen.${e1}`,
    `I was skeptical about ${t} at first... then this changed everything.${e2}`,
    `Save this for later. Everything you need to know about ${t} is right here.`,
    `Question: what's your best ${t} tip? Drop it below 👇`,
  ];
  return base;
}

function buildHashtags(topic: string, count: number): string {
  const words = topic.trim().split(/\s+/).filter(Boolean).slice(0, count);
  if (words.length === 0) return "";
  const tags = [words[0], ...words.slice(1, count)];
  return tags
    .map((w) => "#" + w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .join(" ");
}

function CaptionGenerator() {
  const [topic, setTopic] = useState("");
  const [emoji, setEmoji] = useState(true);
  const [hashtags, setHashtags] = useState(5);
  const [out, setOut] = useState<string[] | null>(null);

  const generate = () => {
    if (!topic.trim()) return;
    const tagLine = buildHashtags(topic, hashtags);
    const caps = captionTemplates(topic, emoji).map((c) =>
      tagLine ? `${c}\n\n${tagLine}` : c,
    );
    setOut(caps);
  };

  const all = out?.join("\n\n---\n\n") ?? "";

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Topic">
            <TextInput
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. morning routine"
            />
          </Field>
          <Field label="Hashtags count (0-10)">
            <NumInput
              value={hashtags}
              min={0}
              max={10}
              onChange={(e) =>
                setHashtags(
                  Math.max(0, Math.min(10, Number(e.target.value) || 0)),
                )
              }
            />
          </Field>
          <div>
            <ToggleInput
              label="Add emoji"
              checked={emoji}
              onChange={setEmoji}
            />
          </div>
        </div>
        <div className="mt-4">
          <PrimaryButton onClick={generate}>Generate</PrimaryButton>
        </div>
      </div>
      {out && (
        <div className="grid gap-4">
          <div className="space-y-2">
            {[...out].map((c, i) => (
              <div key={i}>{copyRow({ value: c })}</div>
            ))}
          </div>
          <div>
            <PrimaryButton onClick={() => copyText(all)}>
              Copy all
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

function bioTemplates(
  platform: string,
  name: string,
  vibe: string,
  emoji: boolean,
) {
  const n = name.trim() || "Your Name";
  const e = emoji ? " ✦" : "";
  const platformTag =
    platform === "Instagram"
      ? "Instagram"
      : platform === "Twitter-X"
        ? "X"
        : platform === "LinkedIn"
          ? "LinkedIn"
          : "TikTok";
  const templates: string[] = [];
  if (vibe === "professional")
    templates.push(
      `${n} · ${platformTag} ${e}\nBuilding things that matter.\nNow hiring → link in bio`,
    );
  if (vibe === "creative")
    templates.push(
      `${n} ${e}\nDesigner · Creator · Dreamer\nTurning ideas into pixels`,
    );
  if (vibe === "playful")
    templates.push(
      `Just ${n} ${e}\nCoffee in one hand, keyboard in the other ✌️\nLet's make cool stuff`,
    );
  if (vibe === "minimal") templates.push(`${n}\n${platformTag}\nlink in bio`);
  if (vibe === "freelancer")
    templates.push(
      `${n} | Freelance ${platformTag} ${e}\nAvailable for projects\nDM for inquiries`,
    );
  if (templates.length === 0)
    templates.push(
      `${n} · ${platformTag} ${e}\nSharing my journey\nFollow for more`,
    );
  return templates;
}

function BioGenerator() {
  const [platform, setPlatform] = useState("Instagram");
  const [name, setName] = useState("");
  const [vibe, setVibe] = useState("creative");
  const [emoji, setEmoji] = useState(true);
  const [out, setOut] = useState<string[] | null>(null);

  const generate = () => {
    setOut(bioTemplates(platform, name, vibe, emoji));
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:items-end">
          <Field label="Platform">
            <SelectInput
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              options={["Instagram", "Twitter-X", "LinkedIn", "TikTok"]}
            />
          </Field>
          <Field label="Name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Vibe">
            <SelectInput
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              options={[
                "professional",
                "creative",
                "playful",
                "minimal",
                "freelancer",
              ]}
            />
          </Field>
          <div>
            <ToggleInput
              label="Add emoji"
              checked={emoji}
              onChange={setEmoji}
            />
          </div>
        </div>
        <div className="mt-4">
          <PrimaryButton onClick={generate}>Generate</PrimaryButton>
        </div>
      </div>
      {out && (
        <div className="space-y-2">
          {out.map((b, i) => {
            const c = b.length <= 150 ? "" : ` (${b.length}/150)`;
            return <div key={i}>{copyRow({ value: b, fallback: c })}</div>;
          })}
        </div>
      )}
    </div>
  );
}

function LinkedinHeaderGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gradient, setGradient] = useState(true);
  const [colorA, setColorA] = useState("#0f172a");
  const [colorB, setColorB] = useState("#1d4ed8");
  const [headline, setHeadline] = useState("Building the future of work");
  const [subline, setSubline] = useState(
    "Design & Engineering · Open to opportunities",
  );
  const [accent, setAccent] = useState("#f59e0b");

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = 1128;
    c.height = 191;
    if (gradient) {
      const g = ctx.createLinearGradient(0, 0, 1128, 0);
      g.addColorStop(0, colorA);
      g.addColorStop(1, colorB);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = colorA;
    }
    ctx.fillRect(0, 0, 1128, 191);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "700 52px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(headline.slice(0, 34), 56, 80);
    ctx.font = "400 30px system-ui, sans-serif";
    ctx.fillStyle = "#dbeafe";
    ctx.fillText(subline.slice(0, 60), 56, 142);
    ctx.fillStyle = accent;
    ctx.fillRect(56, 160, 90, 6);
  };

  useEffect(() => {
    draw();
  });

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Headline">
            <TextInput
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </Field>
          <Field label="Subline">
            <TextInput
              value={subline}
              onChange={(e) => setSubline(e.target.value)}
            />
          </Field>
          <Field label="Accent">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background"
            />
          </Field>
          <div className="sm:pt-6">
            <ToggleInput
              label="Gradient"
              checked={gradient}
              onChange={setGradient}
            />
          </div>
        </div>
        {gradient && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Color A">
              <input
                type="color"
                value={colorA}
                onChange={(e) => setColorA(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background"
              />
            </Field>
            <Field label="Color B">
              <input
                type="color"
                value={colorB}
                onChange={(e) => setColorB(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background"
              />
            </Field>
          </div>
        )}
        {!gradient && (
          <div className="mt-4 max-w-xs">
            <Field label="Background">
              <input
                type="color"
                value={colorA}
                onChange={(e) => setColorA(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background"
              />
            </Field>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <canvas
          ref={canvasRef}
          className="w-full rounded-xl"
          style={{ maxWidth: 560, aspectRatio: "1128/191" }}
        />
      </div>
      <div>
        <PrimaryButton
          onClick={() => {
            draw();
            if (canvasRef.current)
              triggerDownload(
                canvasRef.current.toDataURL("image/png"),
                "linkedin-header-1128x191.png",
              );
          }}
        >
          Download PNG
        </PrimaryButton>
      </div>
    </div>
  );
}

function LinkPreviewGenerator() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [siteName, setSiteName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<
    Record<
      string,
      { title: string; description: string; image: string; siteName: string }
    >
  >({});

  const autoFetch = async () => {
    if (!url.trim()) return;
    const norm = url.trim();
    setLoading(true);
    setError(null);
    try {
      if (cache.current[norm]) {
        const c = cache.current[norm];
        if (!title) setTitle(c.title);
        if (!description) setDescription(c.description);
        if (!image) setImage(c.image);
        if (!siteName) setSiteName(c.siteName);
        setLoading(false);
        return;
      }
      const res = await fetch(
        "https://api.microlink.io/?url=" + encodeURIComponent(norm),
      );
      if (!res.ok) throw new Error("Could not fetch link metadata");
      const j = await res.json();
      const d = j.data ?? {};
      const c = {
        title: d.title ?? title,
        description: d.description ?? description,
        image: d.image?.url ?? image,
        siteName: d.publisher ?? siteName,
      };
      cache.current[norm] = c;
      if (!title) setTitle(c.title);
      if (!description) setDescription(c.description);
      if (!image) setImage(c.image);
      if (!siteName) setSiteName(c.siteName);
    } catch (e) {
      setError((e as Error).message || "Could not fetch link preview");
    } finally {
      setLoading(false);
    }
  };

  const domain =
    (url.match(/^(?:https?:\/\/)?(?:www\.)?([^/]+)/) || [])[1] || "";

  const structured = `Title: ${title || ""}\nDescription: ${description || ""}\nImage: ${image || ""}\nSite name: ${siteName || ""}\nURL: ${url}`;

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-4">
          <Field label="URL">
            <TextInput
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </Field>
          {!title && (
            <PrimaryButton onClick={autoFetch} disabled={loading}>
              {loading ? "Fetching..." : "Auto-fetch from URL"}
            </PrimaryButton>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Field label="Title">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Description">
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Image URL">
            <TextInput
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </Field>
          <Field label="Site name">
            <TextInput
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </Field>
        </div>
      </div>
      {title && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Link card preview
            </p>
            <div className="max-w-md overflow-hidden rounded-2xl border border-border bg-black/40">
              {image && (
                <img
                  src={image}
                  alt="link"
                  className="aspect-[1.91/1] w-full object-cover"
                />
              )}
              <div className="p-3">
                <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
                  {siteName || domain || "example.com"}
                </p>
                <p className="mt-1 truncate font-semibold text-foreground">
                  {title}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Phone shell</p>
            <div className="mx-auto mt-1 max-w-[240px] rounded-[2rem] border-4 border-border bg-black/60 p-3">
              <div className="mb-2 h-2 w-16 rounded-full bg-border/60 mx-auto" />
              {image && (
                <img src={image} alt="link" className="w-full object-cover" />
              )}
              <p className="mt-2 truncate text-sm font-semibold text-foreground">
                {title}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {description}
              </p>
              <p className="mt-1 text-[10px] uppercase text-muted-foreground/70">
                {siteName || domain}
              </p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Structured data
            </p>
            <OutBox
              value={structured}
              mono
              downloadable
              filename="link-preview.txt"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SocialMockup() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [content, setContent] = useState(
    "So excited to share this new project with all of you!",
  );
  const [author, setAuthor] = useState("Jane Doe");
  const [avatarColor, setAvatarColor] = useState("#6366f1");
  const [platform, setPlatform] = useState("X");
  const [likes, setLikes] = useState(128);
  const [reposts, setReposts] = useState(24);

  const avatarInit = (author.trim() || "A").charAt(0).toUpperCase();

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = 800,
      H = 1000;
    c.width = W;
    c.height = H;
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#111827";
    ctx.fillRect(40, 40, W - 80, H - 80);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = avatarColor;
    ctx.beginPath();
    ctx.arc(110, 120, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 44px system-ui, sans-serif";
    ctx.fillText(avatarInit, 110 - ctx.measureText(avatarInit).width / 2, 92);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "700 34px system-ui, sans-serif";
    ctx.fillText((author || "Jane Doe").slice(0, 30), 180, 85);

    ctx.font = "500 28px system-ui, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(
      `@${(author || "jane").toLowerCase().replace(/\s+/g, "")}`,
      180,
      130,
    );

    ctx.fillStyle = "#f59e0b";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText(
      "✓",
      180 + ctx.measureText((author || "Jane Doe").slice(0, 30)).width + 10,
      88,
    );

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "400 34px system-ui, sans-serif";
    const lines = wrapLines(ctx, content, W - 160);
    lines
      .slice(0, 12)
      .forEach((line, i) => ctx.fillText(line, 100, 230 + i * 50));

    const botY = 780;
    const iconColor = "#94a3b8";
    ctx.fillStyle = iconColor;
    ctx.font = "600 28px system-ui, sans-serif";
    const likeLabel =
      platform === "X"
        ? `♥ ${likes}`
        : platform === "Instagram"
          ? `❤ ${likes}`
          : `👍 ${likes}`;
    const repostLabel = platform === "X" ? `↻ ${reposts}` : `🔁 ${reposts}`;
    ctx.fillText(likeLabel, 100, botY);
    ctx.fillText(repostLabel, 320, botY);
    ctx.fillText("💬 14", 540, botY);
  };

  useEffect(() => {
    draw();
  });

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Post content">
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Field>
          <div className="space-y-4">
            <Field label="Author name">
              <TextInput
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Platform">
                <SelectInput
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  options={["X", "Instagram", "Facebook"]}
                />
              </Field>
              <Field label="Avatar color">
                <input
                  type="color"
                  value={avatarColor}
                  onChange={(e) => setAvatarColor(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background"
                />
              </Field>
              <Field label="Likes">
                <NumInput
                  value={likes}
                  min={0}
                  onChange={(e) => setLikes(Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Reposts">
                <NumInput
                  value={reposts}
                  min={0}
                  onChange={(e) => setReposts(Number(e.target.value) || 0)}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <canvas
          ref={canvasRef}
          className="mx-auto rounded-3xl"
          style={{ maxWidth: 360, aspectRatio: "800/1000" }}
        />
      </div>
      <div>
        <PrimaryButton
          onClick={() => {
            draw();
            if (canvasRef.current)
              triggerDownload(
                canvasRef.current.toDataURL("image/png"),
                "social-post.png",
              );
          }}
        >
          Download PNG
        </PrimaryButton>
      </div>
    </div>
  );
}

function titleCandidates(
  kw1: string,
  kw2: string,
  kw3: string,
  topic: string,
  o: { number: boolean; power: boolean; howto: boolean; myth: boolean },
): string[] {
  const keys = [kw1, kw2, kw3].filter(Boolean);
  const k = keys.length ? keys.join(" ") : topic.trim() || "Your Topic";
  const tt = topic.trim() || "Your Topic";
  const list: string[] = [];
  const top = o.number ? "Top 5 " : "";
  if (o.howto) list.push(`How to Master ${tt} in 2026 (Step by Step)`);
  if (o.power) list.push(`You Won't Believe These ${tt} Secrets!`);
  list.push(`${top}${tt} Tips Nobody Tells You`);
  list.push(`The Ultimate Guide to ${tt} for Beginners`);
  list.push(`${tt}: Everything You Need to Know`);
  if (o.myth) list.push(`5 ${tt} Myths, Debunked`);
  if (o.power) list.push(`Stop Wasting Time on ${tt} – Do This Instead`);
  list.push(`${top}${k} Tricks That Actually Work`);
  list.push(`Why ${tt} Matters More Than You Think`);
  return list.slice(0, 8);
}

function YtTitleGenerator() {
  const [kw1, setKw1] = useState("");
  const [kw2, setKw2] = useState("");
  const [kw3, setKw3] = useState("");
  const [topic, setTopic] = useState("");
  const [num, setNum] = useState(true);
  const [power, setPower] = useState(true);
  const [howto, setHowto] = useState(false);
  const [myth, setMyth] = useState(false);
  const [out, setOut] = useState<string[] | null>(null);

  const generate = () => {
    if (kw1.trim() || kw2.trim() || kw3.trim() || topic.trim())
      setOut(
        titleCandidates(kw1, kw2, kw3, topic, {
          number: num,
          power,
          howto,
          myth,
        }),
      );
  };

  const band = (t: string) =>
    t.length < 40 ? "Under 40" : t.length <= 70 ? "40-70" : "Over 70";
  const bandColor = (t: string) =>
    t.length < 40
      ? "bg-green-500/20 text-green-400"
      : t.length <= 70
        ? "bg-amber-500/20 text-amber-400"
        : "bg-red-500/20 text-red-400";

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Keyword 1">
            <TextInput value={kw1} onChange={(e) => setKw1(e.target.value)} />
          </Field>
          <Field label="Keyword 2">
            <TextInput value={kw2} onChange={(e) => setKw2(e.target.value)} />
          </Field>
          <Field label="Keyword 3">
            <TextInput value={kw3} onChange={(e) => setKw3(e.target.value)} />
          </Field>
          <Field label="Topic">
            <TextInput
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <ToggleInput
            label="Numbers (Top 5...)"
            checked={num}
            onChange={setNum}
          />
          <ToggleInput
            label="Power words"
            checked={power}
            onChange={setPower}
          />
          <ToggleInput label="How-to" checked={howto} onChange={setHowto} />
          <ToggleInput label="Myth debunk" checked={myth} onChange={setMyth} />
        </div>
        <div className="mt-4">
          <PrimaryButton onClick={generate}>Generate</PrimaryButton>
        </div>
      </div>
      {out && (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="mb-3 flex gap-2">
            <Chip color="bg-ring/15 text-ring">{out.length} candidates</Chip>
            <Chip color={bandColor("short")}>Length bands</Chip>
          </div>
          <div className="space-y-2">
            {out.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">{copyRow({ value: t })}</div>
                <Chip color={bandColor(t)}>{band(t)}</Chip>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InstagramFilterPreview() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<string | null>(null);
  const [filter, setFilter] = useState("none");
  const [error, setError] = useState<string | null>(null);

  const filters: Record<string, string> = {
    none: "",
    clarendon: "contrast(1.2) saturate(1.3)",
    gingham: "sepia(0.1) contrast(0.9) brightness(1.05)",
    moon: "grayscale(1) contrast(1.1)",
    lark: "saturate(0.8) brightness(1.05) sepia(0.1)",
    reyes: "sepia(0.2) contrast(0.9) brightness(1.05)",
    juno: "saturate(1.4) contrast(1.05)",
    slumber: "saturate(0.7) brightness(0.9) sepia(0.1)",
    crema: "sepia(0.2) contrast(0.9) brightness(1.1)",
    ludwig: "saturate(1.1) contrast(1.05)",
  };

  const load = async (f: File) => {
    setError(null);
    try {
      const i = await readFileAsImage(f);
      setFile(f);
      setImg(i.src);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="grid gap-4">
      <div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) load(f);
          }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = () => {
              const f = input.files?.[0];
              if (f) load(f);
            };
            input.click();
          }}
          className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-black/40 p-6 text-center transition hover:border-ring/50"
        >
          {img ? (
            <img src={img} alt="preview" className="max-h-44 rounded-xl" />
          ) : (
            <p className="text-sm text-muted-foreground">
              Drop a photo or click to browse
            </p>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>
      {img && (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="mx-auto max-w-xs overflow-hidden rounded-xl border border-border">
            <img
              src={img}
              alt="preview"
              className="w-full"
              style={{ filter: filters[filter] }}
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {Object.keys(filters).map((f) => (
              <GhostButton
                key={f}
                className={filter === f ? "border-ring bg-ring/15" : ""}
                onClick={() => setFilter(f)}
              >
                {f}
              </GhostButton>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SocialTools({ tool }: ToolPageProps) {
  switch (tool.slug) {
    case "og-meta-generator":
      return <OgMetaGenerator />;
    case "instagram-filters":
      return <InstagramFilterPreview />;
    case "youtube-thumbnail":
      return <YoutubeThumbnail />;
    case "vimeo-thumbnail":
      return <VimeoThumbnail />;
    case "custom-twitter-card":
      return <CustomTwitterCard />;
    case "og-image-generator":
      return <OgImageGenerator />;
    case "quote-generator":
      return <QuoteGenerator />;
    case "caption-generator":
      return <CaptionGenerator />;
    case "bio-generator":
      return <BioGenerator />;
    case "linkedin-header-generator":
      return <LinkedinHeaderGenerator />;
    case "link-preview-generator":
      return <LinkPreviewGenerator />;
    case "social-mockup":
      return <SocialMockup />;
    case "yt-title-generator":
      return <YtTitleGenerator />;
    default:
      return <div className="text-sm text-muted-foreground">Unknown tool</div>;
  }
}
