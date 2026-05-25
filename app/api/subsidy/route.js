import { NextResponse } from 'next/server';

const getCategories = (item) => {
  const cats = [];
  const textToSearch = (item["지원유형"] + " " + item["서비스명"] + " " + item["서비스목적요약"] + " " + item["지원내용"]).toLowerCase();
  
  if (textToSearch.includes("현금") || textToSearch.includes("지원금") || textToSearch.includes("연금") || textToSearch.includes("수당") || textToSearch.includes("장려금")) {
    cats.push("현금지원");
  }
  if (textToSearch.includes("의료") || textToSearch.includes("건강") || textToSearch.includes("돌봄") || textToSearch.includes("요양") || textToSearch.includes("치료") || textToSearch.includes("치매") || textToSearch.includes("병원")) {
    cats.push("의료/돌봄");
  }
  if (textToSearch.includes("문화") || textToSearch.includes("여가") || textToSearch.includes("체육") || textToSearch.includes("관광") || textToSearch.includes("공연") || textToSearch.includes("여행")) {
    cats.push("문화/여가");
  }
  if (textToSearch.includes("이용권") || textToSearch.includes("바우처") || textToSearch.includes("할인") || textToSearch.includes("감면") || textToSearch.includes("티켓")) {
    cats.push("이용권");
  }
  
  if (cats.length === 0) {
    cats.push("기타");
  }
  return cats;
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const age = searchParams.get('age') || '60대';
  const region = searchParams.get('region') || '서울';
  const gender = searchParams.get('gender') || '';

  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  let fetchedData = [];
  let useFallback = false;

  try {
    const urls = [
      // 1. 지역 맞춤 (최대 1000건) - 소관기관명에 지역 이름 포함
      `https://api.odcloud.kr/api/gov24/v3/serviceList?page=1&perPage=1000&cond[소관기관명::LIKE]=${encodeURIComponent(region)}&serviceKey=${apiKey}`,
      // 2. 필수 키워드 (에너지 바우처 등, 최대 100건)
      `https://api.odcloud.kr/api/gov24/v3/serviceList?page=1&perPage=100&cond[서비스명::LIKE]=${encodeURIComponent('에너지')}&serviceKey=${apiKey}`,
      // 3. 전국 공통 (보건복지부 등, 필터 없이 최상단 1000건)
      `https://api.odcloud.kr/api/gov24/v3/serviceList?page=1&perPage=1000&serviceKey=${apiKey}`
    ];

    // 병렬로 API 호출 (속도 향상)
    const fetchPromises = urls.map(url => fetch(url, { timeout: 8000 }));
    const responses = await Promise.allSettled(fetchPromises);
    
    let rawItems = [];
    
    for (const result of responses) {
      if (result.status === 'fulfilled' && result.value.ok) {
        const data = await result.value.json();
        if (data && data.data && Array.isArray(data.data)) {
          rawItems.push(...data.data);
        }
      }
    }

    if (rawItems.length > 0) {
      // 다른 지자체 혜택 필터링 (사용자가 서울을 선택했는데 부산, 대구 등 다른 지역이 섞이는 것 방지)
      const allRegions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '충청', '전라', '경상'];
      
      const isRelevantRegion = (agency) => {
        if (!agency) return true;
        for (const r of allRegions) {
          if (r !== region && agency.includes(r)) {
            // 다른 지역의 이름이 소관기관명에 들어있으면 탈락 (예: region이 '서울'인데 agency가 '부산광역시'면 탈락)
            return false;
          }
        }
        return true;
      };

      // 서비스ID를 기준으로 중복 제거 및 타 지역 제외
      const uniqueItemsMap = new Map();
      rawItems.forEach(item => {
        const id = item["서비스ID"];
        const agency = item["소관기관명"];
        if (id && !uniqueItemsMap.has(id) && isRelevantRegion(agency)) {
          uniqueItemsMap.set(id, item);
        }
      });
      const uniqueItems = Array.from(uniqueItemsMap.values());

      let mappedData = uniqueItems.map((item, index) => ({
        id: item["서비스ID"] || index,
        title: item["서비스명"] || "지원금 이름 없음",
        description: item["서비스목적요약"] || "상세 설명이 제공되지 않았습니다.",
        amount: item["지원내용"] ? item["지원내용"].substring(0, 120) + (item["지원내용"].length > 120 ? "..." : "") : "자세한 금액은 기관 문의",
        endDate: item["신청기한"] || "2099-12-31", // 종료일이 없으면 넉넉하게
        region: item["소관기관명"] || region,
        target: item["지원대상"] || "",
        categories: getCategories(item),
      }));

      // 시니어 및 취약계층 관련 키워드로 필터링 (에너지 포함)
      const seniorKeywords = ["노인", "어르신", "고령", "65세", "60세", "중장년", "시니어", "기초연금", "치매", "에너지", "취약계층", "독거"];
      
      // 시니어와 무관한 키워드는 완전히 배제 (블랙리스트)
      const baseNegativeKeywords = ["임산부", "영유아", "어린이", "아동", "청소년", "청년", "학생", "난임", "출산", "보육", "신생아", "유아", "산모", "입양", "대학생"];
      
      // 사용자의 연령대에 맞지 않는 '더 높은 연령' 전용 혜택 배제
      let ageNegativeKeywords = [];
      if (age === '60대') {
        ageNegativeKeywords = ["70세", "75세", "80세", "85세", "90세", "95세", "100세", "백수축하", "장수축하", "장수수당", "60세 미만", "60세미만"];
      } else if (age === '70대') {
        ageNegativeKeywords = ["80세", "85세", "90세", "95세", "100세", "백수축하", "장수축하", "장수수당", "60세 미만", "60세미만", "65세 미만", "65세미만", "64세 이하", "64세이하", "69세 이하", "69세이하", "60대 전용"];
      } else if (age === '80대') {
        ageNegativeKeywords = ["90세", "95세", "100세", "백수축하", "장수축하", "60세 미만", "60세미만", "65세 미만", "65세미만", "64세 이하", "64세이하", "69세 이하", "69세이하", "74세 이하", "74세이하", "75세 미만", "75세미만", "79세 이하", "79세이하", "60대 전용", "70대 전용"];
      } else if (age === '90대 이상') {
        ageNegativeKeywords = ["100세", "백수축하", "60세 미만", "60세미만", "65세 미만", "65세미만", "64세 이하", "64세이하", "69세 이하", "69세이하", "74세 이하", "74세이하", "75세 미만", "75세미만", "79세 이하", "79세이하", "84세 이하", "84세이하", "85세 미만", "85세미만", "89세 이하", "89세이하", "60대 전용", "70대 전용", "80대 전용"];
      }

      // 사용자의 성별에 맞지 않는 전용 혜택 배제
      let genderNegativeKeywords = [];
      if (gender === 'male') {
        genderNegativeKeywords = ["여성", "자궁", "유방", "임산부", "산모", "부녀"];
      } else if (gender === 'female') {
        genderNegativeKeywords = ["남성", "전립선"];
      }

      const allNegativeKeywords = [...baseNegativeKeywords, ...ageNegativeKeywords, ...genderNegativeKeywords];
      
      let filtered = mappedData.filter(item => {
        const textToSearch = (item.title + " " + item.description + " " + item.target).toLowerCase();
        
        // 블랙리스트 키워드가 하나라도 있으면 무조건 제외
        const hasNegative = allNegativeKeywords.some(keyword => textToSearch.includes(keyword));
        if (hasNegative) return false;

        // 블랙리스트가 없고, 시니어/취약계층 키워드가 하나라도 있으면 포함
        return seniorKeywords.some(keyword => textToSearch.includes(keyword));
      });

      // 스마트 정렬 (Scoring 알고리즘) 적용
      const getScore = (item) => {
        let score = 0;
        const text = (item.title + " " + item.description + " " + item.target).toLowerCase();
        
        // [S급 / +50점] 핵심 현금성 및 중증 의료
        const sClass = ['기초연금', '현금', '수당', '의료비', '치매', '임플란트', '틀니', '수술', '지원금'];
        sClass.forEach(kw => { if (text.includes(kw)) score += 50; });

        // [A급 / +30점] 생활비 절감 및 요양
        const aClass = ['요양', '돌봄', '일자리', '교통', '주거', '월세', '에너지', '통신비', '할인', '감면'];
        aClass.forEach(kw => { if (text.includes(kw)) score += 30; });

        // [B급 / +10점] 보조 및 문화 혜택
        const bClass = ['바우처', '교육', '문화', '상담', '건강검진'];
        bClass.forEach(kw => { if (text.includes(kw)) score += 10; });

        return score;
      };

      const isUrgent = (endDate) => {
        if (!endDate || endDate.includes('상시') || endDate.includes('미정') || endDate.includes('소진')) return false;
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 14;
      };

      // 1순위: 마감임박 / 2순위: Score 내림차순 / 3순위: 날짜순
      fetchedData = filtered.sort((a, b) => {
        const urgentA = isUrgent(a.endDate);
        const urgentB = isUrgent(b.endDate);
        
        if (urgentA && !urgentB) return -1;
        if (!urgentA && urgentB) return 1;

        const scoreA = getScore(a);
        const scoreB = getScore(b);
        
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }

        const dateA = new Date(a.endDate).getTime();
        const dateB = new Date(b.endDate).getTime();
        if (!isNaN(dateA) && !isNaN(dateB)) {
          return dateA - dateB;
        }
        if (a.endDate.includes('상시') || isNaN(dateA)) return 1;
        if (b.endDate.includes('상시') || isNaN(dateB)) return -1;
        return 0;
      });

    } else {
      useFallback = true;
    }
  } catch (error) {
    console.error("Public Data API fetch error:", error);
    useFallback = true; // API 호출 실패 시 Fallback(Mock) 사용
  }

  // Fallback (Mock) 데이터 로직
  if (useFallback || fetchedData.length === 0) {
    console.log("Using Mock data for subsidies due to API unavailability or unknown endpoint.");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    fetchedData = [
      {
        id: 1,
        title: "기초연금",
        description: "만 65세 이상 어르신들의 안정적인 노후생활을 돕기 위한 연금입니다.",
        amount: "최대 334,810원 / 월",
        endDate: nextMonth.toISOString().split('T')[0], // 미래 날짜
        region: "전국",
        categories: ["현금지원"]
      },
      {
        id: 2,
        title: `${region} 어르신 교통비 지원`,
        description: `만 65세 이상 ${region} 거주 어르신을 위한 대중교통 요금 지원`,
        amount: "최대 50,000원 / 월",
        endDate: nextMonth.toISOString().split('T')[0], // 미래 날짜
        region: region,
        categories: ["현금지원"]
      },
      {
        id: 3,
        title: "에너지 바우처",
        description: "에너지 취약계층의 냉난방비 부담을 덜어주기 위한 바우처",
        amount: "금액 차등 지급",
        endDate: nextMonth.toISOString().split('T')[0],
        region: "전국",
        categories: ["이용권"]
      },
      {
        id: 4,
        title: "만료된 지원금 테스트용",
        description: "이미 신청 기한이 지난 지원금 (보이면 안됨)",
        amount: "100,000원",
        endDate: yesterday.toISOString().split('T')[0], // 과거 날짜
        region: region,
        categories: ["기타"]
      }
    ];
  }

  // 기한 만료 필터링 로직: 종료일이 오늘 날짜보다 과거인 데이터는 제외
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const filteredData = fetchedData.filter(item => {
    if (!item.endDate) return true; // 기한 명시 안된 것은 통과
    try {
      const endDate = new Date(item.endDate);
      if (isNaN(endDate.getTime())) return true; // 파싱 실패시 통과
      
      const endStart = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      return endStart >= todayStart;
    } catch(e) {
      return true;
    }
  });

  return NextResponse.json({ success: true, data: filteredData });
}
