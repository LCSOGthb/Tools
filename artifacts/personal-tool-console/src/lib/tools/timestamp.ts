const FMT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZoneName: "short",
};

export function timestampNow() {
  const now = new Date();
  const unix = Math.floor(now.getTime() / 1000);
  return {
    unix,
    unixMs: now.getTime(),
    utc: now.toUTCString(),
    local: now.toLocaleString(undefined, FMT),
    iso: now.toISOString(),
  };
}

export function timestampFromUnix(value: string) {
  const n = Number(value);
  const d = new Date(n > 1e10 ? n : n * 1000);
  if (isNaN(d.getTime())) throw new Error("Invalid Unix timestamp");
  return {
    unix: Math.floor(d.getTime() / 1000),
    unixMs: d.getTime(),
    utc: d.toUTCString(),
    local: d.toLocaleString(undefined, FMT),
    iso: d.toISOString(),
  };
}

export function timestampFromDate(value: string) {
  const d = new Date(
    value.includes("T") || value.includes(" ") ? value : value + "T00:00:00",
  );
  if (isNaN(d.getTime())) throw new Error("Invalid date string");
  return {
    unix: Math.floor(d.getTime() / 1000),
    unixMs: d.getTime(),
    utc: d.toUTCString(),
    local: d.toLocaleString(undefined, FMT),
    iso: d.toISOString(),
  };
}
