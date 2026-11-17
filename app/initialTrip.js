// 처음 열었을 때(저장된 데이터가 없을 때) 채워지는 기본 일정.
// 설정(⚙️) → "기본 일정 다시 불러오기"로 언제든 이 내용으로 되돌릴 수 있어요.

const STAY_ADDR = "제주특별자치도 제주시 애월해안로 770-15";

export const PACKING_GROUPS = ["📄 필수·서류", "🍼 아기 수유", "🧷 아기 기저귀·위생", "👶 아기 옷·외출", "💊 아기 건강", "🧥 어른 옷", "🧴 세면·기타"];

export const INITIAL_PACKING = [
  { id: "p1", group: "📄 필수·서류", text: "신분증 (어른 2명)", done: false },
  { id: "p2", group: "📄 필수·서류", text: "아기 탑승용 등본 또는 가족관계증명서 (발급 3개월 이내)", done: false },
  { id: "p3", group: "📄 필수·서류", text: "운전면허증 (렌터카 인수 필수)", done: false },
  { id: "p4", group: "📄 필수·서류", text: "렌터카 결제한 신용카드", done: false },
  { id: "p5", group: "📄 필수·서류", text: "휴대폰 충전기 · 보조배터리", done: false },
  { id: "p6", group: "📄 필수·서류", text: "항공·렌터카·숙소 예약 내역 캡처", done: false },
  { id: "p7", group: "🍼 아기 수유", text: "분유 (끼니별 소분)", done: false },
  { id: "p8", group: "🍼 아기 수유", text: "젖병 · 젖꼭지", done: false },
  { id: "p9", group: "🍼 아기 수유", text: "보온병 (뜨거운 물)", done: false },
  { id: "p10", group: "🍼 아기 수유", text: "젖병 세정제 · 젖병솔", done: false },
  { id: "p11", group: "🍼 아기 수유", text: "턱받이 · 가제수건", done: false },
  { id: "p12", group: "🍼 아기 수유", text: "공갈젖꼭지", done: false },
  { id: "p13", group: "🧷 아기 기저귀·위생", text: "기저귀 (넉넉하게)", done: false },
  { id: "p14", group: "🧷 아기 기저귀·위생", text: "물티슈", done: false },
  { id: "p15", group: "🧷 아기 기저귀·위생", text: "기저귀 크림", done: false },
  { id: "p16", group: "🧷 아기 기저귀·위생", text: "방수 매트 (기저귀 갈이용)", done: false },
  { id: "p17", group: "🧷 아기 기저귀·위생", text: "비닐봉투 (기저귀·빨래용)", done: false },
  { id: "p18", group: "🧷 아기 기저귀·위생", text: "아기 바디워시 · 로션", done: false },
  { id: "p19", group: "🧷 아기 기저귀·위생", text: "아기 손톱가위", done: false },
  { id: "p20", group: "👶 아기 옷·외출", text: "아기띠", done: false },
  { id: "p21", group: "👶 아기 옷·외출", text: "휴대용 유모차", done: false },
  { id: "p22", group: "👶 아기 옷·외출", text: "겉싸개 · 담요 (바람 대비)", done: false },
  { id: "p23", group: "👶 아기 옷·외출", text: "방한 우주복 · 모자", done: false },
  { id: "p24", group: "👶 아기 옷·외출", text: "여벌 옷 (하루 2~3벌)", done: false },
  { id: "p25", group: "👶 아기 옷·외출", text: "내복 · 수면조끼", done: false },
  { id: "p26", group: "👶 아기 옷·외출", text: "양말", done: false },
  { id: "p27", group: "👶 아기 옷·외출", text: "애착 인형 · 장난감", done: false },
  { id: "p28", group: "💊 아기 건강", text: "체온계", done: false },
  { id: "p29", group: "💊 아기 건강", text: "아기 해열제", done: false },
  { id: "p30", group: "💊 아기 건강", text: "콧물 흡입기", done: false },
  { id: "p31", group: "💊 아기 건강", text: "아기 수첩 (영유아 검진·접종 기록)", done: false },
  { id: "p32", group: "🧥 어른 옷", text: "패딩 · 바람막이 (12월 제주는 바람이 강해요)", done: false },
  { id: "p33", group: "🧥 어른 옷", text: "니트 · 긴팔", done: false },
  { id: "p34", group: "🧥 어른 옷", text: "잠옷", done: false },
  { id: "p35", group: "🧥 어른 옷", text: "속옷 · 양말", done: false },
  { id: "p36", group: "🧥 어른 옷", text: "편한 신발", done: false },
  { id: "p37", group: "🧥 어른 옷", text: "수영복 (야외 자쿠지용)", done: false },
  { id: "p38", group: "🧥 어른 옷", text: "모자 · 목도리", done: false },
  { id: "p39", group: "🧴 세면·기타", text: "세면도구 · 화장품", done: false },
  { id: "p40", group: "🧴 세면·기타", text: "어른 상비약 (두통약·소화제·밴드)", done: false },
  { id: "p41", group: "🧴 세면·기타", text: "마스크", done: false },
  { id: "p42", group: "🧴 세면·기타", text: "차량용 휴대폰 거치대", done: false },
  { id: "p43", group: "🧴 세면·기타", text: "장바구니 (마트 장보기)", done: false },
  { id: "p44", group: "🧴 세면·기타", text: "카메라", done: false },
];

