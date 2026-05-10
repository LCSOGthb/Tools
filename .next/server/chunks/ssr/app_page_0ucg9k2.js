module.exports = [
  30100,
  (a) => {
    "use strict";
    var b = a.i(87924),
      c = a.i(72131);
    let d = {
        passwordLength: 16,
        passwordMode: "strong",
        defaultCurrencyFrom: "usd",
        defaultCurrencyTo: "myr",
      },
      e = {
        length: {
          mm: 0.001,
          cm: 0.01,
          m: 1,
          km: 1e3,
          in: 0.0254,
          ft: 0.3048,
          yd: 0.9144,
          mi: 1609.344,
        },
        mass: { mg: 1e-6, g: 0.001, kg: 1, oz: 0.028349523125, lb: 0.45359237 },
        speed: {
          "m/s": 1,
          "km/h": 1e3 / 3600,
          mph: 0.44704,
          knot: 1852 / 3600,
        },
        area: { m2: 1, cm2: 1e-4, km2: 1e6, acre: 4046.8564224, ha: 1e4 },
        volume: {
          ml: 1e-6,
          l: 0.001,
          m3: 1,
          tsp: 492892159375e-17,
          tbsp: 1478676478125e-17,
          cup: 2365882365e-13,
          fl_oz: 295735295625e-16,
          gal: 0.003785411784,
        },
      },
      f = {
        usd: "$",
        myr: "RM",
        eur: "€",
        gbp: "£",
        jpy: "¥",
        sgd: "S$",
        aud: "A$",
        idr: "Rp",
      };
    function g(a, b) {}
    function h(a, b = 8) {
      if (!Number.isFinite(a)) return "—";
      let c = Math.abs(a);
      return 0 !== c && (c >= 1e9 || c < 1e-6)
        ? a.toExponential(6).replace(/\+/, "")
        : Number.parseFloat(a.toFixed(b)).toString();
    }
    function i(a) {
      return a.trim().replace(/\s+/g, " ").toLowerCase();
    }
    function j(a) {
      for (let [b, c] of Object.entries(e))
        if (Object.prototype.hasOwnProperty.call(c, a)) return b;
      return null;
    }
    a.s([
      "default",
      0,
      function () {
        let [a, k] = (0, c.useState)(d),
          [l, m] = (0, c.useState)(""),
          [n, o] = (0, c.useState)(null),
          [p, q] = (0, c.useState)([]),
          [r, s] = (0, c.useState)([]),
          [t, u] = (0, c.useState)("Ready"),
          [v, w] = (0, c.useState)(null),
          x = (0, c.useRef)(null);
        function y(a) {
          q((b) => [a, ...b].slice(0, 80));
        }
        function z(a) {
          navigator.clipboard?.writeText(a).catch(() => {});
        }
        function A(b, c = {}) {
          let d = i(b);
          if (!d) return;
          let g = null,
            k = null,
            l = "unknown",
            n = [];
          try {
            if ("speed test" === d || "speed" === d)
              ((l = "speed"),
                (k = {
                  title: "Speed test is scaffolded",
                  details:
                    "This prototype includes the UI and history, but a true browser speed test needs a test file or backend endpoint you control.",
                }),
                w({ running: !1, dl: null, ul: null, ping: null }),
                (n = ["configure speed endpoint"]));
            else {
              let b;
              if (
                (g = (b = d.match(
                  /^(?:gen\s+)?password(?:\s+(\d{1,3}))?(?:\s+(weak|medium|strong))?$/i,
                ))
                  ? {
                      type: "password",
                      length: Math.max(
                        4,
                        Math.min(128, Number(b[1] || a.passwordLength || 16)),
                      ),
                      mode: (b[2] || a.passwordMode || "strong").toLowerCase(),
                    }
                  : null)
              ) {
                let a;
                l = "password";
                let b = (function (a, b) {
                  let c = {
                      weak: "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789",
                      medium:
                        "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%?_-",
                      strong:
                        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};:,.<>/?",
                    },
                    d = c[b] || c.strong,
                    e = new Uint32Array(a);
                  window.crypto.getRandomValues(e);
                  let f = "";
                  for (let b = 0; b < a; b += 1) f += d[e[b] % d.length];
                  return f;
                })(g.length, g.mode);
                ((k = {
                  password: b,
                  score:
                    ((a = 0),
                    b.length >= 12 && (a += 1),
                    b.length >= 16 && (a += 1),
                    /[a-z]/.test(b) && (a += 1),
                    /[A-Z]/.test(b) && (a += 1),
                    /\d/.test(b) && (a += 1),
                    /[^A-Za-z0-9]/.test(b) && (a += 1),
                    a),
                  mode: g.mode,
                  length: g.length,
                }),
                  (n = ["copy", "pin"]));
              } else if (
                (g = (function (a) {
                  if (!a.startsWith("qr ")) return null;
                  let b = a.slice(3).trim();
                  return b ? { type: "qr", value: b } : null;
                })(d))
              )
                ((l = "qr"),
                  (k = {
                    value: g.value,
                    url: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(g.value)}`,
                  }),
                  (n = ["copy", "pin"]));
              else if (
                (g = (function (a, b) {
                  let c = a.match(
                    /^(?:(\d+(?:\.\d+)?)\s+)?([a-z]{3})\s+to\s+([a-z]{3})$/i,
                  );
                  if (c)
                    return {
                      type: "currency",
                      value: c[1] ? Number(c[1]) : 1,
                      from: c[2].toLowerCase(),
                      to: c[3].toLowerCase(),
                      note: "Rates are local/manual in this prototype.",
                      prefs: b,
                    };
                  let d = a.match(
                    /^(\d+(?:\.\d+)?)\s+([a-z\/0-9_]+)\s+to\s+([a-z\/0-9_]+)$/i,
                  );
                  if (!d) return null;
                  let e = Number(d[1]),
                    f = d[2].toLowerCase();
                  return {
                    type: "unit",
                    value: e,
                    from: f,
                    to: d[3].toLowerCase(),
                  };
                })(d, a))
              )
                if ("currency" === g.type) {
                  l = "currency";
                  let a = (function (a, b, c) {
                    let d = {
                      usd: 1,
                      myr: 4.7,
                      eur: 0.92,
                      gbp: 0.78,
                      jpy: 154,
                      sgd: 1.35,
                      aud: 1.51,
                      idr: 15850,
                    };
                    if (!d[b] || !d[c]) throw Error("Unsupported currency");
                    return (a / d[b]) * d[c];
                  })(g.value, g.from, g.to);
                  ((k = {
                    value: a,
                    formatted: `${f[g.to] || g.to.toUpperCase()} ${h(a, 6)}`,
                    source: `${g.value} ${g.from.toUpperCase()}`,
                    note: g.note,
                  }),
                    (n = ["copy", "pin"]));
                } else {
                  l = "unit";
                  let a = (function (a, b, c) {
                    let d = j(b);
                    if (!d || j(c) !== d) throw Error("Unsupported unit pair");
                    if ("speed" === d) return (a * e.speed[b]) / e.speed[c];
                    if (
                      "area" === d ||
                      "volume" === d ||
                      "length" === d ||
                      "mass" === d
                    )
                      return (a * e[d][b]) / e[d][c];
                    throw Error("Unsupported unit category");
                  })(g.value, g.from, g.to);
                  ((k = {
                    value: a,
                    formatted: `${h(a, 8)} ${g.to}`,
                    source: `${g.value} ${g.from}`,
                  }),
                    (n = ["copy", "pin"]));
                }
              else if (/^[0-9+\-*/%^().,\s]+$/.test(d) && /\d/.test(d)) {
                l = "math";
                let a = (function (a) {
                  let b = a.replace(/,/g, ".").replace(/\^/g, "**");
                  if (!/^[0-9+\-*/%().*\s**]+$/.test(b.replace(/\*\*/g, "")))
                    throw Error("Invalid expression");
                  let c = Function(`"use strict"; return (${b});`)();
                  if ("number" != typeof c || !Number.isFinite(c))
                    throw Error("Invalid result");
                  return c;
                })(d);
                ((k = { value: a, formatted: h(a, 10) }),
                  (n = ["copy", "pin"]));
              } else if (d.startsWith("pin ")) {
                let a = d.slice(4).trim();
                if (!a) throw Error("Nothing to pin");
                (s((b) => [a, ...b.filter((b) => b !== a)].slice(0, 12)),
                  u(`Pinned: ${a}`));
                return;
              } else if (d.startsWith("unpin ")) {
                let a = d.slice(6).trim();
                (s((b) => b.filter((b) => b !== a)), u(`Unpinned: ${a}`));
                return;
              } else throw Error("Unknown command");
            }
            let i = {
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              input: b,
              normalized: d,
              type: l,
              label: (function (a) {
                switch (a) {
                  case "math":
                    return "Calculator";
                  case "unit":
                    return "Unit converter";
                  case "currency":
                    return "Currency converter";
                  case "password":
                    return "Password generator";
                  case "qr":
                    return "QR generator";
                  case "speed":
                    return "Speed test";
                  default:
                    return "Command";
                }
              })(l),
              output: k,
              actions: n,
              createdAt: new Date().toISOString(),
            };
            return (
              o(i),
              y(i),
              u(`Ran ${i.label}`),
              !1 !== c.clearInput && m(""),
              i
            );
          } catch (c) {
            let a = {
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              input: b,
              normalized: d,
              type: "error",
              label: "Error",
              output: { message: c.message || "Command failed" },
              actions: [],
              createdAt: new Date().toISOString(),
            };
            return (o(a), y(a), u(a.output.message), a);
          }
        }
        function B(a) {
          (m(a), x.current?.focus(), A(a));
        }
        function C() {
          let a = performance.now();
          (w({
            running: !0,
            dl: null,
            ul: null,
            ping: null,
            message: "Downloading a test payload…",
          }),
            fetch("https://speed.hetzner.de/10MB.bin", { cache: "no-store" })
              .then(async (b) => {
                if (!b.ok) throw Error(`HTTP ${b.status}`);
                let c = b.body?.getReader();
                if (!c) throw Error("Streaming not available in this browser");
                let d = 0,
                  e = Number(b.headers.get("content-length")) || 0xa00000;
                for (;;) {
                  let { done: a, value: b } = await c.read();
                  if (a) break;
                  d += b.byteLength;
                }
                let f = (8 * d) / ((performance.now() - a) / 1e3) / 1e6;
                w({
                  running: !1,
                  dl: f.toFixed(2),
                  ul: "—",
                  ping: "—",
                  message: `${Math.round((d / e) * 100)}%`,
                });
                let g = {
                  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                  input: "speed test",
                  normalized: "speed test",
                  type: "speed",
                  label: "Speed test",
                  output: {
                    downloadMbps: f.toFixed(2),
                    note: "Download estimate from a single download payload.",
                  },
                  actions: ["copy", "pin"],
                  createdAt: new Date().toISOString(),
                };
                (o(g), y(g), u(`Speed test complete: ${f.toFixed(2)} Mbps`));
              })
              .catch((a) => {
                (w({
                  running: !1,
                  dl: null,
                  ul: null,
                  ping: null,
                  message: a.message,
                }),
                  u(`Speed test failed: ${a.message}`));
              }));
        }
        ((0, c.useEffect)(() => {
          let a = [],
            b = [];
          (k({ ...d, ...d }),
            q(Array.isArray(a) ? a : []),
            s(Array.isArray(b) ? b : []));
        }, []),
          (0, c.useEffect)(() => g("ptc_prefs_v1", a), [a]),
          (0, c.useEffect)(() => g("ptc_history_v1", p.slice(0, 80)), [p]),
          (0, c.useEffect)(() => g("ptc_pins_v1", r), [r]));
        let D = (0, c.useMemo)(() => {
          let a, b;
          return (
            (a = i(l)),
            (b = [
              "100 usd to myr",
              "10 km to mi",
              "16 * 24 + 10",
              "gen password 16 strong",
              "qr https://example.com",
              "speed test",
            ]),
            a ? b.filter((b) => b.includes(a)).slice(0, 6) : b
          );
        }, [l]);
        return (
          (0, c.useEffect)(() => {
            let a = (a) => {
              ("/" === a.key &&
                document.activeElement !== x.current &&
                (a.preventDefault(), x.current?.focus()),
                "Enter" === a.key &&
                  document.activeElement === x.current &&
                  (a.preventDefault(),
                  "speed test" === i(l) || "speed" === i(l) ? C() : A(l)));
            };
            return (
              window.addEventListener("keydown", a),
              () => window.removeEventListener("keydown", a)
            );
          }, [l, a]),
          (0, b.jsx)("div", {
            className: "min-h-screen bg-slate-950 text-slate-100",
            children: (0, b.jsxs)("div", {
              className: "mx-auto max-w-7xl px-4 py-6 lg:px-8",
              children: [
                (0, b.jsxs)("header", {
                  className:
                    "mb-6 flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/20 backdrop-blur",
                  children: [
                    (0, b.jsxs)("div", {
                      className:
                        "flex flex-wrap items-center justify-between gap-3",
                      children: [
                        (0, b.jsxs)("div", {
                          children: [
                            (0, b.jsx)("h1", {
                              className:
                                "text-2xl font-semibold tracking-tight",
                              children: "Personal Tool Console",
                            }),
                            (0, b.jsx)("p", {
                              className: "mt-1 text-sm text-slate-400",
                              children:
                                "Command-driven utilities with local history, saved shortcuts, and fast results.",
                            }),
                          ],
                        }),
                        (0, b.jsxs)("div", {
                          className:
                            "flex items-center gap-2 text-xs text-slate-400",
                          children: [
                            (0, b.jsx)("span", {
                              className:
                                "rounded-full border border-slate-700 px-3 py-1",
                              children: "Press / to focus",
                            }),
                            (0, b.jsx)("span", {
                              className:
                                "rounded-full border border-slate-700 px-3 py-1",
                              children: "Enter to run",
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, b.jsxs)("div", {
                      className: "grid gap-3 lg:grid-cols-[1fr_auto]",
                      children: [
                        (0, b.jsxs)("div", {
                          className: "relative",
                          children: [
                            (0, b.jsx)("input", {
                              ref: x,
                              value: l,
                              onChange: (a) => m(a.target.value),
                              onKeyDown: (a) => {
                                "Enter" === a.key &&
                                  (a.preventDefault(),
                                  "speed test" === i(l) || "speed" === i(l)
                                    ? C()
                                    : A(l));
                              },
                              placeholder:
                                "Type a command: 100 usd to myr, gen password 16 strong, qr https://..., 16*24+10",
                              className:
                                "w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-4 pr-24 text-base outline-none ring-0 placeholder:text-slate-500 focus:border-slate-500",
                            }),
                            (0, b.jsx)("div", {
                              className:
                                "pointer-events-none absolute inset-y-0 right-3 flex items-center gap-2 text-xs text-slate-500",
                              children: (0, b.jsx)("span", {
                                className:
                                  "rounded-lg border border-slate-800 px-2 py-1",
                                children: "Cmd",
                              }),
                            }),
                          ],
                        }),
                        (0, b.jsxs)("div", {
                          className: "flex gap-2",
                          children: [
                            (0, b.jsx)("button", {
                              onClick: () =>
                                "speed test" === i(l) || "speed" === i(l)
                                  ? C()
                                  : A(l),
                              className:
                                "rounded-2xl bg-slate-100 px-4 py-3 font-medium text-slate-950 transition hover:bg-white",
                              children: "Run",
                            }),
                            (0, b.jsx)("button", {
                              onClick: () => m(""),
                              className:
                                "rounded-2xl border border-slate-700 px-4 py-3 font-medium text-slate-200 transition hover:bg-slate-800",
                              children: "Clear",
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, b.jsx)("div", {
                      className: "flex flex-wrap gap-2",
                      children: D.map((a) =>
                        (0, b.jsx)(
                          "button",
                          {
                            onClick: () => B(a),
                            className:
                              "rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-800",
                            children: a,
                          },
                          a,
                        ),
                      ),
                    }),
                  ],
                }),
                (0, b.jsxs)("main", {
                  className: "grid gap-6 lg:grid-cols-[1.25fr_0.75fr]",
                  children: [
                    (0, b.jsxs)("section", {
                      className: "space-y-6",
                      children: [
                        (0, b.jsxs)("div", {
                          className:
                            "rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10",
                          children: [
                            (0, b.jsxs)("div", {
                              className:
                                "mb-4 flex items-center justify-between gap-3",
                              children: [
                                (0, b.jsxs)("div", {
                                  children: [
                                    (0, b.jsx)("h2", {
                                      className: "text-lg font-semibold",
                                      children: "Result",
                                    }),
                                    (0, b.jsx)("p", {
                                      className: "text-sm text-slate-400",
                                      children: t,
                                    }),
                                  ],
                                }),
                                n &&
                                  (0, b.jsx)("button", {
                                    onClick: () =>
                                      z(
                                        "string" == typeof n.output
                                          ? n.output
                                          : JSON.stringify(n.output, null, 2),
                                      ),
                                    className:
                                      "rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800",
                                    children: "Copy output",
                                  }),
                              ],
                            }),
                            !n &&
                              (0, b.jsx)("div", {
                                className:
                                  "rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400",
                                children:
                                  "Run a command to see a structured result here.",
                              }),
                            n &&
                              (0, b.jsxs)("div", {
                                className:
                                  "space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5",
                                children: [
                                  (0, b.jsxs)("div", {
                                    className:
                                      "flex flex-wrap items-start justify-between gap-3",
                                    children: [
                                      (0, b.jsxs)("div", {
                                        children: [
                                          (0, b.jsx)("div", {
                                            className:
                                              "text-xs uppercase tracking-[0.2em] text-slate-500",
                                            children: n.label,
                                          }),
                                          (0, b.jsx)("div", {
                                            className:
                                              "mt-1 text-xl font-semibold text-slate-100",
                                            children: n.input,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsx)("div", {
                                        className:
                                          "rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300",
                                        children: n.type,
                                      }),
                                    ],
                                  }),
                                  "math" === n.type &&
                                    (0, b.jsxs)("div", {
                                      children: [
                                        (0, b.jsx)("div", {
                                          className: "text-sm text-slate-400",
                                          children: "Answer",
                                        }),
                                        (0, b.jsx)("div", {
                                          className:
                                            "mt-1 text-3xl font-semibold",
                                          children: n.output.formatted,
                                        }),
                                      ],
                                    }),
                                  ("unit" === n.type ||
                                    "currency" === n.type) &&
                                    (0, b.jsxs)("div", {
                                      children: [
                                        (0, b.jsx)("div", {
                                          className: "text-sm text-slate-400",
                                          children: "Converted",
                                        }),
                                        (0, b.jsx)("div", {
                                          className:
                                            "mt-1 text-3xl font-semibold",
                                          children: n.output.formatted,
                                        }),
                                        (0, b.jsxs)("div", {
                                          className:
                                            "mt-2 text-sm text-slate-400",
                                          children: ["From ", n.output.source],
                                        }),
                                        n.output.note &&
                                          (0, b.jsx)("div", {
                                            className:
                                              "mt-1 text-xs text-slate-500",
                                            children: n.output.note,
                                          }),
                                      ],
                                    }),
                                  "password" === n.type &&
                                    (0, b.jsxs)("div", {
                                      className: "space-y-3",
                                      children: [
                                        (0, b.jsxs)("div", {
                                          children: [
                                            (0, b.jsx)("div", {
                                              className:
                                                "text-sm text-slate-400",
                                              children: "Password",
                                            }),
                                            (0, b.jsx)("div", {
                                              className:
                                                "mt-1 break-all rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 font-mono text-base",
                                              children: n.output.password,
                                            }),
                                          ],
                                        }),
                                        (0, b.jsxs)("div", {
                                          className: "text-sm text-slate-400",
                                          children: [
                                            "Strength score: ",
                                            n.output.score,
                                            "/6 · Mode: ",
                                            n.output.mode,
                                            " · Length: ",
                                            n.output.length,
                                          ],
                                        }),
                                      ],
                                    }),
                                  "qr" === n.type &&
                                    (0, b.jsxs)("div", {
                                      className:
                                        "grid gap-4 md:grid-cols-[auto_1fr] md:items-center",
                                      children: [
                                        (0, b.jsx)("img", {
                                          src: n.output.url,
                                          alt: "QR code",
                                          className:
                                            "h-44 w-44 rounded-2xl border border-slate-800 bg-white p-3",
                                        }),
                                        (0, b.jsxs)("div", {
                                          children: [
                                            (0, b.jsx)("div", {
                                              className:
                                                "text-sm text-slate-400",
                                              children: "Encoded value",
                                            }),
                                            (0, b.jsx)("div", {
                                              className:
                                                "mt-1 break-all rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm",
                                              children: n.output.value,
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  "speed" === n.type &&
                                    (0, b.jsxs)("div", {
                                      className: "space-y-4",
                                      children: [
                                        (0, b.jsxs)("div", {
                                          className:
                                            "rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4",
                                          children: [
                                            (0, b.jsx)("div", {
                                              className:
                                                "text-sm text-slate-400",
                                              children: "Speed test status",
                                            }),
                                            (0, b.jsx)("div", {
                                              className:
                                                "mt-1 text-lg text-slate-100",
                                              children:
                                                v?.message || n.output.title,
                                            }),
                                            (0, b.jsx)("div", {
                                              className:
                                                "mt-2 text-sm text-slate-400",
                                              children:
                                                "This prototype can run a basic download-based estimate, but a robust speed test should use your own test endpoint.",
                                            }),
                                          ],
                                        }),
                                        (0, b.jsxs)("div", {
                                          className:
                                            "grid gap-3 md:grid-cols-3",
                                          children: [
                                            (0, b.jsxs)("div", {
                                              className:
                                                "rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4",
                                              children: [
                                                (0, b.jsx)("div", {
                                                  className:
                                                    "text-xs uppercase tracking-[0.2em] text-slate-500",
                                                  children: "Download",
                                                }),
                                                (0, b.jsxs)("div", {
                                                  className:
                                                    "mt-1 text-2xl font-semibold",
                                                  children: [
                                                    v?.dl ?? "—",
                                                    " Mbps",
                                                  ],
                                                }),
                                              ],
                                            }),
                                            (0, b.jsxs)("div", {
                                              className:
                                                "rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4",
                                              children: [
                                                (0, b.jsx)("div", {
                                                  className:
                                                    "text-xs uppercase tracking-[0.2em] text-slate-500",
                                                  children: "Upload",
                                                }),
                                                (0, b.jsx)("div", {
                                                  className:
                                                    "mt-1 text-2xl font-semibold",
                                                  children: v?.ul ?? "—",
                                                }),
                                              ],
                                            }),
                                            (0, b.jsxs)("div", {
                                              className:
                                                "rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4",
                                              children: [
                                                (0, b.jsx)("div", {
                                                  className:
                                                    "text-xs uppercase tracking-[0.2em] text-slate-500",
                                                  children: "Ping",
                                                }),
                                                (0, b.jsx)("div", {
                                                  className:
                                                    "mt-1 text-2xl font-semibold",
                                                  children: v?.ping ?? "—",
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        (0, b.jsx)("button", {
                                          onClick: C,
                                          className:
                                            "rounded-2xl bg-slate-100 px-4 py-3 font-medium text-slate-950 transition hover:bg-white",
                                          children: "Run download test",
                                        }),
                                      ],
                                    }),
                                  (0, b.jsx)("div", {
                                    className: "flex flex-wrap gap-2 pt-2",
                                    children: n.actions.map((a) =>
                                      (0, b.jsx)(
                                        "button",
                                        {
                                          onClick: () => {
                                            ("copy" === a &&
                                              (z(
                                                "password" === n.type
                                                  ? n.output.password
                                                  : "qr" === n.type
                                                    ? n.output.value
                                                    : n.output.formatted ||
                                                      JSON.stringify(
                                                        n.output,
                                                        null,
                                                        2,
                                                      ),
                                              ),
                                              u("Copied to clipboard")),
                                              "pin" === a &&
                                                (s((a) =>
                                                  [
                                                    n.input,
                                                    ...a.filter(
                                                      (a) => a !== n.input,
                                                    ),
                                                  ].slice(0, 12),
                                                ),
                                                u("Pinned command")));
                                          },
                                          className:
                                            "rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800",
                                          children: a,
                                        },
                                        a,
                                      ),
                                    ),
                                  }),
                                ],
                              }),
                          ],
                        }),
                        (0, b.jsxs)("div", {
                          className: "grid gap-6 md:grid-cols-2",
                          children: [
                            (0, b.jsxs)("div", {
                              className:
                                "rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10",
                              children: [
                                (0, b.jsxs)("div", {
                                  className:
                                    "mb-4 flex items-center justify-between",
                                  children: [
                                    (0, b.jsx)("h3", {
                                      className: "text-lg font-semibold",
                                      children: "Pinned shortcuts",
                                    }),
                                    (0, b.jsxs)("span", {
                                      className: "text-xs text-slate-500",
                                      children: [r.length, "/12"],
                                    }),
                                  ],
                                }),
                                0 === r.length
                                  ? (0, b.jsxs)("div", {
                                      className:
                                        "rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400",
                                      children: [
                                        "Pin commands from results or use ",
                                        (0, b.jsx)("span", {
                                          className: "font-mono text-slate-300",
                                          children: "pin ...",
                                        }),
                                        ".",
                                      ],
                                    })
                                  : (0, b.jsx)("div", {
                                      className: "space-y-2",
                                      children: r.map((a) =>
                                        (0, b.jsxs)(
                                          "div",
                                          {
                                            className:
                                              "flex items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3",
                                            children: [
                                              (0, b.jsx)("button", {
                                                className:
                                                  "text-left text-sm text-slate-200 hover:text-white",
                                                onClick: () => B(a),
                                                children: a,
                                              }),
                                              (0, b.jsx)("button", {
                                                onClick: () =>
                                                  s((b) =>
                                                    b.filter((b) => b !== a),
                                                  ),
                                                className:
                                                  "rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-800",
                                                children: "remove",
                                              }),
                                            ],
                                          },
                                          a,
                                        ),
                                      ),
                                    }),
                              ],
                            }),
                            (0, b.jsxs)("div", {
                              className:
                                "rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10",
                              children: [
                                (0, b.jsxs)("div", {
                                  className:
                                    "mb-4 flex items-center justify-between",
                                  children: [
                                    (0, b.jsx)("h3", {
                                      className: "text-lg font-semibold",
                                      children: "Settings",
                                    }),
                                    (0, b.jsx)("span", {
                                      className: "text-xs text-slate-500",
                                      children: "Stored locally",
                                    }),
                                  ],
                                }),
                                (0, b.jsxs)("div", {
                                  className: "grid gap-3",
                                  children: [
                                    (0, b.jsxs)("label", {
                                      className:
                                        "grid gap-1 text-sm text-slate-300",
                                      children: [
                                        "Default password length",
                                        (0, b.jsx)("input", {
                                          type: "number",
                                          value: a.passwordLength,
                                          onChange: (a) =>
                                            k((b) => ({
                                              ...b,
                                              passwordLength: Number(
                                                a.target.value || 16,
                                              ),
                                            })),
                                          className:
                                            "rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-slate-500",
                                        }),
                                      ],
                                    }),
                                    (0, b.jsxs)("label", {
                                      className:
                                        "grid gap-1 text-sm text-slate-300",
                                      children: [
                                        "Default password mode",
                                        (0, b.jsxs)("select", {
                                          value: a.passwordMode,
                                          onChange: (a) =>
                                            k((b) => ({
                                              ...b,
                                              passwordMode: a.target.value,
                                            })),
                                          className:
                                            "rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-slate-500",
                                          children: [
                                            (0, b.jsx)("option", {
                                              value: "weak",
                                              children: "weak",
                                            }),
                                            (0, b.jsx)("option", {
                                              value: "medium",
                                              children: "medium",
                                            }),
                                            (0, b.jsx)("option", {
                                              value: "strong",
                                              children: "strong",
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    (0, b.jsxs)("div", {
                                      className: "text-sm text-slate-400",
                                      children: [
                                        "Tip: use ",
                                        (0, b.jsx)("span", {
                                          className: "font-mono text-slate-200",
                                          children: "gen password",
                                        }),
                                        ", ",
                                        (0, b.jsx)("span", {
                                          className: "font-mono text-slate-200",
                                          children: "qr ...",
                                        }),
                                        ", ",
                                        (0, b.jsx)("span", {
                                          className: "font-mono text-slate-200",
                                          children: "100 usd to myr",
                                        }),
                                        ", or plain math.",
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, b.jsxs)("aside", {
                      className: "space-y-6",
                      children: [
                        (0, b.jsxs)("div", {
                          className:
                            "rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10",
                          children: [
                            (0, b.jsx)("h3", {
                              className: "text-lg font-semibold",
                              children: "Examples",
                            }),
                            (0, b.jsx)("div", {
                              className: "mt-4 space-y-2",
                              children: [
                                "100 usd to myr",
                                "10 km to mi",
                                "16 * 24 + 10",
                                "gen password 16 strong",
                                "qr https://example.com",
                                "speed test",
                              ].map((a) =>
                                (0, b.jsxs)(
                                  "button",
                                  {
                                    onClick: () => B(a),
                                    className:
                                      "flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800",
                                    children: [
                                      (0, b.jsx)("span", {
                                        className: "font-mono",
                                        children: a,
                                      }),
                                      (0, b.jsx)("span", {
                                        className: "text-xs text-slate-500",
                                        children: "run",
                                      }),
                                    ],
                                  },
                                  a,
                                ),
                              ),
                            }),
                          ],
                        }),
                        (0, b.jsxs)("div", {
                          className:
                            "rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10",
                          children: [
                            (0, b.jsxs)("div", {
                              className:
                                "mb-4 flex items-center justify-between",
                              children: [
                                (0, b.jsx)("h3", {
                                  className: "text-lg font-semibold",
                                  children: "Recent history",
                                }),
                                (0, b.jsx)("button", {
                                  onClick: () => q([]),
                                  className:
                                    "rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800",
                                  children: "clear",
                                }),
                              ],
                            }),
                            0 === p.length
                              ? (0, b.jsx)("div", {
                                  className:
                                    "rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400",
                                  children: "No commands yet.",
                                })
                              : (0, b.jsx)("div", {
                                  className:
                                    "max-h-[520px] space-y-2 overflow-auto pr-1",
                                  children: p.map((a) =>
                                    (0, b.jsxs)(
                                      "button",
                                      {
                                        onClick: () => o(a),
                                        className:
                                          "block w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-left hover:bg-slate-800",
                                        children: [
                                          (0, b.jsxs)("div", {
                                            className:
                                              "flex items-center justify-between gap-3",
                                            children: [
                                              (0, b.jsx)("div", {
                                                className:
                                                  "text-sm font-medium text-slate-200",
                                                children: a.input,
                                              }),
                                              (0, b.jsx)("div", {
                                                className:
                                                  "text-xs text-slate-500",
                                                children: a.type,
                                              }),
                                            ],
                                          }),
                                          (0, b.jsx)("div", {
                                            className:
                                              "mt-1 text-xs text-slate-500",
                                            children: new Date(
                                              a.createdAt,
                                            ).toLocaleString(),
                                          }),
                                        ],
                                      },
                                      a.id,
                                    ),
                                  ),
                                }),
                          ],
                        }),
                        (0, b.jsxs)("div", {
                          className:
                            "rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10",
                          children: [
                            (0, b.jsx)("h3", {
                              className: "text-lg font-semibold",
                              children: "Notes",
                            }),
                            (0, b.jsxs)("ul", {
                              className:
                                "mt-4 space-y-3 text-sm text-slate-400",
                              children: [
                                (0, b.jsx)("li", {
                                  children:
                                    "QR generation uses a public image endpoint for this prototype. Swap it for a local library before deploying.",
                                }),
                                (0, b.jsx)("li", {
                                  children:
                                    "Currency conversion is manual/static here. Replace it with a real rate source if you need live FX.",
                                }),
                                (0, b.jsx)("li", {
                                  children:
                                    "Speed test is scaffolded; the browser download test works only if the test URL is reachable and not blocked by CORS.",
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          })
        );
      },
    ]);
  },
];

//# sourceMappingURL=app_page_0ucg9k2.js.map
