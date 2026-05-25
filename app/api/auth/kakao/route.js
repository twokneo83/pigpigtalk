import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const clientId = "718745ecca8337c62f44faf199caa826";
  const redirectUri = "http://localhost:3000/api/auth/kakao";

  try {
    // 1. 카카오 REST API에 인가 코드를 전달하여 액세스 토큰 발급
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return NextResponse.json({ error: "Kakao Token Error", details: tokenData });
    }

    // 2. 액세스 토큰으로 사용자 정보 조회
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    const userData = await userResponse.json();
    
    if (!userData.id) {
       return NextResponse.json({ error: "Kakao User Info Error", details: userData });
    }

    const kakaoId = userData.id.toString();
    const ageRange = userData.kakao_account?.age_range || null;
    const gender = userData.kakao_account?.gender || null;

    // 3. Prisma를 이용해 DB에 사용자 정보 저장 또는 업데이트
    await prisma.user.upsert({
      where: { kakaoId: kakaoId },
      update: {
        ageRange: ageRange,
        gender: gender,
      },
      create: {
        kakaoId: kakaoId,
        ageRange: ageRange,
        gender: gender,
      },
    });

    // 4. 설문 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/survey', request.url));
  } catch (error) {
    return NextResponse.json({ error: "Server Internal Error", message: error.message, stack: error.stack });
  }
}
