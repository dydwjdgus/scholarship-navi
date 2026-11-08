// =====================================================
// 장학금 기준 데이터
// - 원본 자료: 프로젝트 폴더의 scholarships.csv (자료수집 담당 정리)
//   사이트는 이 파일만 읽음 (CSV를 직접 불러오지 않음 → file://에서도 동작)
// - CSV가 바뀌면 이 파일의 값도 같이 고쳐 주세요.
//
// [값 규칙]
//   null   : 그 기준 없음 (CSV 빈칸) → 비교하지 않음
//   "모름" : 기준은 있지만 값을 모름 → 그 조건은 "확인 필요"로 표시
//
// [각 항목 설명]
//   name            : 장학금 이름
//   type            : 구분. "교내" 또는 "국가"
//   amount          : 지원 금액 (화면 표시용 글자)
//   minGpa          : 최소 직전 학기 평점 (4.5 만점, 이상)
//   minPercent      : 최소 직전 학기 백분위 점수 (100점 만점, 이상)
//                     ※ 평점 ↔ 백분위 환산은 하지 않음 (가천대 환산식 비공개)
//   minCredits      : 최소 직전 학기 이수학점 (이상)
//   incomeMin       : 학자금 지원구간(소득분위) 하한. 기초·차상위 = 0, 1~10구간 = 1~10
//   incomeMax       : 학자금 지원구간(소득분위) 상한
//   firstTermExempt : 첫 학기(신입·편입·재입학) 성적기준 미적용 여부
//                     true → 첫 학기 학생은 성적 조건 통과 / false·"모름" → 확인 필요
//   otherConditions : 기타 조건 원문 (줄바꿈 포함). 화면에 접기/펼치기로만 보여주고 판정에는 쓰지 않음
//   sourceUrl       : 공고(출처) 링크
//
// [선택 항목] 필요한 장학금에만 있음
//   manualChecks    : 자동 판정이 안 되지만 꼭 확인해야 하는 조건 → 항상 "확인 필요"
//                     { label: 화면 줄 이름, note: 안내 문장 }
//   percentByIncome : 지원구간에 따라 백분위 기준이 다를 때 (구간 범위 + 그 구간의 최소 백분위)
//   percentWarning  : 기준에 못 미쳐도 예외로 받을 수 있는 구간 (예: C학점 경고제)
//                     이 구간 학생이 minPercent 이상 ~ 기준 미만이면 "확인 필요"
// =====================================================

