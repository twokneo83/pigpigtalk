import { NextResponse } from 'next/server';

// 캐싱 옵션 설정: 86400초(24시간) 동안 캐시 유지
export const revalidate = 86400;

export async function GET() {
  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  let totalCount = 10542; // Fallback base number

  try {
    // 1건만 요청해서 전체 matchCount만 빠르게 가져옵니다
    const url = `https://api.odcloud.kr/api/gov24/v3/serviceList?page=1&perPage=1&serviceKey=${apiKey}`;
    const response = await fetch(url, { timeout: 3000 }); // 빠른 타임아웃
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.matchCount) {
        totalCount = data.matchCount;
      }
    }
  } catch (error) {
    console.error("Error fetching total count:", error);
  }

  return NextResponse.json({ success: true, totalCount });
}
