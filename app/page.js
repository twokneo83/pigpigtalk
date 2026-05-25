"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const currentCountRef = useRef(0);
  const [targetNumber, setTargetNumber] = useState(10542); // 초기 기준값
  const [randomPig, setRandomPig] = useState("");

  useEffect(() => {
    const pigs = ['a', 'b', 'c', 'd', 'e'];
    const randomSuffix = pigs[Math.floor(Math.random() * pigs.length)];
    setRandomPig(`/characters/crt - pigpigtalk - main - v03${randomSuffix}.png`);
  }, []);

  // 백그라운드에서 실제 정부 API의 실시간 데이터 전체 건수를 가져옴
  useEffect(() => {
    fetch('/api/subsidy/total')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.totalCount) {
          setTargetNumber(data.totalCount); // 실제 수치로 타겟 업데이트
        }
      })
      .catch(err => console.error("Failed to fetch live count:", err));
  }, []);

  // 카운팅 애니메이션 (targetNumber가 바뀌면 이어서 부드럽게 다시 올라감)
  useEffect(() => {
    let startTimestamp = null;
    const duration = 1500; // 1.5초 동안 카운트
    const startValue = currentCountRef.current;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const current = startValue + (targetNumber - startValue) * easeOut;
      const floorCurrent = Math.floor(current);
      
      setCount(floorCurrent);
      currentCountRef.current = floorCurrent;

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    const animId = window.requestAnimationFrame(step);
    
    return () => window.cancelAnimationFrame(animId);
  }, [targetNumber]);

  const handleKakaoLogin = () => {
    const clientId = "718745ecca8337c62f44faf199caa826";
    const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/kakao` : "http://localhost:3000/api/auth/kakao";
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
  };

  return (
    <div className="container fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>
      
      <div style={{ width: '210px', height: '210px', marginBottom: '-10px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
        {randomPig && (
          <img 
            src={randomPig} 
            alt="꿀꿀이톡 메인 캐릭터" 
            className="fade-in"
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.15))' }} 
          />
        )}
      </div>
      
      <img 
        src="/logo-pigpigtalk.png" 
        alt="꿀꿀이톡 로고" 
        style={{ width: '200px', objectFit: 'contain', marginBottom: '1rem', zIndex: 3 }} 
      />
      <p className="subtitle" style={{ lineHeight: '1.5', wordBreak: 'keep-all', marginTop: '0', marginBottom: '0.5rem' }}>
        시니어분들을 위한 나의 숨은 지원금,<br/>3초만에 찾아보세요!
      </p>

      {/* 실시간 혜택 건수 텍스트 */}
      <div style={{ 
        color: '#0052CC',
        fontSize: '1rem',
        fontWeight: 'bold',
        marginTop: '0.5rem',
        marginBottom: '0',
        zIndex: 1
      }}>
        현재 총 <span style={{ color: '#FF9500', textDecoration: 'underline', textUnderlineOffset: '3px', fontSize: '1.15rem', display: 'inline-block', minWidth: '70px', textAlign: 'center' }}>{count.toLocaleString()}건</span>의 혜택을 찾았습니다!
      </div>
      
      {/* 시작 버튼 */}
      <button
        onClick={() => router.push('/survey')}
        className="btn-primary"
        style={{ marginTop: '1rem', backgroundColor: '#0052CC', color: '#FFFFFF', border: 'none', padding: '1.2rem', fontSize: '1.3rem', width: '100%' }}
      >
        내 숨은 지원금 바로 찾기
      </button>

      <p style={{ marginTop: '1rem', fontSize: '1rem', color: 'var(--text-light)', textAlign: 'center' }}>
        회원가입 없이 무료로 확인해보세요!
      </p>

      {/* 저작권 표기 */}
      <div style={{ marginTop: 'auto', paddingTop: '3rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: '#999', letterSpacing: '0.5px' }}>
          © {new Date().getFullYear()} SHNJ Soft. All rights reserved.
        </p>
      </div>
    </div>
  );
}
