// 일정 · 예약 · 예산 연결 도우미

// 일정 분류 → 예산 분류
export const PLAN_TO_BUDGET = { spot: "tour", food: "food", cafe: "cafe", move: "car", stay: "stay", shop: "shop", etc: "etc" };

// 예약 카드 제목으로 예산 분류 추측 (수정 창에서 바꿀 수 있어요)
export function guessInfoCat(title = "") {
  if (/✈|항공|비행|탑승/.test(title)) return "flight";
  if (/🚗|렌터카|렌트|차량|주유/.test(title)) return "car";
  if (/🏡|🏨|숙소|호텔|펜션|리조트/.test(title)) return "stay";
  if (/🎟|입장|체험|투어|관광/.test(title)) return "tour";
  return "etc";
}

const parseAmount = (s) => {
  const m = String(s || "").replace(/,/g, "").match(/\d{3,}/);
  return m ? Number(m[0]) : 0;
};

// 처음 넣어둔 일정에서 예약 카드로 이어지는 기본 연결
const DEFAULT_LINKS = { d1a: "i1", d3e: "i1", d3f: "i1", d1b: "i2", d3d: "i2", d1e: "i3", d3c: "i3" };

// 연결 기능 이전 데이터를 한 번만 바꿔요 (두 휴대폰에서 똑같이 바뀌어요)
export function migrateLinks(t) {
  if (!t || t.linkedV1) return t;
  const next = structuredClone(t);
  const infoIds = new Set((next.info || []).map((c) => c.id));
  let bbqLinked = false;
  for (const d of next.days || []) {
    for (const it of d.items || []) {
      if (it.cost && !it.amount) {
        const n = parseAmount(it.cost);
        if (n) {
          it.amount = n;
          it.paid = false;
          if (/바비큐/.test(it.cost + it.title)) bbqLinked = true;
        } else {
          it.memo = [it.memo, it.cost].filter(Boolean).join("\n");
        }
        delete it.cost;
      }
      if (!it.infoId && DEFAULT_LINKS[it.id] && infoIds.has(DEFAULT_LINKS[it.id])) it.infoId = DEFAULT_LINKS[it.id];
    }
  }
  // 예산 탭에 따로 있던 "숙소 바비큐"는 일정 쪽 금액과 겹치니 하나만 남겨요
  if (bbqLinked && next.budget?.items) {
    next.budget.items = next.budget.items.filter((x) => !(x.id === "b1" && /바비큐/.test(x.title)));
  }
  next.linkedV1 = true;
  return next;
}

// 일정·예약에서 자동으로 들어오는 예산 항목
export function derivedExpenses(trip) {
  const out = [];
  (trip.info || []).forEach((c) => {
    if (c.amount > 0) {
      out.push({
        id: "info:" + c.id,
        source: "info",
        refId: c.id,
        title: (c.title || "").replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, ""),
        amount: c.amount,
        paid: c.paid !== false,
        category: c.budgetCat || guessInfoCat(c.title),
        when: "pre",
      });
    }
  });
  (trip.days || []).forEach((d, di) => {
    (d.items || []).forEach((it) => {
      if (it.amount > 0) {
        out.push({
          id: "plan:" + it.id,
          source: "plan",
          refId: it.id,
          dayIndex: di,
          time: it.time,
          title: it.title,
          amount: it.amount,
          paid: !!it.paid,
          category: PLAN_TO_BUDGET[it.category] || "etc",
          when: di,
        });
      }
    });
  });
  return out;
}
