import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const apiKey = process.env.PUBLIC_DATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'API key is missing' }, { status: 500 });
  }

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID is missing' }, { status: 400 });
  }

  try {
    const apiUrl = `https://api.odcloud.kr/api/gov24/v3/serviceDetail?cond[서비스ID::EQ]=${id}&serviceKey=${apiKey}`;
    
    const res = await fetch(apiUrl, { timeout: 8000 });
    if (res.ok) {
      const data = await res.json();
      
      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        const detail = data.data[0];
        const mappedDetail = {
          id: detail["서비스ID"],
          title: detail["서비스명"],
          purpose: detail["서비스목적"],
          target: detail["지원대상"],
          criteria: detail["선정기준"],
          content: detail["지원내용"],
          howToApply: detail["신청방법"],
          documents: detail["구비서류"],
          contact: detail["문의처"],
          url: detail["온라인신청사이트URL"],
        };
        return NextResponse.json({ success: true, data: mappedDetail });
      }
    }
    
    return NextResponse.json({ success: false, error: 'Detail not found or fetch failed' });
  } catch (error) {
    console.error('API detail error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}
