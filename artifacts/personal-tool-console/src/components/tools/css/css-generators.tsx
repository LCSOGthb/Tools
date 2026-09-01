import { useMemo, useRef, useState, type ReactNode } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import {
  cssGradient,
  cssGlassmorphism,
  cssTriangle,
  cssBoxShadow,
  cssBorderRadius,
  cssRgbBackgroundPattern,
  cssClipPath,
  cssCubicBezier,
  cssLoader,
  cssSwitch,
  cssCheckbox,
  cssTextGlitch,
  type CssGenResult,
} from "@/lib/tools/css-gen";
import {
  Field,
  TextInput,
  NumInput,
  SelectInput,
  ToggleInput,
  OutBox,
  GhostButton,
} from "@/components/tools/shared/fields";

function num(v: string, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function scopeCss(css: string, scope: string): string {
  const kfNames = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
  let out = css;
  for (const name of kfNames) {
    out = out.replace(
      new RegExp(`(animation:[^;]*?)\\b${name}\\b`, "g"),
      `$1${scope}-${name}`,
    );
    out = out.replace(
      new RegExp(`@keyframes\\s+${name}`, "g"),
      `@keyframes ${scope}-${name}`,
    );
  }
  out = out.replace(
    /(^|\n)\s*\.([\w-]+)([^{]*?)\{/g,
    (_m, lead: string, cls: string, rest: string) => {
      return `${lead}.${scope} .${cls}${rest}{`;
    },
  );
  return out;
}

function Preview({
  css,
  className,
  children,
}: {
  css: string;
  className?: string;
  children?: ReactNode;
}) {
  const scopeRef = useRef(`pv-${Math.random().toString(36).slice(2, 8)}`);
  const scoped = useMemo(() => scopeCss(css, scopeRef.current), [css]);
  return (
    <div className={className}>
      <style>{scoped}</style>
      {children}
    </div>
  );
}

function Result({ css, html }: { css: string; html?: string }) {
  return (
    <div className="grid gap-3">
      <OutBox value={css} filename="style.css" />
      {html ? <OutBox value={html} filename="index.html" /> : null}
    </div>
  );
}

const POSITIONS = [
  "center",
  "top left",
  "top center",
  "top right",
  "left",
  "right",
  "bottom left",
  "bottom center",
  "bottom right",
];

function GradientGen() {
  const [kind, setKind] = useState("linear");
  const [angle, setAngle] = useState("45");
  const [stops, setStops] = useState<string[]>(["#6366f1", "#22d3ee"]);
  const [position, setPosition] = useState("center");
  const result = useMemo(
    () =>
      cssGradient(
        kind as "linear" | "radial" | "conic",
        num(angle, 45),
        stops,
        position,
      ),
    [kind, angle, stops, position],
  );
  const square = kind !== "linear";
  return (
    <div className="grid gap-4">
      <Preview
        css={result.css}
        className="rounded-2xl border border-border bg-card/60 p-4"
      >
        <div
          className={
            square
              ? "grid h-48 w-48 place-items-center rounded-xl border border-border"
              : "rounded-xl border border-border"
          }
        >
          <div
            className="gradient"
            style={
              square
                ? { width: 48, height: 48, borderRadius: 8 }
                : { width: "100%", height: 40, borderRadius: 8 }
            }
          />
        </div>
      </Preview>
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
        <Field label="Type">
          <SelectInput
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            options={["linear", "radial", "conic"]}
          />
        </Field>
        <Field label="Angle">
          <NumInput
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
          />
        </Field>
        {kind !== "linear" && (
          <Field label="Position">
            <SelectInput
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              options={POSITIONS}
            />
          </Field>
        )}
        <div className="space-y-2 sm:col-span-2">
          {stops.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-5 text-sm text-muted-foreground">
                #{i + 1}
              </span>
              <input
                type="color"
                value={s}
                onChange={(e) =>
                  setStops(stops.map((x, j) => (j === i ? e.target.value : x)))
                }
                className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-border bg-background"
              />
              <TextInput
                value={s}
                onChange={(e) =>
                  setStops(stops.map((x, j) => (j === i ? e.target.value : x)))
                }
              />
              {stops.length > 2 && (
                <GhostButton
                  onClick={() => setStops(stops.filter((_, j) => j !== i))}
                >
                  Remove
                </GhostButton>
              )}
            </div>
          ))}
          {stops.length < 5 && (
            <GhostButton onClick={() => setStops([...stops, "#ffffff"])}>
              Add stop
            </GhostButton>
          )}
        </div>
      </div>
      <Result css={result.css} html={result.html} />
    </div>
  );
}

function GlassGen() {
  const [blur, setBlur] = useState(12);
  const [opacity, setOpacity] = useState(1);
  const [border, setBorder] = useState("1");
  const [radius, setRadius] = useState(16);
  const [color, setColor] = useState("rgba(255,255,255,0.25)");
  const result = useMemo(
    () => cssGlassmorphism(blur, opacity, border, radius, color),
    [blur, opacity, border, radius, color],
  );
  return (
    <div className="grid gap-4">
      <Preview css={result.css}>
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div
            className="flex h-56 items-center justify-center rounded-xl"
            style={{
              background:
                "linear-gradient(135deg,#7c3aed 0%,#2563eb 45%,#06b6d4 100%)",
            }}
          >
            <div className="glass flex h-32 w-56 items-center justify-center text-sm font-medium text-foreground">
              Frosted glass
            </div>
          </div>
        </div>
      </Preview>
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
        <Field label={`Blur — ${blur}px`}>
          <input
            type="range"
            min={0}
            max={40}
            value={blur}
            onChange={(e) => setBlur(num(e.target.value))}
            className="w-full"
          />
        </Field>
        <Field label={`Opacity — ${opacity}`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(num(e.target.value))}
            className="w-full"
          />
        </Field>
        <Field label="Border width">
          <NumInput
            min={0}
            max={12}
            value={border}
            onChange={(e) => setBorder(e.target.value)}
          />
        </Field>
        <Field label="Radius">
          <NumInput
            min={0}
            max={60}
            value={radius}
            onChange={(e) => setRadius(num(e.target.value))}
          />
        </Field>
        <Field label="Color">
          <TextInput value={color} onChange={(e) => setColor(e.target.value)} />
        </Field>
      </div>
      <Result css={result.css} html={result.html} />
    </div>
  );
}

function TriangleGen() {
  const [dir, setDir] = useState("up");
  const [size, setSize] = useState("40");
  const [color, setColor] = useState("#6366f1");
  const result = useMemo(
    () =>
      cssTriangle(
        dir as "up" | "down" | "left" | "right",
        num(size, 40),
        color,
      ),
    [dir, size, color],
  );
  return (
    <div className="grid gap-4">
      <Preview
        css={result.css}
        className="rounded-2xl border border-border bg-card/60 p-4"
      >
        <div className="grid h-40 place-items-center">
          <div className="triangle" />
        </div>
      </Preview>
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-3">
        <Field label="Direction">
          <SelectInput
            value={dir}
            onChange={(e) => setDir(e.target.value)}
            options={["up", "down", "left", "right"]}
          />
        </Field>
        <Field label="Size">
          <NumInput
            min={4}
            max={120}
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </Field>
        <Field label="Color">
          <TextInput value={color} onChange={(e) => setColor(e.target.value)} />
        </Field>
      </div>
      <Result css={result.css} html={result.html} />
    </div>
  );
}

const SHADOW_TEMPLATE = {
  x: "0",
  y: "4",
  blur: "12",
  grow: "0",
  color: "#00000040",
  inset: false,
};
type ShadowLayer = typeof SHADOW_TEMPLATE;

function BoxShadowGen() {
  const [layers, setLayers] = useState<ShadowLayer[]>([{ ...SHADOW_TEMPLATE }]);
  const spreads = layers.map((l) => ({
    x: num(l.x),
    y: num(l.y),
    blur: num(l.blur),
    grow: num(l.grow),
    color: l.color,
    inset: l.inset,
  }));
  const result = useMemo(
    () => cssBoxShadow(spreads),
    [JSON.stringify(spreads)],
  );
  const set = (i: number, patch: Partial<ShadowLayer>) =>
    setLayers(layers.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <div className="grid gap-4">
      <Preview
        css={result.css}
        className="rounded-2xl border border-border bg-card/60 p-4"
      >
        <div
          className="grid h-48 place-items-center rounded-xl"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        >
          <div
            className="box h-30 w-30 rounded-xl border border-border bg-card"
            style={{ width: 120, height: 120 }}
          />
        </div>
      </Preview>
      <div className="grid gap-3 rounded-2xl border border-border bg-card/60 p-4">
        {layers.map((l, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-background/40 p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Layer {i + 1}
              </span>
              {layers.length > 1 && (
                <GhostButton
                  onClick={() => setLayers(layers.filter((_, j) => j !== i))}
                >
                  Remove
                </GhostButton>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="X">
                <NumInput
                  value={l.x}
                  onChange={(e) => set(i, { x: e.target.value })}
                />
              </Field>
              <Field label="Y">
                <NumInput
                  value={l.y}
                  onChange={(e) => set(i, { y: e.target.value })}
                />
              </Field>
              <Field label="Blur">
                <NumInput
                  value={l.blur}
                  onChange={(e) => set(i, { blur: e.target.value })}
                />
              </Field>
              <Field label="Spread">
                <NumInput
                  value={l.grow}
                  onChange={(e) => set(i, { grow: e.target.value })}
                />
              </Field>
              <div className="flex items-end gap-3 sm:col-span-2">
                <Field label="Color" className="flex-1">
                  <input
                    type="color"
                    value={l.color}
                    onChange={(e) => set(i, { color: e.target.value })}
                    className="h-10 w-full cursor-pointer rounded-lg border border-border bg-background"
                  />
                </Field>
                <div className="w-40">
                  <ToggleInput
                    label="Inset"
                    checked={l.inset}
                    onChange={(v) => set(i, { inset: v })}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        <GhostButton
          onClick={() => setLayers([...layers, { ...SHADOW_TEMPLATE }])}
        >
          Add layer
        </GhostButton>
      </div>
      <Result css={result.css} html={result.html} />
    </div>
  );
}

function BorderRadiusGen() {
  const [tl, setTl] = useState("30");
  const [tr, setTr] = useState("30");
  const [br, setBr] = useState("30");
  const [bl, setBl] = useState("30");
  const [squircle, setSquircle] = useState(false);
  const result = useMemo(
    () => cssBorderRadius(num(tl), num(tr), num(br), num(bl), squircle),
    [tl, tr, br, bl, squircle],
  );
  return (
    <div className="grid gap-4">
      <Preview
        css={result.css}
        className="rounded-2xl border border-border bg-card/60 p-4"
      >
        <div className="grid place-items-center">
          <div
            className={squircle ? "squircle" : "rounded"}
            style={{
              width: 120,
              height: 120,
              background: "linear-gradient(135deg,#6366f1,#22d3ee)",
            }}
          />
        </div>
      </Preview>
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-4">
        <Field label="Top-left">
          <NumInput value={tl} onChange={(e) => setTl(e.target.value)} />
        </Field>
        <Field label="Top-right">
          <NumInput value={tr} onChange={(e) => setTr(e.target.value)} />
        </Field>
        <Field label="Bottom-right">
          <NumInput value={br} onChange={(e) => setBr(e.target.value)} />
        </Field>
        <Field label="Bottom-left">
          <NumInput value={bl} onChange={(e) => setBl(e.target.value)} />
        </Field>
        <ToggleInput
          label="Squircle"
          checked={squircle}
          onChange={setSquircle}
        />
      </div>
      <Result css={result.css} html={result.html} />
    </div>
  );
}

function PatternsGen() {
  const [kind, setKind] = useState("dots");
  const [size, setSize] = useState(24);
  const [color, setColor] = useState("#6366f1");
  const [bg, setBg] = useState("#0f172a");
  const result = useMemo(
    () =>
      cssRgbBackgroundPattern(
        kind as "dots" | "stripes" | "grid" | "checker" | "crosshatch",
        size,
        color,
        bg,
      ),
    [kind, size, color, bg],
  );
  return (
    <div className="grid gap-4">
      <Preview
        css={result.css}
        className="rounded-2xl border border-border bg-card/60 p-4"
      >
        <div className="grid place-items-center">
          <div
            className="pattern"
            style={{
              width: 200,
              height: 200,
              borderRadius: 14,
              border: "1px solid hsl(var(--border))",
            }}
          />
        </div>
      </Preview>
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
        <Field label="Kind">
          <SelectInput
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            options={["dots", "stripes", "grid", "checker", "crosshatch"]}
          />
        </Field>
        <Field label={`Size — ${size}px`}>
          <input
            type="range"
            min={8}
            max={64}
            value={size}
            onChange={(e) => setSize(num(e.target.value))}
            className="w-full"
          />
        </Field>
        <Field label="Pattern color">
          <TextInput value={color} onChange={(e) => setColor(e.target.value)} />
        </Field>
        <Field label="Background color">
          <TextInput value={bg} onChange={(e) => setBg(e.target.value)} />
        </Field>
      </div>
      <Result css={result.css} html={result.html} />
    </div>
  );
}

const SHAPES = ["circle", "ellipse", "triangle", "hexagon", "star", "custom"];

function ClipPathGen() {
  const [shape, setShape] = useState("hexagon");
  const [points, setPoints] = useState<Array<[number, number]>>([
    [5, 5],
    [95, 5],
    [95, 95],
    [5, 95],
  ]);
  const result = useMemo(
    () =>
      cssClipPath(
        shape as
          | "circle"
          | "ellipse"
          | "triangle"
          | "hexagon"
          | "star"
          | "custom",
        points,
      ),
    [shape, points],
  );
  return (
    <div className="grid gap-4">
      <Preview
        css={result.css}
        className="rounded-2xl border border-border bg-card/60 p-4"
      >
        <div className="grid place-items-center">
          <div
            className="clipped"
            style={{
              width: 160,
              height: 160,
              background: "linear-gradient(135deg,#f43f5e,#f97316)",
            }}
          />
        </div>
      </Preview>
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Shape">
            <SelectInput
              value={shape}
              onChange={(e) => setShape(e.target.value)}
              options={SHAPES}
            />
          </Field>
          {shape === "custom" && (
            <div className="flex items-end">
              <GhostButton
                onClick={() =>
                  setPoints(points.length < 8 ? [...points, [50, 50]] : points)
                }
              >
                Add point
              </GhostButton>
            </div>
          )}
        </div>
        {shape === "custom" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {points.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-16 text-xs text-muted-foreground">
                  Point {i + 1}
                </span>
                <NumInput
                  value={String(p[0])}
                  min={0}
                  max={100}
                  onChange={(e) =>
                    setPoints(
                      points.map((x, j) =>
                        j === i ? [num(e.target.value), x[1]] : x,
                      ),
                    )
                  }
                  className="w-full"
                />
                <span className="text-xs text-muted-foreground">%</span>
                <NumInput
                  value={String(p[1])}
                  min={0}
                  max={100}
                  onChange={(e) =>
                    setPoints(
                      points.map((x, j) =>
                        j === i ? [x[0], num(e.target.value)] : x,
                      ),
                    )
                  }
                  className="w-full"
                />
                {points.length > 3 && (
                  <GhostButton
                    onClick={() => setPoints(points.filter((_, j) => j !== i))}
                  >
                    ×
                  </GhostButton>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Result css={result.css} html={result.html} />
    </div>
  );
}

function BezierGen() {
  const [p1x, setP1x] = useState("0.4");
  const [p1y, setP1y] = useState("0");
  const [p2x, setP2x] = useState("0.2");
  const [p2y, setP2y] = useState("1");
  const [play, setPlay] = useState(false);
  const b1x = Math.min(1, Math.max(0, num(p1x, 0.4)));
  const b1y = Math.min(1, Math.max(0, num(p1y)));
  const b2x = Math.min(1, Math.max(0, num(p2x, 0.2)));
  const b2y = Math.min(1, Math.max(0, num(p2y, 1)));
  const result = useMemo(
    () => cssCubicBezier(b1x, b1y, b2x, b2y),
    [b1x, b1y, b2x, b2y],
  );
  const d = `M0,100 C${(b1x * 100).toFixed(1)},${(100 - b1y * 100).toFixed(1)} ${(b2x * 100).toFixed(1)},${(100 - b2y * 100).toFixed(1)} 100,0`;
  return (
    <div className="grid gap-4">
      <Preview
        css={result.css}
        className="rounded-2xl border border-border bg-card/60 p-4"
      >
        <div className="grid gap-4">
          <div className="flex h-12 items-center overflow-hidden rounded-xl border border-border bg-background/40">
            <div
              className="ease h-7 w-7 shrink-0 rounded-lg bg-primary"
              style={{
                transform: play ? "translateX(13.25rem)" : "translateX(0)",
              }}
            />
          </div>
          <GhostButton onClick={() => setPlay((p) => !p)}>
            {play ? "Reset" : "Play"}
          </GhostButton>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-28 w-full rounded-xl border border-border bg-background/40"
          >
            <line
              x1="0"
              y1="100"
              x2="100"
              y2="0"
              stroke="hsl(var(--border))"
              strokeDasharray="4 4"
            />
            <path d={d} fill="none" stroke="hsl(var(--ring))" strokeWidth="2" />
            <circle cx={b1x * 100} cy={100 - b1y * 100} r="3" fill="#f43f5e" />
            <circle cx={b2x * 100} cy={100 - b2y * 100} r="3" fill="#22d3ee" />
          </svg>
        </div>
      </Preview>
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-4">
        <Field label="P1 x">
          <NumInput
            min={0}
            max={1}
            step={0.01}
            value={p1x}
            onChange={(e) => setP1x(e.target.value)}
          />
        </Field>
        <Field label="P1 y">
          <NumInput
            min={0}
            max={1}
            step={0.01}
            value={p1y}
            onChange={(e) => setP1y(e.target.value)}
          />
        </Field>
        <Field label="P2 x">
          <NumInput
            min={0}
            max={1}
            step={0.01}
            value={p2x}
            onChange={(e) => setP2x(e.target.value)}
          />
        </Field>
        <Field label="P2 y">
          <NumInput
            min={0}
            max={1}
            step={0.01}
            value={p2y}
            onChange={(e) => setP2y(e.target.value)}
          />
        </Field>
      </div>
      <Result css={result.css} html={result.html} />
    </div>
  );
}

function LoaderGen() {
  const [kind, setKind] = useState("ring");
  const [color, setColor] = useState("#6366f1");
  const [size, setSize] = useState("40");
  const [speed, setSpeed] = useState("1.2");
  const result = useMemo(
    () =>
      cssLoader(
        kind as "ring" | "dual" | "bar" | "dots",
        color,
        num(size, 40),
        num(speed, 1.2),
      ),
    [kind, color, size, speed],
  );
  return (
    <div className="grid gap-4">
      <Preview
        css={result.css}
        className="rounded-2xl border border-border bg-card/60 p-4"
      >
        <div className="grid h-36 place-items-center">
          {kind === "dots" ? (
            <div className="loader">
              <span />
              <span />
              <span />
            </div>
          ) : (
            <div className="loader" />
          )}
        </div>
      </Preview>
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
        <Field label="Kind">
          <SelectInput
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            options={["ring", "dual", "bar", "dots"]}
          />
        </Field>
        <Field label="Color">
          <TextInput value={color} onChange={(e) => setColor(e.target.value)} />
        </Field>
        <Field label="Size">
          <NumInput
            min={8}
            max={120}
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </Field>
        <Field label={`Speed — ${speed}s`}>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            className="w-full"
          />
        </Field>
      </div>
      <Result css={result.css} html={result.html} />
    </div>
  );
}

function SwitchGen() {
  const [color, setColor] = useState("#10b981");
  const [size, setSize] = useState("32");
  const [checked, setChecked] = useState(true);
  const result = useMemo(
    () => cssSwitch(color, num(size, 32), checked),
    [color, size, checked],
  );
  return (
    <div className="grid gap-4">
      <Preview
        css={result.css}
        className="rounded-2xl border border-border bg-card/60 p-4"
      >
        <div className="grid h-32 place-items-center">
          <div className="switch" />
        </div>
      </Preview>
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
        <Field label="Color">
          <TextInput value={color} onChange={(e) => setColor(e.target.value)} />
        </Field>
        <Field label="Size">
          <NumInput
            min={16}
            max={80}
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </Field>
        <ToggleInput label="Checked" checked={checked} onChange={setChecked} />
      </div>
      <Result css={result.css} html={result.html} />
    </div>
  );
}

function CheckboxGen() {
  const [color, setColor] = useState("#6366f1");
  const [size, setSize] = useState("28");
  const result = useMemo(
    () => cssCheckbox(color, num(size, 28)),
    [color, size],
  );
  return (
    <div className="grid gap-4">
      <Preview
        css={result.css}
        className="rounded-2xl border border-border bg-card/60 p-4"
      >
        <div className="grid h-32 place-items-center">
          <input type="checkbox" className="checkbox" defaultChecked />
        </div>
      </Preview>
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
        <Field label="Color">
          <TextInput value={color} onChange={(e) => setColor(e.target.value)} />
        </Field>
        <Field label="Size">
          <NumInput
            min={16}
            max={80}
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </Field>
      </div>
      <Result css={result.css} html={result.html} />
    </div>
  );
}

function GlitchGen() {
  const [text, setText] = useState("GLITCH");
  const [colorA, setColorA] = useState("#f43f5e");
  const [colorB, setColorB] = useState("#22d3ee");
  const [intensity, setIntensity] = useState(3);
  const result = useMemo(
    () => cssTextGlitch(colorA, colorB, intensity),
    [colorA, colorB, intensity],
  );
  return (
    <div className="grid gap-4">
      <Preview
        css={result.css}
        className="rounded-2xl border border-border bg-card/60 p-4"
      >
        <div className="grid h-36 place-items-center">
          <div
            className="glitch text-4xl font-black tracking-widest text-foreground"
            data-text={text}
          >
            {text}
          </div>
        </div>
      </Preview>
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
        <Field label="Text">
          <TextInput value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <Field label={`Intensity — ${intensity}`}>
          <input
            type="range"
            min={1}
            max={6}
            value={intensity}
            onChange={(e) => setIntensity(num(e.target.value))}
            className="w-full"
          />
        </Field>
        <Field label="Color A">
          <TextInput
            value={colorA}
            onChange={(e) => setColorA(e.target.value)}
          />
        </Field>
        <Field label="Color B">
          <TextInput
            value={colorB}
            onChange={(e) => setColorB(e.target.value)}
          />
        </Field>
      </div>
      <Result css={result.css} html={result.html} />
    </div>
  );
}

function GridGen() {
  const [cols, setCols] = useState("3");
  const [rows, setRows] = useState("auto");
  const [gap, setGap] = useState("12");
  const [fixedPx, setFixedPx] = useState("");
  const [areas, setAreas] = useState("");
  const n = num(cols, 3);
  const g = num(gap, 12);
  const f = num(fixedPx);
  const columns =
    f > 0
      ? `repeat(${Math.max(1, n)}, ${f}px)`
      : `repeat(${Math.max(1, n)}, 1fr)`;
  const areasCss = areas.trim()
    ? `\n  grid-template-areas: ${areas
        .split("\n")
        .map((l) => `"${l.trim()}"`)
        .join(" ")};`
    : "";
  const result = useMemo<CssGenResult>(
    () => ({
      css: `.grid {\n  display: grid;\n  grid-template-columns: ${columns};\n  gap: ${g}px;\n${rows !== "auto" ? `  grid-template-rows: repeat(${rows}, 1fr);\n` : ""}${areasCss}\n}`,
    }),
    [columns, rows, g, areasCss],
  );
  const cellCount = 3 * Math.max(1, n);
  return (
    <div className="grid gap-4">
      <Preview
        css={result.css}
        className="rounded-2xl border border-border bg-card/60 p-4"
      >
        <div className="grid gap-3">
          <div className="grid">
            {Array.from({ length: cellCount }, (_, i) => (
              <div
                key={i}
                className="grid h-12 place-items-center rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </Preview>
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
        <Field label="Columns">
          <NumInput
            min={1}
            max={12}
            value={cols}
            onChange={(e) => setCols(e.target.value)}
          />
        </Field>
        <Field label="Rows">
          <SelectInput
            value={rows}
            onChange={(e) => setRows(e.target.value)}
            options={["auto", "1", "2", "3"]}
          />
        </Field>
        <Field label="Gap (px)">
          <NumInput
            min={0}
            max={64}
            value={gap}
            onChange={(e) => setGap(e.target.value)}
          />
        </Field>
        <Field label="Fixed width (px, optional)">
          <NumInput
            min={0}
            max={300}
            value={fixedPx}
            onChange={(e) => setFixedPx(e.target.value)}
          />
        </Field>
        <Field
          label="Grid template areas (free text)"
          className="sm:col-span-2"
        >
          <TextInput
            value={areas}
            onChange={(e) => setAreas(e.target.value)}
            placeholder={"header header header\ncontent content aside"}
          />
        </Field>
      </div>
      <Result css={result.css} html={result.html} />
    </div>
  );
}

export default function CssGenerators({ tool }: ToolPageProps) {
  switch (tool.slug) {
    case "css-gradient-generator":
      return <GradientGen />;
    case "css-glassmorphism":
      return <GlassGen />;
    case "css-triangle-generator":
      return <TriangleGen />;
    case "css-box-shadow":
      return <BoxShadowGen />;
    case "css-border-radius":
      return <BorderRadiusGen />;
    case "css-background-patterns":
      return <PatternsGen />;
    case "css-clip-path":
      return <ClipPathGen />;
    case "css-cubic-bezier":
      return <BezierGen />;
    case "css-loader-generator":
      return <LoaderGen />;
    case "css-switch-generator":
      return <SwitchGen />;
    case "css-checkbox-generator":
      return <CheckboxGen />;
    case "css-text-glitch":
      return <GlitchGen />;
    case "css-grid-generator":
      return <GridGen />;
    default:
      return null;
  }
}
