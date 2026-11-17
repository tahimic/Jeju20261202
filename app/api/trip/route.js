import { getStore, notConfigured } from "../../lib/store";

export const dynamic = "force-dynamic";

const KEY = "trip:main";

export async function GET() {
  let store;
  try {
    store = await getStore();
  } catch (e) {
    return Response.json({ configured: true, error: "저장소 연결 실패: " + e.message }, { status: 500 });
  }
  if (!store) return notConfigured();
  const trip = await store.get(KEY);
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
  await store.set(KEY, body);
  return Response.json({ ok: true, updatedAt: body.updatedAt });
}
