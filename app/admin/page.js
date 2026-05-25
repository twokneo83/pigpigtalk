"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [hotIssues, setHotIssues] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = {
    title: "",
    department: "",
    showDepartment: true,
    contact: "",
    showContact: true,
    target: "",
    showTarget: true,
    description: "",
    showDescription: true,
    content: "",
    showContent: true,
    howToApply: "",
    showHowToApply: true,
    category: "긴급",
    endDate: "",
    showEndDate: true,
    isVisible: true
  };

  const [formData, setFormData] = useState(initialForm);
  const [hasUrl, setHasUrl] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/auth");
      if (res.ok) {
        setIsAuthenticated(true);
        fetchHotIssues();
      }
    } catch (e) {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        fetchHotIssues();
      } else {
        setLoginError("아이디 또는 비밀번호가 틀렸습니다.");
      }
    } catch (err) {
      setLoginError("로그인 중 오류가 발생했습니다.");
    }
  };

  const fetchHotIssues = async () => {
    try {
      const res = await fetch("/api/admin/hot-issues");
      const data = await res.json();
      setHotIssues(data);
    } catch (e) {
      console.error("Failed to fetch hot issues");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("정말 삭제하시겠습니까? 즉시 앱에서 사라집니다.")) return;
    try {
      const res = await fetch(`/api/admin/hot-issues?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchHotIssues();
      else alert("삭제 실패");
    } catch (e) {
      alert("오류 발생");
    }
  };

  const handleEdit = (issue) => {
    setEditingId(issue.id);
    setFormData({
      title: issue.title || "",
      department: issue.department || "",
      showDepartment: issue.showDepartment !== false,
      contact: issue.contact || "",
      showContact: issue.showContact !== false,
      target: issue.target || "",
      showTarget: issue.showTarget !== false,
      description: issue.description || "",
      showDescription: issue.showDescription !== false,
      content: issue.content || "",
      showContent: issue.showContent !== false,
      howToApply: issue.howToApply || "",
      showHowToApply: issue.showHowToApply !== false,
      category: issue.category || "긴급",
      endDate: issue.endDate || "",
      showEndDate: issue.showEndDate !== false,
      isVisible: issue.isVisible !== false
    });
    setHasUrl(issue.url && issue.url !== "null");
    setUrl(issue.url && issue.url !== "null" ? issue.url : "");
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVisibilityChange = async (issue, value) => {
    const isVisible = value === "visible";
    const updatedIssue = { ...issue, isVisible };
    
    try {
      const res = await fetch("/api/admin/hot-issues", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedIssue)
      });
      if (res.ok) fetchHotIssues();
      else alert("상태 변경 실패");
    } catch (e) {
      alert("오류 발생");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData(initialForm);
    setHasUrl(false);
    setUrl("");
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    const issueData = {
      ...formData,
      url: hasUrl ? url : "null"
    };

    if (editingId) {
      issueData.id = editingId;
    }

    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch("/api/admin/hot-issues", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issueData)
      });
      
      if (res.ok) {
        alert(editingId ? "성공적으로 수정되었습니다!" : "성공적으로 등록되었습니다!");
        resetForm();
        fetchHotIssues();
      } else {
        alert("요청 실패");
      }
    } catch (e) {
      alert("오류 발생");
    }
  };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>로딩 중...</div>;

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f6f8" }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: "#fff", padding: "3rem 2.5rem", borderRadius: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.08)", width: "100%", maxWidth: "420px", border: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span style={{ fontSize: "3.5rem", display: "block", marginBottom: "1rem", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" }}>🐷</span>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "900", color: "#111", letterSpacing: "-0.5px" }}>꿀꿀이톡 관리자</h1>
            <p style={{ color: "#888", marginTop: "0.5rem", fontSize: "0.95rem" }}>시스템 관리를 위해 로그인해 주세요.</p>
          </div>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#444", fontWeight: "bold" }}>아이디</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem" }} required />
          </div>
          
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#444", fontWeight: "bold" }}>비밀번호</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem" }} required />
          </div>
          
          {loginError && <p style={{ color: "#FF3B30", marginBottom: "1rem", fontSize: "0.9rem" }}>{loginError}</p>}
          
          <button type="submit" style={{ width: "100%", padding: "1rem", backgroundColor: "#0052CC", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1.1rem", cursor: "pointer" }}>로그인</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f6f8", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Premium Header */}
        <header style={{ 
          marginBottom: "2rem", 
          padding: "2.5rem 2rem", 
          background: "linear-gradient(135deg, #0052CC 0%, #003D99 100%)", 
          borderRadius: "20px",
          boxShadow: "0 12px 30px rgba(0, 82, 204, 0.25)",
          color: "white"
        }}>
          <h1 style={{ fontSize: "2.2rem", fontWeight: "900", letterSpacing: "-1px", margin: 0, lineHeight: "1.3", wordBreak: "keep-all" }}>
            꿀꿀이톡 <span style={{ fontWeight: "300", opacity: 0.9 }}>관리자 시스템</span>
          </h1>
          <p style={{ color: "#E5F0FF", marginTop: "1rem", fontSize: "1.05rem", fontWeight: "400", opacity: 0.85, wordBreak: "keep-all", lineHeight: "1.5" }}>
            앱 전반의 데이터와 긴급 핫이슈를 관리하는 스마트 대시보드
          </p>
        </header>

        {/* Main Card */}
        <div style={{ backgroundColor: "#fff", padding: "2rem", borderRadius: "20px", boxShadow: "0 12px 40px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderBottom: "1px solid #f0f0f0", paddingBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#111" }}>🔥 긴급/핫이슈 관리</h2>
            <button onClick={() => showAddForm ? resetForm() : setShowAddForm(true)} style={{ padding: "0.6rem 1rem", backgroundColor: showAddForm ? "#666" : "#FF3B30", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}>
              {showAddForm ? "취소" : "+ 새 등록"}
            </button>
          </div>

        {showAddForm && (
          <form onSubmit={handleAddSubmit} style={{ backgroundColor: "#FFF4F4", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem", border: "1px solid #FFD1D1" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1.5rem", color: "#D90000" }}>
              {editingId ? "핫이슈 수정하기" : "새로운 핫이슈 등록"}
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", marginBottom: "1.2rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.95rem" }}>제목 (필수)</label>
                <input type="text" name="title" value={formData.title} onChange={handleFormChange} required style={{ width: "100%", padding: "0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem" }} />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.95rem" }}>상단 카테고리 뱃지</label>
                <input type="text" name="category" value={formData.category} onChange={handleFormChange} required style={{ width: "100%", padding: "0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem" }} />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.95rem", color: formData.showDepartment ? "#111" : "#888", cursor: "pointer" }}>
                  <input type="checkbox" name="showDepartment" checked={formData.showDepartment} onChange={handleCheckboxChange} style={{ transform: "scale(1.2)" }} /> 
                  담당 기관
                </label>
                <input type="text" name="department" value={formData.department} onChange={handleFormChange} disabled={!formData.showDepartment} placeholder="예: 기획재정부" style={{ width: "100%", padding: "0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem", opacity: formData.showDepartment ? 1 : 0.5 }} />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.95rem", color: formData.showContact ? "#111" : "#888", cursor: "pointer" }}>
                  <input type="checkbox" name="showContact" checked={formData.showContact} onChange={handleCheckboxChange} style={{ transform: "scale(1.2)" }} /> 
                  문의처 전화번호
                </label>
                <input type="text" name="contact" value={formData.contact} onChange={handleFormChange} disabled={!formData.showContact} placeholder="예: 정부24 콜센터 (1588-2188)" style={{ width: "100%", padding: "0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem", opacity: formData.showContact ? 1 : 0.5 }} />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.95rem", color: formData.showTarget ? "#111" : "#888", cursor: "pointer" }}>
                  <input type="checkbox" name="showTarget" checked={formData.showTarget} onChange={handleCheckboxChange} style={{ transform: "scale(1.2)" }} /> 
                  지원 대상
                </label>
                <input type="text" name="target" value={formData.target} onChange={handleFormChange} disabled={!formData.showTarget} placeholder="예: 전국민 (소득 무관)" style={{ width: "100%", padding: "0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem", opacity: formData.showTarget ? 1 : 0.5 }} />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.95rem", color: formData.showEndDate ? "#111" : "#888", cursor: "pointer" }}>
                  <input type="checkbox" name="showEndDate" checked={formData.showEndDate} onChange={handleCheckboxChange} style={{ transform: "scale(1.2)" }} /> 
                  마감일
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  <input type="date" onChange={(e) => setFormData(prev => ({...prev, endDate: e.target.value}))} disabled={!formData.showEndDate} style={{ flex: "1 1 150px", padding: "0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem", opacity: formData.showEndDate ? 1 : 0.5 }} />
                  <input type="text" name="endDate" value={formData.endDate} onChange={handleFormChange} disabled={!formData.showEndDate} placeholder="텍스트 입력 (예: 예산 소진 시 마감)" style={{ flex: "2 1 200px", padding: "0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem", opacity: formData.showEndDate ? 1 : 0.5 }} />
                </div>
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.95rem", color: formData.showDescription ? "#111" : "#888", cursor: "pointer" }}>
                  <input type="checkbox" name="showDescription" checked={formData.showDescription} onChange={handleCheckboxChange} style={{ transform: "scale(1.2)" }} /> 
                  리스트에 노출되는 간략설명 (1~3줄)
                </label>
                <textarea name="description" value={formData.description} onChange={handleFormChange} disabled={!formData.showDescription} rows="2" style={{ width: "100%", padding: "0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem", resize: "vertical", opacity: formData.showDescription ? 1 : 0.5 }} />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.95rem", color: formData.showContent ? "#111" : "#888", cursor: "pointer" }}>
                  <input type="checkbox" name="showContent" checked={formData.showContent} onChange={handleCheckboxChange} style={{ transform: "scale(1.2)" }} /> 
                  상세페이지용 지원내용
                </label>
                <textarea name="content" value={formData.content} onChange={handleFormChange} disabled={!formData.showContent} rows="4" style={{ width: "100%", padding: "0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem", resize: "vertical", opacity: formData.showContent ? 1 : 0.5 }} />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.95rem", color: formData.showHowToApply ? "#111" : "#888", cursor: "pointer" }}>
                  <input type="checkbox" name="showHowToApply" checked={formData.showHowToApply} onChange={handleCheckboxChange} style={{ transform: "scale(1.2)" }} /> 
                  신청 방법 및 서류
                </label>
                <textarea name="howToApply" value={formData.howToApply} onChange={handleFormChange} disabled={!formData.showHowToApply} rows="3" style={{ width: "100%", padding: "0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem", resize: "vertical", opacity: formData.showHowToApply ? 1 : 0.5 }} />
              </div>
            </div>

            <div style={{ marginBottom: "2rem", padding: "1.2rem", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #ddd" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}>
                <input type="checkbox" checked={hasUrl} onChange={(e) => setHasUrl(e.target.checked)} style={{ transform: "scale(1.3)" }} />
                온라인 신청 버튼 활성화
              </label>
              
              {hasUrl && (
                <div style={{ marginTop: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.95rem" }}>신청 링크 (URL)</label>
                  <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required={hasUrl} style={{ width: "100%", padding: "0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem" }} />
                </div>
              )}
            </div>

            <button type="submit" style={{ width: "100%", padding: "1.2rem", backgroundColor: "#FF3B30", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1.2rem", cursor: "pointer" }}>
              {editingId ? "수정 내용 저장" : "새 핫이슈 등록"}
            </button>
          </form>
        )}

        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem", color: "#111" }}>현재 등록된 핫이슈 ({hotIssues.length}건)</h2>
          {hotIssues.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center", padding: "2rem", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>등록된 핫이슈가 없습니다.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {hotIssues.map(issue => (
                <div key={issue.id} style={{ display: "flex", flexDirection: "column", gap: "0.8rem", padding: "1.2rem", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#fff" }}>
                  <div>
                    <span style={{ display: "inline-block", padding: "3px 8px", backgroundColor: "#FFE5E5", color: "#D90000", fontSize: "0.85rem", borderRadius: "4px", marginBottom: "0.5rem", fontWeight: "bold" }}>{issue.category}</span>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", marginBottom: "0.5rem", wordBreak: 'keep-all', lineHeight: "1.4" }}>{issue.title}</h3>
                    <p style={{ fontSize: "0.95rem", color: "#666" }}>마감: {issue.showEndDate !== false ? (issue.endDate || "설정안됨") : "노출안함"}</p>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: "1rem", marginTop: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button 
                        onClick={() => handleEdit(issue)}
                        style={{ padding: "0.6rem 1rem", backgroundColor: "#f0f0f0", color: "#333", border: "1px solid #ccc", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}
                      >
                        수정
                      </button>
                      <button 
                        onClick={() => handleDelete(issue.id)}
                        style={{ padding: "0.6rem 1rem", backgroundColor: "#fff", color: "#FF3B30", border: "1px solid #FF3B30", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}
                      >
                        삭제
                      </button>
                    </div>
                    <select 
                      value={issue.isVisible === false ? "hidden" : "visible"}
                      onChange={(e) => handleVisibilityChange(issue, e.target.value)}
                      style={{ 
                        padding: "0.6rem", 
                        borderRadius: "6px", 
                        border: "1px solid #ddd", 
                        fontWeight: "bold", 
                        fontSize: "0.95rem",
                        backgroundColor: issue.isVisible === false ? "#f5f5f5" : "#E5F0FF", 
                        color: issue.isVisible === false ? "#888" : "#0052CC",
                        cursor: "pointer"
                      }}
                    >
                      <option value="visible">✅ 노출</option>
                      <option value="hidden">🚫 비노출</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