export const INITIAL_TRIP = {
  title: "제주 애월 2박 3일",
  startDate: "2026-12-02",
  days: [
    {
      id: "d1",
      note: "첫날은 이동 피로를 고려해 공항 → 숙소 동선 위주로.",
      items: [
        { id: "d1a", time: "12:35", category: "move", title: "제주공항 도착", place: "", memo: "김포 → 제주" },
        {
          id: "d1b",
          time: "13:30",
          category: "move",
          title: "해피렌트카 차량 인수",
          place: "",
          memo:
            "공항 1층 5번 게이트 건너편 렌터카하우스 주차장 5구역 1번에서 셔틀 탑승 (약 15분 간격)\n운전면허증 필수 지참!\n차량: 2026 뉴 셀토스 하이브리드 / 유아용품: 다이치 더 스페이스 트래블세트",
        },
        { id: "d1c", time: "14:00", category: "food", title: "애월 이동 및 점심 식사", place: "", memo: "맛집 미정" },
        { id: "d1d", time: "15:00", category: "cafe", title: "애월 오션뷰 카페", place: "", memo: "카페 미정" },
        {
          id: "d1e",
          time: "16:00",
          category: "stay",
          title: "플로라애월 체크인",
          place: STAY_ADDR,
          memo: "프라이빗애월 독채펜션 · 플로라애월 105호 (복층)",
          link: "https://privateaewol.com/special1.html",
        },
        { id: "d1f", time: "18:00", category: "food", title: "저녁 식사", place: "", memo: "식당 미정" },
        { id: "d1g", time: "", category: "stay", title: "저녁 · 숙소 휴식 및 자쿠지", place: "", memo: "" },
      ],
    },
    {
      id: "d2",
      note: "애월 주변 맛집과 카페를 즐기는 메인 여행일.",
      items: [
        { id: "d2a", time: "09:00", category: "food", title: "기상 및 아침 식사", place: "", memo: "" },
        { id: "d2b", time: "10:00", category: "cafe", title: "애월 감성 카페", place: "", memo: "카페 미정" },
        { id: "d2c", time: "11:30", category: "spot", title: "한담해안산책로", place: "한담해안산책로", memo: "" },
        { id: "d2d", time: "12:30", category: "food", title: "점심 맛집", place: "", memo: "맛집 미정" },
        { id: "d2e", time: "14:00", category: "stay", title: "숙소 복귀 및 아기 휴식", place: "", memo: "" },
        {
          id: "d2f",
          time: "16:00",
          category: "spot",
          title: "구엄돌염전 또는 애월해안도로",
          place: "구엄리 돌염전",
          memo: "",
        },
        { id: "d2g", time: "18:00", category: "food", title: "저녁 식사", place: "", memo: "식당 미정" },
        {
          id: "d2h",
          time: "20:00",
          category: "stay",
          title: "숙소 바비큐 또는 자쿠지",
          place: "",
          memo: "바비큐는 사전 예약 필수",
          cost: "바비큐 30,000원",
        },
      ],
    },
    {
      id: "d3",
      note: "기본 체크아웃은 11시지만, 렌터카 반납에 맞춰 일찍 체크아웃하기로 함.",
      items: [
        { id: "d3a", time: "07:30", category: "stay", title: "기상 및 짐 정리", place: "", memo: "07:30~08:00" },
        { id: "d3b", time: "08:30", category: "food", title: "간단한 아침 식사", place: "", memo: "" },
        { id: "d3c", time: "09:30", category: "stay", title: "숙소 출발 (체크아웃)", place: "", memo: "" },
        {
          id: "d3d",
          time: "10:00",
          category: "move",
          title: "렌터카 반납",
          place: "",
          memo: "반납 후 셔틀로 제주공항 이동",
        },
        { id: "d3e", time: "12:30", category: "move", title: "제주공항 출발", place: "", memo: "제주 → 김포" },
        { id: "d3f", time: "13:45", category: "move", title: "김포공항 도착", place: "", memo: "" },
      ],
    },
  ],
  info: [
    {
      id: "i0",
      title: "🧳 여행 개요",
      body:
        "기간: 2026년 12월 2일(수) ~ 12월 4일(금)\n인원: 성인 2명 + 유아 1명\n지역: 제주 서쪽 애월 중심\n스타일: 맛집, 감성 카페, 오션뷰, 여유로운 휴식\n\n항공권 · 렌터카 · 숙소 예약 완료",
    },
    {
      id: "i1",
      title: "✈️ 항공권",
      body:
        "제주행: 12월 2일 12:35 제주 도착\n김포행: 12월 4일 12:30 제주 출발 → 13:45 김포 도착\n\n※ 탑승자별 일정은 발권 내역으로 최종 확인 필요",
    },
    {
      id: "i2",
      title: "🚗 렌터카 · 해피렌트카",
      body:
        "차량: 2026 뉴 셀토스 하이브리드\n유아용품: 다이치 더 스페이스 트래블세트\n결제: 신용카드 / 예약 확정\n\n인수: 12월 2일 13:30\n반납: 12월 4일 10:00\n\n· 제주공항 1층 5번 게이트 건너편 렌터카하우스 주차장 5구역 1번에서 셔틀 탑승\n· 셔틀 약 15분 간격 운행\n· 운전면허증 필수 지참\n· 반납 후 셔틀로 공항 이동",
    },
    {
      id: "i3",
      title: "🏡 숙소 · 플로라애월 105호",
      body:
        "프라이빗애월 독채펜션\n주소: " +
        STAY_ADDR +
        "\n객실: 105호 / 복층, 약 80㎡, 퀸 침대 2개, 욕실 1개\n체크인 12월 2일 16:00 / 체크아웃 12월 4일 11:00\n주차 무료\n\n시설: 바다 전망, 대형 야외 자쿠지(무료, 보일러 이용), 정원·바비큐 공간, 세탁기·주방·다이닝, 플라워 룸 무료\n\n· 바비큐 사전 예약 필수, 30,000원\n· 실내 금연\n· 고기 굽기 등 냄새 강한 음식 조리 제한\n\nhttps://privateaewol.com/special1.html",
    },
  ],
  packing: INITIAL_PACKING,
  packingGroups: PACKING_GROUPS,
  checklist: [
    { id: "c1", text: "12월 2일 점심 맛집", done: false },
    { id: "c2", text: "12월 2일 카페", done: false },
    { id: "c3", text: "12월 2일 저녁 식사", done: false },
    { id: "c4", text: "12월 3일 아침 카페", done: false },
    { id: "c5", text: "12월 3일 점심 맛집", done: false },
    { id: "c6", text: "12월 3일 저녁 식사", done: false },
    { id: "c7", text: "바비큐 사전 예약 (3만 원)", done: false },
    { id: "c8", text: "아기 동반 가능한 식당 및 카페 확인", done: false },
    { id: "c9", text: "아기 여행용품 준비", done: false },
  ],
};
