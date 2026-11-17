import "./globals.css";

export const metadata = {
  title: "우리 여행 일정",
  description: "둘이 함께 보는 여행 일정표",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
