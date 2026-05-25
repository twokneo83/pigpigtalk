"use client";

import Script from 'next/script';
import { useEffect } from 'react';

export default function KakaoScript() {
  const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized() && kakaoAppKey) {
      window.Kakao.init(kakaoAppKey);
      console.log('Kakao SDK initialized via useEffect');
    }
  }, [kakaoAppKey]);

  const handleKakaoInit = () => {
    if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized() && kakaoAppKey) {
      window.Kakao.init(kakaoAppKey);
      console.log('Kakao SDK initialized via onLoad');
    }
  };

  return (
    <Script
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
      strategy="afterInteractive"
      onLoad={handleKakaoInit}
    />
  );
}
