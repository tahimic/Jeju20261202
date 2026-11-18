"use client";

import { useState } from "react";
import Sheet from "./Sheet";
import MoreMenu from "./MoreMenu";

export const BUDGET_CATS = [
  { id: "flight", label: "항공", icon: "✈️" },
  { id: "car", label: "교통·렌터카", icon: "🚗" },
  { id: "stay", label: "숙소", icon: "🏨" },
  { id: "food", label: "식비", icon: "🍽️" },
  { id: "cafe", label: "카페·간식", icon: "☕" },
  { id: "tour", label: "관광·체험", icon: "🎟️" },
  { id: "shop", label: "쇼핑·기념품", icon: "🛍️" },
  { id: "baby", label: "아기용품", icon: "👶" },
  { id: "etc", label: "기타", icon: "📦" },
];
const catOf = (id) => BUDGET_CATS.find((c) => c.id === id) || BUDGET_CATS[BUDGET_CATS.length - 1];

export const won = (n) => `${Math.round(Number(n) || 0).toLocaleString("ko-KR")}원`;
const toNum = (s) => Number(String(s).replace(/[^\d]/g, "")) || 0;

export function MoneyInput({ value, onChange, placeholder, autoFocus }) {
  return (
    <div className="money-input">
      <input
        inputMode="numeric"
        value={value ? Number(value).toLocaleString("ko-KR") : ""}
        onChange={(e) => onChange(toNum(e.target.value))}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      <span>원</span>
    </div>
  );
}

