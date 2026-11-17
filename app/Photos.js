"use client";

import { useEffect, useRef, useState } from "react";

export const imgUrl = (id) => `/api/image?id=${id}`;

// 휴대폰 사진을 올리기 전에 줄여요 (긴 변 1800px, 약 1MB 이하). QR·글씨는 충분히 선명해요.
async function compressImage(file) {
  let src;
  try {
    src = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    src = await new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error("이 사진 형식은 열 수 없어요"));
      img.src = URL.createObjectURL(file);
    });
  }
  const w0 = src.width;
  const h0 = src.height;
  let maxSide = 1800;
  let quality = 0.85;
  for (let i = 0; i < 6; i++) {
    const scale = Math.min(1, maxSide / Math.max(w0, h0));
    const w = Math.round(w0 * scale);
    const h = Math.round(h0 * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(src, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= 1_300_000) return dataUrl;
    maxSide = Math.round(maxSide * 0.8);
    quality = Math.max(0.6, quality - 0.07);
  }
  throw new Error("사진이 너무 커요");
}

export async function uploadImage(file) {
  const dataUrl = await compressImage(file);
  const res = await fetch("/api/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });
  if (res.status === 503) throw new Error("공유 저장소가 연결돼 있어야 사진을 올릴 수 있어요");
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "업로드 실패");
  return (await res.json()).id;
}

export function deleteImages(ids) {
  for (const id of ids || []) {
    fetch(`/api/image?id=${id}`, { method: "DELETE", keepalive: true }).catch(() => {});
  }
}

// 카드 안 썸네일
export function PhotoStrip({ images, onOpen }) {
  if (!images?.length) return null;
  return (
    <div className="photo-strip">
      {images.map((id, i) => (
        <button
          key={id}
          className="thumb"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(i);
          }}
          aria-label={`사진 ${i + 1} 크게 보기`}
        >
          <img src={imgUrl(id)} alt="" loading="lazy" />
        </button>
      ))}
    </div>
  );
}

// 크게 보기
export function Lightbox({ images, index, onClose }) {
  const [i, setI] = useState(index);
  const touch = useRef(null);
  const n = images.length;
  const go = (d) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="lightbox"
      onClick={onClose}
      onTouchStart={(e) => (touch.current = e.touches.length === 1 ? e.touches[0].clientX : null)}
      onTouchEnd={(e) => {
        if (touch.current == null || n < 2) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <div className="lb-top" onClick={(e) => e.stopPropagation()}>
        <span>{n > 1 ? `${i + 1} / ${n}` : ""}</span>
        <div>
          <a href={imgUrl(images[i])} target="_blank" rel="noreferrer">
            원본 열기
          </a>
          <button onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
      </div>
      <img src={imgUrl(images[i])} alt="" onClick={(e) => e.stopPropagation()} />
      {n > 1 && (
        <>
          <button className="lb-nav prev" onClick={(e) => (e.stopPropagation(), go(-1))} aria-label="이전">
            ‹
          </button>
          <button className="lb-nav next" onClick={(e) => (e.stopPropagation(), go(1))} aria-label="다음">
            ›
          </button>
        </>
      )}
    </div>
  );
}

// 수정 창 안의 사진 관리
export function PhotoEditor({ images, onAdd, onRemove }) {
  const [busy, setBusy] = useState(0);
  const inputRef = useRef(null);

  const onFiles = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setBusy((b) => b + list.length);
    for (const file of list) {
      try {
        const id = await uploadImage(file);
        onAdd(id);
      } catch (e) {
        alert(e.message);
      } finally {
        setBusy((b) => b - 1);
      }
    }
  };

  return (
    <div className="photo-editor">
      <div className="pe-label">사진 (탑승권, 예약 내역 캡처 등)</div>
      <div className="photo-strip">
        {images.map((id) => (
          <div key={id} className="thumb">
            <img src={imgUrl(id)} alt="" />
            <button className="thumb-x" onClick={() => onRemove(id)} aria-label="사진 빼기">
              ✕
            </button>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, k) => (
          <div key={"b" + k} className="thumb loading">
            <span className="spinner" />
          </div>
        ))}
        <button type="button" className="thumb add" onClick={() => inputRef.current?.click()}>
          <span>＋</span>
          <small>사진 추가</small>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
