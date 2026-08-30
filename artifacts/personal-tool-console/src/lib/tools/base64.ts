export function base64Encode(text: string) {
  return btoa(unescape(encodeURIComponent(text)));
}

export function base64Decode(text: string) {
  try {
    return decodeURIComponent(escape(atob(text)));
  } catch {
    throw new Error('Invalid base64 string');
  }
}
