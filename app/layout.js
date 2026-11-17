import "./globals.css";

export const metadata = {
  title: "우리 여행 일정",
  description: "둘이 함께 보는 여행 일정표",
  // 아이콘 이미지는 public 폴더에 있어요. 같은 이름으로 바꿔 넣으면 아이콘이 바뀌어요.
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  // 아이폰 홈 화면에서 열 때: 주소창 없이 앱처럼, 아이콘 아래 이름
  appleWebApp: {
    capable: true,
    title: "제주 여행",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f5f1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
