// =====================================================
// 장학 내비 - 입력 처리, 기준 비교, 결과 표시
// 장학금 기준 숫자는 data.js의 SCHOLARSHIPS에서만 가져옴 (여기에 직접 쓰지 않기)
// =====================================================

// 화면 요소 가져오기
const form = document.getElementById("grade-form");
const resultList = document.getElementById("result-list");

// [확인하기] 버튼을 누르면 실행
form.addEventListener("submit", function (event) {
  event.preventDefault(); // 페이지 새로고침 막기

  const input = readInput();

  // 입력 오류가 있으면 안내만 보여주고 끝
  if (input.error) {
    showError(input.error);
    return;
  }

  // 모든 장학금에 대해 충족 여부 확인
  const results = SCHOLARSHIPS.map(function (s) {
    return { scholarship: s, check: checkScholarship(s, input) };
  });

  renderResults(results);
});

// -----------------------------------------------------
// 1) 입력값 읽기 + 오류 검사
//    성공: { gpa, credits, income }  /  실패: { error: "메시지" }
// -----------------------------------------------------
function readInput() {
  const gpaText = document.getElementById("gpa").value;
  const creditsText = document.getElementById("credits").value;
  const incomeText = document.getElementById("income").value;

  // 빈칸 검사
  if (gpaText === "" || creditsText === "" || incomeText === "") {
    return { error: "평점, 이수학점, 소득분위를 모두 입력해주세요." };
  }

  const gpa = Number(gpaText);
  const credits = Number(creditsText);

  // 범위 검사
  if (isNaN(gpa) || gpa < 0 || gpa > 4.5) {
    return { error: "평점은 0 ~ 4.5 사이로 입력해주세요." };
  }
  if (isNaN(credits) || credits < 0 || credits > 30 || !Number.isInteger(credits)) {
    return { error: "이수학점은 0 ~ 30 사이의 정수로 입력해주세요." };
  }

  // 소득분위: "모름"이면 null, 아니면 숫자
  const income = incomeText === "unknown" ? null : Number(incomeText);

  return { gpa: gpa, credits: credits, income: income };
}

// -----------------------------------------------------
// 2) 장학금 하나의 기준과 입력값 비교
//    status: "pass"(충족) / "fail"(미충족) / "check"(확인 필요)
//    reasons: 미충족·확인 필요 이유 목록
// -----------------------------------------------------
function checkScholarship(s, input) {
  const reasons = [];
  let needCheck = false;

  // 평점 비교
  if (input.gpa < s.minGpa) {
    const gap = (s.minGpa - input.gpa).toFixed(2);
    reasons.push("평점 " + gap + "점 부족 (기준 " + s.minGpa + " 이상)");
  }

  // 이수학점 비교
  if (input.credits < s.minCredits) {
    const gap = s.minCredits - input.credits;
    reasons.push("이수학점 " + gap + "학점 부족 (기준 " + s.minCredits + "학점 이상)");
  }

  // 소득분위 비교 (기준이 있는 장학금만)
  if (s.maxIncome !== null) {
    if (input.income === null) {
      needCheck = true;
      reasons.push("소득분위 확인 필요 (기준 " + s.maxIncome + "구간 이하)");
    } else if (input.income > s.maxIncome) {
      reasons.push("소득분위 초과 (기준 " + s.maxIncome + "구간 이하)");
    }
  }

  // 상태 결정: 이유가 없으면 충족, 소득만 모르는 경우는 확인 필요
  let status = "pass";
  if (reasons.length > 0) {
    status = needCheck && reasons.length === 1 ? "check" : "fail";
  }

  return { status: status, reasons: reasons };
}

// -----------------------------------------------------
// 3) 결과를 화면에 카드로 표시 (충족 → 확인 필요 → 미충족 순서)
// -----------------------------------------------------
function renderResults(results) {
  const order = { pass: 0, check: 1, fail: 2 };
  results.sort(function (a, b) {
    return order[a.check.status] - order[b.check.status];
  });

  const statusText = { pass: "충족", check: "확인 필요", fail: "미충족" };

  resultList.innerHTML = ""; // 이전 결과 지우기

  results.forEach(function (r) {
    const s = r.scholarship;
    const item = document.createElement("div");
    item.className = "result-item " + r.check.status;

    // 제목: [교내] 장학금 이름 - 충족
    const title = document.createElement("h3");
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = s.type;
    title.appendChild(tag);
    title.appendChild(document.createTextNode(s.name + " - " + statusText[r.check.status]));
    item.appendChild(title);

    // 지원 금액
    const amount = document.createElement("p");
    amount.textContent = "지원 금액: " + s.amount;
    item.appendChild(amount);

    // 미충족·확인 필요 이유 목록
    if (r.check.reasons.length > 0) {
      const ul = document.createElement("ul");
      r.check.reasons.forEach(function (reason) {
        const li = document.createElement("li");
        li.textContent = reason;
        ul.appendChild(li);
      });
      item.appendChild(ul);
    }

    resultList.appendChild(item);
  });
}

// 입력 오류 메시지 표시
function showError(message) {
  resultList.innerHTML = "";
  const p = document.createElement("p");
  p.className = "error";
  p.textContent = message;
  resultList.appendChild(p);
}
