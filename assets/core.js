// 날짜 계산, 설정, 콘텐츠 로딩. 화면을 그리지 않는 공통 로직.

const DAY_MS = 86400000;
const PREGNANCY_DAYS = 280;

export const GUIDE_FIRST_WEEK = 4;
export const GUIDE_LAST_WEEK = 42;

// "YYYY-MM-DD" 또는 "YYYY-MM-DDTHH:mm"을 기기 시간대의 그날 자정으로 읽는다.
export function parseDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return date.getMonth() === Number(m[2]) - 1 ? date : null;
}

export function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// 달력 기준 일수 차(b - a). 서머타임의 영향을 받지 않도록 UTC로 옮겨 계산한다.
export function daysBetween(a, b) {
  const utc = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((utc(b) - utc(a)) / DAY_MS);
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatKoreanDate(date) {
  const weekday = '일월화수목금토'[date.getDay()];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}

export function pregnancyAge(date, lmp) {
  const days = daysBetween(lmp, date);
  return { days, week: Math.floor(days / 7), day: ((days % 7) + 7) % 7 };
}

export function ddayLabel(daysLeft) {
  if (daysLeft === 0) return 'D-Day';
  return daysLeft > 0 ? `D-${daysLeft}` : `D+${-daysLeft}`;
}

// 만 나이. 생일이 지나야 한 살이 는다.
export function fullYears(birth, date) {
  let years = date.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    date.getMonth() < birth.getMonth() ||
    (date.getMonth() === birth.getMonth() && date.getDate() < birth.getDate());
  if (beforeBirthday) years -= 1;
  return years;
}

// 달 끝을 넘으면 그 달의 마지막 날로 맞춘다(1월 31일 + 1개월 = 2월 28일).
export function addMonths(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

// 만 개월 수.
export function fullMonths(birth, date) {
  const months = (date.getFullYear() - birth.getFullYear()) * 12 + date.getMonth() - birth.getMonth();
  return addMonths(birth, months) > date ? months - 1 : months;
}

// 주차 계산의 기준은 항상 "예정일 - 280일"이다. 예정일만 고치면 전부 재계산된다.
export function resolveConfig(raw) {
  const lmpFromFile = parseDate(raw.lmp);
  const dueDate = parseDate(raw.dueDate) ?? (lmpFromFile && addDays(lmpFromFile, PREGNANCY_DAYS));
  if (!dueDate) throw new Error('content/config.json의 dueDate 형식을 확인하세요 (YYYY-MM-DD).');
  return {
    dueDate,
    lmp: addDays(dueDate, -PREGNANCY_DAYS),
    dueDateConfirmed: raw.dueDateConfirmed === true,
    nickname: String(raw.nickname ?? '').trim(),
    birthDate: parseDate(raw.birthDateTime),
    birthDateTime: raw.birthDateTime ?? null,
  };
}

// 단순 키:값 프런트매터. 값이 [ 또는 {로 시작하면 JSON으로 읽는다.
export function parseFrontmatter(text) {
  const source = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n?---\n?/.exec(source);
  if (!m) return { meta: {}, body: source };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon < 1 || line.trimStart().startsWith('#')) continue;
    const key = line.slice(0, colon).trim();
    meta[key] = parseValue(line.slice(colon + 1).trim());
  }
  return { meta, body: source.slice(m[0].length) };
}

