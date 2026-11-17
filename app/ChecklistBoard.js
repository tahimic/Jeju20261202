"use client";

import { useEffect, useRef, useState } from "react";
import MoreMenu, { GripIcon } from "./MoreMenu";

// 체크리스트(할 일 / 준비물) 공용 화면
// - 평소: 체크만
// - [수정] 모드: 박스마다 ⋮(수정/삭제) + ≡(누른 채로 끌어서 순서·분류 이동)
export default function ChecklistBoard({
  items,
  groups, // 분류 목록 (할 일은 null)
  progressLabel,
  addPlaceholder,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
  onAdd,
  onUncheckAll,
  onGroupAdd,
  onGroupEdit,
  onGroupDelete,
}) {
  const [editMode, setEditMode] = useState(false);
  const [drag, setDrag] = useState(null); // { id, x, y, offX, offY, width, item }
  const [order, setOrder] = useState(null); // 끄는 동안의 임시 순서
  const [text, setText] = useState("");
  const [addGroupRaw, setAddGroup] = useState(groups ? groups[0] : null);
  const addGroup = groups ? (groups.includes(addGroupRaw) ? addGroupRaw : groups[0]) : null;
  const dragRef = useRef(null);
  const pointRef = useRef(null);
  const orderRef = useRef(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const setOrderBoth = (fn) =>
    setOrder((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      orderRef.current = next;
      return next;
    });

  const list = order || items;
  const done = items.filter((c) => c.done).length;

  const shownGroups = groups
    ? [...new Set([...groups, ...list.map((p) => p.group)])].filter(
        (g) => editMode || list.some((p) => p.group === g)
      )
    : [null];

  // 손가락 위치에 있는 박스/분류를 찾아 임시 순서를 바꿈
  const hitTest = () => {
    const d = dragRef.current;
    const pt = pointRef.current;
    if (!d || !pt) return;
    const el = document.elementFromPoint(pt.x, pt.y);
    if (!el) return;
    const li = el.closest("[data-item-id]");
    const zone = el.closest("[data-group]");
    setOrderBoth((prev) => {
      if (!prev) return prev;
      const it = prev.find((x) => x.id === d.id);
      const rest = prev.filter((x) => x.id !== d.id);
      let next;
      if (li && li.dataset.itemId !== d.id) {
        const r = li.getBoundingClientRect();
        const after = pt.y > r.top + r.height / 2;
        const target = rest.find((x) => x.id === li.dataset.itemId);
        const moved = groups ? { ...it, group: target.group } : it;
        const idx = rest.indexOf(target) + (after ? 1 : 0);
        next = [...rest.slice(0, idx), moved, ...rest.slice(idx)];
      } else if (!li && zone && groups) {
        const g = zone.dataset.group;
        if (it.group === g) return prev;
        const moved = { ...it, group: g };
        const last = rest.map((x) => x.group).lastIndexOf(g);
        const idx = last >= 0 ? last + 1 : rest.length;
        next = [...rest.slice(0, idx), moved, ...rest.slice(idx)];
      } else {
        return prev;
      }
      const same = next.every((x, i) => x.id === prev[i].id && x.group === prev[i].group);
      return same ? prev : next;
    });
  };

  const endDrag = () => {
    if (!dragRef.current) return;
    const ord = orderRef.current;
    const cur = itemsRef.current;
    const changed = ord && ord.some((x, i) => x.id !== cur[i]?.id || x.group !== cur[i]?.group);
    if (changed) onReorder(ord);
    dragRef.current = null;
    pointRef.current = null;
    orderRef.current = null;
    setDrag(null);
    setOrder(null);
  };

  // 끄는 동안: 손가락 따라가기 + 화면 끝에서 자동 스크롤
  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      if (!dragRef.current) return;
      e.preventDefault();
      pointRef.current = { x: e.clientX, y: e.clientY };
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      hitTest();
    };
    const up = () => endDrag();
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    const t = setInterval(() => {
      const pt = pointRef.current;
      if (!pt) return;
      const edge = 90;
      let dy = 0;
      if (pt.y < edge) dy = -Math.ceil((edge - pt.y) / 6);
      else if (pt.y > window.innerHeight - edge) dy = Math.ceil((pt.y - (window.innerHeight - edge)) / 6);
      if (dy) {
        window.scrollBy(0, dy);
        hitTest();
      }
    }, 16);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.id]);

  const startDrag = (e, item) => {
    e.preventDefault();
    const li = e.currentTarget.closest("li");
    const r = li.getBoundingClientRect();
    const d = { id: item.id, x: e.clientX, y: e.clientY, offX: e.clientX - r.left, offY: e.clientY - r.top, width: r.width, item };
    dragRef.current = d;
    pointRef.current = { x: e.clientX, y: e.clientY };
    setDrag(d);
    setOrderBoth(itemsRef.current.slice());
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const renderItem = (c) => (
    <li
      key={c.id}
      data-item-id={c.id}
      className={[c.done ? "done" : "", drag?.id === c.id ? "placeholder" : ""].join(" ")}
    >
      <div className="todo-label">
        <input type="checkbox" checked={!!c.done} aria-label="체크" onChange={() => onToggle(c.id)} />
        <span className="todo-text">{c.text}</span>
      </div>
      {editMode && (
        <div className="row-tools">
          <MoreMenu onEdit={() => onEdit(c)} onDelete={() => onDelete(c.id)} />
          <button
            className="grip"
            aria-label="누른 채로 끌어서 이동"
            onPointerDown={(e) => startDrag(e, c)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <GripIcon />
          </button>
        </div>
      )}
    </li>
  );

  return (
    <section className={drag ? "board dragging" : "board"}>
      <div className="progress">
        <div style={{ width: items.length ? `${(done / items.length) * 100}%` : 0 }} />
      </div>
      <div className="board-head">
        <div>
          <p className="sub">
            {progressLabel} {done}/{items.length}
          </p>
          {editMode && (
            <p className="hint-line">⋮ 수정·삭제 · ≡ 누른 채로 끌어서 {groups ? "순서·분류" : "순서"} 이동</p>
          )}
        </div>
        <div className="board-actions">
          {!editMode && onUncheckAll && done > 0 && (
            <button className="link" onClick={onUncheckAll}>
              체크 모두 해제
            </button>
          )}
          <button className={editMode ? "mode-btn on" : "mode-btn"} onClick={() => setEditMode((m) => !m)}>
            {editMode ? "완료" : "수정"}
          </button>
        </div>
      </div>

      {shownGroups.map((g) => {
        const sub = list.filter((p) => (groups ? p.group === g : true));
        const d = sub.filter((p) => p.done).length;
        return (
          <div key={g ?? "all"} className="pack-group" data-group={g ?? undefined}>
            {groups && (
              <div className="group-head">
                <h3>
                  {g}{" "}
                  <small className={sub.length && d === sub.length ? "all" : ""}>
                    {d}/{sub.length}
                  </small>
                </h3>
                {editMode && onGroupEdit && (
                  <MoreMenu onEdit={() => onGroupEdit(g)} onDelete={() => onGroupDelete(g)} />
                )}
              </div>
            )}
            <ul className="todos">
              {sub.map(renderItem)}
              {editMode && groups && sub.length === 0 && <li className="drop-empty">여기로 끌어다 놓기</li>}
            </ul>
          </div>
        );
      })}

      {editMode && onGroupAdd && (
        <button className="btn ghost full add-group" onClick={onGroupAdd}>
          + 분류 추가
        </button>
      )}

      {drag && (
        <div
          className="drag-ghost"
          style={{ left: drag.x - drag.offX, top: drag.y - drag.offY, width: drag.width }}
        >
          <input type="checkbox" checked={!!drag.item.done} readOnly />
          <span>{drag.item.text}</span>
          <span className="grip">
            <GripIcon />
          </span>
        </div>
      )}

      <form
        className="pack-add"
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim();
          if (!t) return;
          onAdd(t, addGroup);
          setText("");
        }}
      >
        {groups && groups.length > 0 && (
          <select value={addGroup} onChange={(e) => setAddGroup(e.target.value)}>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        )}
        <div className="todo-add">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={addPlaceholder} />
          <button className="btn primary">추가</button>
        </div>
      </form>
    </section>
  );
}
