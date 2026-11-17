import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

const KEY = "trip:main";

// Vercel의 Upstash 연동은 KV_REST_API_* 또는 UPSTASH_REDIS_REST_* 이름으로 환경변수를 넣어줍니다.
function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function GET() {
  const redis = getRedis();
  if (!redis) return Response.json({ configured: false }, { status: 503 });
  const trip = await redis.get(KEY);
  return Response.json({ configured: true, trip: trip ?? null });
}

export async function PUT(req) {
  const redis = getRedis();
  if (!redis) return Response.json({ configured: false }, { status: 503 });
  const body = await req.json();
  if (!body || typeof body !== "object" || !Array.isArray(body.days)) {
    return Response.json({ error: "잘못된 데이터" }, { status: 400 });
  }
  const json = JSON.stringify(body);
  if (json.length > 500_000) {
    return Response.json({ error: "데이터가 너무 큽니다" }, { status: 413 });
  }
  body.updatedAt = Date.now();
  await redis.set(KEY, body);
  return Response.json({ ok: true, updatedAt: body.updatedAt });
}
