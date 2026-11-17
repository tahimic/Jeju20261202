"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INITIAL_TRIP, INITIAL_PACKING, PACKING_GROUPS } from "./initialTrip";
import ChecklistBoard from "./ChecklistBoard";
import MoreMenu from "./MoreMenu";

const LOCAL_KEY = "trip-planner:local";
const uid = () => Math.random().toString(36).slice(2, 10);

const CATEGORIES = [
  { id: "spot", label: "관광", icon: "📍" },
  { id: "food", label: "식사", icon: "🍽️" },
  { id: "cafe", label: "카페", icon: "☕" },
  { id: "move", label: "이동", icon: "🚗" },
  { id: "stay", label: "숙소", icon: "🏨" },
  { id: "shop", label: "쇼핑", icon: "🛍️" },
  { id: "etc", label: "기타", icon: "📝" },
];
const catOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[6];

function todayStr() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function newTrip() {
  return structuredClone(INITIAL_TRIP);
}

// 준비물 목록이 생기기 전에 저장된 데이터에는 기본 준비물을 채워 넣어요.
const UNSORTED = "미분류";

function withPacking(t) {
  if (!t) return t;
  let next = t;
  if (!Array.isArray(next.packing)) next = { ...next, packing: structuredClone(INITIAL_PACKING) };
  if (!Array.isArray(next.packingGroups)) {
    next = { ...next, packingGroups: [...new Set([...PACKING_GROUPS, ...next.packing.map((p) => p.group).filter(Boolean)])] };
  }
  return next;
}

function emptyTrip() {
  return { title: "우리 여행", startDate: todayStr(), days: [{ id: uid(), note: "", items: [] }], info: [], checklist: [], packing: [], packingGroups: [] };
}

function Linkify({ text }) {
  const parts = String(text || "").split(/(https?:\/\/[^\s]+)/g);
  return parts.map((p, i) =>
    /^https?:\/\//.test(p) ? (
      <a key={i} href={p} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
        {p}
      </a>
    ) : (
      p
    )
  );
}

function dayDate(startDate, index) {
  if (!startDate) return null;
  const d = new Date(startDate + "T00:00:00");
  d.setDate(d.getDate() + index);
  return d;
}