function parseValue(value) {
  if (/^[[{]/.test(value)) {
    try {
      return JSON.parse(value);
    } catch {
      console.warn('프런트매터 JSON을 읽지 못했습니다:', value);
      return value;
    }
  }
  return value.replace(/^(["'])(.*)\1$/, '$2');
}

// "a.jpg, b.jpg"와 ["a.jpg", "b.jpg"]를 모두 배열로 받는다.
export function asList(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
}

// "## 제목" 단위로 본문을 나눈다.
export function splitSections(body) {
  const sections = {};
  let current = null;
  for (const line of body.split('\n')) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      current = heading[1];
      sections[current] = [];
    } else if (current) {
      sections[current].push(line);
    }
  }
  for (const key of Object.keys(sections)) sections[key] = sections[key].join('\n').trim();
  return sections;
}

async function fetchOrNull(path) {
  const res = await fetch(path);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${path} 응답 오류 (${res.status})`);
  return res;
}

export async function loadText(path) {
  const res = await fetchOrNull(path);
  return res ? res.text() : null;
}

export async function loadJson(path) {
  const res = await fetchOrNull(path);
  return res ? res.json() : null;
}

export async function loadConfig() {
  const raw = await loadJson('content/config.json');
  if (!raw) throw new Error('content/config.json을 찾을 수 없습니다.');
  return resolveConfig(raw);
}

// index.json에 적힌 파일을 모두 읽는다. 찾지 못한 파일명은 missing으로 돌려준다.
async function loadIndexedFolder(folder) {
  const names = (await loadJson(`${folder}/index.json`)) ?? [];
  const entries = await Promise.all(
    names.map(async (file) => {
      const text = await loadText(`${folder}/${file}`);
      return text === null ? { file, missing: true } : { file, ...parseFrontmatter(text) };
    }),
  );
  return {
    items: entries.filter((e) => !e.missing),
    missing: entries.filter((e) => e.missing).map((e) => e.file),
  };
}

function entryDate(entry) {
  return String(entry.meta.date ?? entry.file.slice(0, 10));
}

const stem = (file) => file.replace(/\.md$/, '');

// 기록: 날짜 역순. 같은 날은 -2가 붙은 파일이 위로 온다.
export async function loadPosts() {
  const { items, missing } = await loadIndexedFolder('content/posts');
  const posts = items
    .map((e) => ({ ...e, date: entryDate(e) }))
    .filter((e) => parseDate(e.date))
    .sort((a, b) => b.date.localeCompare(a.date) || stem(b.file).localeCompare(stem(a.file)));
  return { posts, missing };
}

// 편지: 작성일 순. 날짜가 없는 편지는 맨 뒤.
export async function loadLetters() {
  const { items, missing } = await loadIndexedFolder('content/letters');
  const letters = items
    .map((e) => ({ ...e, date: parseDate(e.meta.date) ? String(e.meta.date) : '' }))
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.file.localeCompare(b.file));
  return { letters, missing };
}

// 주차 번호 규약으로 요청하고 404는 "없음"으로 처리한다.
export async function loadGuides() {
  const weeks = [];
  for (let w = GUIDE_FIRST_WEEK; w <= GUIDE_LAST_WEEK; w += 1) weeks.push(w);
  const loaded = await Promise.all(
    weeks.map(async (week) => {
      const text = await loadText(`content/guide/${String(week).padStart(2, '0')}.md`);
      if (text === null) return null;
      const { meta, body } = parseFrontmatter(text);
      return { week, meta, sections: splitSections(body) };
    }),
  );
  return loaded.filter(Boolean);
}

export async function loadSchedule() {
  const items = (await loadJson('content/schedule.json')) ?? [];
  return items
    .filter((item) => parseDate(item.date))
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.time ?? '').localeCompare(String(b.time ?? '')));
}

// 메인에 고정할 일정: 오늘 일정이 있으면 전부, 없으면 가장 가까운 미완료 일정 하나.
export function pickNextSchedule(items, date = today()) {
  const key = formatDate(date);
  const open = items.filter((item) => !item.done && item.date >= key);
  const todays = open.filter((item) => item.date === key);
  return todays.length ? todays : open.slice(0, 1);
}

// 한 마디: 최신순. 날짜가 미래인 것은 그날이 올 때까지 숨긴다.
export async function loadNotes(date = today()) {
  const items = (await loadJson('content/notes.json')) ?? [];
  return items
    .filter((item) => parseDate(item.date) && parseDate(item.date) <= date && item.text)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function loadGrowth() {
  const items = (await loadJson('content/growth.json')) ?? [];
  return items.filter((item) => parseDate(item.date)).sort((a, b) => a.date.localeCompare(b.date));
}

// 접종: 완료, 시작 시기가 된 것, 아직 이른 것으로 나눈다.
export function groupVaccines(doses, birth, date = today()) {
  const withDate = doses.map((dose) => ({ ...dose, start: addMonths(birth, Number(dose.fromMonths) || 0) }));
  return {
    done: withDate.filter((dose) => dose.done),
    due: withDate.filter((dose) => !dose.done && dose.start <= date),
    upcoming: withDate.filter((dose) => !dose.done && dose.start > date).sort((a, b) => a.start - b.start),
  };
}

const PREGNANCY_DAY_MILESTONES = {
  100: { title: 'D-100', text: '아기를 만나기까지 100일 남았어요.' },
  50: { title: 'D-50', text: '아기를 만나기까지 50일 남았어요.' },
  30: { title: 'D-30', text: '아기를 만나기까지 30일 남았어요.' },
  0: { title: '오늘이 출산 예정일이에요', text: '그동안 정말 고생 많았어요.' },
};
const PREGNANCY_WEEK_MILESTONES = {
  13: { title: '임신 중기에 들어섰어요', text: '여기까지 함께 잘 왔어요.' },
  28: { title: '임신 후기에 들어섰어요', text: '이제 만날 날이 점점 가까워져요.' },
};

// 오늘 축하할 일. 임신 중에는 날짜 기념일이 주차 기념일보다 앞선다.
// 백일은 태어난 날을 1일로 세는 관습을 따르므로 생후 99일이다.
export function pickMilestone(config, date = today()) {
  if (config.birthDate) {
    const days = daysBetween(config.birthDate, date);
    if (days === 0) return { title: '우리 아기가 태어났어요', text: '세상에 온 걸 환영해.' };
    if (days === 49) return { title: '오늘은 50일이에요', text: '하루하루 고마운 날들이에요.' };
    if (days === 99) return { title: '오늘은 백일이에요', text: '백 일 동안 정말 잘 자라 주었어요.' };
    const isBirthday = date.getMonth() === config.birthDate.getMonth() && date.getDate() === config.birthDate.getDate();
    const years = fullYears(config.birthDate, date);
    if (isBirthday && years === 1) return { title: '오늘은 첫돌이에요', text: '첫 번째 생일을 축하해.' };
    if (isBirthday && years > 1) return { title: `오늘은 ${years}번째 생일이에요`, text: '생일을 축하해.' };
    return null;
  }
  const left = daysBetween(date, config.dueDate);
  if (PREGNANCY_DAY_MILESTONES[left]) return PREGNANCY_DAY_MILESTONES[left];
  return PREGNANCY_WEEK_MILESTONES[pregnancyAge(date, config.lmp).week] ?? null;
}

const REMINDER_LEAD_WEEKS = 2;
const SCHEDULE_MATCH_MARGIN_WEEKS = 2;

const normalize = (s) => String(s ?? '').replace(/\s+/g, '').toLowerCase();

// 권장 검사가 이미 일정에 있는지: 종류가 같고, 시기가 맞고, 제목에 검사명이나 키워드가 있어야 한다.
function isTestScheduled(test, items, lmp) {
  const words = [test.name, ...asList(test.keywords)].map(normalize).filter(Boolean);
  return items.some((item) => {
    if (item.kind !== test.kind) return false;
    const { week } = pregnancyAge(parseDate(item.date), lmp);
    if (week < test.from - SCHEDULE_MATCH_MARGIN_WEEKS || week > test.to + SCHEDULE_MATCH_MARGIN_WEEKS) return false;
    const title = normalize(item.title);
    return words.some((word) => title.includes(word));
  });
}

// 권장 시기가 2주 안으로 다가왔거나 진행 중인데 일정이 없는 검사.
export function findMissingTests(guides, items, config, date = today()) {
  const { week } = pregnancyAge(date, config.lmp);
  const seen = new Set();
  const missing = [];
  for (const guide of guides) {
    for (const test of asList(guide.meta.tests)) {
      const id = `${test.name}|${test.from}|${test.to}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const due = week >= test.from - REMINDER_LEAD_WEEKS && week <= test.to;
      if (due && !isTestScheduled(test, items, config.lmp)) missing.push(test);
    }
  }
  return missing;
}

// 편지 공개 조건. 표시 수준의 잠금일 뿐이다.
export function letterAccess(meta, config, date = today()) {
  const condition = String(meta.open ?? '출생 전').trim();
  if (condition === '출생 전') return { open: true, condition };
  if (condition === '출생 후') return { open: Boolean(config.birthDate), condition };
  const age = /^(\d+)\s*살$/.exec(condition);
  if (age) {
    const open = Boolean(config.birthDate) && fullYears(config.birthDate, date) >= Number(age[1]);
    return { open, condition };
  }
  return { open: false, condition: `알 수 없는 공개 조건: ${condition}` };
}
