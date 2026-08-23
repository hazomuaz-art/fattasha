const WINDOW_MS = 60_000;
const MAX_ENTRIES = 2_000;
const buckets = new Map<string, { count: number; reset: number }>();

export function securityHeaders(extra?: HeadersInit) {
  const headers = new Headers(extra);
  headers.set("Content-Security-Policy", "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://saucenao.com; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  return headers;
}

export function secureJson(body: unknown, init: ResponseInit = {}) {
  return Response.json(body, { ...init, headers: securityHeaders(init.headers) });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const trusted=new Set([new URL(request.url).origin,"https://fattasha.vercel.app","https://athar-image-trace.huzifamuaz4.chatgpt.site"]);
    return trusted.has(new URL(origin).origin);
  } catch { return false; }
}

export function rateLimit(request: Request, scope: string, limit: number) {
  const now = Date.now();
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
  const key = `${scope}:${ip}`;
  const current = buckets.get(key);
  if (!current || current.reset <= now) buckets.set(key, { count: 1, reset: now + WINDOW_MS });
  else if (++current.count > limit) return Math.max(1, Math.ceil((current.reset - now) / 1000));
  if (buckets.size > MAX_ENTRIES) for (const [k, value] of buckets) if (value.reset <= now) buckets.delete(k);
  return 0;
}

export async function validImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return bytes.slice(0, 8).every((v, i) => v === [137,80,78,71,13,10,26,10][i]);
  if (file.type === "image/webp") return String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
  return false;
}
