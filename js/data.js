// =====================================================
// 장학금 기준 데이터
// ⚠ 지금은 "예시 데이터"입니다. 실제 가천대·국가장학금 기준이 아님!
//    자료수집 담당 자료가 오면 이 파일만 고치면 됩니다. (app.js는 수정 불필요)
//
// [각 항목 설명]
//   name       : 화면에 보이는 장학금 이름
//   type       : "교내" 또는 "국가"
//   minGpa     : 최소 직전 학기 평점 (이 점수 이상이면 충족)
//   minCredits : 최소 직전 학기 이수학점 (이 학점 이상이면 충족)
//   maxIncome  : 최대 소득구간 (이 구간 이하면 충족). null이면 소득 조건 없음
//                소득구간 표기: 기초·차상위 = 0, 1~10구간 = 1~10
//   amount     : 지원 금액 설명 (화면 표시용 글자)
//   link       : "신청 방법 보기" 링크 주소 (아직 없으면 "#")
// =====================================================

const SCHOLARSHIPS = [
  {
    name: "국가장학금 Ⅰ유형 (예시)",
    type: "국가",
    minGpa: 2.5,
    minCredits: 12,
    maxIncome: 8,
    amount: "자료 확인 후 입력",
    link: "#"
  },
  {
    name: "학업장려장학금 (예시)",
    type: "교내",
    minGpa: 2.0,
    minCredits: 12,
    maxIncome: null, // 소득 조건 없음
    amount: "자료 확인 후 입력",
    link: "#"
  },
  {
    name: "성적우수장학금 (예시)",
    type: "교내",
    minGpa: 4.0,
    minCredits: 15,
    maxIncome: null,
    amount: "자료 확인 후 입력",
    link: "#"
  },
  {
    name: "수석장학금 (예시)",
    type: "교내",
    minGpa: 4.4,
    minCredits: 18,
    maxIncome: null,
    amount: "자료 확인 후 입력",
    link: "#"
  }
];

// "조금 부족"으로 판정하는 범위
// 평점이 기준보다 gpa 이하로 모자라거나, 학점이 credits 이하로 모자라면 "조금 부족"
// 이보다 더 모자라면 "해당 없음"
const NEAR_MISS = {
  gpa: 0.3,
  credits: 3
};
