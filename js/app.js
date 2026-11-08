// =====================================================
// 장학 내비 - 입력값 처리, 기준 비교, 결과 그리기
// - 장학금 기준 숫자는 data.js(SCHOLARSHIPS, NEAR_MISS)에서만 가져옴
// - 입력값은 저장하지 않음: input.html → result.html 로 URL 쿼리스트링으로만 전달
//   예) result.html?gpa=3.8&pct=92&credits=18&income=4
//       result.html?firstTerm=1&income=unknown   (첫 학기라 성적 없음)
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

// 소수 둘째 자리까지의 숫자를 0~max 범위로 검사하는 공통 함수
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

// 직전 학기 평점: 0 ~ 4.5
function parseGpa(text) {
  return parseDecimal(text, 4.5, "평점을 입력해 주세요.", "3.75");
}

// 직전 학기 백분위 점수: 0 ~ 100
function parsePercent(text) {
  return parseDecimal(text, 100, "백분위 점수를 입력해 주세요.", "92.5");
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

// 숫자를 보기 좋게 (평점은 소수 둘째 자리 고정, 백분위는 불필요한 0 제거)
function fmtGpa(v) { return v.toFixed(2); }
function fmtPercent(v) { return String(Number(v.toFixed(2))); }

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

  // 칸별 설정
  //   key     : 주소(쿼리스트링)에 쓰는 이름
  //   isScore : 성적 칸 여부 (첫 학기 체크 시 꺼짐)
  const fields = [
    { el: document.getElementById("gpa"), parse: parseGpa, key: "gpa", isScore: true },
    { el: document.getElementById("pct"), parse: optional(parsePercent), key: "pct", isScore: true },
    { el: document.getElementById("credits"), parse: parseCredits, key: "credits", isScore: true },
    { el: document.getElementById("income"), parse: parseIncome, key: "income" }
  ];

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

  // 첫 학기 체크 상태를 성적 칸에 반영 (체크하면 평점·백분위·이수학점 칸이 꺼짐)
  function applyFirstTerm() {
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
  const isFirstTerm = params.get("firstTerm") === "1";
  const income = parseIncome(params.get("income"));

  // 첫 학기면 성적은 모두 null, 아니면 주소의 값을 검사 (백분위는 선택)
  let gpa = { ok: true, value: null };
  let pct = { ok: true, value: null };
  let credits = { ok: true, value: null };
  if (!isFirstTerm) {
    gpa = parseGpa(params.get("gpa"));
    pct = optional(parsePercent)(params.get("pct"));
    credits = parseCredits(params.get("credits"));
  }

  // 주소의 값이 없거나 잘못됐으면 입력 화면으로 돌려보냄
  if (![income, gpa, pct, credits].every(function (r) { return r.ok; })) {
    location.replace("input.html");
    return;
  }

  const input = {
    firstTerm: isFirstTerm,
    gpa: gpa.value,
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
  renderGroup("pass-list", groups.pass);
  renderGroup("check-list", groups.check);
  renderGroup("near-list", groups.near);
  renderGroup("none-list", groups.none);
}

// =====================================================
// 판정 엔진
//
// 조건(rows) 하나하나의 state:
//   "pass"    통과
//   "short"   미달 (조금 부족: NEAR_MISS 범위 안)
//   "fail"    미달 (많이 부족하거나 대상 아님)
//   "unknown" 확인 불가 (사용자가 모름/비워둠, 데이터가 "모름", 자동 판정 불가 조건)
//
// 장학금 전체 status (미달 > 확인 불가 > 통과):
//   fail이 하나라도 있으면        → "none"  (해당 없음)
//   short가 있으면                → "near"  (조금 부족)
//   미달 없이 unknown이 있으면    → "check" (확인 필요)
//   모두 통과                     → "pass"  (충족)
// =====================================================

// 지원구간 n이 [lo, hi] 범위 안인지 (null = 제한 없음)
function inIncomeRange(n, lo, hi) {
  return (lo === null || n >= lo) && (hi === null || n <= hi);
}

// 소수 둘째 자리 정수로 바꿔 비교 (부동소수점 오차 방지)
function to100(v) { return Math.round(v * 100); }

// 기준값 이상인지 비교해서 통과 / 조금 부족 / 미달 줄을 ctx에 추가
//   opt: { label, word, min, value, fmt, unit, nearLimit, goal }
function compareMin(ctx, opt) {
  const minText = opt.fmt(opt.min) + opt.unit + " 이상";
  if (to100(opt.value) >= to100(opt.min)) {
    ctx.rows.push({ label: opt.label, text: minText + " · 충족", state: "pass" });
    return;
  }
  const gap = (to100(opt.min) - to100(opt.value)) / 100;
  const text = opt.word + " " + opt.fmt(gap) + opt.unit + " 부족 (기준 " + minText + ")";
  if (gap <= opt.nearLimit) {
    ctx.rows.push({ label: opt.label, text: text, state: "short" });
    ctx.goals.push(opt.goal);
  } else {
    ctx.rows.push({ label: opt.label, text: text, state: "fail" });
    ctx.reasons.push(opt.label + " 기준 미달");
  }
}

// 1) 직전 학기 평점
function judgeGpa(ctx, s, input) {
  if (s.minGpa === null) return;
  compareMin(ctx, {
    label: "직전 학기 평점", word: "평점", min: s.minGpa, value: input.gpa,
    fmt: fmtGpa, unit: "", nearLimit: NEAR_MISS.gpa,
    goal: "다음 학기 평점을 " + fmtGpa(s.minGpa) + " 이상으로 올리면 받을 수 있어요."
  });
}

// 2) 직전 학기 백분위 (지원구간별 기준·경고제 예외 포함)
function judgePercent(ctx, s, input) {
  if (s.minPercent === null) return;
  const label = "직전 학기 백분위";
  const overrides = s.percentByIncome || [];
  const warning = s.percentWarning || null;

  // 이 학생에게 적용할 기준 정하기
  let min = s.minPercent;
  let warnMin = null;   // 경고제로 예외 인정되는 최소 점수
  let lowest = min;     // 지원구간을 모를 때 가능한 가장 낮은 기준
  if (input.income !== null) {
    overrides.forEach(function (o) {
      if (inIncomeRange(input.income, o.incomeMin, o.incomeMax)) min = o.minPercent;
    });
    if (warning && inIncomeRange(input.income, warning.incomeMin, warning.incomeMax)) warnMin = warning.minPercent;
  } else {
    overrides.forEach(function (o) { lowest = Math.min(lowest, o.minPercent); });
    if (warning) lowest = Math.min(lowest, warning.minPercent);
  }
  const varies = input.income === null && lowest < min;

  // 백분위를 비워둔 경우
  if (input.percent === null) {
    ctx.rows.push({ label: label, text: "확인 필요", state: "unknown" });
    ctx.notes.push("성적표의 백분위 점수를 입력하면 정확히 확인할 수 있어요. (기준: " +
      fmtPercent(min) + "점 이상" + (varies ? ", 지원구간에 따라 다름" : "") + ")");
    return;
  }

  const v = input.percent;
  // 지원구간을 몰라서 기준이 달라질 수 있는 경우: 가장 낮은 기준과 기본 기준 사이면 확인 필요
  if (varies && to100(v) < to100(min) && to100(v) >= to100(lowest)) {
    ctx.rows.push({ label: label, text: "확인 필요", state: "unknown" });
    ctx.notes.push("지원구간에 따라 백분위 기준이 달라요(" + fmtPercent(lowest) + "~" + fmtPercent(min) +
      "점). 지원구간을 확인하면 정확히 판정할 수 있어요.");
    return;
  }
  // 경고제 예외 구간: 기준 미만이지만 경고제 최소 점수 이상이면 확인 필요
  if (warnMin !== null && to100(v) < to100(min) && to100(v) >= to100(warnMin)) {
    ctx.rows.push({ label: label, text: "경고제 대상 · 확인 필요", state: "unknown" });
    ctx.notes.push(warning.note);
    return;
  }

  // 남은 경우: 기준 이상(통과) 또는 가장 낮은 기준보다도 낮음(미달 → 가장 낮은 기준과 비교)
  const compareTo = varies && to100(v) < to100(lowest) ? lowest : min;
  compareMin(ctx, {
    label: label, word: "백분위", min: compareTo, value: v,
    fmt: fmtPercent, unit: "점", nearLimit: NEAR_MISS.percent,
    goal: "다음 학기 백분위 점수를 " + fmtPercent(min) + "점 이상으로 올리면 받을 수 있어요."
  });
}

// 3) 직전 학기 이수학점
function judgeCredits(ctx, s, input) {
  if (s.minCredits === null) return;
  if (s.minCredits === "모름") {
    ctx.rows.push({ label: "이수학점", text: "확인 필요", state: "unknown" });
    ctx.notes.push("이수학점 기준이 공고에 나와 있지 않아요. 공고를 확인해 주세요.");
    return;
  }
  const gap = s.minCredits - input.credits;
  if (gap <= 0) {
    ctx.rows.push({ label: "이수학점", text: s.minCredits + "학점 이상 · 충족", state: "pass" });
  } else if (gap <= NEAR_MISS.credits) {
    ctx.rows.push({ label: "이수학점", text: gap + "학점 부족 (기준 " + s.minCredits + "학점 이상)", state: "short" });
    ctx.goals.push("다음 학기에 " + s.minCredits + "학점 이상 이수하면 받을 수 있어요.");
  } else {
    ctx.rows.push({ label: "이수학점", text: gap + "학점 부족 (기준 " + s.minCredits + "학점 이상)", state: "fail" });
    ctx.reasons.push("이수학점 기준 미달");
  }
}

// 첫 학기: 성적기준 미적용 장학금은 통과, 아니면(false·"모름") 확인 불가
function judgeFirstTerm(ctx, s) {
  const labels = [];
  if (s.minGpa !== null) labels.push("평점");
  if (s.minPercent !== null) labels.push("백분위");
  if (s.minCredits !== null) labels.push("이수학점");
  if (labels.length === 0) return;

  const exempt = s.firstTermExempt === true;
  labels.forEach(function (name) {
    ctx.rows.push(exempt
      ? { label: name, text: "첫 학기 미적용 · 통과", state: "pass" }
      : { label: name, text: "확인 필요", state: "unknown" });
  });
  if (!exempt) {
    ctx.notes.push(s.firstTermExempt === "모름"
      ? "첫 학기 학생에게 성적 기준을 적용하는지 공고에 나와 있지 않아요. 공고를 확인해 주세요."
      : "첫 학기 학생도 성적 기준이 적용돼요. 직전 학기 성적이 나오면 " + labels.join("·") + " 조건을 판정할 수 있어요.");
  }
}

// 4) 학자금 지원구간 (하한 ≤ 입력 ≤ 상한일 때만 통과)
function judgeIncome(ctx, s, income) {
  const lo = s.incomeMin;
  const hi = s.incomeMax;
  if (lo === null && hi === null) return; // 지원구간 조건 없음

  const label = "학자금 지원구간";
  const loNum = typeof lo === "number" ? lo : null;
  const hiNum = typeof hi === "number" ? hi : null;
  const hasUnknown = lo === "모름" || hi === "모름";

  // 기준 범위 글자 (예: 1~3구간 / 9구간 이하 / 기초·차상위만 / 9구간만)
  function name(n) { return n === 0 ? "기초·차상위" : n + "구간"; }
  let range;
  if (hiNum === 0 && (loNum === null || loNum === 0)) range = "기초·차상위만";
  else if (loNum !== null && hiNum !== null) range = loNum === hiNum ? name(loNum) + "만" : loNum + "~" + hiNum + "구간";
  else if (hiNum !== null) range = name(hiNum) + " 이하";
  else if (loNum !== null) range = name(loNum) + " 이상";
  else range = "공고 확인 필요";

  // 사용자가 "모름"을 고른 경우
  if (income === null) {
    ctx.rows.push({ label: label, text: "확인 필요", state: "unknown" });
    ctx.notes.push("학자금 지원구간을 확인하면 정확히 판정할 수 있어요. (기준: " + range + ")");
    return;
  }

  // 알려진 경계를 벗어나면 확실히 미달
  if (!inIncomeRange(income, loNum, hiNum)) {
    ctx.rows.push({ label: label, text: range + " 대상", state: "fail" });
    ctx.reasons.push("지원구간 대상 아님");
    return;
  }

  // 경계 중 데이터가 "모름"인 쪽이 있으면 확인 불가
  if (hasUnknown) {
    ctx.rows.push({ label: label, text: "확인 필요", state: "unknown" });
    ctx.notes.push("지급 가능한 지원구간이 정해져 있지 않거나 매 학기 바뀌어요. 공고를 확인해 주세요.");
    return;
  }

  ctx.rows.push({ label: label, text: range + " · 충족", state: "pass" });
}

function judgeScholarship(s, input) {
  const ctx = {
    rows: [],     // 조건별 판정 줄
    goals: [],    // 조금 부족할 때 목표 안내
    reasons: [],  // 해당 없음일 때 사유
    notes: []     // 확인 불가 조건마다 무엇을 확인해야 하는지
  };

  // 성적 조건
  if (input.firstTerm) {
    judgeFirstTerm(ctx, s);
  } else {
    judgeGpa(ctx, s, input);
    judgePercent(ctx, s, input);
    judgeCredits(ctx, s, input);
  }

  // 지원구간
  judgeIncome(ctx, s, input.income);

  // 자동 판정이 안 되는 필수 확인 조건 (항상 확인 불가)
  (s.manualChecks || []).forEach(function (m) {
    ctx.rows.push({ label: m.label, text: "확인 필요", state: "unknown" });
    ctx.notes.push(m.note);
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

// -----------------------------------------------------
// 화면 그리기 도우미
// (사용자 입력이나 데이터 글자는 모두 textContent로 넣음)
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
const ICON_X = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"></path><path d="M17 7L7 17"></path></svg>';

// 상태별 배지 모양
const BADGES = {
  pass: { icon: ICON_CHECK, text: "충족" },
  check: { icon: ICON_QUESTION, text: "확인 필요" },
  near: { icon: ICON_WARN, text: "조금 부족" },
  none: { icon: ICON_X, text: "해당 없음" }
};

function makeBadge(status) {
  const badge = el("span", "badge " + status);
  badge.innerHTML = BADGES[status].icon;
  badge.appendChild(document.createTextNode(BADGES[status].text));
  return badge;
}

// 카드 윗부분: 태그 + 장학금 이름 + 배지
function makeCardHead(s, status) {
  const head = el("div", "sch-head");
  const left = el("div");
  left.appendChild(el("span", "tag", s.type));
  left.appendChild(el("h3", null, s.name));
  head.appendChild(left);
  head.appendChild(makeBadge(status));
  return head;
}

// 조건별 판정 줄 (통과: 기본색 / 미달: 주황 / 확인 불가: 파랑)
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

// 기타 조건: 접기/펼치기 (원문 줄바꿈 그대로)
function makeOtherConditions(text) {
  const details = el("details", "conditions");
  details.appendChild(el("summary", null, "기타 조건 보기"));
  details.appendChild(el("p", null, text));
  return details;
}

// 카드 아래: 지원 금액 + 공고 보기 (새 탭)
function makeCardFoot(s) {
  const foot = el("div", "sch-foot");
  foot.appendChild(el("span", null, "지원 금액 " + s.amount));
  if (s.sourceUrl) {
    const link = el("a", null, "공고 보기");
    link.href = s.sourceUrl;
    link.target = "_blank";
    link.rel = "noopener";
    foot.appendChild(link);
  }
  return foot;
}

// 장학금 카드 하나 (네 상태 공통 구조, 해당 없음은 회색 톤)
function renderCard(j) {
  const card = el("article", "white-card sch-card" + (j.status === "none" ? " is-none" : ""));
  card.appendChild(makeCardHead(j.s, j.status));
  card.appendChild(makeCriteria(j.rows));

  // 판정 이유 안내: 해당 없음 → 사유, 조금 부족 → 목표 + 확인할 것, 확인 필요 → 확인할 것
  let sentences = [];
  if (j.status === "none") sentences = ["해당되지 않는 이유: " + j.reasons.join(", ")];
  else if (j.status === "near") sentences = j.goals.concat(j.checkNotes);
  else if (j.status === "check") sentences = j.checkNotes;
  if (sentences.length > 0) card.appendChild(makeGoalBox(sentences));

  if (j.s.otherConditions) card.appendChild(makeOtherConditions(j.s.otherConditions));
  card.appendChild(makeCardFoot(j.s));
  return card;
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

  // 입력값 칩 (백분위는 입력했을 때만)
  const chips = document.getElementById("summary-chips");
  if (input.firstTerm) {
    chips.appendChild(el("span", "chip", "첫 학기 (성적 없음)"));
  } else {
    chips.appendChild(el("span", "chip", "평점 " + fmtGpa(input.gpa)));
    if (input.percent !== null) chips.appendChild(el("span", "chip", "백분위 " + fmtPercent(input.percent)));
    chips.appendChild(el("span", "chip", input.credits + "학점"));
  }
  chips.appendChild(el("span", "chip", incomeLabel(input.income)));

  // 개수 박스
  ["pass", "check", "near", "none"].forEach(function (key) {
    document.getElementById("count-" + key).textContent = groups[key].length + "개";
  });
}

// 묶음 하나 그리기 (비어 있으면 섹션 제목까지 숨김)
function renderGroup(listId, items) {
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