function fmtDate(d, withYear = false) {
  if (!d) return "";
  const w = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${withYear ? d.getFullYear() + ". " : ""}${d.getMonth() + 1}/${d.getDate()} (${w})`;
}

function mapUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
}

export default function Page() {
  const [trip, setTrip] = useState(null);
  const [mode, setMode] = useState("loading"); // loading | cloud | local
  const [status, setStatus] = useState("");
  const [dayIdx, setDayIdx] = useState(0);
  const [editing, setEditing] = useState(null); // {item, isNew}
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [view, setView] = useState("plan"); // plan | info | todo
  const [infoEdit, setInfoEdit] = useState(null);
  const [todoText, setTodoText] = useState("");
  const [packText, setPackText] = useState("");
  const [packGroup, setPackGroup] = useState(PACKING_GROUPS[0]);
  const [listEdit, setListEdit] = useState(null);
  const [groupEdit, setGroupEdit] = useState(null); // { mode: "add" | "rename", old, name }
  const [expanded, setExpanded] = useState(() => new Set());
  const toggleExpand = (id) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    }); // { list: "checklist" | "packing", item }
  const saveTimer = useRef(null);
  const dirty = useRef(false);
  const pending = useRef(null);
  const modeRef = useRef("loading");
  modeRef.current = mode;

  // 저장 대기 중에 앱을 닫거나 다른 앱으로 넘어가도 바로 저장
  useEffect(() => {
    const flush = () => {
      const data = pending.current;
      if (!data) return;
      clearTimeout(saveTimer.current);
      pending.current = null;
      if (modeRef.current === "local") {
        try {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
        } catch {}
      } else {
        fetch("/api/trip", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          keepalive: true,
        }).catch(() => {});
      }
      dirty.current = false;
    };
    const onVis = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const load = useCallback(async (silent = false) => {
    if (dirty.current) return;
    try {
      const res = await fetch("/api/trip", { cache: "no-store" });
      if (!res.ok) throw new Error("not-configured");
      const data = await res.json();
      setMode("cloud");
      setTrip((prev) => {
        if (!data.trip) return prev || newTrip();
        if (prev && prev.updatedAt === data.trip.updatedAt) return prev;
        return withPacking(data.trip);
      });
      if (!silent) setStatus("");
    } catch {
      setMode("local");
      setTrip((prev) => {
        if (prev) return prev;
        try {
          const saved = localStorage.getItem(LOCAL_KEY);
          if (saved) return withPacking(JSON.parse(saved));
        } catch {}
        return newTrip();
      });
    }
  }, []);

  useEffect(() => {
    load();
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, 20000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(t);
    };
  }, [load]);

  const update = (fn) => {
    const next = fn(structuredClone(trip));
    setTrip(next);
    dirty.current = true;
    setStatus("저장 중…");
    clearTimeout(saveTimer.current);
    pending.current = next;
    saveTimer.current = setTimeout(() => persist(next), 700);
  };

  const persist = async (data) => {
    if (pending.current === data) pending.current = null;
    if (mode === "local") {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
      } catch {}
      dirty.current = false;
      setStatus("이 기기에 저장됨");
      setTimeout(() => setStatus((s) => (s === "이 기기에 저장됨" ? "" : s)), 2000);
      return;
    }
    try {
      const res = await fetch("/api/trip", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const { updatedAt } = await res.json();
      setTrip((prev) => (prev ? { ...prev, updatedAt } : prev));
      dirty.current = false;
      setStatus("저장됨 ✓");
      setTimeout(() => setStatus((s) => (s === "저장됨 ✓" ? "" : s)), 2000);
    } catch {
      setStatus("저장 실패 — 인터넷 연결을 확인해 주세요");
      saveTimer.current = setTimeout(() => persist(data), 5000);
    }
  };

  if (!trip) {
    return <main className="center">불러오는 중…</main>;
  }

  const days = trip.days;
  const info = trip.info || [];
  const checklist = trip.checklist || [];
  const doneCount = checklist.filter((c) => c.done).length;
  const packing = trip.packing || [];
  const packDone = packing.filter((c) => c.done).length;
  const packingGroups = trip.packingGroups || PACKING_GROUPS;
  const packGroups = [...new Set([...PACKING_GROUPS, ...packing.map((p) => p.group)])].filter((g) =>
    packing.some((p) => p.group === g)
  );
  const safeIdx = Math.min(dayIdx, days.length - 1);
  const day = days[safeIdx];
  const items = [...day.items].sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const start = dayDate(trip.startDate, 0);
  const end = dayDate(trip.startDate, days.length - 1);

  const saveItem = (item) => {
    update((t) => {
      const d = t.days[safeIdx];
      const i = d.items.findIndex((x) => x.id === item.id);
      if (i >= 0) d.items[i] = item;
      else d.items.push(item);
      return t;
    });
    setEditing(null);
  };

  const deleteItem = (id) => {
    if (!confirm("이 일정을 삭제할까요?")) return;
    update((t) => {
      t.days[safeIdx].items = t.days[safeIdx].items.filter((x) => x.id !== id);
      return t;
    });
    setEditing(null);
  };

  const deleteInfo = (id) => {
    if (!confirm("이 카드를 삭제할까요?")) return;
    update((t) => {
      t.info = (t.info || []).filter((x) => x.id !== id);
      return t;
    });
    setInfoEdit(null);
  };

  const toggleDone = (id) => {
    update((t) => {
      const it = t.days[safeIdx].items.find((x) => x.id === id);
      if (it) it.done = !it.done;
      return t;
    });
  };

  const addDay = () => {
    update((t) => {
      t.days.push({ id: uid(), note: "", items: [] });
      return t;
    });
    setDayIdx(days.length);
  };

  const removeDay = () => {
    if (days.length <= 1) return alert("마지막 하루는 삭제할 수 없어요.");
    if (!confirm(`Day ${safeIdx + 1}의 일정을 모두 삭제할까요?`)) return;
    update((t) => {
      t.days.splice(safeIdx, 1);
      return t;
    });
    setDayIdx(Math.max(0, safeIdx - 1));
  };

  return (
    <main>
      <header className="top">
        <div>
          <h1>{trip.title || "우리 여행"}</h1>
          <p className="sub">
            {fmtDate(start, true)} – {fmtDate(end)} · {days.length - 1}박 {days.length}일
          </p>
        </div>
        <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="여행 설정">
          ⚙️
        </button>
      </header>

      {mode === "local" && (
        <div className="banner">
          아직 공유 저장소가 연결되지 않아 이 기기에만 저장돼요. README의 &lsquo;저장소 연결&rsquo;을 따라 하면
          남편분과 함께 볼 수 있어요.
        </div>
      )}

      <div className="views">
        <button className={view === "plan" ? "on" : ""} onClick={() => setView("plan")}>
          📅 일정
        </button>
        <button className={view === "info" ? "on" : ""} onClick={() => setView("info")}>
          🎫 예약
        </button>
        <button className={view === "todo" ? "on" : ""} onClick={() => setView("todo")}>
          ✅ 할 일 {checklist.length > 0 && <small>{doneCount}/{checklist.length}</small>}
        </button>
        <button className={view === "pack" ? "on" : ""} onClick={() => setView("pack")}>
          🎒 준비물 {packing.length > 0 && <small>{packDone}/{packing.length}</small>}
        </button>
      </div>

      {view === "pack" && (
        <ChecklistBoard
          items={packing}
          groups={packingGroups}
          progressLabel="챙긴 준비물"
          onGroupAdd={() => setGroupEdit({ mode: "add", name: "" })}
          onGroupEdit={(g) => setGroupEdit({ mode: "rename", old: g, name: g })}
          onGroupDelete={(g) => {
            const n = packing.filter((p) => p.group === g).length;
            if (g === UNSORTED && n > 0) {
              alert(`'${UNSORTED}'에 준비물이 남아 있어요. 다른 분류로 옮긴 뒤 삭제해 주세요.`);
              return;
            }
            const msg = n
              ? `'${g}' 분류를 삭제할까요?\n안에 있는 준비물 ${n}개는 '${UNSORTED}'로 옮겨져요.`
              : `'${g}' 분류를 삭제할까요?`;
            if (!confirm(msg)) return;
            update((t) => {
              t.packingGroups = (t.packingGroups || []).filter((x) => x !== g);
              if (n) {
                t.packing.forEach((p) => {
                  if (p.group === g) p.group = UNSORTED;
                });
                if (!t.packingGroups.includes(UNSORTED)) t.packingGroups.push(UNSORTED);
              }
              return t;
            });
          }}
          addPlaceholder="준비물 추가"
          onToggle={(id) =>
            update((t) => {
              const x = t.packing.find((y) => y.id === id);
              if (x) x.done = !x.done;
              return t;
            })
          }
          onEdit={(item) => setListEdit({ list: "packing", item })}
          onDelete={(id) =>
            update((t) => {
              t.packing = t.packing.filter((y) => y.id !== id);
              return t;
            })
          }
          onReorder={(next) =>
            update((t) => {
              t.packing = next;
              return t;
            })
          }
          onAdd={(text, group) =>
            update((t) => {
              const g = group || UNSORTED;
              t.packingGroups = t.packingGroups || [];
              if (!t.packingGroups.includes(g)) t.packingGroups.push(g);
              t.packing = [...(t.packing || []), { id: uid(), group: g, text, done: false }];
              return t;
            })
          }
          onUncheckAll={() => {
            if (!confirm("체크 표시를 모두 해제할까요? (돌아올 때 짐 쌀 때 유용해요)")) return;
            update((t) => {
              t.packing.forEach((p) => (p.done = false));
              return t;
            });
          }}
        />
      )}

      {view === "info" && (
        <section>
          {info.map((c) => (
            <div key={c.id} className="info-card" onClick={() => setInfoEdit(c)}>
              <div className="card-top">
                <h3>{c.title}</h3>
                <MoreMenu onEdit={() => setInfoEdit(c)} onDelete={() => deleteInfo(c.id)} />
              </div>
              <p>
                <Linkify text={c.body} />
              </p>
            </div>
          ))}
          <button className="btn ghost full" onClick={() => setInfoEdit({ id: uid(), title: "", body: "", isNew: true })}>
            + 정보 카드 추가
          </button>
        </section>
      )}

      {view === "todo" && (
        <ChecklistBoard
          items={checklist}
          groups={null}
          progressLabel="준비 진행률"
          addPlaceholder="할 일 추가 (예: 아기 기저귀 챙기기)"
          onToggle={(id) =>
            update((t) => {
              const x = t.checklist.find((y) => y.id === id);
              if (x) x.done = !x.done;
              return t;
            })
          }
          onEdit={(item) => setListEdit({ list: "checklist", item })}
          onDelete={(id) =>
            update((t) => {
              t.checklist = t.checklist.filter((y) => y.id !== id);
              return t;
            })
          }
          onReorder={(next) =>
            update((t) => {
              t.checklist = next;
              return t;
            })
          }
          onAdd={(text, group) =>
            update((t) => {
              t.checklist = [...(t.checklist || []), { id: uid(), text, done: false }];
              return t;
            })
          }
        />
      )}

      {view === "plan" && (
      <>
      <nav className="tabs">
        {days.map((d, i) => (
          <button key={d.id} className={i === safeIdx ? "tab active" : "tab"} onClick={() => setDayIdx(i)}>
            <span className="tab-day">Day {i + 1}</span>
            <span className="tab-date">{fmtDate(dayDate(trip.startDate, i))}</span>
          </button>
        ))}
        <button className="tab add" onClick={addDay}>
          + 하루
        </button>
      </nav>

      <section className="day">
        <div className="day-head">
          <h2>
            Day {safeIdx + 1} <small>{fmtDate(dayDate(trip.startDate, safeIdx), true)}</small>
          </h2>
          <button className="link danger" onClick={removeDay}>
            이 날 삭제
          </button>
        </div>

        <textarea
          className="day-note"
          placeholder="이 날 메모 (예: 숙소 체크아웃 11시, 렌터카 반납)"
          value={day.note || ""}
          onChange={(e) =>
            update((t) => {
              t.days[safeIdx].note = e.target.value;
              return t;
            })
          }
          rows={2}
        />

        {items.length === 0 && <p className="empty">아직 일정이 없어요. 아래 버튼으로 추가해 보세요.</p>}

        <ol className="timeline">
          {items.map((it) => {
            const c = catOf(it.category);
            const hasDetail = !!(it.place || it.memo || it.cost || it.link);
            const open = expanded.has(it.id);
            return (
              <li key={it.id} className="item">
                <div className="time">{it.time || "—"}</div>
                <div className="dot">{c.icon}</div>
                <div
                  className={open ? "card open" : "card"}
                  onClick={() => hasDetail && toggleExpand(it.id)}
                  role={hasDetail ? "button" : undefined}
                  aria-expanded={hasDetail ? open : undefined}
                >
                  <div className="card-top">
                    <strong>{it.title || "(제목 없음)"}</strong>
                    <span className="card-tools">
                      {hasDetail && <span className="chev" aria-hidden="true">⌄</span>}
                      <MoreMenu onEdit={() => setEditing({ item: it })} onDelete={() => deleteItem(it.id)} />
                    </span>
                  </div>
                  {open && (
                    <div className="detail">
                      {it.place && (
                        <a className="place" href={mapUrl(it.place)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                          🗺️ {it.place}
                        </a>
                      )}
                      {it.memo && <p className="memo">{it.memo}</p>}
                      {(it.cost || it.link) && (
                        <div className="meta">
                          {it.cost && <span>💰 {it.cost}</span>}
                          {it.link && (
                            <a href={it.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                              🔗 링크
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <button
        className="fab"
        onClick={() => setEditing({ isNew: true, item: { id: uid(), time: "", title: "", place: "", memo: "", category: "spot" } })}
      >
        + 일정 추가
      </button>
      </>
      )}

      {status && <div className="toast">{status}</div>}

      {editing && (
        <ItemSheet
          initial={editing.item}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSave={saveItem}
          onDelete={() => deleteItem(editing.item.id)}
        />
      )}

      {listEdit && (
        <ListItemSheet
          initial={listEdit.item}
          groups={listEdit.list === "packing" ? packingGroups : null}
          title={listEdit.list === "packing" ? "준비물 수정" : "할 일 수정"}
          onClose={() => setListEdit(null)}
          onSave={(item) => {
            if (!item.text.trim()) return alert("내용을 입력해 주세요.");
            update((t) => {
              const arr = t[listEdit.list];
              const i = arr.findIndex((x) => x.id === item.id);
              if (i >= 0) arr[i] = { ...item, text: item.text.trim() };
              return t;
            });
            setListEdit(null);
          }}
          onDelete={() => {
            update((t) => {
              t[listEdit.list] = t[listEdit.list].filter((x) => x.id !== listEdit.item.id);
              return t;
            });
            setListEdit(null);
          }}
        />
      )}

      {infoEdit && (
        <InfoSheet
          initial={infoEdit}
          onClose={() => setInfoEdit(null)}
          onSave={(c) => {
            const { isNew, ...card } = c;
            update((t) => {
              t.info = t.info || [];
              const i = t.info.findIndex((x) => x.id === card.id);
              if (i >= 0) t.info[i] = card;
              else t.info.push(card);
              return t;
            });
            setInfoEdit(null);
          }}
          onDelete={() => deleteInfo(infoEdit.id)}
        />
      )}

      {groupEdit && (
        <GroupSheet
          initial={groupEdit}
          onClose={() => setGroupEdit(null)}
          onSave={(name) => {
            const n = name.trim();
            if (!n) return alert("분류 이름을 입력해 주세요.");
            if (n !== groupEdit.old && packingGroups.includes(n)) return alert("이미 있는 분류 이름이에요.");
            update((t) => {
              t.packingGroups = t.packingGroups || [];
              if (groupEdit.mode === "add") {
                t.packingGroups.push(n);
              } else {
                t.packingGroups = t.packingGroups.map((x) => (x === groupEdit.old ? n : x));
                if (!t.packingGroups.includes(n)) t.packingGroups.push(n);
                t.packing.forEach((p) => {
                  if (p.group === groupEdit.old) p.group = n;
                });
              }
              return t;
            });
            setGroupEdit(null);
          }}
        />
      )}

      {settingsOpen && (
        <SettingsSheet
          trip={trip}
          onClose={() => setSettingsOpen(false)}
          onReset={(kind) => {
            const msg =
              kind === "seed"
                ? "지금 내용을 지우고 처음 넣어둔 제주 일정으로 되돌릴까요?"
                : "모든 일정을 지우고 빈 여행으로 새로 시작할까요?";
            if (!confirm(msg)) return;
            update(() => (kind === "seed" ? newTrip() : emptyTrip()));
            setDayIdx(0);
            setSettingsOpen(false);
          }}
          onSave={(title, startDate) => {
            update((t) => {
              t.title = title;
              t.startDate = startDate;
              return t;
            });
            setSettingsOpen(false);
          }}
        />
      )}
    </main>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ItemSheet({ initial, isNew, onClose, onSave, onDelete }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <Sheet title={isNew ? "일정 추가" : "일정 수정"} onClose={onClose}>
      <div className="chips">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={f.category === c.id ? "chip on" : "chip"}
            onClick={() => setF({ ...f, category: c.id })}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>
      <div className="row">
        <label className="narrow">
          시간
          <input type="time" value={f.time} onChange={set("time")} />
        </label>
        <label>
          제목
          <input value={f.title} onChange={set("title")} placeholder="예: 성산일출봉" autoFocus={isNew} />
        </label>
      </div>
      <label>
        장소 (지도에서 검색할 이름이나 주소)
        <input value={f.place} onChange={set("place")} placeholder="예: 제주 서귀포시 성산읍" />
      </label>
      <label>
        메모
        <textarea value={f.memo} onChange={set("memo")} rows={3} placeholder="예약번호, 준비물, 주의사항 등" />
      </label>
      <div className="row">
        <label>
          비용
          <input value={f.cost || ""} onChange={set("cost")} placeholder="예: 2인 30,000원" />
        </label>
        <label>
          링크
          <input value={f.link || ""} onChange={set("link")} placeholder="https://" inputMode="url" />
        </label>
      </div>
      <div className="actions">
        {!isNew && (
          <button className="btn ghost danger" onClick={onDelete}>
            삭제
          </button>
        )}
        <button className="btn primary" onClick={() => onSave(f)}>
          저장
        </button>
      </div>
    </Sheet>
  );
}

function ListItemSheet({ initial, groups, title, onClose, onSave, onDelete }) {
  const [f, setF] = useState(initial);
  return (
    <Sheet title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(f);
        }}
      >
        <label>
          내용
          <input value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} autoFocus />
        </label>
        {groups && (
          <label>
            분류
            <select className="field" value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })}>
              {[...new Set([...groups, f.group])].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
        )}
        <label className="check-row">
          <input type="checkbox" checked={!!f.done} onChange={(e) => setF({ ...f, done: e.target.checked })} />
          {groups ? "챙김" : "완료"}
        </label>
        <div className="actions">
          <button type="button" className="btn ghost danger" onClick={onDelete}>
            삭제
          </button>
          <button className="btn primary">저장</button>
        </div>
      </form>
    </Sheet>
  );
}

function InfoSheet({ initial, onClose, onSave, onDelete }) {
  const [f, setF] = useState(initial);
  return (
    <Sheet title={initial.isNew ? "정보 카드 추가" : "정보 카드 수정"} onClose={onClose}>
      <label>
        제목
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="예: ✈️ 항공권" />
      </label>
      <label>
        내용
        <textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} rows={10} />
      </label>
      <div className="actions">
        {!initial.isNew && (
          <button className="btn ghost danger" onClick={onDelete}>
            삭제
          </button>
        )}
        <button className="btn primary" onClick={() => onSave(f)}>
          저장
        </button>
      </div>
    </Sheet>
  );
}

function GroupSheet({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial.name);
  return (
    <Sheet title={initial.mode === "add" ? "분류 추가" : "분류 이름 수정"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(name);
        }}
      >
        <label>
          분류 이름
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 🏖️ 물놀이" autoFocus />
        </label>
        <p className="hint">이모지를 앞에 붙이면 보기 좋아요.</p>
        <div className="actions">
          <button className="btn primary">저장</button>
        </div>
      </form>
    </Sheet>
  );
}

function SettingsSheet({ trip, onClose, onSave, onReset }) {
  const [title, setTitle] = useState(trip.title);
  const [startDate, setStartDate] = useState(trip.startDate);
  return (
    <Sheet title="여행 설정" onClose={onClose}>
      <label>
        여행 이름
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        출발일
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>
      <p className="hint">날짜는 출발일부터 Day 순서대로 자동 계산돼요.</p>
      <div className="actions">
        <button className="btn primary" onClick={() => onSave(title, startDate)}>
          저장
        </button>
      </div>
      <div className="reset">
        <button className="link" onClick={() => onReset("seed")}>
          기본 제주 일정 다시 불러오기
        </button>
        <button className="link danger" onClick={() => onReset("empty")}>
          빈 여행으로 새로 시작
        </button>
      </div>
    </Sheet>
  );
}
