async function digest(algo: AlgorithmIdentifier, text: string) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashText(text: string) {
  const [sha1, sha256, sha512] = await Promise.all([
    digest("SHA-1", text),
    digest("SHA-256", text),
    digest("SHA-512", text),
  ]);
  return { sha1, sha256, sha512 };
}

export async function hashWithAlgo(
  text: string,
  algo: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512",
) {
  return digest(algo, text);
}
