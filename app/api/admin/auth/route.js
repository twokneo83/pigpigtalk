import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_if_not_set");

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    // 환경변수에 설정된 값과 비교
    if (username === process.env.ADMIN_ID && password === process.env.ADMIN_PW) {
      const response = NextResponse.json({ success: true, message: 'Logged in successfully' });
      
      const alg = 'HS256';
      const jwt = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setExpirationTime('1d')
        .sign(getSecret());

      // Set an HTTP-only secure cookie with the JWT
      response.cookies.set('admin_token', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 1 day
      });
      return response;
    } else {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  const token = request.cookies.get('admin_token');
  if (token) {
    try {
      // JWT 검증
      await jwtVerify(token.value, getSecret());
      return NextResponse.json({ authenticated: true });
    } catch (e) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
