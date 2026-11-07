// =====================================================
// 장학 내비 - 입력값 처리, 기준 비교, 결과 그리기
// - 장학금 기준 숫자는 data.js(SCHOLARSHIPS, NEAR_MISS)에서만 가져옴
// - 입력값은 저장하지 않음: input.html → result.html 로 URL 쿼리스트링으로만 전달
//   예) result.html?grade=2&gpa=3.8&cumGpa=3.6&pct=92&credits=18&income=4
//       result.html?grade=1&firstTerm=1&income=unknown   (첫 학기라 성적 없음)
// - <body data-page="..."> 값을 보고 페이지별 기능을 실행
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
  const page = document.body.dataset.page;
  if (page === "input") initInputPage();
  if (page === "result") initResultPage();
});

// =====================================================
// 공통: 입력값 검사 (입력 화면과 결과 화면이 같이 사용)
// 각 함수는 { ok: true, value } 또는 { ok: false, message } 를 돌려줌
// =====================================================

// 학년: 1 ~ 4
function parseGrade(text) {
  text = String(text || "").trim();
  if (/^[1-4]$/.test(text)) return { ok: true, value: Number(text) };
  return { ok: false, message: "학년을 선택해 주세요." };
}

// 소수 둘째 자리까지의 숫자를 min~max 범위로 검사하는 공통 함수
function parseDecimal(text, max, emptyMsg, example) {
  text = String(text || "").trim();
  if (text === "") return { ok: false, message: emptyMsg };
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return { ok: false, message: "숫자로 입력해 주세요. (예: " + example + ")" };
  }
  const value = Number(text);
  if (value < 0 || value > max) {
    return { ok: false, message: "0 ~ " + max + " 사이로 입력해 주세요." };
  }
  return { ok: true, value: value };
}

// 직전 학기 평점 / 누적 평점: 0 ~ 4.5
function parseGpa(text) {
  return parseDecimal(text, 4.5, "평점을 입력해 주세요.", "3.75");
}

// 백분율 점수: 0 ~ 100
function parsePercent(text) {
  return parseDecimal(text, 100, "백분율 점수를 입력해 주세요.", "92.5");
}

// 이수학점: 0 이상 정수
function parseCredits(text) {
  text = String(text || "").trim();
  if (text === "") return { ok: false, message: "이수학점을 입력해 주세요." };
  if (!/^\d+$/.test(text)) {
    return { ok: false, message: "0 이상의 정수로 입력해 주세요. (예: 18)" };
  }
  return { ok: true, value: Number(text) };
}

// 학자금 지원구간: "0"~"10" → 숫자, "unknown" → null(모름)
function parseIncome(text) {
  text = String(text || "").trim();
  if (text === "unknown") return { ok: true, value: null };
  if (/^\d+$/.test(text) && Number(text) <= 10) {
    return { ok: true, value: Number(text) };
  }
  return { ok: false, message: "학자금 지원구간을 선택해 주세요." };
}

// 선택 입력칸용: 비어 있으면 통과(null), 값이 있으면 원래 검사 함수로 검사
function optional(parse) {
  return function (text) {
    if (String(text || "").trim() === "") return { ok: true, value: null };
    return parse(text);
  };
}

// 숫자를 보기 좋게 (평점은 소수 둘째 자리 고정, 백분율은 불필요한 0 제거)
function fmtGpa(v) { return v.toFixed(2); }
function fmtPercent(v) { return String(Number(v.toFixed(2))); }

// 지원구간 숫자 → 화면용 글자
function incomeName(n) {
  return n === 0 ? "기초·차상위(0구간)" : n + "구간";
}

function incomeLabel(income) {
  if (income === null) return "지원구간 모름";
  if (income === 0) return "기초·차상위";
  return "지원구간 " + income + "구간";
}

