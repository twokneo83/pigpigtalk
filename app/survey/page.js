"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const questions = [
  {
    id: "age",
    title: "연령대를 선택해 주세요.",
    options: ["60대", "70대", "80대 이상"],
  },
  {
    id: "gender",
    title: "성별을 선택해 주세요.",
    options: ["남성", "여성"],
  },
  {
    id: "region",
    title: "거주하시는 지역은 어디신가요?",
    options: ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "세종"],
  }
];

export default function SurveyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);

  const handleOptionClick = (option) => {
    if (isAnimating) return;
    
    const currentQuestion = questions[currentStep];
    const newAnswers = { ...answers, [currentQuestion.id]: option };
    setAnswers(newAnswers);
    setIsAnimating(true);

    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      } else {
        // 모든 질문 완료, 결과 페이지로 이동 (쿼리 파라미터로 데이터 전달)
        const query = new URLSearchParams(newAnswers).toString();
        router.push(`/result?${query}`);
      }
    }, 400); // 0.4초 후 다음 질문으로
  };

  const currentQuestion = questions[currentStep];

  return (
    <div className="container" style={{ justifyContent: 'center' }}>
      <div className={`fade-in ${isAnimating ? 'animating-out' : ''}`} key={currentStep}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ backgroundColor: 'var(--border-color)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', color: 'var(--text-light)' }}>
            {currentStep + 1} / {questions.length}
          </span>
        </div>
        
        <h2 className="title" style={{ fontSize: '2rem', marginBottom: '3rem' }}>
          {currentQuestion.title}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              className={`btn-outline ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
              onClick={() => handleOptionClick(option)}
              style={{ fontSize: '1.4rem', padding: '1.5rem' }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .animating-out {
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
      `}</style>
    </div>
  );
}