const SCHOLARSHIPS = [
  {
    name: "학과성적우수 장학금",
    type: "교내",
    amount: "수업료 일부",
    minGpa: 3,
    minPercent: null,
    minCredits: 12,
    incomeMin: null,
    incomeMax: null,
    firstTermExempt: false,
    manualChecks: [
      {
        label: "학과·학년별 성적 상위 15%",
        note: "학과·학년별 성적 상위 15% 이내인지 확인이 필요해요. (학과별 자체 내규로 선발)"
      }
    ],
    otherConditions:
      "각 학과 학년별 성적이 15%이내에 속하는 자 (학과별 자체내규에 따라 장학생 선발)\n" +
      "P/F과목 제외\n" +
      "자동선발 (고지서감면)",
    sourceUrl: "https://www.gachon.ac.kr/kor/3127/subview.do"
  },
  {
    name: "인간사랑 장학금",
    type: "교내",
    amount: "별도기준",
    minGpa: 2.5,
    minPercent: null,
    minCredits: 12,
    incomeMin: null,
    incomeMax: 0,
    firstTermExempt: "모름",
    otherConditions:
      "국가장학금 신청자 중, 소득0분위 (기초생활수급자)\n" +
      "한국장학재단 국가장학금 신청으로 갈음 (자동선발)",
    sourceUrl: "https://www.gachon.ac.kr/kor/3127/subview.do"
  },
  {
    name: "이웃사랑 장학금",
    type: "교내",
    amount: "구간별 차등",
    minGpa: 2.5,
    minPercent: null,
    minCredits: 12,
    incomeMin: 1,
    incomeMax: 3,
    firstTermExempt: "모름",
    otherConditions:
      "국가장학금 신청자 중, 소득 1~3분위\n" +
      "1분위: 70만원 / 2분위: 70만원 / 3분위: 60만원\n" +
      "한국장학재단 국가장학금 신청으로 갈음 (자동선발)",
    sourceUrl: "https://www.gachon.ac.kr/kor/3127/subview.do"
  },
  {
    name: "공동체사랑장학금",
    type: "교내",
    amount: "구간별 차등",
    minGpa: 2.5,
    minPercent: null,
    minCredits: 12,
    incomeMin: 4,
    incomeMax: 8,
    firstTermExempt: "모름",
    otherConditions:
      "국가장학금 신청자 중, 소득 4~8분위\n" +
      "4분위:50만원 / 5분위:40만원 / 6분위:30만원 / 7분위:20만원 / 8분위:10만원\n" +
      "한국장학재단 국가장학금 신청으로 갈음 (자동선발)",
    sourceUrl: "https://www.gachon.ac.kr/kor/3127/subview.do"
  },
  {
    name: "장학사정관(국가장학금2유형 대응)",
    type: "교내",
    amount: "수업료 범위 내 수혜 가능 금액 전액",
    minGpa: null,
    minPercent: 85,
    minCredits: 12,
    incomeMin: null,
    incomeMax: "모름", // 지급가능 소득구간이 매 학기 변동
    firstTermExempt: true,
    otherConditions:
      "국가장학금 II유형 대신 학교가 지급\n" +
      "낮은 소득분위부터 예산소진시까지 순차적으로 지급, 동일소득분위 내 성적순 적용\n" +
      "지급가능 소득구간은 매학기 변동\n" +
      "졸업학기 9학점 이상\n" +
      "신입생군(신·편·재입학생)은 성적 및 이수학점 기준 미적용으로 동일소득분위 내 우선선발",
    sourceUrl: "https://www.gachon.ac.kr/bbs/kor/478/121440/artclView.do"
  },
  {
    name: "국가근로장학금",
    type: "국가",
    amount: "시급제",
    minGpa: null,
    minPercent: 70,
    minCredits: "모름",
    incomeMin: null,
    incomeMax: 9,
    firstTermExempt: "모름",
    otherConditions:
      "근로 활동 필요(시급제)\n" +
      "선발기본요건+대학자체선발기준 = 장학생 최종선발\n" +
      "시급: 교내근로 10,320원 / 교외근로 12,790원",
    sourceUrl: "https://www.gachon.ac.kr/kor/3130/subview.do"
  },
  {
    name: "국가장학금 I유형",
    type: "국가",
    amount: "구간별 차등",
    minGpa: null,
    minPercent: 80,
    minCredits: 12,
    incomeMin: null,
    incomeMax: 9,
    firstTermExempt: true,
    // 기초·차상위(0구간)는 백분위 70점 이상
    percentByIncome: [
      { incomeMin: 0, incomeMax: 0, minPercent: 70 }
    ],
    // C학점 경고제: 1~3구간은 70점 이상 80점 미만이어도 2회까지 수혜 가능
    percentWarning: {
      incomeMin: 1,
      incomeMax: 3,
      minPercent: 70,
      note: "C학점 경고제로 2회까지 수혜 가능해요. (1~3구간, 백분위 70점 이상 80점 미만) 남은 경고 횟수를 확인해 주세요."
    },
    otherConditions:
      "신입생, 편입생, 재입학생: 첫 학기에 한해 성적기준 미적용\n" +
      "기초/차상위: 직전학기 12학점 이수하여 70점 이상 취득(100점 만점 기준)\n" +
      "C학점 경고제: 1~3구간은 직전학기 70점 이상 ~ 80점 미만이라도 2회에 한해 경고 후 수혜 가능\n" +
      "장애인: 성적기준(이수학점 및 백분위점수) 미적용",
    sourceUrl: "https://www.kosaf.go.kr/ko/scholar.do?pg=scholarship05_12_01_01&naviParam=JH,02,02,05"
  },
  {
    name: "지역사랑장학금",
    type: "교내",
    amount: "10만원",
    minGpa: 2.5,
    minPercent: null,
    minCredits: 12,
    incomeMin: 9,
    incomeMax: 9,
    firstTermExempt: true,
    otherConditions:
      "국가장학금 신청자 중 소득 9분위\n" +
      "신·편입생은 첫 학기에 취득학점 및 성적과 관계없이 장학금 지급\n" +
      "기존 저소득층 장학금 수혜자(인간사랑, 이웃사랑, 공동체사랑)는 해당 장학금 수혜 대상에서 제외",
    sourceUrl: "https://www.gachon.ac.kr/kor/3127/subview.do"
  }
];

// "조금 부족"으로 판정하는 범위
// ※ 장학금 규정에 있는 값이 아니라, 결과 화면을 나누기 위해 우리 팀이 정한 표시용 값
//   기준보다 아래 값 이하로 모자라면 "조금 부족", 더 모자라면 "해당 없음"
const NEAR_MISS = {
  gpa: 0.3,     // 평점 0.3점 이하로 부족
  percent: 3,   // 백분위 3점 이하로 부족
  credits: 3    // 이수학점 3학점 이하로 부족
};
