"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResultContent() {
  const searchParams = useSearchParams();
  const [subsidies, setSubsidies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadingImgToggle, setLoadingImgToggle] = useState(true);
  const [activeCategory, setActiveCategory] = useState("전체보기");
  const [hotIssues, setHotIssues] = useState([]);
  
  const [selectedItem, setSelectedItem] = useState(null); // 풀화면 상세 뷰용 기본 데이터
  const [detailedItem, setDetailedItem] = useState(null); // API로 불러온 진짜 상세 정보
  const [detailLoading, setDetailLoading] = useState(false);
  
  const [showDonationModal, setShowDonationModal] = useState(false); // 후원하기 모달 상태

  const region = searchParams.get("region") || "서울";
  const age = searchParams.get("age") || "60대";
  const rawGender = searchParams.get("gender") || "";
  const genderText = rawGender === "female" ? " 여성" : rawGender === "male" ? " 남성" : "";

  const today = new Date();
  const dateString = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 기준`;

  useEffect(() => {
    const fetchSubsidies = async () => {
      try {
        const [res, hotRes] = await Promise.all([
          fetch(`/api/subsidy?region=${region}&age=${age}&gender=${rawGender}`),
          fetch(`/api/admin/hot-issues`)
        ]);
        
        const result = await res.json();
        const hotResult = await hotRes.json();
        
        if (result.success) {
          // 중복 필터링 적용 (이미지 생성 지연 등의 이유로 같은 ID 여러 개가 올 수 있음)
          const uniqueSubsidies = [];
          const seenIds = new Set();
          
          for (const item of result.data) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              uniqueSubsidies.push(item);
            }
          }
          
          setSubsidies(uniqueSubsidies);
        }
        
        if (Array.isArray(hotResult)) {
          setHotIssues(hotResult.filter(issue => issue.isVisible !== false));
        }
      } catch (error) {
        console.error("Error fetching subsidies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubsidies();
  }, [region, age]);

  // 로딩 프로그레스바 & 이미지 번갈아 나오기 애니메이션
  useEffect(() => {
    if (!loading) return;
    
    // 300ms 간격으로 이미지 토글
    const imgInterval = setInterval(() => {
      setLoadingImgToggle(prev => !prev);
    }, 300);

    // 프로그레스 바 증가
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += (Math.random() * 6 + 2); // 랜덤하게 증가
      if (currentProgress > 98) currentProgress = 98; // 100% 도달 전 대기
      setProgress(currentProgress);
    }, 100);

    return () => {
      clearInterval(imgInterval);
      clearInterval(progressInterval);
    };
  }, [loading]);

  // 브라우저(스마트폰) 뒤로 가기 이벤트 처리
  useEffect(() => {
    const handlePopState = () => {
      if (showDonationModal) {
        setShowDonationModal(false);
      } else if (selectedItem) {
        setSelectedItem(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedItem, showDonationModal]);

  const handleShare = () => {
    if (typeof window !== 'undefined' && window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
        if (kakaoAppKey) {
          window.Kakao.init(kakaoAppKey);
        } else {
          alert("카카오톡 앱 키(NEXT_PUBLIC_KAKAO_APP_KEY)를 찾을 수 없습니다.");
          return;
        }
      }

      const titleText = region && age && subsidies.length > 0
        ? `[꿀꿀이톡] ${region} 거주 ${age} 어르신을 위한 혜택 ${subsidies.length}건을 찾았습니다!`
        : '[꿀꿀이톡] 어르신들 숨은 국가 지원금·복지혜택 찾기';
      
      const descText = '지금 바로 어르신들께서 받을 수 있는 맞춤형 지원금과 혜택을 3초 만에 무료로 확인해 보세요!';

      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: titleText,
          description: descText,
          imageUrl: window.location.origin + '/characters/kakao_banner.png?v=' + new Date().getTime(),
          imageWidth: 800,
          imageHeight: 400,
          link: {
            mobileWebUrl: window.location.origin,
            webUrl: window.location.origin,
          },
        },
        buttons: [
          {
            title: '내 지원금 무료로 확인하기 🔍',
            link: {
              mobileWebUrl: window.location.origin,
              webUrl: window.location.origin,
            },
          },
        ],
      });
    } else {
      alert("카카오톡 공유 스크립트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const handleDonationClick = () => {
    window.history.pushState({ modal: 'donation' }, '', window.location.href);
    setShowDonationModal(true);
  };

  const closeDonationModal = () => {
    setShowDonationModal(false);
    if (window.history.state && window.history.state.modal === 'donation') {
      window.history.back();
    }
  };

  const handleCopyAccount = () => {
    const accountInfo = "하나은행 644-004925-00108 이상현";
    navigator.clipboard.writeText(accountInfo).then(() => {
      alert("계좌번호가 복사되었습니다!\\n원하시는 은행 앱에서 붙여넣기 해주세요.");
    }).catch(err => {
      console.error('복사 실패:', err);
      alert("계좌번호 복사에 실패했습니다. 수동으로 복사해주세요: " + accountInfo);
    });
  };

  const isUrgent = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return false;
    const daysLeft = (d - new Date()) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 30;
  };

  const renderTextWithPhoneLinks = (text) => {
    if (!text) return null;
    const phoneRegex = /(0\d{1,2}-\d{3,4}-\d{4}|1[5-8]\d{2}-\d{4}|0\d{8,10}|1[5-8]\d{6})/g;
    const parts = text.split(phoneRegex);
    return parts.map((part, index) => {
      if (phoneRegex.test(part)) {
        return (
          <a key={index} href={`tel:${part}`} style={{ color: '#0052CC', textDecoration: 'underline', fontWeight: 'bold' }} onClick={(e) => e.stopPropagation()}>
            📞 {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleItemClick = async (item) => {
    window.history.pushState({ modal: 'open' }, '', window.location.href);
    setSelectedItem(item);
    
    // 핫이슈는 API(정부24)에 없는 수동 데이터이므로 곧바로 상세 정보로 셋팅
    if (item.isHot) {
      setDetailedItem(item);
      setDetailLoading(false);
      return;
    }

    setDetailedItem(null);
    setDetailLoading(true);

    try {
      const res = await fetch(`/api/subsidy/detail?id=${item.id}`);
      const result = await res.json();
      if (result.success) {
        setDetailedItem(result.data);
      }
    } catch (err) {
      console.error("Detail fetch error:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedItem(null);
    if (window.history.state && window.history.state.modal === 'open') {
      window.history.back();
    }
  };

  const categories = ["전체보기", "현금지원", "의료/돌봄", "문화/여가", "이용권", "기타"];
  
  const filteredSubsidies = subsidies.filter(item => {
    if (activeCategory === "전체보기") return true;
    return item.categories && item.categories.includes(activeCategory);
  });

  if (loading) {
    return (
      <div className="container" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <img 
          src={loadingImgToggle ? "/characters/loading_a.png" : "/characters/loading_b.png"} 
          alt="로딩 꿀꿀이" 
          style={{ width: '220px', height: '220px', marginBottom: '2rem', objectFit: 'contain' }} 
        />
        
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#111', textAlign: 'center', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          꿀꿀이가 {region} 혜택을<br/>열심히 찾고 있어요! 🐷
        </p>

        {/* Custom Progress Bar */}
        <div style={{ width: '80%', height: '16px', backgroundColor: '#E5E5EA', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
          <div style={{ 
            position: 'absolute', top: 0, left: 0, height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, #0052CC 0%, #FAE100 100%)`,
            transition: 'width 0.1s ease-out',
            borderRadius: '10px'
          }} />
        </div>
        
        <p style={{ marginTop: '0.8rem', fontSize: '1.1rem', color: '#0052CC', fontWeight: 'bold' }}>
          {Math.floor(progress)}%
        </p>
      </div>
    );
  }

  return (
    <div className="container fade-in" style={{ paddingBottom: '0' }}>
      <style>{`
        @keyframes heartbeat {
          0% { transform: scale(1); }
          15% { transform: scale(1.05); }
          30% { transform: scale(1); }
          45% { transform: scale(1.05); }
          60% { transform: scale(1); }
          100% { transform: scale(1); }
        }
        .heartbeat-btn {
          animation: heartbeat 2.5s infinite;
          background: linear-gradient(135deg, #FF6B6B, #FF8E53);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
          transition: all 0.3s ease;
        }
        .heartbeat-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* 후원하기 모달 (바텀 시트 스타일) */}
      {showDonationModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }} onClick={closeDonationModal}>
          <div className="modal-slide-up" style={{
            backgroundColor: '#ffffff',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '2rem 1.5rem',
            paddingBottom: '3rem',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111', marginBottom: '0.5rem', lineHeight: '1.3', wordBreak: 'keep-all' }}>
                꿀꿀이에게 잘했다고 따뜻한 마음 전하기 💖
              </h3>
              <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.5', wordBreak: 'keep-all' }}>
                여러분의 후원으로 꿀꿀이가 계속 지원금과 혜택을<br />찾아오는데 큰 힘이 됩니다!
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={() => window.open('https://link.kakaopay.com/_/임시링크', '_blank')}
                style={{
                  width: '100%', padding: '1.2rem', borderRadius: '14px',
                  backgroundColor: '#FAE100', color: '#111', fontWeight: 'bold', fontSize: '1.15rem',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                카카오페이로 1초 만에 후원하기
              </button>
              
              <button 
                onClick={handleCopyAccount}
                style={{
                  width: '100%', padding: '1.2rem', borderRadius: '14px',
                  backgroundColor: '#F0F5FF', color: '#0052CC', fontWeight: 'bold', fontSize: '1.05rem',
                  border: '1px solid #D6E4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                하나은행 644-004925-00108 이상현 (복사하기)
              </button>
            </div>

            <button 
              onClick={closeDonationModal}
              style={{
                width: '100%', padding: '1rem', marginTop: '1.5rem',
                backgroundColor: 'transparent', color: '#888', fontWeight: 'bold', fontSize: '1.1rem',
                border: 'none'
              }}
            >
              다음에 할게요 닫기
            </button>
          </div>
        </div>
      )}

      {/* --- 풀화면 상세 정보 뷰 (Overlay) --- */}
      {selectedItem && (
        <div className="fade-in" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#fff', zIndex: 9999,
          overflowY: 'auto', padding: '1.5rem',
          display: 'flex', flexDirection: 'column'
        }}>
          <button 
            onClick={closeDetail}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '1.3rem', fontWeight: 'bold', color: '#333',
              background: 'none', border: 'none',
              padding: '1rem 0', marginBottom: '1rem',
              textAlign: 'left', cursor: 'pointer'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            뒤로 가기
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {selectedItem.categories && selectedItem.categories.map((cat, idx) => (
                <div key={idx} style={{ backgroundColor: '#F0F5FF', color: '#0052CC', padding: '6px 12px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {cat}
                </div>
              ))}
              {selectedItem.isHot && selectedItem.category && (
                <div style={{ backgroundColor: '#FFE5E5', color: '#D90000', padding: '6px 12px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  🔥 {selectedItem.category}
                </div>
              )}
              {isUrgent(selectedItem.endDate) && (
                <div style={{ backgroundColor: '#FF3B30', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  🚨 마감임박
                </div>
              )}
            </div>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem', lineHeight: '1.3', wordBreak: 'keep-all' }}>
              {selectedItem.title}
            </h2>

            {detailLoading && (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#0052CC', fontWeight: 'bold' }}>
                <p>상세 정보를 불러오는 중입니다...</p>
              </div>
            )}

            {detailedItem && (
              <>
                {detailedItem.purpose && (
                  <div style={{ backgroundColor: '#F9FAFB', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#555', marginBottom: '0.5rem' }}>서비스 목적</h3>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#111', whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                      {renderTextWithPhoneLinks(detailedItem.purpose)}
                    </p>
                  </div>
                )}

                {detailedItem.showTarget !== false && detailedItem.target && (
                  <div style={{ backgroundColor: '#F9FAFB', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#555', marginBottom: '0.5rem' }}>지원 대상</h3>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#111', whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                      {renderTextWithPhoneLinks(detailedItem.target)}
                    </p>
                  </div>
                )}

                {detailedItem.showCriteria !== false && detailedItem.criteria && (
                  <div style={{ backgroundColor: '#F9FAFB', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#555', marginBottom: '0.5rem' }}>선정 기준</h3>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#111', whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                      {renderTextWithPhoneLinks(detailedItem.criteria)}
                    </p>
                  </div>
                )}

                {detailedItem.showContent !== false && detailedItem.content && (
                  <div style={{ backgroundColor: '#F0F5FF', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #D6E4FF' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#0052CC', marginBottom: '0.5rem', fontWeight: 'bold' }}>지원 내용</h3>
                    <p style={{ fontSize: '1.15rem', lineHeight: '1.6', color: '#111', fontWeight: '500', whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                      {renderTextWithPhoneLinks(detailedItem.content)}
                    </p>
                  </div>
                )}

                {detailedItem.showHowToApply !== false && (detailedItem.howToApply || detailedItem.documents) && (
                  <div style={{ backgroundColor: '#F9FAFB', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#555', marginBottom: '0.5rem' }}>신청 방법 및 서류</h3>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#111', whiteSpace: 'pre-wrap', wordBreak: 'keep-all', marginBottom: detailedItem.documents ? '1rem' : '0' }}>
                      {renderTextWithPhoneLinks(detailedItem.howToApply) || "기관 문의 필요"}
                    </p>
                    {detailedItem.documents && (
                      <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px dashed #ccc' }}>
                        <p style={{ fontSize: '0.95rem', color: '#666', fontWeight: 'bold', marginBottom: '0.3rem' }}>필요 서류</p>
                        <p style={{ fontSize: '1rem', color: '#333', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                          {renderTextWithPhoneLinks(detailedItem.documents)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {detailedItem.showEndDate !== false && (
                  <div style={{ backgroundColor: '#F9FAFB', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#555', marginBottom: '0.5rem' }}>신청 기한</h3>
                    <p style={{ fontSize: '1.2rem', lineHeight: '1.5', color: isUrgent(selectedItem.endDate) ? '#FF3B30' : '#111', fontWeight: 'bold' }}>
                      {selectedItem.endDate}
                    </p>
                  </div>
                )}
                
                {detailedItem.showContact !== false && detailedItem.contact && (
                  <div style={{ backgroundColor: '#F9FAFB', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#555', marginBottom: '0.5rem' }}>문의처</h3>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.5', color: '#111', fontWeight: 'bold', whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                      {renderTextWithPhoneLinks(detailedItem.contact)}
                    </p>
                  </div>
                )}
              </>
            )}
            
            {detailedItem?.showDepartment !== false && (
              <div style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem', paddingBottom: '3rem' }}>
                담당 기관: {selectedItem.department || selectedItem.region}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
            {detailedItem?.url && detailedItem.url !== 'null' && (
              <button 
                className="btn-primary" 
                onClick={() => window.open(detailedItem.url, '_blank')} 
                style={{ width: '100%', backgroundColor: '#0052CC', padding: '1.2rem', fontSize: '1.2rem', borderRadius: '12px', fontWeight: 'bold' }}
              >
                온라인 신청
              </button>
            )}
            <button 
              onClick={handleShare} 
              style={{ 
                width: '100%', 
                backgroundColor: '#FAE100', color: '#000', border: 'none', borderRadius: '12px',
                fontWeight: 'bold', fontSize: '1.1rem', padding: '1.2rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#3A1D1D" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C5.9 3 1 6.8 1 11.5c0 2.8 1.6 5.4 4.1 7.1-.2 1.3-1 3.5-1 3.7 0 .2.2.3.4.2 1.1-.7 4.1-2.8 4.6-3.2 1 .3 2 .4 3 .4 6.1 0 11-3.8 11-8.5S18.1 3 12 3z"/>
              </svg>
              카카오톡으로 혜택 공유하기
            </button>
          </div>

          {/* 카카오톡 채널 추가 버튼 */}
          <button 
            onClick={() => window.open('https://pf.kakao.com/_xxxxxx', '_blank')} 
            style={{ 
              width: '100%', padding: '1rem', borderRadius: '12px',
              backgroundColor: '#FAE100', color: '#000', border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              marginBottom: '1rem', cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#3A1D1D" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C5.9 3 1 6.8 1 11.5c0 2.8 1.6 5.4 4.1 7.1-.2 1.3-1 3.5-1 3.7 0 .2.2.3.4.2 1.1-.7 4.1-2.8 4.6-3.2 1 .3 2 .4 3 .4 6.1 0 11-3.8 11-8.5S18.1 3 12 3z"/>
              </svg>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>꿀꿀이톡 채널 추가하기</span>
            </div>
            <span style={{ fontSize: '0.9rem' }}>새로운 보조금이 생기면 카톡으로 알려드려요!</span>
          </button>

          {/* 후원하기 버튼 (상세페이지 하단 추가) */}
          <button 
            onClick={() => setShowDonationModal(true)} 
            className="pulse-button"
            style={{ 
              width: '100%', padding: '1rem', fontSize: '1.1rem', backgroundColor: '#FF6B6B', color: '#FFF', border: 'none', borderRadius: '12px',
              fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer'
            }}
          >
            <span>꿀꿀이에게 잘했다고 따뜻한 마음 전하기 🐷</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 'normal', opacity: 0.9, textAlign: 'center', wordBreak: 'keep-all' }}>여러분의 후원으로 꿀꿀이가 계속 혜택을<br/>찾아오는데 큰 힘이 됩니다!</span>
          </button>
        </div>
      )}

      <h2 className="title" style={{ textAlign: 'left', marginBottom: '0.5rem', lineHeight: '1.45', wordBreak: 'keep-all' }}>
        <span style={{ color: '#444', fontSize: '1.25rem', fontWeight: '800', display: 'block', marginBottom: '0.6rem' }}>꿀꿀이가 열심히 찾아봤어요</span>
        <span className="highlight" style={{ textDecoration: 'underline', textUnderlineOffset: '4px' }}>{region}</span>에 사시는 <span className="highlight" style={{ textDecoration: 'underline', textUnderlineOffset: '4px' }}>{age}{genderText}</span> 어르신을 위한 지원금•혜택들 <span className="highlight" style={{ textDecoration: 'underline', textUnderlineOffset: '4px' }}>{subsidies.length}건</span>을 찾았어요.
      </h2>
      <p style={{ color: '#888', fontSize: '0.95rem', textAlign: 'left', marginBottom: '1.5rem' }}>
        ({dateString})
      </p>

      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '0.8rem', 
        marginBottom: '1.5rem',
        paddingBottom: '0.5rem'
      }}>
        {categories.map((cat, idx) => (
          <button 
            key={idx}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '20px',
              border: activeCategory === cat ? 'none' : '1px solid #ddd',
              backgroundColor: activeCategory === cat ? '#0052CC' : '#fff',
              color: activeCategory === cat ? '#fff' : '#555',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: activeCategory === cat ? '0 2px 4px rgba(0,82,204,0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {/* 긴급 핫이슈 특별 노출 영역 */}
        {hotIssues
          .filter(item => activeCategory === "전체보기" || activeCategory === item.category)
          .map((item) => (
          <div 
            key={item.id} 
            onClick={() => handleItemClick(item)}
            style={{ 
              border: '3px solid #FF3B30', 
              borderRadius: '16px', 
              padding: '1.5rem',
              backgroundColor: '#FFF4F4',
              boxShadow: '0 4px 12px rgba(255,59,48,0.15)',
              position: 'relative',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-14px',
              left: '16px',
              backgroundColor: '#FF3B30',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(255,59,48,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              letterSpacing: '1px'
            }}>
              🔥 {item.category || '긴급'}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
              {item.showTarget !== false && item.target && (
                <div style={{ backgroundColor: '#FFE5E5', color: '#D90000', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {item.target}
                </div>
              )}
            </div>
            
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#111', fontWeight: 'bold' }}>{item.title}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {item.showDescription !== false && (
                <p style={{ 
                  color: '#444', 
                  fontSize: '1rem', 
                  display: '-webkit-box', 
                  WebkitLineClamp: 3, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden',
                  lineHeight: '1.5'
                }}>
                  {item.description}
                </p>
              )}
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#0052CC', fontWeight: 'bold', fontSize: '0.95rem' }}>자세히 보기 &gt;</span>
                {item.showDepartment !== false && (
                  <span style={{ color: '#888', fontSize: '0.85rem' }}>{item.department}</span>
                )}
              </div>
              {item.showEndDate !== false && item.endDate && (
                <p style={{ fontSize: '0.95rem', color: '#FF3B30', fontWeight: 'bold', marginTop: '0.5rem' }}>
                  마감: {item.endDate}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* 일반 혜택 목록 */}
        {filteredSubsidies.map((item) => {
          const urgent = isUrgent(item.endDate);
          return (
            <div 
              key={item.id} 
              onClick={() => handleItemClick(item)}
              style={{ 
                border: urgent ? '2px solid #FF3B30' : '1px solid var(--border-color)', 
                borderRadius: '16px', 
                padding: '1.5rem',
                backgroundColor: urgent ? '#FFF4F4' : '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              {urgent && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '16px',
                  backgroundColor: '#FF3B30',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(255,59,48,0.3)'
                }}>
                  🚨 마감임박
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {item.categories && item.categories.map((cat, idx) => (
                  <div key={idx} style={{ backgroundColor: '#F0F5FF', color: '#0052CC', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {cat}
                  </div>
                ))}
              </div>
              
              <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{item.title}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ 
                  color: 'var(--primary-color)', 
                  fontWeight: 'bold', 
                  fontSize: '1.1rem', 
                  wordBreak: 'keep-all',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '1.4'
                }}>
                  {item.amount}
                </p>
                <p style={{ fontSize: '0.95rem', color: urgent ? '#FF3B30' : '#888', fontWeight: urgent ? 'bold' : 'normal' }}>
                  마감: {item.endDate}
                </p>
              </div>
            </div>
          );
        })}
        {filteredSubsidies.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-light)' }}>
            선택한 카테고리에 해당하는 지원금이 없습니다.
          </div>
        )}
      </div>

      <div style={{ paddingBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button 
          onClick={handleShare} 
          style={{ 
            width: '100%', padding: '1.5rem', fontSize: '1.3rem', height: '100px', 
            backgroundColor: '#FAE100', color: '#000000', border: 'none', borderRadius: '12px',
            fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#3A1D1D" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3C5.9 3 1 6.8 1 11.5c0 2.8 1.6 5.4 4.1 7.1-.2 1.3-1 3.5-1 3.7 0 .2.2.3.4.2 1.1-.7 4.1-2.8 4.6-3.2 1 .3 2 .4 3 .4 6.1 0 11-3.8 11-8.5S18.1 3 12 3z"/>
          </svg>
          카톡으로 지원금•혜택 공유하기
        </button>
        
        <button 
          className="btn-accent heartbeat-btn" 
          onClick={handleDonationClick} 
          style={{ padding: '1.2rem', fontSize: '1.2rem', border: 'none', borderRadius: '14px' }}
        >
          꿀꿀이에게 고맙다고 후원해주기 💖
        </button>
        
        <button 
          className="btn-primary" 
          onClick={() => window.location.href = '/'} 
          style={{ padding: '1rem', fontSize: '1.1rem', backgroundColor: '#FFFFFF', color: '#333333', border: '1px solid #DDDDDD', marginTop: '1rem' }}
        >
          🏠 처음으로 돌아가기
        </button>
      </div>

      {/* 저작권 표기 */}
      <div style={{ marginTop: 'auto', paddingBottom: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: '#999', letterSpacing: '0.5px' }}>
          © {new Date().getFullYear()} SHNJ Soft. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>로딩중...</div>}>
      <ResultContent />
    </Suspense>
  );
}