// =====================================================
// 화면 2 — 성적 입력 (input.html)
// =====================================================
function initInputPage() {
  const form = document.getElementById("grade-form");
  const submitBtn = document.getElementById("submit-btn");
  const firstTerm = document.getElementById("first-term");
  const firstTermBox = firstTerm.closest(".first-term");

  // 칸별 설정
  //   key     : 주소(쿼리스트링)에 쓰는 이름
  //   isScore : 성적 칸 여부 (첫 학기 체크 시 꺼짐)
  //   optional: 선택 입력 여부 (비워도 됨)
  const fields = [
    { el: document.getElementById("grade"), parse: parseGrade, key: "grade" },
    { el: document.getElementById("gpa"), parse: parseGpa, key: "gpa", isScore: true },
    { el: document.getElementById("cumGpa"), parse: optional(parseGpa), key: "cumGpa", isScore: true, optional: true },
    { el: document.getElementById("pct"), parse: optional(parsePercent), key: "pct", isScore: true, optional: true },
    { el: document.getElementById("credits"), parse: parseCredits, key: "credits", isScore: true },
    { el: document.getElementById("income"), parse: parseIncome, key: "income" }
  ];
  const gradeField = fields[0];

  // 지금 검사해야 하는 칸 (첫 학기면 성적 칸은 제외)
  function activeFields() {
    return fields.filter(function (f) {
      return !(firstTerm.checked && f.isScore);
    });
  }

  // "다시 입력하기"로 돌아왔다면 주소에 있던 값을 칸에 다시 채움
  const params = new URLSearchParams(location.search);
  fields.forEach(function (f) {
    if (params.has(f.key)) f.el.value = params.get(f.key);
  });
  firstTerm.checked = params.get("firstTerm") === "1";

  // 칸 하나의 오류 표시를 갱신
  // showError가 false면 오류 문구는 숨김 (아직 손대지 않은 칸에 빨간 글씨가 뜨지 않도록)
  function updateField(f, showError) {
    const result = f.parse(f.el.value);
    const wrapper = f.el.closest(".field");
    const msg = wrapper.querySelector(".error-msg");
    const show = showError && !result.ok && !f.el.disabled;
    wrapper.classList.toggle("invalid", show);
    msg.textContent = show ? result.message : "";
    msg.hidden = !show;
    return result;
  }

  // 검사 대상 칸이 모두 올바를 때만 "결과 보기" 버튼 활성화
  function updateButton() {
    const allOk = activeFields().every(function (f) {
      return f.parse(f.el.value).ok;
    });
    submitBtn.disabled = !allOk;
  }

  // 학년·첫 학기 체크 상태를 화면에 반영
  // - 첫 학기 체크박스는 1학년일 때만 사용 가능
  // - 체크하면 성적 칸(직전 평점, 누적 평점, 백분율, 이수학점)이 꺼짐
  function applyFirstTerm() {
    const isFirstYear = gradeField.el.value === "1";
    if (!isFirstYear) firstTerm.checked = false;
    firstTerm.disabled = !isFirstYear;
    firstTermBox.classList.toggle("is-disabled", !isFirstYear);

    fields.forEach(function (f) {
      if (!f.isScore) return;
      f.el.disabled = firstTerm.checked;
      f.el.closest(".field").classList.toggle("is-disabled", firstTerm.checked);
      if (firstTerm.checked) updateField(f, false); // 꺼진 칸의 오류 문구 지우기
    });
    updateButton();
  }

  fields.forEach(function (f) {
    // 입력 중: 이미 손댄 칸이면 고쳐지는 대로 바로 갱신
    f.el.addEventListener("input", function () {
      const touched = f.el.dataset.touched === "true" && f.el.value.trim() !== "";
      updateField(f, touched);
      updateButton();
    });
    // 칸을 벗어날 때 오류 문구 표시
    f.el.addEventListener("blur", function () {
      f.el.dataset.touched = "true";
      if (f.el.value.trim() !== "") updateField(f, true);
    });
    // select를 고를 때
    f.el.addEventListener("change", function () {
      f.el.dataset.touched = "true";
      updateField(f, true);
      if (f === gradeField) applyFirstTerm();
      updateButton();
    });
  });

  firstTerm.addEventListener("change", applyFirstTerm);

  // "결과 보기" → 값을 주소에 붙여 결과 화면으로 이동 (빈 선택 입력칸은 넣지 않음)
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const results = activeFields().map(function (f) {
      return updateField(f, true);
    });
    if (!results.every(function (r) { return r.ok; })) return;

    const query = new URLSearchParams();
    if (firstTerm.checked) query.set("firstTerm", "1");
    activeFields().forEach(function (f) {
      const value = f.el.value.trim();
      if (value !== "") query.set(f.key, value);
    });
    location.href = "result.html?" + query.toString();
  });

  // 처음 한 번 화면 상태 맞추기 (값을 다시 채운 경우 대비)
  applyFirstTerm();
}

