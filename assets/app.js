// 공통 레이아웃 주입과 페이지별 렌더링. <body data-page="...">로 페이지를 고른다.
import {
  addMonths,
  asList,
  daysBetween,
  ddayLabel,
  findMissingTests,
  formatDate,
  formatKoreanDate,
  fullMonths,
  groupVaccines,
  letterAccess,
  loadConfig,
  loadGrowth,
  loadGuides,
  loadJson,
  loadLetters,
  loadNotes,
  loadPosts,
  loadSchedule,
  loadText,
  parseDate,
  parseFrontmatter,
  pickMilestone,
  pickNextSchedule,
  pregnancyAge,
  today,
} from './core.js';

const ICONS = {
  home: 'M3 11l9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5',
  book: 'M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-14c-4 0-6.5.5-8 2zM12 6.5v14',
  leaf: 'M5 19c0-9 5-14 15-15 0 10-5 15-13 14M5 21c1-5 4-8 8-10',
  calendar: 'M4 6h16v14H4zM4 10.5h16M8.5 3.5v4M15.5 3.5v4',
  more: 'M4 12a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M10.6 12a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M17.2 12a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0',
  mail: 'M3.5 6h17v12.5h-17zM4 6.5l8 6.5 8-6.5',
  heart: 'M12 20.5S4 15.5 4 9.5A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 8 2c0 6-8 11-8 11z',
  hourglass: 'M7 3.5h10M7 20.5h10M8 3.5c0 5 8 5.5 8 8.5s-8 3.5-8 8.5M16 3.5c0 5-8 5.5-8 8.5s8 3.5 8 8.5',
  check: 'M4 4.5h16v15H4zM8 12l3 3 5.5-6',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9-4.3-4.1 5.9-.8z',
  sprout: 'M12 20.5V11M12 11C12 7 9 5 4.5 5c0 4.5 3 6 7.5 6zM12 14c0-3.5 2.5-5.5 7.5-5.5 0 4-3 5.5-7.5 5.5z',
  shield: 'M12 3.5l7.5 2.8v5.2c0 4.5-3 7.5-7.5 9-4.5-1.5-7.5-4.5-7.5-9V6.3zM9 12l2.2 2.2L15.5 10',
  pulse: 'M6 4.5h12v16H6zM9.5 4.5V3h5v1.5M8.5 13h2l1.2-2.5 1.6 4.5 1.2-2H16',
  alert: 'M12 4l9 16H3zM12 10v4.5M12 17.5h.01',
  people: 'M9 11a3.3 3.3 0 1 0 0-6.6A3.3 3.3 0 0 0 9 11zM3 20c0-3.5 2.5-6 6-6s6 2.5 6 6M16 5a3 3 0 0 1 0 6M18 14.5c2 .8 3.2 2.8 3.2 5.5',
  pencil: 'M4 20l1-4.5L16.5 4l3.5 3.5L8.5 19zM14.5 6l3.5 3.5',
  link: 'M10 14l4-4M8.5 11.5l-2 2a3.5 3.5 0 0 0 5 5l2-2M15.5 12.5l2-2a3.5 3.5 0 0 0-5-5l-2 2',
  lock: 'M6 10.5h12V20H6zM8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5',
  chevron: 'M6 9l6 6 6-6',
  arrow: 'M9 5l7 7-7 7',
  sparkle: 'M12 3.5c.8 4.7 2.8 6.7 7.5 7.5-4.7.8-6.7 2.8-7.5 7.5-.8-4.7-2.8-6.7-7.5-7.5 4.7-.8 6.7-2.8 7.5-7.5zM19 3.5v3M17.5 5h3',
  doc: 'M6.5 3.5h7.5l4 4v13h-11.5zM14 3.5v4h4M9.5 12h5M9.5 16h5',
  chart: 'M4 4v16h16M8 15l3.5-4 3 2.5L19.5 8',
  mic: 'M12 3.5a2.8 2.8 0 0 0-2.8 2.8v5.4a2.8 2.8 0 0 0 5.6 0V6.3A2.8 2.8 0 0 0 12 3.5zM6 11.5a6 6 0 0 0 12 0M12 17.5v3',
  ask: 'M4 5h16v11.5H10L5.5 20v-3.5H4zM9.8 9a2.2 2.2 0 1 1 3.3 1.9c-.7.4-1.1.9-1.1 1.6M12 14.5h.01',
};

