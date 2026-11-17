import { Redis } from "@upstash/redis";
import { createClient } from "redis";

export const dynamic = "force-dynamic";

const KEY = "trip:main";

// Vercel에서 어떤 Redis를 연결했든(Upstash / Redis, 이름 앞에 붙은 접두사 포함) 찾아서 씁니다.
function findEnv(suffixes) {
  const keys = Object.keys(process.env);
  for (const s of suffixes) {
    const k = keys.find((x) => x === s || x.endsWith("_" + s));
    if (k && process.env[k]) return process.env[k];
  }
  return null;
}

let tcpClientPromise = null;

async function getStore() {
  // 1) REST 방식 (Upstash)
  const url = findEnv(["UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"]);
  const token = findEnv(["UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"]);
  if (url && token) {
    const r = new Redis({ url, token });
    return {
      get: async () => r.get(KEY),
      set: async (v) => r.set(KEY, v),
    };
  }
  // 2) 일반 Redis 주소 (redis:// 또는 rediss://)
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
      get: async () => {
        const s = await c.get(KEY);
        return s ? JSON.parse(s) : null;
      },
      set: async (v) => c.set(KEY, JSON.stringify(v)),
    };
  }
  return null;
}

function notConfigured() {
  // 문제 확인용: 값은 숨기고 관련 환경변수 '이름'만 보여줍니다.
  const seen = Object.keys(process.env).filter((k) => /REDIS|KV_|UPSTASH/i.test(k));
  return Response.json({ configured: false, envNames: seen }, { status: 503 });
}

export async function GET() {
  let store;
  try {
    store = await getStore();
  } catch (e) {
    return Response.json({ configured: true, error: "저장소 연결 실패: " + e.message }, { status: 500 });
  }
  if (!store) return notConfigured();
  const trip = await store.get();
  return Response.json({ configured: true, trip: trip ?? null });
}

export async function PUT(req) {
  const store = await getStore();
  if (!store) return notConfigured();
  const body = await req.json();
  if (!body || typeof body !== "object" || !Array.isArray(body.days)) {
    return Response.json({ error: "잘못된 데이터" }, { status: 400 });
  }
  if (JSON.stringify(body).length > 500_000) {
    return Response.json({ error: "데이터가 너무 큽니다" }, { status: 413 });
  }
  body.updatedAt = Date.now();
  await store.set(body);
  return Response.json({ ok: true, updatedAt: body.updatedAt });
}