// =====================================================
// 화면 3 — 결과 (result.html)
// =====================================================
function initResultPage() {
  const params = new URLSearchParams(location.search);
  const grade = parseGrade(params.get("grade"));
  const income = parseIncome(params.get("income"));
  // 첫 학기는 1학년만 가능
  const isFirstTerm = params.get("firstTerm") === "1" && grade.ok && grade.value === 1;

  // 첫 학기면 성적은 모두 null, 아니면 주소의 값을 검사 (누적 평점·백분율은 선택)
  let gpa = { ok: true, value: null };
  let cumGpa = { ok: true, value: null };
  let pct = { ok: true, value: null };
  let credits = { ok: true, value: null };
  if (!isFirstTerm) {
    gpa = parseGpa(params.get("gpa"));
    cumGpa = optional(parseGpa)(params.get("cumGpa"));
    pct = optional(parsePercent)(params.get("pct"));
    credits = parseCredits(params.get("credits"));
  }

  // 주소의 값이 없거나 잘못됐으면 입력 화면으로 돌려보냄
  if (![grade, income, gpa, cumGpa, pct, credits].every(function (r) { return r.ok; })) {
    location.replace("input.html");
    return;
  }

  const input = {
    grade: grade.value,
    firstTerm: isFirstTerm,
    gpa: gpa.value,
    cumGpa: cumGpa.value,
    percent: pct.value,
    credits: credits.value,
    income: income.value
  };

  // "다시 입력하기"를 누르면 입력했던 값이 그대로 채워지도록 주소 전달
  document.getElementById("retry-btn").href = "input.html?" + params.toString();

  // 모든 장학금 판정 후 네 묶음으로 나누기
  const judged = SCHOLARSHIPS.map(function (s) {
    return judgeScholarship(s, input);
  });
  function byStatus(status) {
    return judged.filter(function (j) { return j.status === status; });
  }
  const groups = {
    pass: byStatus("pass"),
    check: byStatus("check"),
    near: byStatus("near"),
    none: byStatus("none")
  };

  renderSummary(input, groups);
  renderGroup("pass-list", groups.pass, renderPassCard);
  renderGroup("check-list", groups.check, renderCheckCard);
  renderGroup("near-list", groups.near, renderNearCard);
  renderGroup("none-list", groups.none, renderNoneCard);
}

// =====================================================
// 판정 엔진
//
// 조건(rows) 하나하나의 state:
//   "pass"    통과
//   "short"   미달 (조금 부족: NEAR_MISS 범위 안)
//   "fail"    미달 (많이 부족하거나 대상 아님)
//   "unknown" 확인 불가 (사용자가 모름/비워둠, 데이터가 "모름", 입력받지 않는 조건)
//
// 장학금 전체 status (미달 > 확인 불가 > 통과):
//   fail이 하나라도 있으면        → "none"  (해당 없음)
//   short가 있으면                → "near"  (조금 부족)
//   미달 없이 unknown이 있으면    → "check" (확인 필요)
//   모두 통과                     → "pass"  (충족)
// =====================================================

