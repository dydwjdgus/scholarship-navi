// =====================================================
// 장학 내비 - 입력값 처리, 기준 비교, 결과 그리기
// - 장학금 기준 숫자는 data.js(SCHOLARSHIPS, NEAR_MISS)에서만 가져옴
// - 입력값은 저장하지 않음: input.html → result.html 로 URL 쿼리스트링으로만 전달
//   예) result.html?gpa=3.8&credits=18&income=4
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

// 평점: 0 ~ 4.5, 소수점 둘째 자리까지
function parseGpa(text) {
  text = String(text || "").trim();
  if (text === "") return { ok: false, message: "평점을 입력해 주세요." };
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return { ok: false, message: "숫자로 입력해 주세요. (예: 3.75)" };
  }
  const value = Number(text);
  if (value < 0 || value > 4.5) {
    return { ok: false, message: "평점은 0 ~ 4.5 사이로 입력해 주세요." };
  }
  return { ok: true, value: value };
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

// 소득구간: "0"~"10" → 숫자, "unknown" → null(모름)
function parseIncome(text) {
  text = String(text || "").trim();
  if (text === "unknown") return { ok: true, value: null };
  if (/^\d+$/.test(text) && Number(text) <= 10) {
    return { ok: true, value: Number(text) };
  }
  return { ok: false, message: "소득구간을 선택해 주세요." };
}

// 소득구간 숫자 → 화면용 글자
function incomeLabel(income) {
  if (income === null) return "소득구간 모름";
  if (income === 0) return "기초·차상위";
  return "소득 " + income + "구간";
}

// =====================================================
// 화면 2 — 성적 입력 (input.html)
// =====================================================
function initInputPage() {
  const form = document.getElementById("grade-form");
  const submitBtn = document.getElementById("submit-btn");

  // 칸별 설정: 입력 요소, 검사 함수, 오류 문구 자리
  const fields = [
    { el: document.getElementById("gpa"), parse: parseGpa, key: "gpa" },
    { el: document.getElementById("credits"), parse: parseCredits, key: "credits" },
    { el: document.getElementById("income"), parse: parseIncome, key: "income" }
  ];

  // "다시 입력하기"로 돌아왔다면 주소에 있던 값을 칸에 다시 채움
  const params = new URLSearchParams(location.search);
  fields.forEach(function (f) {
    if (params.has(f.key)) f.el.value = params.get(f.key);
  });

  // 칸 하나의 오류 표시를 갱신
  // showError가 false면 오류 문구는 숨김 (아직 손대지 않은 칸에 빨간 글씨가 뜨지 않도록)
  function updateField(f, showError) {
    const result = f.parse(f.el.value);
    const wrapper = f.el.closest(".field");
    const msg = wrapper.querySelector(".error-msg");
    const show = showError && !result.ok;
    wrapper.classList.toggle("invalid", show);
    msg.textContent = show ? result.message : "";
    msg.hidden = !show;
    return result;
  }

  // 세 칸이 모두 올바를 때만 "결과 보기" 버튼 활성화
  function updateButton() {
    const allOk = fields.every(function (f) {
      return f.parse(f.el.value).ok;
    });
    submitBtn.disabled = !allOk;
  }

  fields.forEach(function (f) {
    // 입력 중: 이미 오류가 보이는 칸이면 고쳐지는 대로 바로 갱신
    f.el.addEventListener("input", function () {
      const touched = f.el.dataset.touched === "true" && f.el.value.trim() !== "";
      updateField(f, touched);
      updateButton();
    });
    // 칸을 벗어날 때(또는 select를 고를 때) 오류 문구 표시
    f.el.addEventListener("blur", function () {
      f.el.dataset.touched = "true";
      if (f.el.value.trim() !== "") updateField(f, true);
    });
    f.el.addEventListener("change", function () {
      f.el.dataset.touched = "true";
      updateField(f, true);
      updateButton();
    });
  });

  // "결과 보기" → 값을 주소에 붙여 결과 화면으로 이동
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const results = fields.map(function (f) {
      return updateField(f, true);
    });
    if (!results.every(function (r) { return r.ok; })) return;

    const query = new URLSearchParams({
      gpa: fields[0].el.value.trim(),
      credits: fields[1].el.value.trim(),
      income: fields[2].el.value
    });
    location.href = "result.html?" + query.toString();
  });

  // 값을 다시 채운 경우를 위해 처음 한 번 버튼 상태 맞추기
  updateButton();
}

// =====================================================
// 화면 3 — 결과 (result.html)
// =====================================================
function initResultPage() {
  const params = new URLSearchParams(location.search);
  const gpa = parseGpa(params.get("gpa"));
  const credits = parseCredits(params.get("credits"));
  const income = parseIncome(params.get("income"));

  // 주소의 값이 없거나 잘못됐으면 입력 화면으로 돌려보냄
  if (!gpa.ok || !credits.ok || !income.ok) {
    location.replace("input.html");
    return;
  }

  const input = { gpa: gpa.value, credits: credits.value, income: income.value };

  // "다시 입력하기"를 누르면 입력했던 값이 그대로 채워지도록 주소 전달
  document.getElementById("retry-btn").href = "input.html?" + params.toString();

  // 모든 장학금 판정 후 세 묶음으로 나누기
  const judged = SCHOLARSHIPS.map(function (s) {
    return judgeScholarship(s, input);
  });
  const groups = {
    pass: judged.filter(function (j) { return j.status === "pass"; }),
    near: judged.filter(function (j) { return j.status === "near"; }),
    none: judged.filter(function (j) { return j.status === "none"; })
  };

  renderSummary(input, groups);
  renderGroup("pass-list", groups.pass, renderPassCard);
  renderGroup("near-list", groups.near, renderNearCard);
  renderGroup("none-list", groups.none, renderNoneCard);
}

