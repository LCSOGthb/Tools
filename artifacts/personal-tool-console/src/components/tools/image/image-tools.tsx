import { useMemo, useRef, useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { Field, NumInput, SelectInput, ToggleInput, OutBox, PrimaryButton, GhostButton } from "@/components/tools/shared/fields";

function readImageFile(file: File): Promise<HTMLImageElement> {
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

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function FileDrop({ onFile, accentLabel }: { onFile: (f: File) => void; accentLabel?: string }) {
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    onFile(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
      onClick={() => inputRef.current?.click()}
      className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition ${drag ? "border-ring bg-ring/10" : "border-border bg-black/40 hover:border-ring/50"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      {preview ? (
        <img src={preview} alt="preview" className="max-h-44 max-w-full rounded-xl object-contain shadow" />
      ) : (
        <>
          <div className="text-3xl">⬆️</div>
          <div className="text-sm text-muted-foreground">
            Drag &amp; drop an image here, or <span className="text-ring underline">{accentLabel ?? "browse"}</span>
          </div>
        </>
      )}
    </div>
  );
}

function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState("Percent");
  const [percent, setPercent] = useState(50);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lock, setLock] = useState(true);
  const [result, setResult] = useState<string | null>(null);

  const load = async (f: File) => {
    setError(null);
    try {
      const i = await readImageFile(f);
      setFile(f);
      setImg(i);
      setWidth(i.naturalWidth);
      setHeight(i.naturalHeight);
    } catch (e) { setError((e as Error).message); }
  };

  const targetW = mode === "Percent" ? Math.max(1, Math.round((img?.naturalWidth ?? 1) * percent / 100)) : Math.max(1, width);
  const targetH = mode === "Percent" ? Math.max(1, Math.round((img?.naturalHeight ?? 1) * percent / 100)) : Math.max(1, height);

  const apply = () => {
    if (!img) return;
    const c = document.createElement("canvas");
    const scale = Math.min(targetW / img.naturalWidth, targetH / img.naturalHeight);
    const dw = Math.max(1, Math.round(img.naturalWidth * scale));
    const dh = Math.max(1, Math.round(img.naturalHeight * scale));
    c.width = targetW;
    c.height = targetH;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, (targetW - dw) / 2, (targetH - dh) / 2, dw, dh);
    setResult(c.toDataURL("image/png"));
  };

  return (
    <div className="grid gap-4">
      <FileDrop onFile={load} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {img && (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <p className="mb-3 text-xs text-muted-foreground">
            Original: {img.naturalWidth} × {img.naturalHeight}px
          </p>
          <div className="grid gap-4">
            <div className="max-w-xs"><SelectInput value={mode} onChange={(e) => setMode(e.target.value)} options={["Percent", "Exact px"]} /></div>
            {mode === "Percent" ? (
              <div>
                <Field label={`Scale: ${percent}%`}>
                  <input type="range" min={1} max={100} value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="w-full" />
                </Field>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
                <Field label="Width (px)"><NumInput value={width} min={1} onChange={(e) => { const w = Number(e.target.value); setWidth(w); if (lock && img) setHeight(Math.max(1, Math.round(w * img.naturalHeight / img.naturalWidth))); }} /></Field>
                <Field label="Height (px)"><NumInput value={height} min={1} onChange={(e) => { const h = Number(e.target.value); setHeight(h); if (lock && img) setWidth(Math.max(1, Math.round(h * img.naturalWidth / img.naturalHeight))); }} /></Field>
                <div className="sm:pt-6"><ToggleInput label="Lock ratio" checked={lock} onChange={setLock} /></div>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton onClick={apply}>Apply</PrimaryButton>
          </div>
        </div>
      )}
      {result && (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <img src={result} alt="resized" className="max-h-80 rounded-xl object-contain" />
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton onClick={() => triggerDownload(result, "resized.png")}>Download PNG</PrimaryButton>
            <GhostButton onClick={() => { const c = document.createElement("canvas"); c.width = targetW; c.height = targetH; const ctx = c.getContext("2d"); if (ctx && img) { const scale = Math.min(targetW / img.naturalWidth, targetH / img.naturalHeight); const dw = Math.max(1, Math.round(img.naturalWidth * scale)); const dh = Math.max(1, Math.round(img.naturalHeight * scale)); ctx.drawImage(img, (targetW - dw) / 2, (targetH - dh) / 2, dw, dh); triggerDownload(c.toDataURL("image/jpeg", 0.92), "resized.jpg"); } }}>Download JPEG (.92)</GhostButton>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageFilters() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [hue, setHue] = useState(0);
  const [blur, setBlur] = useState(0);
  const [invert, setInvert] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const load = async (f: File) => {
    setError(null);
    try {
      const i = await readImageFile(f);
      setFile(f);
      setImg(i);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(f));
    } catch (e) { setError((e as Error).message); }
  };

  const cssFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) grayscale(${grayscale}%) sepia(${sepia}%) hue-rotate(${hue}deg) blur(${blur}px) invert(${invert}%)`;

  const reset = () => { setBrightness(100); setContrast(100); setSaturate(100); setGrayscale(0); setSepia(0); setHue(0); setBlur(0); setInvert(0); };

  const download = () => {
    if (!img) return;
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.filter = cssFilter;
    ctx.drawImage(img, 0, 0);
    triggerDownload(c.toDataURL("image/png"), "filtered.png");
  };

  const slider = (label: string, value: number, min: number, max: number, fn: (v: number) => void) => (
    <div>
      <Field label={`${label}: ${value}${label === "Blur" ? "px" : label === "Hue" ? "°" : "%"}`}>
        <input type="range" min={min} max={max} value={value} onChange={(e) => fn(Number(e.target.value))} className="w-full" />
      </Field>
    </div>
  );

  return (
    <div className="grid gap-4">
      <FileDrop onFile={load} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {img && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <img src={previewUrl ?? ""} alt="preview" style={{ filter: cssFilter }} className="max-h-96 w-full rounded-xl object-contain" />
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="grid gap-3">
              {slider("Brightness", brightness, 50, 150, setBrightness)}
              {slider("Contrast", contrast, 50, 150, setContrast)}
              {slider("Saturate", saturate, 0, 200, setSaturate)}
              {slider("Grayscale", grayscale, 0, 100, setGrayscale)}
              {slider("Sepia", sepia, 0, 100, setSepia)}
              {slider("Hue", hue, 0, 360, setHue)}
              {slider("Blur", blur, 0, 8, setBlur)}
              {slider("Invert", invert, 0, 100, setInvert)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <GhostButton onClick={reset}>Reset</GhostButton>
              <PrimaryButton onClick={download}>Download Filtered</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function ImageAvgColor() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avg, setAvg] = useState<{ hex: string; rgb: string } | null>(null);
  const [grid, setGrid] = useState<[number, number, number][] | null>(null);

  const load = async (f: File) => {
    setError(null);
    try {
      const i = await readImageFile(f);
      setImg(i);
      const c = document.createElement("canvas");
      c.width = 1; c.height = 1;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(i, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      setAvg({ hex: rgbToHex(r, g, b), rgb: `rgb(${r}, ${g}, ${b})` });
      const gc = document.createElement("canvas");
      gc.width = 8; gc.height = 8;
      const gctx = gc.getContext("2d");
      if (!gctx) return;
      gctx.drawImage(i, 0, 0, 8, 8);
      const data = gctx.getImageData(0, 0, 8, 8).data;
      const cells: [number, number, number][] = [];
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const idx = (y * 8 + x) * 4;
          cells.push([data[idx], data[idx + 1], data[idx + 2]]);
        }
      }
      setGrid(cells);
    } catch (e) { setError((e as Error).message); }
  };

  const copy = async (v: string) => { try { await navigator.clipboard.writeText(v); } catch { /* ignore */ } };

  return (
    <div className="grid gap-4">
      <FileDrop onFile={load} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {avg && (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="h-28 w-28 rounded-2xl border border-border shadow" style={{ background: avg.hex }} />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl">{avg.hex}</span>
                <GhostButton onClick={() => copy(avg.hex)}>Copy</GhostButton>
              </div>
              <p className="text-sm text-muted-foreground">{avg.rgb}</p>
            </div>
          </div>
          {grid && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-muted-foreground">8 × 8 color grid</p>
              <div className="grid w-fit grid-cols-8 overflow-hidden rounded-xl border border-border">
                {grid.map(([r, g, b], i) => (
                  <div key={i} className="h-8 w-8" style={{ background: `rgb(${r}, ${g}, ${b})` }} title={rgbToHex(r, g, b)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ImageColorPicker() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ hex: string; rgb: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mag, setMag] = useState<{ x: number; y: number; color: [number, number, number] } | null>(null);

  const load = async (f: File) => {
    setError(null);
    try {
      const i = await readImageFile(f);
      setImg(i);
      setPicked(null);
      requestAnimationFrame(() => draw(i));
    } catch (e) { setError((e as Error).message); }
  };

  const draw = (source: HTMLImageElement) => {
    const c = canvasRef.current;
    if (!c) return;
    const scale = Math.min(1, 600 / source.naturalWidth);
    c.width = Math.round(source.naturalWidth * scale);
    c.height = Math.round(source.naturalHeight * scale);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(source, 0, 0, c.width, c.height);
  };

  const drawMag = (x: number, y: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const region = ctx.getImageData(Math.max(0, x - 10), Math.max(0, y - 10), Math.min(20, c.width - x + 10), Math.min(20, c.height - y + 10));
    setMag({ x, y, color: [region.data[0], region.data[1], region.data[2]] });
  };

  const sample = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (c.width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (c.height / rect.height));
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const d = ctx.getImageData(Math.min(x, c.width - 1), Math.min(y, c.height - 1), 1, 1).data;
    const hex = rgbToHex(d[0], d[1], d[2]);
    const rgb = `rgb(${d[0]}, ${d[1]}, ${d[2]})`;
    setPicked({ hex, rgb });
    drawMag(x, y);
  };

  const copy = async (v: string) => { try { await navigator.clipboard.writeText(v); } catch { /* ignore */ } };

  return (
    <div className="grid gap-4">
      <FileDrop onFile={load} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {img && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <canvas ref={canvasRef} onMouseMove={sample} onClick={sample} className="w-full rounded-xl" style={{ aspectRatio: `${img.naturalWidth}/${img.naturalHeight}`, maxHeight: 500, objectFit: "contain" }} />
            <p className="mt-2 text-xs text-muted-foreground">Move to sample, click to lock.</p>
          </div>
          <div className="space-y-4">
            {mag && (
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <p className="mb-2 text-xs text-muted-foreground">Magnifier</p>
                <canvas width={100} height={100} className="rounded-xl" ref={(el) => {
                  if (el) {
                    const ctx = el.getContext("2d");
                    if (!ctx) return;
                    ctx.imageSmoothingEnabled = false;
                    ctx.fillStyle = `rgb(${mag.color.join(",")})`;
                    ctx.fillRect(0, 0, 100, 100);
                  }
                }} />
                <p className="mt-2 font-mono text-sm">{mag.color.join(", ")}</p>
              </div>
            )}
            {picked && (
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-20 w-20 rounded-xl border border-border" style={{ background: picked.hex }} />
                  <div className="space-y-1">
                    <p className="font-mono text-lg">{picked.hex}</p>
                    <p className="text-sm text-muted-foreground">{picked.rgb}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <GhostButton onClick={() => copy(picked.hex)}>Copy HEX</GhostButton>
                  <GhostButton onClick={() => copy(picked.rgb)}>Copy RGB</GhostButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildBlobPath(points: number, seed: number): string {
  const rand = mulberry32(seed);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const radius = 0.55 + rand() * 0.45;
    pts.push({ x: 200 + Math.cos(angle) * 200 * radius, y: 200 + Math.sin(angle) * 200 * radius });
  }
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < points; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % points];
    const mid = { x: (cur.x + next.x) / 2, y: (cur.y + next.y) / 2 };
    d += ` Q ${cur.x.toFixed(2)} ${cur.y.toFixed(2)} ${mid.x.toFixed(2)} ${mid.y.toFixed(2)}`;
  }
  d += " Z";
  return d;
}

function SvgBlobGenerator() {
  const [seed, setSeed] = useState(1234);
  const [points, setPoints] = useState("8");
  const [fill, setFill] = useState("#6366f1");
  const [opacity, setOpacity] = useState(80);
  const [count, setCount] = useState(0);

  const path = useMemo(() => buildBlobPath(Number(points), seed + count), [points, seed, count]);
  const snippet = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">\n  <path d="${path}" fill="${fill}" fill-opacity="${(opacity / 100).toFixed(2)}" />\n</svg>`;
  const rawPath = `<path d="${path}" fill="${fill}" fill-opacity="${(opacity / 100).toFixed(2)}" />`;

  const download = () => {
    const blob = new Blob([snippet], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blob.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Seed"><NumInput value={seed} min={0} max={9999} onChange={(e) => setSeed(Number(e.target.value) || 0)} /></Field>
          <Field label="Points"><SelectInput value={points} onChange={(e) => setPoints(e.target.value)} options={["6", "8", "10"]} /></Field>
          <Field label="Fill color"><input type="color" value={fill} onChange={(e) => setFill(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background" /></Field>
          <Field label={`Opacity: ${opacity}%`}><input type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full" /></Field>
        </div>
        <div className="mt-4">
          <PrimaryButton onClick={() => setCount((c) => c + 1)}>Regenerate</PrimaryButton>
        </div>
        <div className="mt-4 rounded-2xl border border-border bg-black/40 p-4">
          <svg viewBox="0 0 400 400" className="mx-auto h-64 w-64">
            <path d={path} fill={fill} fillOpacity={opacity / 100} />
          </svg>
        </div>
      </div>
      <OutBox value={`${rawPath}\n\n${snippet}`} mono downloadable filename="blob.svg" />
      <div className="flex gap-2">
        <PrimaryButton onClick={download}>Download .svg</PrimaryButton>
      </div>
    </div>
  );
}

function SvgPatternGenerator() {
  const [shape, setShape] = useState("dots");
  const [size, setSize] = useState(30);
  const [colorA, setColorA] = useState("#6366f1");
  const [colorB, setColorB] = useState("transparent");
  const [opacity, setOpacity] = useState(80);

  const patternId = "patt";
  const o = opacity / 100;

  const shapeMarkup = () => {
    const c = size / 2;
    const r = Math.max(1.5, size / 8);
    const stroke = Math.max(1, size / 12);
    switch (shape) {
      case "dots": return `<circle cx="${c.toFixed(1)}" cy="${c.toFixed(1)}" r="${r.toFixed(1)}" fill="${colorA}" fill-opacity="${o}"/>`;
      case "lines": return `<line x1="0" y1="${c.toFixed(1)}" x2="${size}" y2="${c.toFixed(1)}" stroke="${colorA}" stroke-opacity="${o}" stroke-width="${stroke.toFixed(1)}"/>`;
      case "grid": return `<path d="M ${c.toFixed(1)} 0 V ${size} M 0 ${c.toFixed(1)} H ${size}" stroke="${colorA}" stroke-opacity="${o}" stroke-width="${stroke.toFixed(1)}" fill="none"/>`;
      case "diamonds": return `<polygon points="${c.toFixed(1)},${(size * 0.1).toFixed(1)} ${(size * 0.9).toFixed(1)},${c.toFixed(1)} ${c.toFixed(1)},${(size * 0.9).toFixed(1)} ${(size * 0.1).toFixed(1)},${c.toFixed(1)}" fill="${colorA}" fill-opacity="${o}"/>`;
      case "net": return `<path d="M 0 0 L ${size} ${size} M 0 ${size} L ${size} 0" stroke="${colorA}" stroke-opacity="${o}" stroke-width="${stroke.toFixed(1)}"/>`;
      default: return "";
    }
  };

  const backgroundAttrs = colorB && colorB !== "transparent" ? `\n  <rect width="${size}" height="${size}" fill="${colorB}"/>` : "";

  const snippet = `<svg width="260" height="260" viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">\n  <defs>\n    <pattern id="${patternId}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">${backgroundAttrs}\n      ${shapeMarkup()}\n    </pattern>\n  </defs>\n  <rect width="260" height="260" fill="url(#${patternId})"/>\n</svg>`;

  const download = () => {
    const blob = new Blob([snippet], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pattern.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Shape"><SelectInput value={shape} onChange={(e) => setShape(e.target.value)} options={["dots", "lines", "grid", "diamonds", "net"]} /></Field>
          <Field label={`Tile size: ${size}px`}><input type="range" min={10} max={60} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full" /></Field>
          <Field label="Color A"><input type="color" value={colorA} onChange={(e) => setColorA(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background" /></Field>
          <Field label="Color B (background)"><input type="color" value={colorB} onChange={(e) => setColorB(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background" /></Field>
          <Field label={`Opacity: ${opacity}%`}><input type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full" /></Field>
        </div>
        <div className="mt-4 rounded-2xl border border-border bg-black/40 p-4">
          <svg width="260" height="260" viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="patt" width={size} height={size} patternUnits="userSpaceOnUse">
                {colorB && colorB !== "transparent" && <rect width={size} height={size} fill={colorB} />}
                {shape === "dots" && <circle cx={size / 2} cy={size / 2} r={Math.max(1.5, size / 8)} fill={colorA} fillOpacity={o} />}
                {shape === "lines" && <line x1={0} y1={size / 2} x2={size} y2={size / 2} stroke={colorA} strokeOpacity={o} strokeWidth={Math.max(1, size / 12)} />}
                {shape === "grid" && <path d={`M ${size / 2} 0 V ${size} M 0 ${size / 2} H ${size}`} stroke={colorA} strokeOpacity={o} strokeWidth={Math.max(1, size / 12)} fill="none" />}
                {shape === "diamonds" && <polygon points={`${size / 2},${size * 0.1} ${size * 0.9},${size / 2} ${size / 2},${size * 0.9} ${size * 0.1},${size / 2}`} fill={colorA} fillOpacity={o} />}
                {shape === "net" && <path d={`M 0 0 L ${size} ${size} M 0 ${size} L ${size} 0`} stroke={colorA} strokeOpacity={o} strokeWidth={Math.max(1, size / 12)} />}
              </pattern>
            </defs>
            <rect width="260" height="260" fill="url(#patt)" />
          </svg>
        </div>
      </div>
      <OutBox value={snippet} mono downloadable filename="pattern.svg" />
      <div className="flex gap-2">
        <PrimaryButton onClick={download}>Download .svg</PrimaryButton>
      </div>
    </div>
  );
}

function ImageToBase64() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState("Data URL");
  const [mime, setMime] = useState(true);
  const [raw, setRaw] = useState<string | null>(null);

  const load = async (f: File) => {
    setError(null);
    try {
      const text = await f.arrayBuffer();
      const bytes = new Uint8Array(text);
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
      }
      setFile(f);
      setRaw(btoa(binary));
    } catch (e) { setError((e as Error).message); }
  };

  const result = useMemo<string>(() => {
    if (!raw) return "";
    if (format === "Raw base64") return raw;
    return mime ? `data:${file?.type || "image/*"};base64,${raw}` : raw;
  }, [raw, format, mime, file]);

  const encoded = result ?? "";
  const sizeRatio = file && file.size > 0 ? (encoded.length / file.size * 100).toFixed(1) : "0";

  return (
    <div className="grid gap-4">
      <FileDrop onFile={load} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {file && (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Format"><SelectInput value={format} onChange={(e) => setFormat(e.target.value)} options={["Data URL", "Raw base64"]} /></Field>
            <div className="sm:pt-6"><ToggleInput label="Include MIME prefix" checked={mime} onChange={setMime} disabled={format === "Raw base64"} /></div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Source: {(file.size / 1024).toFixed(1)} KB &nbsp;·&nbsp; Encoded: {(encoded.length / 1024).toFixed(1)} KB ({sizeRatio}%)
          </p>
        </div>
      )}
      {result && (
        <div>
          <OutBox value={result} mono downloadable filename="image.txt" />
          {result.length > 4000 && <p className="mt-1 text-xs text-muted-foreground">Preview truncated in the box — full string is copied/downloaded.</p>}
        </div>
      )}
    </div>
  );
}

export default function ImageTools({ tool }: ToolPageProps) {
  switch (tool.slug) {
    case "image-resizer": return <ImageResizer />;
    case "image-filters": return <ImageFilters />;
    case "image-avg-color": return <ImageAvgColor />;
    case "image-color-picker": return <ImageColorPicker />;
    case "svg-blob-generator": return <SvgBlobGenerator />;
    case "svg-pattern-generator": return <SvgPatternGenerator />;
    case "image-to-base64": return <ImageToBase64 />;
    default: return <div className="text-sm text-muted-foreground">Unknown tool</div>;
  }
}