// 사용할 성적 값 정하기
// - 직전 학기: 입력한 직전 학기 평점 / 백분율
// - 누적 평점: 입력했으면 그 값. 비워뒀으면 1학년은 직전 학기 평점으로 대신(1학년 2학기는 두 값이 같음),
//              2학년 이상은 null(확인 불가)
// - 누적 백분율: 입력란이 하나(직전 학기 기준)뿐이라, 1학년만 같은 값으로 대신하고 2학년 이상은 null
function scoreValues(input) {
  const isFirstYear = input.grade === 1;
  return {
    prevGpa: input.gpa,
    cumGpa: input.cumGpa !== null ? input.cumGpa : (isFirstYear ? input.gpa : null),
    prevPercent: input.percent,
    cumPercent: isFirstYear ? input.percent : null
  };
}

// scoreBasis → 판정할 성적 종류 목록
function basisList(basis) {
  if (basis === "누적") return ["cum"];
  if (basis === "둘다") return ["prev", "cum"];
  return ["prev"]; // "직전학기" (값이 없거나 잘못돼도 직전 학기로)
}

// 평점·백분율 하나 비교 → ctx에 줄/안내 추가
//   kind: "gpa" | "percent",  which: "prev" | "cum"
function judgeScore(ctx, s, kind, which, value) {
  const isGpa = kind === "gpa";
  const min = isGpa ? s.minGpa : s.minPercent;
  const fmt = isGpa ? fmtGpa : fmtPercent;
  const word = isGpa ? "평점" : "백분율";
  const label = (which === "prev" ? "직전 학기 " : "누적 ") + word;
  const strict = s.scoreCompare === "초과";
  const cmpWord = strict ? "초과" : "이상";

  // 값이 없으면 확인 불가
  if (value === null) {
    ctx.rows.push({ label: label, text: "확인 필요", state: "unknown" });
    if (isGpa && which === "cum") ctx.notes.push("누적 평점을 입력하면 판정할 수 있어요. (기준: " + fmt(min) + " " + cmpWord + ")");
    else if (!isGpa && which === "prev") ctx.notes.push("백분율 점수를 입력하면 판정할 수 있어요. (기준: " + fmt(min) + "점 " + cmpWord + ")");
    else if (!isGpa && which === "cum") ctx.notes.push("누적 백분율 기준이에요. 포털에서 누적 백분율을 확인해 주세요. (기준: " + fmt(min) + "점 " + cmpWord + ")");
    return;
  }

  // 소수 둘째 자리 정수로 바꿔 비교 (부동소수점 오차 방지)
  const v100 = Math.round(value * 100);
  const m100 = Math.round(min * 100);
  const passed = strict ? v100 > m100 : v100 >= m100;
  if (passed) {
    ctx.rows.push({ label: label, text: fmt(min) + " " + cmpWord + " · 충족", state: "pass" });
    return;
  }

  // 미달: 모자란 만큼 계산
  const gap = (m100 - v100) / 100;
  const text = gap === 0
    ? fmt(min) + " 초과 필요"          // 기준값과 같은데 "초과" 기준
    : word + " " + fmt(gap) + " 부족";
  const nearLimit = isGpa ? NEAR_MISS.gpa : NEAR_MISS.percent;
  if (gap <= nearLimit) {
    ctx.rows.push({ label: label, text: text, state: "short" });
    const target = which === "prev" ? "다음 학기 " + word : "누적 " + word;
    const toWord = strict ? "초과로" : "이상으로";
    ctx.goals.push(target + "을 " + fmt(min) + " " + toWord + " 올리면 받을 수 있어요.");
  } else {
    ctx.rows.push({ label: label, text: text, state: "fail" });
    ctx.reasons.push(label + " 기준 미달");
  }
}

