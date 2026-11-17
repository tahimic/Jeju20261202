// 안드로이드(갤럭시) 홈 화면 추가용 정보
export default function manifest() {
  return {
    name: "우리 여행 일정",
    short_name: "제주 여행",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f1",
    theme_color: "#0f766e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