// when: "pre"(여행 전) 또는 Day 순번(0, 1, 2…)
export default function BudgetView({ budget, derived = [], dayCount, dayLabel, defaultWhen, onChange, onGoSource, onEditSource, onClearSource }) {
  const [edit, setEdit] = useState(null); // { item, isNew }
  const [totalOpen, setTotalOpen] = useState(false);
  const manual = (budget.items || []).map((x) => ({ ...x, source: "manual" }));
  const items = [...derived, ...manual];
  const total = budget.total || 0;
  const paid = items.filter((x) => x.paid).reduce((s, x) => s + (x.amount || 0), 0);
  const planned = items.filter((x) => !x.paid).reduce((s, x) => s + (x.amount || 0), 0);
  const spent = paid + planned;
  const left = total - spent;

  const save = (item) =>
    onChange((b) => {
      const i = b.items.findIndex((x) => x.id === item.id);
      if (i >= 0) b.items[i] = item;
      else b.items.push(item);
      return b;
    });
  const remove = (id) => {
    if (!confirm("이 지출을 삭제할까요?")) return;
    onChange((b) => {
      b.items = b.items.filter((x) => x.id !== id);
      return b;
    });
  };

  // 분류별 합계
  const byCat = BUDGET_CATS.map((c) => ({
    ...c,
    sum: items.filter((x) => (x.category || "etc") === c.id).reduce((s, x) => s + (x.amount || 0), 0),
  }))
    .filter((c) => c.sum > 0)
    .sort((a, b) => b.sum - a.sum);

  // 언제별 묶음
  const whenKey = (x) => (x.when === "pre" || x.when == null ? "pre" : Math.min(Number(x.when), dayCount - 1));
  const sections = ["pre", ...Array.from({ length: dayCount }, (_, i) => i)]
    .map((k) => ({
      key: k,
      list: items
        .filter((x) => whenKey(x) === k)
        .sort((a, b) => (a.source === "manual") - (b.source === "manual") || (a.time || "").localeCompare(b.time || "")),
    }))
    .filter((s) => s.list.length > 0);

  const pct = (n) => (total > 0 ? Math.min(100, (n / total) * 100) : spent > 0 ? (n / spent) * 100 : 0);

  return (
    <section className="budget">
      <div className="budget-summary">
        <div className="bs-top">
          <span className="sub">총 예산</span>
          <button className="link" onClick={() => setTotalOpen(true)}>
            {total > 0 ? won(total) + " ✎" : "예산 설정하기"}
          </button>
        </div>
        {total > 0 ? (
          <>
            <div className={left < 0 ? "bs-left over" : "bs-left"}>
              {left < 0 ? `${won(-left)} 초과` : `${won(left)} 남음`}
            </div>
            <div className="bs-bar">
              <div className="paid" style={{ width: pct(paid) + "%" }} />
              <div className="planned" style={{ width: Math.max(0, Math.min(100 - pct(paid), pct(planned))) + "%" }} />
            </div>
          </>
        ) : (
          <div className="bs-left">{won(spent)}</div>
        )}
        <div className="bs-legend">
          <span>
            <i className="dot-paid" /> 결제 완료 {won(paid)}
          </span>
          <span>
            <i className="dot-planned" /> 예정 {won(planned)}
          </span>
        </div>
      </div>

      {byCat.length > 0 && (
        <div className="budget-cats">
          <h3>분류별</h3>
          {byCat.map((c) => (
            <div key={c.id} className="bc-row">
              <span className="bc-name">
                {c.icon} {c.label}
              </span>
              <div className="bc-bar">
                <div style={{ width: (c.sum / byCat[0].sum) * 100 + "%" }} />
              </div>
              <span className="bc-amt">{won(c.sum)}</span>
            </div>
          ))}
        </div>
      )}

      {sections.length === 0 && <p className="empty">아직 지출이 없어요. 아래 버튼으로 추가해 보세요.</p>}

      {sections.map((s) => (
        <div key={s.key} className="budget-sec">
          <div className="sec-head">
            <h3>{s.key === "pre" ? "여행 전" : dayLabel(s.key)}</h3>
            <span>{won(s.list.reduce((a, x) => a + (x.amount || 0), 0))}</span>
          </div>
          <ul className="exp-list">
            {s.list.map((x) => {
              const c = catOf(x.category);
              return (
                <li key={x.id}>
                  <span className="exp-icon">{c.icon}</span>
                  <div className="exp-main">
                    <div className="exp-title">
                      {x.title || c.label}
                      {!x.paid && <span className="chip-planned">예정</span>}
                    </div>
                    {x.memo && <div className="exp-memo">{x.memo}</div>}
                    {x.source !== "manual" && (
                      <button className="src-badge" onClick={() => onGoSource(x)}>
                        {x.source === "plan" ? `📅 일정 · Day ${x.dayIndex + 1}${x.time ? " " + x.time : ""}` : "🎫 예약"} ›
                      </button>
                    )}
                  </div>
                  <span className={x.paid ? "exp-amt" : "exp-amt planned"}>{won(x.amount)}</span>
                  {x.source === "manual" ? (
                    <MoreMenu
                      onEdit={() => {
                        const { source, ...item } = x;
                        setEdit({ item });
                      }}
                      onDelete={() => remove(x.id)}
                    />
                  ) : (
                    <MoreMenu onEdit={() => onEditSource(x)} onDelete={() => onClearSource(x)} />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <button
        className="fab"
        onClick={() =>
          setEdit({
            isNew: true,
            item: {
              id: Math.random().toString(36).slice(2, 10),
              title: "",
              amount: 0,
              category: "food",
              when: defaultWhen,
              paid: true,
              memo: "",
            },
          })
        }
      >
        + 지출 추가
      </button>

      {edit && (
        <ExpenseSheet
          initial={edit.item}
          isNew={edit.isNew}
          dayCount={dayCount}
          dayLabel={dayLabel}
          onClose={() => setEdit(null)}
          onSave={(it) => {
            if (!it.amount) return alert("금액을 입력해 주세요.");
            save(it);
            setEdit(null);
          }}
          onDelete={() => {
            remove(edit.item.id);
            setEdit(null);
          }}
        />
      )}

      {totalOpen && (
        <TotalSheet
          value={total}
          onClose={() => setTotalOpen(false)}
          onSave={(v) => {
            onChange((b) => {
              b.total = v;
              return b;
            });
            setTotalOpen(false);
          }}
        />
      )}
    </section>
  );
}

function ExpenseSheet({ initial, isNew, dayCount, dayLabel, onClose, onSave, onDelete }) {
  const [f, setF] = useState(initial);
  return (
    <Sheet
      title={isNew ? "지출 추가" : "지출 수정"}
      onClose={onClose}
      dirty={JSON.stringify(f) !== JSON.stringify(initial)}
      onSave={() => onSave(f)}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(f);
        }}
      >
        <div className="seg">
          <button type="button" className={f.paid ? "on" : ""} onClick={() => setF({ ...f, paid: true })}>
            결제 완료
          </button>
          <button type="button" className={!f.paid ? "on" : ""} onClick={() => setF({ ...f, paid: false })}>
            예정
          </button>
        </div>
        <label>
          금액
          <MoneyInput value={f.amount} onChange={(v) => setF({ ...f, amount: v })} placeholder="0" autoFocus={isNew} />
        </label>
        <label>
          내용
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="예: 점심 고기국수" />
        </label>
        <div className="pe-label" style={{ marginTop: 12 }}>
          분류
        </div>
        <div className="chips" style={{ marginTop: 6 }}>
          {BUDGET_CATS.map((c) => (
            <button
              type="button"
              key={c.id}
              className={f.category === c.id ? "chip on" : "chip"}
              onClick={() => setF({ ...f, category: c.id })}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <label>
          언제
          <select
            className="field"
            value={String(f.when ?? "pre")}
            onChange={(e) => setF({ ...f, when: e.target.value === "pre" ? "pre" : Number(e.target.value) })}
          >
            <option value="pre">여행 전 (미리 결제)</option>
            {Array.from({ length: dayCount }, (_, i) => (
              <option key={i} value={i}>
                {dayLabel(i)}
              </option>
            ))}
          </select>
        </label>
        <label>
          메모
          <input value={f.memo || ""} onChange={(e) => setF({ ...f, memo: e.target.value })} placeholder="예: 카드 결제, 남편 계산" />
        </label>
        <div className="actions">
          {!isNew && (
            <button type="button" className="btn ghost danger" onClick={onDelete}>
              삭제
            </button>
          )}
          <button className="btn primary">저장</button>
        </div>
      </form>
    </Sheet>
  );
}

function TotalSheet({ value, onClose, onSave }) {
  const [v, setV] = useState(value || 0);
  return (
    <Sheet title="총 예산" onClose={onClose} dirty={(v || 0) !== (value || 0)} onSave={() => onSave(v)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(v);
        }}
      >
        <label>
          이번 여행 전체 예산
          <MoneyInput value={v} onChange={setV} placeholder="예: 1,500,000" autoFocus />
        </label>
        <div className="chips" style={{ marginTop: 10 }}>
          {[100000, 500000].map((n) => (
            <button type="button" key={n} className="chip" onClick={() => setV((x) => (x || 0) + n)}>
              +{(n / 10000).toLocaleString()}만
            </button>
          ))}
          <button type="button" className="chip" onClick={() => setV(0)}>
            지우기
          </button>
        </div>
        <div className="actions">
          <button className="btn primary">저장</button>
        </div>
      </form>
    </Sheet>
  );
}