function judgeScholarship(s, input) {
  const ctx = {
    rows: [],     // 조건별 판정 줄
    goals: [],    // 조금 부족할 때 목표 안내
    reasons: [],  // 해당 없음일 때 사유
    notes: []     // 확인 불가 조건마다 무엇을 확인해야 하는지
  };

  // 1) 학년
  const gr = s.gradeRange;
  if (gr && (gr.min !== null || gr.max !== null)) {
    let target;
    if (gr.min !== null && gr.max !== null) target = gr.min === gr.max ? gr.min + "학년" : gr.min + "~" + gr.max + "학년";
    else if (gr.min !== null) target = gr.min + "학년 이상";
    else target = gr.max + "학년 이하";
    const inRange = (gr.min === null || input.grade >= gr.min) && (gr.max === null || input.grade <= gr.max);
    if (inRange) {
      ctx.rows.push({ label: "학년", text: target + " 대상 · 통과", state: "pass" });
    } else {
      ctx.rows.push({ label: "학년", text: target + " 대상", state: "fail" });
      ctx.reasons.push("학년 대상 아님");
    }
  }

  // 2) 성적 조건 (평점·백분율·이수학점)
  const hasScore = s.minGpa !== null || s.minPercent !== null || s.minCredits !== null;
  if (input.firstTerm && hasScore) {
    // 첫 학기: 성적기준 미적용 장학금은 통과, 아니면 확인 불가
    const labels = [];
    if (s.minGpa !== null) labels.push("평점");
    if (s.minPercent !== null) labels.push("백분율");
    if (s.minCredits !== null) labels.push("이수학점");
    labels.forEach(function (name) {
      if (s.firstTermExempt) {
        ctx.rows.push({ label: name, text: "첫 학기 미적용 · 통과", state: "pass" });
      } else {
        ctx.rows.push({ label: name, text: "확인 필요", state: "unknown" });
      }
    });
    if (!s.firstTermExempt) {
      ctx.notes.push("직전 학기 성적이 나오면 " + labels.join("·") + " 조건을 판정할 수 있어요.");
    }
  } else {
    const sv = scoreValues(input);
    // 평점: "둘다"면 직전 학기와 누적을 각각 판정 (하나라도 미달이면 미달 → 전체 규칙이 처리)
    basisList(s.scoreBasis).forEach(function (which) {
      if (s.minGpa !== null) judgeScore(ctx, s, "gpa", which, which === "prev" ? sv.prevGpa : sv.cumGpa);
    });
    basisList(s.scoreBasis).forEach(function (which) {
      if (s.minPercent !== null) judgeScore(ctx, s, "percent", which, which === "prev" ? sv.prevPercent : sv.cumPercent);
    });

    // 이수학점 (항상 "이상")
    if (s.minCredits !== null) {
      if (input.credits >= s.minCredits) {
        ctx.rows.push({ label: "이수학점", text: s.minCredits + "학점 이상 · 충족", state: "pass" });
      } else {
        const gap = s.minCredits - input.credits;
        if (gap <= NEAR_MISS.credits) {
          ctx.rows.push({ label: "이수학점", text: gap + "학점 부족", state: "short" });
          ctx.goals.push("다음 학기에 " + s.minCredits + "학점 이상 이수하면 받을 수 있어요.");
        } else {
          ctx.rows.push({ label: "이수학점", text: gap + "학점 부족", state: "fail" });
          ctx.reasons.push("이수학점 기준 미달");
        }
      }
    }
  }

  // 3) 학자금 지원구간 (하한 이상 + 상한 이하일 때만 통과)
  judgeIncome(ctx, s, input.income);

  // 4) 기타 조건 (자동 판정 불가 → 항상 확인 불가)
  (s.otherConditions || []).forEach(function (cond) {
    ctx.rows.push({ label: cond, text: "확인 필요", state: "unknown" });
    ctx.notes.push(cond + ": 학교 공지에서 직접 확인해 주세요.");
  });

  // 전체 판정 (미달 > 확인 불가 > 통과)
  const states = ctx.rows.map(function (r) { return r.state; });
  let status = "pass";
  if (states.indexOf("fail") !== -1) status = "none";
  else if (states.indexOf("short") !== -1) status = "near";
  else if (states.indexOf("unknown") !== -1) status = "check";

  return {
    s: s,
    rows: ctx.rows,
    goals: ctx.goals,
    reasons: ctx.reasons,
    checkNotes: ctx.notes,
    status: status
  };
}

