import { Redis } from "@upstash/redis";
import { createClient } from "redis";

// Vercel에서 어떤 Redis를 연결했든(Upstash / Redis, 이름 앞 접두사 포함) 찾아서 씁니다.
function findEnv(suffixes) {
  const keys = Object.keys(process.env);
  for (const s of suffixes) {
    const k = keys.find((x) => x === s || x.endsWith("_" + s));
    if (k && process.env[k]) return process.env[k];
  }
  return null;
}

let tcpClientPromise = null;

// 값은 항상 JSON으로 저장/조회합니다.
export async function getStore() {
  const url = findEnv(["UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"]);
  const token = findEnv(["UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"]);
  if (url && token) {
    const r = new Redis({ url, token, automaticDeserialization: false });
    return {
      get: async (key) => {
        const s = await r.get(key);
        return s == null ? null : JSON.parse(s);
      },
      set: async (key, v) => r.set(key, JSON.stringify(v)),
      del: async (key) => r.del(key),
    };
  }
  const redisUrl = findEnv(["REDIS_URL", "KV_URL"]);
  if (redisUrl && /^rediss?:\/\//.test(redisUrl)) {
    if (!tcpClientPromise) {
      const c = createClient({ url: redisUrl });
      c.on("error", () => {});
      tcpClientPromise = c.connect().then(() => c);
      tcpClientPromise.catch(() => (tcpClientPromise = null));
    }
    const c = await tcpClientPromise;
    return {
      get: async (key) => {
        const s = await c.get(key);
        return s == null ? null : JSON.parse(s);
      },
      set: async (key, v) => c.set(key, JSON.stringify(v)),
      del: async (key) => c.del(key),
    };
  }
  return null;
}

export function notConfigured() {
  // 문제 확인용: 값은 숨기고 관련 환경변수 '이름'만 보여줍니다.
  const seen = Object.keys(process.env).filter((k) => /REDIS|KV_|UPSTASH/i.test(k));
  return Response.json({ configured: false, envNames: seen }, { status: 503 });
}
