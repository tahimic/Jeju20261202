"use client";

import { useEffect, useRef, useState } from "react";

export function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="19" r="2" fill="currentColor" />
    </svg>
  );
}

export function GripIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// ⋮ 버튼 → 수정 / 삭제 메뉴
export default function MoreMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <span className="more" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button className="more-btn" aria-label="더보기" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <DotsIcon />
      </button>
      {open && (
        <div className="more-menu" role="menu">
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            ✏️ 수정
          </button>
          <button
            role="menuitem"
            className="danger"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            🗑️ 삭제
          </button>
        </div>
      )}
    </span>
  );
}