// 학자금 지원구간 판정
function judgeIncome(ctx, s, income) {
  const lo = s.incomeMin;
  const hi = s.incomeMax;
  if (lo === null && hi === null) return; // 지원구간 조건 없음

  const label = "학자금 지원구간";
  const loUnknown = lo === "모름";
  const hiUnknown = hi === "모름";
  const loNum = typeof lo === "number" ? lo : null;
  const hiNum = typeof hi === "number" ? hi : null;

  // 기준 범위 글자 (예: 4~8구간 / 8구간 이하 / 4구간 이상 / 9구간만)
  let range;
  if (loNum !== null && hiNum !== null) {
    range = loNum === hiNum ? incomeName(loNum) + "만" : (loNum === 0 ? "기초·차상위" : loNum) + "~" + hiNum + "구간";
  } else if (hiNum !== null) {
    range = incomeName(hiNum) + " 이하";
  } else if (loNum !== null) {
    range = incomeName(loNum) + " 이상";
  } else {
    range = "원문 확인 필요";
  }

  // 사용자가 "모름"을 고른 경우
  if (income === null) {
    ctx.rows.push({ label: label, text: "확인 필요", state: "unknown" });
    ctx.notes.push("학자금 지원구간을 확인하면 정확히 판정할 수 있어요. (기준: " + range + ")");
    return;
  }

  // 알려진 경계부터 비교: 하나라도 벗어나면 확실히 미달
  const belowMin = loNum !== null && income < loNum;
  const aboveMax = hiNum !== null && income > hiNum;
  if (belowMin || aboveMax) {
    ctx.rows.push({ label: label, text: range + " 대상", state: "fail" });
    ctx.reasons.push("지원구간 대상 아님");
    return;
  }

  // 경계 중 데이터가 "모름"인 쪽이 있으면 확인 불가
  if (loUnknown || hiUnknown) {
    ctx.rows.push({ label: label, text: "확인 필요", state: "unknown" });
    ctx.notes.push("이 장학금의 지원구간 기준을 아직 확인하지 못했어요. 공지를 직접 확인해 주세요.");
    return;
  }

  ctx.rows.push({ label: label, text: range + " · 충족", state: "pass" });
}

// -----------------------------------------------------
// 화면 그리기 도우미
// (사용자 입력이 섞일 수 있는 글자는 모두 textContent로 넣음)
// -----------------------------------------------------
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// 배지 아이콘 (고정된 SVG 문자열)
const ICON_CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"></path></svg>';
const ICON_WARN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v6"></path><path d="M12 17h.01"></path></svg>';
const ICON_QUESTION = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V14"></path><path d="M12 18h.01"></path></svg>';

function makeBadge(kind, iconSvg, text) {
  const badge = el("span", "badge " + kind);
  badge.innerHTML = iconSvg;
  badge.appendChild(document.createTextNode(text));
  return badge;
}

// 카드 윗부분: 태그 + 장학금 이름 + 배지
function makeCardHead(s, badge) {
  const head = el("div", "sch-head");
  const left = el("div");
  left.appendChild(el("span", "tag", s.type));
  left.appendChild(el("h3", null, s.name));
  head.appendChild(left);
  head.appendChild(badge);
  return head;
}

// 조건별 줄 목록 (통과: 기본색 / 미달: 주황 / 확인 불가: 파랑)
function makeCriteria(rows) {
  const judgeClass = { pass: "judge", short: "judge short", fail: "judge short", unknown: "judge unknown" };
  const ul = el("ul", "criteria");
  rows.forEach(function (r) {
    const li = el("li");
    li.appendChild(el("span", null, r.label));
    li.appendChild(el("span", judgeClass[r.state], r.text));
    ul.appendChild(li);
  });
  return ul;
}

// 회색 안내 박스 (문장 여러 개면 줄을 나눠서)
function makeGoalBox(sentences) {
  const box = el("div", "goal");
  sentences.forEach(function (text) {
    box.appendChild(el("p", null, text));
  });
  return box;
}

// 카드 아래: 지원 금액 + 기준 원문 링크
function makeCardFoot(s) {
  const foot = el("div", "sch-foot");
  foot.appendChild(el("span", null, "지원 금액 " + s.amount));
  const link = el("a", null, "기준 원문 보기");
  link.href = s.sourceUrl || "#";
  if (link.getAttribute("href") !== "#") {
    link.target = "_blank";
    link.rel = "noopener";
  }
  foot.appendChild(link);
  return foot;
}

