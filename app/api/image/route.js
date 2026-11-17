import { getStore, notConfigured } from "../../lib/store";

export const dynamic = "force-dynamic";

// 사진은 Redis에 "img:<id>" 키로 따로 저장해요. (일정 데이터와 분리해서 동기화가 가볍게 유지돼요)
const MAX_LEN = 1_400_000; // base64 기준 약 1MB
const ID_RE = /^[a-z0-9]{8,32}$/;

function newId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => (b % 36).toString(36)).join("");
}

export async function POST(req) {
  const store = await getStore();
  if (!store) return notConfigured();
  const { dataUrl } = await req.json().catch(() => ({}));
  const m = typeof dataUrl === "string" && dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return Response.json({ error: "사진 형식이 올바르지 않아요" }, { status: 400 });
  if (dataUrl.length > MAX_LEN) return Response.json({ error: "사진이 너무 커요" }, { status: 413 });
  const id = newId();
  await store.set("img:" + id, { type: m[1], data: m[2] });
  return Response.json({ id });
}

export async function GET(req) {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!ID_RE.test(id)) return new Response("not found", { status: 404 });
  const store = await getStore();
  if (!store) return notConfigured();
  const img = await store.get("img:" + id);
  if (!img) return new Response("not found", { status: 404 });
  return new Response(Buffer.from(img.data, "base64"), {
    headers: {
      "Content-Type": img.type,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!ID_RE.test(id)) return Response.json({ ok: true });
  const store = await getStore();
  if (!store) return notConfigured();
  await store.del("img:" + id);
  return Response.json({ ok: true });
}
