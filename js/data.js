// =====================================================
// 장학금 기준 데이터
// ⚠ 지금은 "예시 데이터"입니다. 실제 가천대·국가장학금 기준이 아님!
//    자료수집 담당 자료가 오면 이 파일만 고치면 됩니다. (app.js는 수정 불필요)
//
// [각 항목 설명]
//   name            : 화면에 보이는 장학금 이름
//   type            : 분류. "교내" 또는 "국가"
//   amount          : 지원 금액 설명 (화면 표시용 글자)
//
//   minGpa          : 최소 평점 (4.5 만점). 기준 없으면 null
//   minPercent      : 최소 백분율 점수 (100점 만점). 기준 없으면 null
//                     ※ 평점 ↔ 백분율 환산은 하지 않음 (가천대 환산식 비공개)
//   scoreBasis      : 평점·백분율을 어느 성적으로 보는지
//                     "직전학기" / "누적" / "둘다" (둘다 = 두 성적 모두 기준을 넘어야 함)
//   scoreCompare    : 기준값 포함 여부. "이상"(기준값과 같아도 통과) / "초과"(기준값보다 커야 통과)
//                     평점·백분율에 적용. 이수학점은 항상 "이상"
//   minCredits      : 최소 직전 학기 이수학점. 기준 없으면 null
//
//   gradeRange      : 대상 학년 { min: 최소, max: 최대 }. 전체 학년이면 null
//                     한쪽이 열려 있으면 null로 (예: 3학년 이상 → { min: 3, max: null })
//   incomeMin       : 학자금 지원구간 하한 (이 구간 이상이어야 통과)
//   incomeMax       : 학자금 지원구간 상한 (이 구간 이하여야 통과)
//                     숫자(기초·차상위 = 0, 1~10구간 = 1~10) / 없으면 null
//                     원문에서 확인 못 했으면 "모름" → 이 조건은 "확인 필요"로 표시
//
//   firstTermExempt : 첫 학기(1학년 1학기) 학생에게 성적 기준을 적용하지 않으면 true
//                     true  → 첫 학기 학생은 평점·백분율·이수학점 조건을 통과로 처리
//                     false → 첫 학기 학생은 성적 조건을 "확인 필요"로 처리
//   otherConditions : 자동으로 판정할 수 없는 조건 문장 목록 (봉사시간, 추천서 등). 없으면 []
//   sourceUrl       : 기준 원문(공지) 주소. 아직 없으면 "#"
// =====================================================

const SCHOLARSHIPS = [
  {
    name: "국가장학금 Ⅰ유형 (예시)",
    type: "국가",
    amount: "자료 확인 후 입력",
    minGpa: 2.5,
    minPercent: null,
    scoreBasis: "직전학기",
    scoreCompare: "이상",
    minCredits: 12,
    gradeRange: null,
    incomeMin: null,
    incomeMax: 8,
    firstTermExempt: true,
    otherConditions: [],
    sourceUrl: "#"
  },
  {
    name: "학업장려장학금 (예시)",
    type: "교내",
    amount: "자료 확인 후 입력",
    minGpa: 2.0,
    minPercent: null,
    scoreBasis: "직전학기",
    scoreCompare: "이상",
    minCredits: 12,
    gradeRange: null,
    incomeMin: null,
    incomeMax: null,
    firstTermExempt: false,
    otherConditions: ["지도교수 추천서 (예시)"],
    sourceUrl: "#"
  },
  {
    name: "성적우수장학금 (예시)",
    type: "교내",
    amount: "자료 확인 후 입력",
    minGpa: 4.0,
    minPercent: null,
    scoreBasis: "직전학기",
    scoreCompare: "이상",
    minCredits: 15,
    gradeRange: null,
    incomeMin: null,
    incomeMax: null,
    firstTermExempt: false,
    otherConditions: [],
    sourceUrl: "#"
  },
  {
    name: "수석장학금 (예시)",
    type: "교내",
    amount: "자료 확인 후 입력",
    minGpa: 4.4,
    minPercent: null,
    scoreBasis: "직전학기",
    scoreCompare: "이상",
    minCredits: 18,
    gradeRange: null,
    incomeMin: null,
    incomeMax: null,
    firstTermExempt: false,
    otherConditions: [],
    sourceUrl: "#"
  },
  {
    // 지원구간 하한이 있는 예시 (4~8구간만)
    name: "생활지원장학금 (예시)",
    type: "교내",
    amount: "자료 확인 후 입력",
    minGpa: 2.0,
    minPercent: null,
    scoreBasis: "직전학기",
    scoreCompare: "이상",
    minCredits: 12,
    gradeRange: null,
    incomeMin: 4,
    incomeMax: 8,
    firstTermExempt: false,
    otherConditions: [],
    sourceUrl: "#"
  },
  {
    // 학년 제한 + 누적 평점 기준 예시 (3학년 이상)
    name: "전공우수장학금 (예시)",
    type: "교내",
    amount: "자료 확인 후 입력",
    minGpa: 3.5,
    minPercent: null,
    scoreBasis: "누적",
    scoreCompare: "이상",
    minCredits: 15,
    gradeRange: { min: 3, max: null },
    incomeMin: null,
    incomeMax: null,
    firstTermExempt: false,
    otherConditions: [],
    sourceUrl: "#"
  },
  {
    // 백분율 기준만 있는 예시
    name: "백분율우수장학금 (예시)",
    type: "교내",
    amount: "자료 확인 후 입력",
    minGpa: null,
    minPercent: 90,
    scoreBasis: "직전학기",
    scoreCompare: "이상",
    minCredits: 12,
    gradeRange: null,
    incomeMin: null,
    incomeMax: null,
    firstTermExempt: false,
    otherConditions: [],
    sourceUrl: "#"
  }
];

// "조금 부족"으로 판정하는 범위
// ※ 장학금 규정에 있는 값이 아니라, 결과 화면을 나누기 위해 우리 팀이 정한 표시용 값
//   기준보다 아래 값 이하로 모자라면 "조금 부족", 더 모자라면 "해당 없음"
const NEAR_MISS = {
  gpa: 0.3,     // 평점 0.3점 이하로 부족
  percent: 3,   // 백분율 3점 이하로 부족
  credits: 3    // 이수학점 3학점 이하로 부족
};