// -----------------------------------------------------
// 요약 카드
// -----------------------------------------------------
function renderSummary(input, groups) {
  const title = document.getElementById("summary-title");
  title.textContent = "";
  if (groups.pass.length > 0) {
    title.appendChild(document.createTextNode("받을 수 있는 장학금이"));
    title.appendChild(el("br"));
    title.appendChild(el("span", "count", groups.pass.length + "개"));
    title.appendChild(document.createTextNode(" 있어요"));
  } else if (groups.check.length > 0) {
    title.appendChild(document.createTextNode("확인하면 받을 수도 있는 장학금이"));
    title.appendChild(el("br"));
    title.appendChild(el("span", "count", groups.check.length + "개"));
    title.appendChild(document.createTextNode(" 있어요"));
  } else {
    title.appendChild(document.createTextNode("지금은 기준을 충족한"));
    title.appendChild(el("br"));
    title.appendChild(document.createTextNode("장학금이 없어요"));
  }

  // 입력값 칩 (선택 입력은 입력했을 때만)
  const chips = document.getElementById("summary-chips");
  chips.appendChild(el("span", "chip", input.grade + "학년"));
  if (input.firstTerm) {
    chips.appendChild(el("span", "chip", "첫 학기 (성적 없음)"));
  } else {
    chips.appendChild(el("span", "chip", "직전 평점 " + fmtGpa(input.gpa)));
    if (input.cumGpa !== null) chips.appendChild(el("span", "chip", "누적 평점 " + fmtGpa(input.cumGpa)));
    if (input.percent !== null) chips.appendChild(el("span", "chip", "백분율 " + fmtPercent(input.percent)));
    chips.appendChild(el("span", "chip", input.credits + "학점"));
  }
  chips.appendChild(el("span", "chip", incomeLabel(input.income)));

  // 개수 박스
  ["pass", "check", "near", "none"].forEach(function (key) {
    document.getElementById("count-" + key).textContent = groups[key].length + "개";
  });
}

// 묶음 하나 그리기 (비어 있으면 섹션 제목까지 숨김)
function renderGroup(listId, items, renderCard) {
  const list = document.getElementById(listId);
  const section = list.closest(".result-group");
  if (items.length === 0) {
    section.hidden = true;
    return;
  }
  items.forEach(function (item) {
    list.appendChild(renderCard(item));
  });
}

// 충족 카드
function renderPassCard(j) {
  const card = el("article", "white-card sch-card");
  card.appendChild(makeCardHead(j.s, makeBadge("pass", ICON_CHECK, "충족")));
  card.appendChild(makeCriteria(j.rows));
  card.appendChild(makeCardFoot(j.s));
  return card;
}

// 확인 필요 카드: 어떤 조건을 확인해야 하는지 문장으로 안내
function renderCheckCard(j) {
  const card = el("article", "white-card sch-card");
  card.appendChild(makeCardHead(j.s, makeBadge("check", ICON_QUESTION, "확인 필요")));
  card.appendChild(makeCriteria(j.rows));
  card.appendChild(makeGoalBox(j.checkNotes));
  card.appendChild(makeCardFoot(j.s));
  return card;
}

// 조금 부족 카드: 목표 안내 + (있다면) 확인할 조건 안내
function renderNearCard(j) {
  const card = el("article", "white-card sch-card");
  card.appendChild(makeCardHead(j.s, makeBadge("near", ICON_WARN, "조금 부족")));
  card.appendChild(makeCriteria(j.rows));
  card.appendChild(makeGoalBox(j.goals.concat(j.checkNotes)));
  return card;
}

// 해당 없음 한 줄 카드
function renderNoneCard(j) {
  const card = el("article", "white-card none-card");
  const left = el("div");
  left.appendChild(el("span", "tag", j.s.type));
  left.appendChild(el("h3", null, j.s.name));
  card.appendChild(left);
  card.appendChild(el("span", "reason", j.reasons.join(", ")));
  return card;
}
