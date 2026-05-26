import "./globals.css";
import KakaoScript from "../components/KakaoScript";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GoogleAnalytics } from '@next/third-parties/google';

export const metadata = {
  title: "꿀꿀이톡 - 시니어 맞춤 지원금 찾기",
  description: "60대 이상 시니어 사용자를 위한 정부 보조금 조회 및 카카오톡 공유 서비스",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <KakaoScript />
        {children}
        <Analytics />
        <SpeedInsights />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