// -----------------------------------------------------
// 장학금 하나 판정
// 기준별 줄(rows)마다 state: "ok"(충족) / "short"(조금 부족) / "check"(확인 필요) / "fail"(미달)
// 전체 status: 하나라도 fail → "none", short·check가 있으면 → "near", 모두 ok → "pass"
// -----------------------------------------------------
function judgeScholarship(s, input) {
  const rows = [];
  const goals = [];     // 조금 부족할 때 보여줄 목표 안내
  const reasons = [];   // 해당 없음일 때 보여줄 사유

  // 1) 평점
  if (input.gpa >= s.minGpa) {
    rows.push({ label: "직전 학기 평점", text: s.minGpa.toFixed(2) + " 이상 · 충족", state: "ok" });
  } else {
    // 부동소수점 오차를 없애려고 소수 둘째 자리에서 반올림
    const gap = Math.round((s.minGpa - input.gpa) * 100) / 100;
    if (gap <= NEAR_MISS.gpa) {
      rows.push({ label: "직전 학기 평점", text: "평점 " + gap.toFixed(2) + " 부족", state: "short" });
      goals.push("다음 학기 평점을 " + s.minGpa.toFixed(2) + " 이상으로 올리면 받을 수 있어요.");
    } else {
      rows.push({ label: "직전 학기 평점", text: "평점 " + gap.toFixed(2) + " 부족", state: "fail" });
      reasons.push("평점 기준 미달");
    }
  }

  // 2) 이수학점
  if (input.credits >= s.minCredits) {
    rows.push({ label: "이수학점", text: s.minCredits + "학점 이상 · 충족", state: "ok" });
  } else {
    const gap = s.minCredits - input.credits;
    if (gap <= NEAR_MISS.credits) {
      rows.push({ label: "이수학점", text: gap + "학점 부족", state: "short" });
      goals.push("다음 학기에 " + s.minCredits + "학점 이상 이수하면 받을 수 있어요.");
    } else {
      rows.push({ label: "이수학점", text: gap + "학점 부족", state: "fail" });
      reasons.push("이수학점 기준 미달");
    }
  }

  // 3) 소득구간 (기준이 있는 장학금만)
  if (s.maxIncome !== null) {
    const limit = s.maxIncome === 0 ? "기초·차상위" : s.maxIncome + "구간";
    if (input.income === null) {
      rows.push({ label: "소득구간", text: "소득구간 확인 필요", state: "check" });
      goals.push("소득구간이 " + limit + " 이하인지 한국장학재단에서 확인해 보세요.");
    } else if (input.income <= s.maxIncome) {
      rows.push({ label: "소득구간", text: limit + " 이하 · 충족", state: "ok" });
    } else {
      rows.push({ label: "소득구간", text: limit + " 초과", state: "fail" });
      reasons.push("소득구간 기준 초과");
    }
  }

  // 전체 판정
  const states = rows.map(function (r) { return r.state; });
  let status = "pass";
  if (states.indexOf("fail") !== -1) status = "none";
  else if (states.indexOf("short") !== -1 || states.indexOf("check") !== -1) status = "near";

  // 소득구간만 모르는 경우는 배지를 "확인 필요"로
  const onlyCheck = status === "near" && states.indexOf("short") === -1;

  return { s: s, rows: rows, goals: goals, reasons: reasons, status: status, onlyCheck: onlyCheck };
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

// 기준별 줄 목록
function makeCriteria(rows) {
  const ul = el("ul", "criteria");
  rows.forEach(function (r) {
    const li = el("li");
    li.appendChild(el("span", null, r.label));
    const cls = r.state === "ok" ? "judge" : "judge short";
    li.appendChild(el("span", cls, r.text));
    ul.appendChild(li);
  });
  return ul;
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
  } else {
    title.appendChild(document.createTextNode("지금은 기준을 충족한"));
    title.appendChild(el("br"));
    title.appendChild(document.createTextNode("장학금이 없어요"));
  }

  // 입력값 칩
  const chips = document.getElementById("summary-chips");
  chips.appendChild(el("span", "chip", "평점 " + input.gpa.toFixed(2)));
  chips.appendChild(el("span", "chip", input.credits + "학점"));
  chips.appendChild(el("span", "chip", incomeLabel(input.income)));

  // 개수 박스
  document.getElementById("count-pass").textContent = groups.pass.length + "개";
  document.getElementById("count-near").textContent = groups.near.length + "개";
  document.getElementById("count-none").textContent = groups.none.length + "개";
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

  const foot = el("div", "sch-foot");
  foot.appendChild(el("span", null, "지원 금액 " + j.s.amount));
  const link = el("a", null, "신청 방법 보기");
  link.href = j.s.link || "#";
  if (link.getAttribute("href") !== "#") {
    link.target = "_blank";
    link.rel = "noopener";
  }
  foot.appendChild(link);
  card.appendChild(foot);
  return card;
}

// 조금 부족 / 확인 필요 카드
function renderNearCard(j) {
  const card = el("article", "white-card sch-card");
  const badgeText = j.onlyCheck ? "확인 필요" : "조금 부족";
  card.appendChild(makeCardHead(j.s, makeBadge("near", ICON_WARN, badgeText)));
  card.appendChild(makeCriteria(j.rows));
  card.appendChild(el("p", "goal", j.goals.join(" ")));
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