const icon = (name, className = 'icon') =>
  `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;

const NAV_MAIN = [
  { page: 'index', href: 'index.html', label: '홈', icon: 'home' },
  { page: 'records', href: 'records.html', label: '기록', icon: 'book' },
  { page: 'guide', href: 'guide.html', label: '가이드', icon: 'leaf' },
  { page: 'schedule', href: 'schedule.html', label: '일정', icon: 'calendar' },
];

const NAV_MORE = [
  { page: 'letters', href: 'letters.html', label: '편지', icon: 'mail' },
  { page: 'names', href: 'names.html', label: '이름', icon: 'heart' },
  { page: 'capsule', href: 'capsule.html', label: '타임캡슐', icon: 'hourglass' },
  { page: 'checklist', href: 'checklist.html', label: '준비', icon: 'check' },
  { page: 'firsts', href: 'firsts.html', label: '처음', icon: 'sparkle' },
  { page: 'support', href: 'support.html', label: '행정', icon: 'doc' },
  { page: 'baby', href: 'baby.html', label: '성장', icon: 'chart', requiresBirth: true },
  { page: 'birth', href: 'birth.html', label: '탄생', icon: 'star', requiresBirth: true },
];

// open은 처음부터 펼쳐 두는 섹션이다. 위급 신호(fixed)는 접을 수 없다.
const GUIDE_SECTIONS = [
  { title: '아기 발달', tone: 'baby', icon: 'sprout', open: true },
  { title: '엄마 몸 변화', tone: 'mom', icon: 'heart' },
  { title: '조심할 것', tone: 'care', icon: 'shield' },
  { title: '이 시기 검사·병원', tone: 'test', icon: 'pulse' },
  { title: '바로 병원에 가야 할 신호', tone: 'urgent', icon: 'alert', fixed: true },
  { title: '아빠가 할 일', tone: 'dad', icon: 'people' },
  { title: '우리 병원 메모', tone: 'memo', icon: 'pencil' },
];
const sectionInfo = (title) => GUIDE_SECTIONS.find((section) => section.title === title);
const GUIDE_NOTICE = '일반 정보이며, 담당 의사의 안내가 항상 우선합니다.';

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const md = (text) => window.marked.parse(text ?? '');

// 출처 간 차이를 적은 괄호 문장은 본문과 구분해 작게 보여준다. 글자는 바꾸지 않는다.
const guideHtml = (text) => md(text).replace(/\s*\(([^()]*차이가 있다\.?)\)/g, '<span class="source-diff">$1</span>');

const emptyState = (name, text) => `<div class="empty-state">${icon(name)}<p class="empty">${esc(text)}</p></div>`;

// 차오르는 달. fraction은 0(그믐)~1(보름)이다.
function moonSvg(fraction, className = 'moon') {
  const f = Math.min(1, Math.max(0, fraction));
  const lit =
    f >= 0.995
      ? '<circle class="moon-lit" cx="50" cy="50" r="40"/>'
      : f <= 0
        ? ''
        : `<path class="moon-lit" d="M50 10A40 40 0 0 1 50 90A${(40 * Math.abs(1 - 2 * f)).toFixed(2)} 40 0 0 ${f > 0.5 ? 1 : 0} 50 10Z"/>`;
  return `<svg class="${className}" viewBox="0 0 100 100" aria-hidden="true"><circle class="moon-shadow" cx="50" cy="50" r="40"/>${lit}</svg>`;
}

const app = () => document.getElementById('app');

function renderLayout(config, pageInfo) {
  const page = document.body.dataset.page;
  const more = NAV_MORE.filter((item) => !item.requiresBirth || config?.birthDate);
  const inMore = more.some((item) => item.page === page);
  const link = (item) =>
    `<a href="${item.href}"${item.page === page ? ' class="active" aria-current="page"' : ''}>${icon(item.icon)}${esc(item.label)}</a>`;
  const name = config?.nickname || '우리 아기';

  document.body.insertAdjacentHTML(
    'afterbegin',
    page === 'index'
      ? `<header class="site-header"><h1>${esc(name)}</h1><p class="site-tagline">${config?.birthDate ? '함께 자라는 날들' : esc(pageInfo.tagline)}</p></header>`
      : `<header class="site-header"><span class="site-name">${esc(name)}</span><h1>${esc(pageInfo.title)}</h1><p class="site-tagline">${esc(pageInfo.tagline)}</p></header>`,
  );
  document.body.insertAdjacentHTML(
    'beforeend',
    `<nav class="bottom-nav" aria-label="주요 메뉴">
      <div class="more-sheet" id="more-sheet" hidden>${more.map(link).join('')}</div>
      <div class="nav-row">
        ${NAV_MAIN.map(link).join('')}
        <button type="button" id="more-toggle" aria-expanded="false" aria-controls="more-sheet"${inMore ? ' class="active"' : ''}>${icon('more')}더보기</button>
      </div>
    </nav>`,
  );

  const sheet = document.getElementById('more-sheet');
  const toggle = document.getElementById('more-toggle');
  const setOpen = (open) => {
    sheet.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setOpen(sheet.hidden);
  });
  document.addEventListener('click', (event) => {
    if (!sheet.contains(event.target)) setOpen(false);
  });
}

function setupLightbox() {
  document.addEventListener('click', (event) => {
    const thumb = event.target.closest('[data-full]');
    if (!thumb) return;
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', '사진 원본 보기. 탭하면 닫힙니다.');
    box.innerHTML = `<img src="${esc(thumb.dataset.full)}" alt="">`;
    box.addEventListener('click', () => box.remove());
    document.body.append(box);
  });
}

// ---------- 기록 ----------

const isExternal = (src) => /^([a-z]+:|\/\/)/i.test(src);

// 편집기 미리보기용 ../../images/... 경로도 사이트 루트 기준으로 바꾼다.
const rootRelative = (src) => src.replace(/^(\.{1,2}\/)+/, '');

function photoPath(name, date) {
  if (isExternal(name)) return name;
  return name.includes('/') ? rootRelative(name) : `images/${date}/${name}`;
}

// 본문의 상대 경로 이미지는 빼내어 프런트매터 사진과 함께 그리드로 보여준다.
function preparePost(post) {
  const template = document.createElement('template');
  template.innerHTML = md(post.body);
  const photos = asList(post.meta.photos).map((name) => photoPath(name, post.date));
  for (const img of template.content.querySelectorAll('img')) {
    const src = img.getAttribute('src') ?? '';
    if (isExternal(src)) continue;
    photos.push(rootRelative(src));
    const parent = img.parentElement;
    img.remove();
    if (parent?.tagName === 'P' && !parent.textContent.trim() && !parent.children.length) parent.remove();
  }
  return { html: template.innerHTML, photos: [...new Set(photos)] };
}

function postBadge(dateText, config) {
  const date = parseDate(dateText);
  if (config.birthDate && date >= config.birthDate) return `생후 ${daysBetween(config.birthDate, date)}일`;
  const { days, week, day } = pregnancyAge(date, config.lmp);
  return days < 0 ? '임신 전' : `${week}주 ${day}일`;
}

function photoGrid(photos) {
  if (!photos.length) return '';
  const items = photos
    .map(
      (src) =>
        `<button type="button" class="thumb" data-full="${esc(src)}" aria-label="사진 크게 보기"><img src="${esc(src)}" alt="" loading="lazy"></button>`,
    )
    .join('');
  return `<div class="photo-grid count-${Math.min(photos.length, 5)}">${items}</div>`;
}

function audioPlayers(post) {
  const clips = asList(post.meta.audio).map((name) => photoPath(name, post.date));
  return clips
    .map((src) => `<div class="audio-clip">${icon('mic')}<audio controls preload="none" src="${esc(src)}"></audio></div>`)
    .join('');
}

function postCard(post, config) {
  const { html, photos } = preparePost(post);
  const author = post.meta.author ? ` · ${esc(post.meta.author)}` : '';
  const firstLabel = post.meta.first ? `<span class="first-tag">${icon('sparkle')}${esc(post.meta.first)}</span>` : '';
  return `<article class="card post">
    ${firstLabel}
    <p class="post-meta"><span class="badge">${esc(postBadge(post.date, config))}</span><span>${esc(formatKoreanDate(parseDate(post.date)))}${author}</span></p>
    ${post.meta.title ? `<h3>${esc(post.meta.title)}</h3>` : ''}
    <div class="prose">${html}</div>
    ${photoGrid(photos)}
    ${audioPlayers(post)}
  </article>`;
}

function missingNotice(missing, folder) {
  if (!missing.length) return '';
  return `<p class="notice warn">${icon('alert')}<span>index.json에는 있지만 ${esc(folder)}에서 찾지 못한 파일: ${esc(missing.join(', '))}</span></p>`;
}

function bellySeries(posts) {
  const photos = [...posts]
    .reverse()
    .flatMap((post) => preparePost(post).photos.map((src) => ({ src, date: post.date })))
    .filter(({ src }) => src.split('/').pop().toLowerCase() === 'belly.jpg');
  if (!photos.length) return '';
  const slides = photos
    .map(
      ({ src, date }) =>
        `<figure class="belly-slide"><button type="button" class="thumb" data-full="${esc(src)}" aria-label="사진 크게 보기"><img src="${esc(src)}" alt="" loading="lazy"></button><figcaption>${esc(date)}</figcaption></figure>`,
    )
    .join('');
  return `<section class="card"><h2>배 사진 시리즈</h2><div class="belly-series">${slides}</div></section>`;
}

async function renderRecords(config) {
  const { posts, missing } = await loadPosts();
  if (!posts.length) {
    app().innerHTML = `${missingNotice(missing, 'content/posts')}${emptyState('book', '아직 기록이 없습니다.')}`;
    return;
  }
  let lastGroup = null;
  const timeline = posts
    .map((post) => {
      const group = postBadge(post.date, config).split(' ')[0];
      const isWeek = !config.birthDate || parseDate(post.date) < config.birthDate;
      const divider = isWeek && group !== lastGroup ? `<h2 class="week-divider">${esc(group)}</h2>` : '';
      lastGroup = group;
      return divider + postCard(post, config);
    })
    .join('');
  app().innerHTML = missingNotice(missing, 'content/posts') + bellySeries(posts) + `<div class="timeline">${timeline}</div>`;
}

// ---------- 처음의 순간 ----------

const FIRST_SLOTS = ['첫 초음파', '첫 심장 소리', '첫 태동'];
const FIRST_SLOTS_AFTER_BIRTH = ['첫 울음', '첫 미소', '첫 뒤집기', '첫 걸음'];

async function renderFirsts(config) {
  const { posts, missing } = await loadPosts();
  const firsts = posts.filter((post) => post.meta.first).reverse();
  const filled = new Set(firsts.map((post) => String(post.meta.first).trim()));
  const slots = [...FIRST_SLOTS, ...(config.birthDate ? FIRST_SLOTS_AFTER_BIRTH : [])].filter((slot) => !filled.has(slot));
  const waiting = slots
    .map((slot) => `<li class="first-slot">${icon('sparkle')}<span>${esc(slot)}</span><span class="muted">기다리는 중</span></li>`)
    .join('');
  app().innerHTML = `${missingNotice(missing, 'content/posts')}
    ${firsts.map((post) => postCard(post, config)).join('')}
    ${waiting ? `<ul class="first-slots">${waiting}</ul>` : ''}`;
}

// ---------- 일정 ----------

function questionList(item) {
  const questions = asList(item.questions);
  if (!questions.length) return '';
  return `<div class="questions">
    <p class="questions-title">${icon('ask')}${item.done ? '물어본 것' : '물어볼 것'}</p>
    <ul>${questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
  </div>`;
}

function scheduleRow(item, base = today()) {
  const date = parseDate(item.date);
  const left = daysBetween(base, date);
  const when = left === 0 ? '오늘' : left > 0 ? `${left}일 후` : `${-left}일 전`;
  return `<li class="schedule-item${item.done ? ' done' : ''}">
    <div class="date-tile" aria-hidden="true">
      <span class="date-tile-month">${date.getMonth() + 1}월</span>
      <span class="date-tile-day">${date.getDate()}</span>
      <span class="date-tile-weekday">${'일월화수목금토'[date.getDay()]}요일</span>
    </div>
    <div class="schedule-body">
      <div class="schedule-title"><span class="badge" data-kind="${esc(item.kind ?? '기타')}">${esc(item.kind ?? '기타')}</span> ${esc(item.title)}${item.done ? ' <span class="muted">(완료)</span>' : ''}</div>
      <div class="schedule-when">${esc(formatKoreanDate(date))}${item.time ? ` ${esc(item.time)}` : ''} · <span class="schedule-left">${when}</span></div>
      ${item.memo ? `<p class="muted">${esc(item.memo)}</p>` : ''}
      ${questionList(item)}
    </div>
  </li>`;
}

async function renderSchedule() {
  const items = await loadSchedule();
  const key = formatDate(today());
  const upcoming = items.filter((item) => item.date >= key);
  const past = items.filter((item) => item.date < key).reverse();
  app().innerHTML = `
    <section class="card">
      <h2>다가오는 일정</h2>
      ${upcoming.length ? `<ul class="schedule-list">${upcoming.map((i) => scheduleRow(i)).join('')}</ul>` : emptyState('calendar', '등록된 일정이 없습니다.')}
    </section>
    <details class="card past-schedule">
      <summary>지난 일정 (${past.length})${icon('chevron', 'chevron')}</summary>
      ${past.length ? `<ul class="schedule-list">${past.map((i) => scheduleRow(i)).join('')}</ul>` : '<p class="empty">지난 일정이 없습니다.</p>'}
    </details>`;
}

// ---------- 메인 ----------

function heroPregnancy(config, guide) {
  const base = today();
  const { days, week, day } = pregnancyAge(base, config.lmp);
  const unconfirmed = config.dueDateConfirmed ? '' : '<span class="small-tag">병원 확정 전</span>';
  const months = Array.from({ length: 10 }, (_, i) => moonSvg((days - i * 28) / 28)).join('');
  const month = Math.min(10, Math.floor(days / 28) + 1);
  return `<section class="card hero ${skyClass(week)}">
    ${moonSvg(days / 280, 'moon hero-moon')}
    <p class="hero-eyebrow">아기를 만나기까지</p>
    <p class="hero-main">${esc(ddayLabel(daysBetween(base, config.dueDate)))}</p>
    <p class="hero-sub">${days < 0 ? '임신 전' : `${week}주 ${day}일`}</p>
    ${days < 0 ? '' : `<div class="hero-months">${months}</div><p class="hero-month-label">열 달 중 ${month}번째 달</p>`}
    ${guide?.meta.size ? `<p class="hero-size">이번 주 아기는<strong>${esc(guide.meta.size)}</strong></p>` : ''}
    <p class="hero-due"><span>출산 예정일 ${esc(formatKoreanDate(config.dueDate))}</span> ${unconfirmed}</p>
  </section>`;
}

function heroBirth(config) {
  return `<section class="card hero hero-birth sky-morning">
    ${moonSvg(1, 'moon hero-moon')}
    <div class="hero-links">
      <a class="birth-link" href="birth.html">탄생 페이지 보기${icon('arrow')}</a>
      <a class="hero-link" href="baby.html">성장 보기${icon('arrow')}</a>
    </div>
    <p class="hero-main">생후 ${daysBetween(config.birthDate, today())}일</p>
    <p class="muted">${esc(formatKoreanDate(config.birthDate))} 출생</p>
  </section>`;
}

function nextScheduleCard(items) {
  const next = pickNextSchedule(items);
  const isToday = next[0]?.date === formatDate(today());
  return `<section class="card next-schedule${isToday ? ' is-today' : ''}">
    <h2>${isToday ? '오늘 일정' : '다음 일정'}</h2>
    ${next.length ? `<ul class="schedule-list">${next.map((i) => scheduleRow(i)).join('')}</ul>` : '<p class="empty">등록된 일정이 없습니다.</p>'}
  </section>`;
}

function reminderCards(missing) {
  return missing
    .map(
      (test) =>
        `<p class="notice warn">${icon('calendar')}<span>${esc(test.from)}~${esc(test.to)}주 전후 ${esc(test.name)} 일정을 잡으세요.</span></p>`,
    )
    .join('');
}

// 태어난 뒤에는 아침 하늘로 바뀐다. 구분은 가이드의 초기·중기·후기와 같다.
function skyClass(week) {
  return week <= 12 ? 'sky-night' : week <= 27 ? 'sky-predawn' : 'sky-dawn';
}

function celebrationCard(config) {
  const milestone = pickMilestone(config);
  if (!milestone) return '';
  const stars = Array.from({ length: 12 }, (_, i) => `<span class="spark" style="--i:${i}"></span>`).join('');
  return `<section class="card celebration" role="status">
    <div class="sparks" aria-hidden="true">${stars}</div>
    ${icon('sparkle')}
    <div><h2>${esc(milestone.title)}</h2><p>${esc(milestone.text)}</p></div>
  </section>`;
}

function noteCard(notes) {
  if (!notes.length) return '';
  const [latest, ...older] = notes;
  const row = (note) => `<div class="note-row">
    <p class="note-text">${esc(note.text)}</p>
    <p class="muted">${esc(formatKoreanDate(parseDate(note.date)))}</p>
  </div>`;
  return `<section class="card note-card">
    <h2>${esc(latest.from || '남편')}의 한 마디</h2>
    ${row(latest)}
    ${older.length ? `<details class="note-older"><summary>지난 한 마디 (${older.length})${icon('chevron', 'chevron')}</summary>${older.map(row).join('')}</details>` : ''}
  </section>`;
}

// ---------- 그래프 ----------

const CHART = { width: 320, height: 180, left: 30, right: 12, top: 14, bottom: 24 };
const chartData = new Map();

function niceMax(value) {
  const step = 10 ** Math.floor(Math.log10(value || 1));
  return Math.ceil(value / step + 0.0001) * step;
}

// 값이 이어지지 않는 구간은 segments를 나눠 선을 끊는다. y축은 항상 0에서 시작한다.
function lineChart({ title, segments, unit, ticks, xRange, current, note }) {
  const points = segments.flat();
  const id = `chart-${chartData.size}`;
  const yMax = niceMax(Math.max(...points.map((p) => p.y)));
  const [xMin, xMax] = xRange;
  const px = (x) => CHART.left + ((x - xMin) / (xMax - xMin || 1)) * (CHART.width - CHART.left - CHART.right);
  const py = (y) => CHART.height - CHART.bottom - (y / yMax) * (CHART.height - CHART.top - CHART.bottom);
  const placed = points.map((p) => ({ ...p, px: px(p.x), py: py(p.y) }));
  chartData.set(id, placed);

  const grid = [0, 0.5, 1]
    .map((f) => {
      const y = py(yMax * f);
      return `<line class="chart-grid" x1="${CHART.left}" x2="${CHART.width - CHART.right}" y1="${y}" y2="${y}"/><text class="chart-tick" x="${CHART.left - 6}" y="${y + 4}" text-anchor="end">${yMax * f}</text>`;
    })
    .join('');
  const xLabels = ticks
    .map((t) => `<text class="chart-tick" x="${px(t.x)}" y="${CHART.height - 7}" text-anchor="middle">${esc(t.label)}</text>`)
    .join('');
  const lines = segments
    .filter((segment) => segment.length > 1)
    .map((segment) => `<polyline class="chart-line" points="${segment.map((p) => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')}"/>`)
    .join('');
  const marked = current ?? points.at(-1);
  // 오르는 선과 겹치지 않도록 글자는 점의 왼쪽 위에 둔다. 왼쪽에 자리가 없을 때만 오른쪽으로 보낸다.
  const anchor = px(marked.x) > CHART.width * 0.35 ? 'end' : 'start';
  const shift = anchor === 'end' ? -8 : 8;
  const rows = points.map((p) => `<tr><td>${esc(p.label)}</td><td>${p.y}${esc(unit)}</td></tr>`).join('');

  return `<figure class="chart" data-chart="${id}">
    <figcaption class="chart-title">${esc(title)}</figcaption>
    <div class="chart-plot">
      <svg viewBox="0 0 ${CHART.width} ${CHART.height}" role="img" aria-label="${esc(`${title}. ${marked.label}, ${marked.y}${unit}`)}">
        ${grid}${xLabels}${lines}
        <line class="chart-cross" y1="${CHART.top}" y2="${CHART.height - CHART.bottom}" hidden/>
        <circle class="chart-dot" cx="${px(marked.x)}" cy="${py(marked.y)}" r="5"/>
        <text class="chart-value" x="${px(marked.x) + shift}" y="${Math.max(py(marked.y) - 9, 12)}" text-anchor="${anchor}">${marked.y}${esc(unit)}</text>
      </svg>
      <div class="chart-tip" hidden></div>
    </div>
    ${note ? `<p class="chart-note">${esc(note)}</p>` : ''}
    <details class="chart-table"><summary>표로 보기${icon('chevron', 'chevron')}</summary><table>${rows}</table></details>
  </figure>`;
}

function setupCharts() {
  const show = (event) => {
    const chart = event.target.closest?.('.chart-plot')?.closest('.chart');
    if (!chart) return;
    const points = chartData.get(chart.dataset.chart);
    const plot = chart.querySelector('.chart-plot');
    const rect = plot.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * CHART.width;
    const nearest = points.reduce((best, p) => (Math.abs(p.px - x) < Math.abs(best.px - x) ? p : best));
    const cross = chart.querySelector('.chart-cross');
    cross.removeAttribute('hidden');
    cross.setAttribute('x1', nearest.px);
    cross.setAttribute('x2', nearest.px);
    const tip = chart.querySelector('.chart-tip');
    tip.hidden = false;
    tip.textContent = nearest.label;
    const left = (nearest.px / CHART.width) * rect.width;
    tip.style.left = `${Math.min(Math.max(left, tip.offsetWidth / 2), rect.width - tip.offsetWidth / 2)}px`;
  };
  document.addEventListener('pointermove', show);
  document.addEventListener('pointerdown', show);
}

const sizeInCm = (size) => {
  const m = /약\s*([\d.]+)\s*(mm|cm)/.exec(String(size ?? ''));
  if (!m) return null;
  return m[2] === 'mm' ? Number(m[1]) / 10 : Number(m[1]);
};

// NHS는 19주까지 머리~엉덩이, 20주부터 머리~발끝을 잰다. 이어 그리면 없는 급성장처럼 보인다.
const SIZE_MEASURE_CHANGE_WEEK = 20;

function sizeChart(guides, week) {
  const points = guides
    .map((guide) => ({ guide, y: sizeInCm(guide.meta.size) }))
    .filter(({ y }) => y !== null)
    .map(({ guide, y }) => ({ x: guide.week, y, label: `${guide.week}주 · ${guide.meta.size}` }));
  if (!points.length) return '';
  return `<section class="card size-card">
    <h2>아기가 자라는 길</h2>
    ${lineChart({
      title: '주차별 아기 길이 (cm)',
      segments: [points.filter((p) => p.x < SIZE_MEASURE_CHANGE_WEEK), points.filter((p) => p.x >= SIZE_MEASURE_CHANGE_WEEK)],
      unit: 'cm',
      ticks: [4, 12, 20, 28, 36].map((x) => ({ x, label: `${x}주` })),
      xRange: [points[0].x, points.at(-1).x],
      current: points.find((p) => p.x === week),
      note: 'NHS 안내의 대략적인 값이며 우리 아기의 실제 크기가 아닙니다. 19주까지는 머리~엉덩이, 20주부터는 머리~발끝 길이라 선이 끊겨 있습니다.',
    })}
  </section>`;
}

const SUMMARY_ITEMS = 2;

// 메인에는 항목 앞부분만 보여주고 나머지 개수를 알려준다.
function summaryBlock(guide, title) {
  const info = sectionInfo(title);
  const template = document.createElement('template');
  template.innerHTML = guideHtml(guide.sections[title] || '내용 없음');
  const items = [...template.content.querySelectorAll('li')];
  items.slice(SUMMARY_ITEMS).forEach((li) => li.remove());
  const rest = items.length - SUMMARY_ITEMS;
  return `<div class="summary-block tone-${info.tone}">
    <div class="summary-head"><span class="tone-icon">${icon(info.icon)}</span><h3>${esc(title)}</h3>${rest > 0 ? `<span class="guide-count">외 ${rest}가지</span>` : ''}</div>
    <div class="prose tips">${template.innerHTML}</div>
  </div>`;
}

function guideSummary(guide, week) {
  if (!guide) return '';
  return `<section class="card">
    <h2>이번 주 가이드 (${week}주)</h2>
    ${summaryBlock(guide, '조심할 것')}
    ${summaryBlock(guide, '이 시기 검사·병원')}
    <p class="muted">${esc(GUIDE_NOTICE)}</p>
    <div class="summary-foot"><a class="more-link" href="guide.html">가이드 전체 보기${icon('arrow')}</a></div>
  </section>`;
}

function shortcuts() {
  const links = NAV_MORE.filter((item) => !item.requiresBirth)
    .map((item) => `<a class="shortcut" href="${item.href}">${icon(item.icon)}${esc(item.label)}</a>`)
    .join('');
  return `<h2 class="section-title">우리 이야기</h2><nav class="shortcuts" aria-label="우리 이야기">${links}</nav>`;
}

async function renderHome(config) {
  const [items, { posts, missing }, notes] = await Promise.all([loadSchedule(), loadPosts(), loadNotes()]);
  const recent = posts.slice(0, 3).map((post) => postCard(post, config)).join('');
  let hero = '';
  let guideParts = '';
  if (config.birthDate) {
    hero = heroBirth(config);
  } else {
    const guides = await loadGuides();
    const { week } = pregnancyAge(today(), config.lmp);
    const guide = guides.find((g) => g.week === week);
    hero = heroPregnancy(config, guide);
    guideParts = reminderCards(findMissingTests(guides, items, config)) + guideSummary(guide, week) + sizeChart(guides, week);
  }
  app().innerHTML = `
    ${hero}
    ${celebrationCard(config)}
    ${noteCard(notes)}
    ${nextScheduleCard(items)}
    ${guideParts}
    <h2 class="section-title">최근 기록</h2>
    ${missingNotice(missing, 'content/posts')}
    ${recent || emptyState('book', '아직 기록이 없습니다.')}
    ${posts.length ? `<a class="more-link" href="records.html">기록 전체 보기${icon('arrow')}</a>` : ''}
    ${shortcuts()}`;
}

// ---------- 가이드 ----------

function sourceList(sources) {
  const items = asList(sources).map((source) => {
    if (typeof source === 'string') return `<li>${esc(source)}</li>`;
    const label = `${esc(source.org)} — ${esc(source.title)}`;
    return `<li>${source.url ? `<a href="${esc(source.url)}" target="_blank" rel="noopener">${label}</a>` : label}</li>`;
  });
  return `<ul class="source-list">${items.join('')}</ul>`;
}

function guideSection({ title, tone, icon: iconName, open, fixed }, content) {
  const count = content ? (content.match(/^- /gm) ?? []).length : 0;
  const head = `<span class="tone-icon">${icon(iconName)}</span><h3>${esc(title)}</h3>`;
  const body = `<div class="guide-section-body">${content ? `<div class="prose tips">${guideHtml(content)}</div>` : '<p class="empty">아직 비어 있습니다.</p>'}</div>`;
  if (fixed) return `<section class="guide-section tone-${tone}"><div class="guide-section-head">${head}</div>${body}</section>`;
  return `<details class="guide-section tone-${tone}"${open ? ' open' : ''}>
    <summary>${head}${count ? `<span class="guide-count">${count}가지</span>` : ''}${icon('chevron', 'chevron')}</summary>
    ${body}
  </details>`;
}

function guideCard(guide, currentWeek) {
  const isCurrent = guide.week === currentWeek;
  const sections = GUIDE_SECTIONS.map((info) => guideSection(info, guide.sections[info.title])).join('');
  return `<details class="card guide-card${isCurrent ? ' current' : ''}" id="week-${guide.week}"${isCurrent ? ' open' : ''}>
    <summary>
      <span class="guide-week-number">${guide.week}주</span>
      <span class="guide-week-text">
        <span class="guide-week">임신 ${guide.week}주차${isCurrent ? ' <span class="badge">이번 주</span>' : ''}</span>
        ${guide.meta.size ? `<span class="guide-size">${esc(guide.meta.size)}</span>` : ''}
      </span>
      ${icon('chevron', 'chevron')}
    </summary>
    <div class="guide-body">
      ${sections}
      <details class="guide-section tone-source">
        <summary><span class="tone-icon">${icon('link')}</span><h3>출처</h3>${icon('chevron', 'chevron')}</summary>
        <div class="guide-section-body">${sourceList(guide.meta.sources)}</div>
      </details>
      <p class="muted guide-reviewed">마지막 검토일 ${esc(guide.meta.reviewed ?? '-')}</p>
    </div>
  </details>`;
}

// 구분은 NHS 주차별 안내의 삼분기 기준을 따른다.
function trimesterOf(week) {
  return week <= 12 ? '임신 초기' : week <= 27 ? '임신 중기' : '임신 후기';
}

function guideList(guides, currentWeek) {
  let last = null;
  return guides
    .map((guide) => {
      const trimester = trimesterOf(guide.week);
      const heading = trimester === last ? '' : `<h2 class="trimester">${trimester}</h2>`;
      last = trimester;
      return heading + guideCard(guide, currentWeek);
    })
    .join('');
}

function setupWeekStrip(strip, currentChip) {
  if (currentChip) strip.scrollLeft = currentChip.offsetLeft - (strip.clientWidth - currentChip.offsetWidth) / 2;
  strip.addEventListener('click', (event) => {
    const chip = event.target.closest('a');
    if (!chip) return;
    event.preventDefault();
    const card = document.querySelector(chip.getAttribute('href'));
    card.open = true;
    card.scrollIntoView({ block: 'start' });
  });
}

async function renderGuide(config) {
  const guides = await loadGuides();
  const currentWeek = config.birthDate ? null : pregnancyAge(today(), config.lmp).week;
  const chips = guides
    .map((g) => `<a class="week-chip${g.week === currentWeek ? ' current' : ''}" href="#week-${g.week}">${g.week}</a>`)
    .join('');
  app().innerHTML = `<div class="guide-bar">
      <p class="guide-notice">${esc(GUIDE_NOTICE)}</p>
      <nav class="week-strip" aria-label="주차 바로가기">${chips}</nav>
    </div>
    ${guides.length ? guideList(guides, currentWeek) : emptyState('leaf', '아직 가이드가 없습니다.')}`;
  setupWeekStrip(app().querySelector('.week-strip'), app().querySelector('.week-chip.current'));
  const current = document.getElementById(`week-${currentWeek}`);
  current?.scrollIntoView({ block: 'start' });
}

// ---------- 편지 ----------

function letterCard(letter, config) {
  const access = letterAccess(letter.meta, config);
  const dateText = letter.date ? formatKoreanDate(parseDate(letter.date)) : '작성일 없음';
  const title = esc(letter.meta.title || '제목 없는 편지');
  if (!access.open) {
    return `<article class="card letter locked">
      <span class="letter-seal">${icon('lock')}</span>
      <div class="letter-text">
        <h3>${title}</h3>
        <p class="muted">${esc(dateText)}</p>
        <p class="lock-label">잠김 · ${esc(access.condition)}</p>
      </div>
    </article>`;
  }
  return `<article class="card letter">
    <h3>${title}</h3>
    <p class="muted">${esc(dateText)}${letter.meta.author ? ` · ${esc(letter.meta.author)}` : ''}</p>
    <div class="prose">${md(letter.body)}</div>
  </article>`;
}

async function renderLetters(config) {
  const { letters, missing } = await loadLetters();
  app().innerHTML =
    missingNotice(missing, 'content/letters') +
    (letters.length ? letters.map((l) => letterCard(l, config)).join('') : emptyState('mail', '아직 편지가 없습니다.'));
}

// ---------- 마크다운 한 파일 페이지 ----------

// 큰 제목마다 카드를 나눈다. 제목만 있고 내용이 없는 칸은 비어 있다고 표시한다.
function markdownSections(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const groups = [];
  for (const node of template.content.children) {
    if (/^H[12]$/.test(node.tagName) || !groups.length) groups.push([]);
    groups.at(-1).push(node.outerHTML);
  }
  const cards = groups.map((nodes) => {
    const isEmpty = nodes.length === 1 && /^<h[12]/.test(nodes[0]);
    return `<article class="card prose md-section${isEmpty ? ' is-empty' : ''}">${nodes.join('')}</article>`;
  });
  return `<div class="md-sections">${cards.join('')}</div>`;
}

async function renderMarkdownPage(path, emptyIcon) {
  const text = await loadText(path);
  if (text === null) {
    app().innerHTML = emptyState(emptyIcon, '아직 내용이 없습니다.');
    return;
  }
  app().innerHTML = markdownSections(md(parseFrontmatter(text).body));
}

function sourcesCard(meta) {
  return `<details class="card source-card">
    <summary>출처${icon('chevron', 'chevron')}</summary>
    ${sourceList(meta.sources)}
    <p class="muted">마지막 확인일 ${esc(meta.reviewed ?? '-')}</p>
  </details>`;
}

async function renderSupport() {
  const text = await loadText('content/support.md');
  if (text === null) {
    app().innerHTML = emptyState('doc', '아직 내용이 없습니다.');
    return;
  }
  const { meta, body } = parseFrontmatter(text);
  app().innerHTML = `<p class="notice warn">${icon('alert')}<span>제도와 금액은 바뀔 수 있습니다. 신청 전에 출처의 공식 페이지나 주민센터에서 꼭 확인하세요. 마지막 확인일 ${esc(meta.reviewed ?? '-')}</span></p>
    <div class="tips">${markdownSections(md(body))}</div>
    ${sourcesCard(meta)}`;
}

// ---------- 성장 ----------

function growthCharts(growth, birth) {
  const series = (key, title, unit) => {
    const points = growth
      .filter((item) => Number(item[key]) > 0)
      .map((item) => {
        const date = parseDate(item.date);
        const months = fullMonths(birth, date);
        return { x: daysBetween(birth, date), y: Number(item[key]), label: `${formatKoreanDate(date)} · 생후 ${months}개월 · ${item[key]}${unit}` };
      });
    if (!points.length) return '';
    const last = points.at(-1).x;
    const span = Math.max(last, 30);
    const stepMonths = Math.max(1, Math.ceil(span / 30 / 4));
    const ticks = [];
    for (let m = 0; m * 30 <= span; m += stepMonths) ticks.push({ x: daysBetween(birth, addMonths(birth, m)), label: `${m}개월` });
    return lineChart({ title, segments: [points], unit, ticks, xRange: [0, span] });
  };
  const charts = series('heightCm', '키 (cm)', 'cm') + series('weightKg', '몸무게 (kg)', 'kg');
  return charts || emptyState('chart', '아직 잰 기록이 없습니다.');
}

function monthPhotos(posts, birth) {
  const photos = [...posts]
    .reverse()
    .flatMap((post) => preparePost(post).photos.map((src) => ({ src, date: post.date })))
    .filter(({ src, date }) => src.split('/').pop().toLowerCase() === 'month.jpg' && parseDate(date) >= birth);
  if (!photos.length) return emptyState('sparkle', '아직 개월별 사진이 없습니다.');
  const slides = photos
    .map(
      ({ src, date }) =>
        `<figure class="belly-slide"><button type="button" class="thumb" data-full="${esc(src)}" aria-label="사진 크게 보기"><img src="${esc(src)}" alt="" loading="lazy"></button><figcaption>${fullMonths(birth, parseDate(date))}개월</figcaption></figure>`,
    )
    .join('');
  return `<div class="belly-series">${slides}</div>`;
}

function vaccineRow(dose, state) {
  const status = dose.done
    ? `${esc(formatKoreanDate(parseDate(dose.done)))} 접종`
    : `${esc(formatKoreanDate(dose.start))}부터`;
  return `<li class="vaccine-row ${state}">
    <div class="vaccine-main"><strong>${esc(dose.name)}</strong> <span class="badge">${esc(dose.dose)}</span>${dose.national === false ? ' <span class="badge" data-kind="기타">선택</span>' : ''}</div>
    <div class="muted">권장 시기 ${esc(dose.when)} · ${status}</div>
  </li>`;
}

function vaccineCard(data, birth) {
  if (!data) return emptyState('shield', '접종 자료가 없습니다.');
  const { done, due, upcoming } = groupVaccines(data.doses, birth);
  const list = (doses, state) => `<ul class="vaccine-list">${doses.map((dose) => vaccineRow(dose, state)).join('')}</ul>`;
  const soon = upcoming.slice(0, 4);
  const later = upcoming.slice(4);
  return `<section class="card vaccine-card">
    <h2>예방접종</h2>
    <p class="muted">${esc(GUIDE_NOTICE)} ${esc(data.note ?? '')}</p>
    ${due.length ? `<h3>시기가 된 접종</h3>${list(due, 'due')}<p class="muted">이미 맞았다면 파일에 접종일을 적어 주세요. 시기가 지났다면 소아청소년과에 일정을 문의하세요.</p>` : ''}
    ${soon.length ? `<h3>다가오는 접종</h3>${list(soon, 'upcoming')}` : ''}
    ${later.length ? `<details class="vaccine-more"><summary>이후 접종 (${later.length})${icon('chevron', 'chevron')}</summary>${list(later, 'upcoming')}</details>` : ''}
    ${done.length ? `<details class="vaccine-more"><summary>맞은 접종 (${done.length})${icon('chevron', 'chevron')}</summary>${list(done, 'done')}</details>` : ''}
    <details class="vaccine-more"><summary>출처${icon('chevron', 'chevron')}</summary>${sourceList(data.sources)}<p class="muted">마지막 확인일 ${esc(data.reviewed ?? '-')}</p></details>
  </section>`;
}

async function renderBaby(config) {
  if (!config.birthDate) {
    app().innerHTML = `<div class="empty-state waiting">${moonSvg(0.75)}<p>아직 기다리는 중</p></div>`;
    return;
  }
  const [growth, { posts }, vaccines] = await Promise.all([loadGrowth(), loadPosts(), loadJson('content/vaccines.json')]);
  const birth = config.birthDate;
  const months = fullMonths(birth, today());
  app().innerHTML = `<section class="card hero hero-birth sky-morning">
      ${moonSvg(1, 'moon hero-moon')}
      <p class="hero-sub">생후 ${months}개월</p>
      <p class="muted">태어난 지 ${daysBetween(birth, today())}일</p>
    </section>
    <section class="card"><h2>키와 몸무게</h2>${growthCharts(growth, birth)}</section>
    <section class="card"><h2>개월별 사진</h2>${monthPhotos(posts, birth)}</section>
    ${vaccineCard(vaccines, birth)}`;
}

async function renderChecklist() {
  await renderMarkdownPage('content/checklist.md', 'check');
  const boxes = [...app().querySelectorAll('input[type="checkbox"]')];
  const done = boxes.filter((box) => box.checked).length;
  const progress = boxes.length
    ? `<section class="card progress-card">
        <p class="progress-text">${done} / ${boxes.length} <span>준비했어요</span></p>
        <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${boxes.length}" aria-valuenow="${done}"><div class="progress-fill" style="width:${(done / boxes.length) * 100}%"></div></div>
      </section>`
    : '';
  app().insertAdjacentHTML(
    'afterbegin',
    `${progress}<p class="notice">${icon('pencil')}<span>여기서는 체크할 수 없습니다. 체크 상태를 바꾸려면 content/checklist.md 파일을 수정하세요.</span></p>`,
  );
}

async function renderBirth(config) {
  if (!config.birthDate) {
    app().innerHTML = `<div class="empty-state waiting">${moonSvg(0.75)}<p>아직 기다리는 중</p></div>`;
    return;
  }
  await renderMarkdownPage('content/birth.md', 'star');
  app().insertAdjacentHTML(
    'afterbegin',
    `<section class="card hero hero-birth sky-morning">${moonSvg(1, 'moon hero-moon')}<p class="hero-sub">${esc(formatKoreanDate(config.birthDate))}</p><p class="muted">생후 ${daysBetween(config.birthDate, today())}일</p></section>`,
  );
}

// ---------- 시작 ----------

const PAGES = {
  index: { title: '메인', tagline: '함께 기다리는 열 달', render: renderHome },
  records: { title: '기록', tagline: '우리가 쌓아 가는 날들', render: renderRecords },
  guide: { title: '가이드', tagline: '이번 주에 알아 두면 좋은 것들', render: renderGuide },
  schedule: { title: '일정', tagline: '병원 가는 날과 챙길 일', render: renderSchedule },
  letters: { title: '편지', tagline: '언젠가 아이가 읽을 이야기', render: renderLetters },
  names: { title: '이름', tagline: '불러 보고 싶은 이름들', render: () => renderMarkdownPage('content/names.md', 'heart') },
  capsule: { title: '타임캡슐', tagline: '네가 오기 전의 세상', render: () => renderMarkdownPage('content/capsule.md', 'hourglass') },
  checklist: { title: '준비', tagline: '하나씩 챙겨 가는 목록', render: renderChecklist },
  birth: { title: '탄생', tagline: '우리가 처음 만난 날', render: renderBirth },
  firsts: { title: '처음의 순간', tagline: '한 번뿐인 처음들을 모아 둔 곳', render: renderFirsts },
  support: { title: '행정·지원', tagline: '시기별로 챙길 신청과 신고', render: renderSupport },
  baby: { title: '성장', tagline: '하루하루 자라는 기록', render: renderBaby },
};

async function start() {
  const page = PAGES[document.body.dataset.page];
  let config = null;
  try {
    config = await loadConfig();
    renderLayout(config, page);
    setupLightbox();
    setupCharts();
    if (!window.marked) throw new Error('마크다운 라이브러리를 불러오지 못했습니다. 네트워크를 확인하세요.');
    app().innerHTML = '<p class="empty">불러오는 중…</p>';
    await page.render(config);
  } catch (error) {
    console.error(error);
    if (!config) renderLayout(null, page);
    app().innerHTML = `<p class="notice warn">${icon('alert')}<span>페이지를 불러오지 못했습니다. ${esc(error.message)}</span></p>`;
  }
}

start();
