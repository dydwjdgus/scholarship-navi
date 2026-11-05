// =====================================================
// 장학금 기준 데이터
// ⚠ 지금은 "예시 데이터"입니다. 실제 가천대/국가장학금 기준이 아님!
//    실제 기준이 확인되면 아래 값만 바꾸면 됩니다. (script.js는 수정 불필요)
//
// [각 항목 설명]
//   id         : 장학금을 구분하는 고유 이름 (영문, 겹치면 안 됨)
//   name       : 화면에 보이는 장학금 이름
//   type       : "교내" 또는 "국가"
//   minGpa     : 최소 직전 학기 평점 (이 점수 이상이어야 충족)
//   minCredits : 최소 직전 학기 이수학점 (이 학점 이상이어야 충족)
//   maxIncome  : 최대 소득분위 (이 구간 이하여야 충족). null이면 소득 조건 없음
//   amount     : 지원 금액 설명 (화면 표시용)
// =====================================================

const SCHOLARSHIPS = [
  {
    id: "example-merit",
    name: "(예시) 교내 성적우수장학금",
    type: "교내",
    minGpa: 3.5,
    minCredits: 15,
    maxIncome: null, // 소득 조건 없음
    amount: "등록금 50%"
  },
  {
    id: "example-need",
    name: "(예시) 교내 가계곤란장학금",
    type: "교내",
    minGpa: 2.5,
    minCredits: 12,
    maxIncome: 4,
    amount: "100만원"
  },
  {
    id: "example-national",
    name: "(예시) 국가장학금 I유형",
    type: "국가",
    minGpa: 2.5,
    minCredits: 12,
    maxIncome: 8,
    amount: "구간별 차등 지원"
  }
];
