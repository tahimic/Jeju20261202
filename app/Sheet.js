"use client";

import { useState } from "react";

// 편집 창
// - dirty(고친 내용 있음)일 때 바깥을 누르면 "저장할까요?" → 예: 저장, 아니요: 계속 작성
// - dirty일 때 ✕를 누르면 "저장하지 않고 닫을까요?" → 닫기 / 계속 작성
export default function Sheet({ title, onClose, children, dirty = false, onSave }) {
  const [ask, setAsk] = useState(null); // "save" | "discard" | null
  const guarded = dirty && typeof onSave === "function";

  return (
    <div className="overlay" onClick={() => (guarded ? setAsk("save") : onClose())}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{title}</h3>
          <button
            type="button"
            className="icon-btn"
            onClick={() => (guarded ? setAsk("discard") : onClose())}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        {children}
      </div>

      {ask && (
        <div className="ask-backdrop" onClick={(e) => (e.stopPropagation(), setAsk(null))}>
          <div className="ask" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {ask === "save" ? (
              <>
                <p className="ask-title">작성 중인 내용을 저장할까요?</p>
                <p className="ask-sub">아니요를 누르면 이어서 작성할 수 있어요.</p>
                <div className="ask-actions">
                  <button type="button" className="btn ghost" onClick={() => setAsk(null)}>
                    아니요
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      setAsk(null);
                      onSave();
                    }}
                  >
                    예
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="ask-title">저장하지 않고 닫을까요?</p>
                <p className="ask-sub">작성한 내용은 사라져요.</p>
                <div className="ask-actions">
                  <button type="button" className="btn ghost" onClick={() => setAsk(null)}>
                    계속 작성
                  </button>
                  <button type="button" className="btn primary danger-fill" onClick={onClose}>
                    닫기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
