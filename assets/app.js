// 공통 레이아웃 주입과 페이지별 렌더링. <body data-page="...">로 페이지를 고른다.
import {
  asList,
  daysBetween,
  ddayLabel,
  findMissingTests,
  formatDate,
  formatKoreanDate,
  letterAccess,
  loadConfig,
  loadGuides,
  loadLetters,
  loadPosts,
  loadSchedule,
  loadText,
  parseDate,
  parseFrontmatter,
  pickNextSchedule,
  pregnancyAge,
  today,
} from './core.js';

const NAV_MAIN = [
  { page: 'index', href: 'index.html', label: '홈' },
  { page: 'records', href: 'records.html', label: '기록' },
  { page: 'guide', href: 'guide.html', label: '가이드' },
  { page: 'schedule', href: 'schedule.html', label: '일정' },
];

const NAV_MORE = [
  { page: 'letters', href: 'letters.html', label: '편지' },
  { page: 'names', href: 'names.html', label: '이름' },
  { page: 'capsule', href: 'capsule.html', label: '타임캡슐' },
  { page: 'checklist', href: 'checklist.html', label: '준비' },
  { page: 'birth', href: 'birth.html', label: '탄생', requiresBirth: true },
];

const GUIDE_SECTIONS = [
  '아기 발달',
  '엄마 몸 변화',
  '조심할 것',
  '이 시기 검사·병원',
  '바로 병원에 가야 할 신호',
  '아빠가 할 일',
  '우리 병원 메모',
];
const GUIDE_NOTICE = '일반 정보이며, 담당 의사의 안내가 항상 우선합니다.';

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const md = (text) => window.marked.parse(text ?? '');

const app = () => document.getElementById('app');

function renderLayout(config, pageTitle) {
  const page = document.body.dataset.page;
  const more = NAV_MORE.filter((item) => !item.requiresBirth || config?.birthDate);
  const inMore = more.some((item) => item.page === page);
  const link = (item) =>
    `<a href="${item.href}"${item.page === page ? ' class="active" aria-current="page"' : ''}>${esc(item.label)}</a>`;

  document.body.insertAdjacentHTML(
    'afterbegin',
    `<header class="site-header"><span class="site-name">${esc(config?.nickname || '우리 아기')}</span><h1>${esc(pageTitle)}</h1></header>`,
  );
  document.body.insertAdjacentHTML(
    'beforeend',
    `<nav class="bottom-nav" aria-label="주요 메뉴">
      <div class="more-sheet" id="more-sheet" hidden>${more.map(link).join('')}</div>
      <div class="nav-row">
        ${NAV_MAIN.map(link).join('')}
        <button type="button" id="more-toggle" aria-expanded="false" aria-controls="more-sheet"${inMore ? ' class="active"' : ''}>더보기</button>
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
  return `<div class="photo-grid">${items}</div>`;
}

function postCard(post, config) {
  const { html, photos } = preparePost(post);
  const author = post.meta.author ? ` · ${esc(post.meta.author)}` : '';
  return `<article class="card post">
    <p class="post-meta"><span class="badge">${esc(postBadge(post.date, config))}</span> ${esc(formatKoreanDate(parseDate(post.date)))}${author}</p>
    ${post.meta.title ? `<h3>${esc(post.meta.title)}</h3>` : ''}
    <div class="prose">${html}</div>
    ${photoGrid(photos)}
  </article>`;
}

function missingNotice(missing, folder) {
  if (!missing.length) return '';
  return `<p class="notice warn">index.json에는 있지만 ${esc(folder)}에서 찾지 못한 파일: ${esc(missing.join(', '))}</p>`;
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
    app().innerHTML = `${missingNotice(missing, 'content/posts')}<p class="empty">아직 기록이 없습니다.</p>`;
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
  app().innerHTML = missingNotice(missing, 'content/posts') + bellySeries(posts) + timeline;
}

// ---------- 일정 ----------

function scheduleRow(item, base = today()) {
  const left = daysBetween(base, parseDate(item.date));
  const when = left === 0 ? '오늘' : left > 0 ? `${left}일 후` : `${-left}일 전`;
  return `<li class="schedule-item${item.done ? ' done' : ''}">
    <div class="schedule-when"><strong>${esc(formatKoreanDate(parseDate(item.date)))}</strong>${item.time ? ` ${esc(item.time)}` : ''} <span class="muted">${when}</span></div>
    <div class="schedule-title"><span class="badge">${esc(item.kind ?? '기타')}</span> ${esc(item.title)}${item.done ? ' <span class="muted">(완료)</span>' : ''}</div>
    ${item.memo ? `<p class="muted">${esc(item.memo)}</p>` : ''}
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
      ${upcoming.length ? `<ul class="schedule-list">${upcoming.map((i) => scheduleRow(i)).join('')}</ul>` : '<p class="empty">등록된 일정이 없습니다.</p>'}
    </section>
    <details class="card">
      <summary>지난 일정 (${past.length})</summary>
      ${past.length ? `<ul class="schedule-list">${past.map((i) => scheduleRow(i)).join('')}</ul>` : '<p class="empty">지난 일정이 없습니다.</p>'}
    </details>`;
}

// ---------- 메인 ----------

function heroPregnancy(config) {
  const base = today();
  const { days, week, day } = pregnancyAge(base, config.lmp);
  const unconfirmed = config.dueDateConfirmed ? '' : '<span class="small-tag">병원 확정 전</span>';
  return `<section class="card hero">
    <p class="hero-main">${esc(ddayLabel(daysBetween(base, config.dueDate)))}</p>
    <p class="hero-sub">${days < 0 ? '임신 전' : `${week}주 ${day}일`}</p>
    <p class="muted">출산 예정일 ${esc(formatKoreanDate(config.dueDate))} ${unconfirmed}</p>
  </section>`;
}

function heroBirth(config) {
  return `<section class="card hero">
    <a class="birth-link" href="birth.html">탄생 페이지 보기</a>
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
        `<p class="notice warn">${esc(test.from)}~${esc(test.to)}주 전후 ${esc(test.name)} 일정을 잡으세요.</p>`,
    )
    .join('');
}

function guideSummary(guides, config) {
  const { week } = pregnancyAge(today(), config.lmp);
  const guide = guides.find((g) => g.week === week);
  if (!guide) return '';
  const part = (title) =>
    `<h3>${esc(title)}</h3><div class="prose">${md(guide.sections[title] || '내용 없음')}</div>`;
  return `<section class="card">
    <h2>이번 주 가이드 (${week}주)</h2>
    ${part('조심할 것')}
    ${part('이 시기 검사·병원')}
    <p class="muted">${esc(GUIDE_NOTICE)}</p>
    <a href="guide.html">가이드 전체 보기</a>
  </section>`;
}

async function renderHome(config) {
  const [items, { posts, missing }] = await Promise.all([loadSchedule(), loadPosts()]);
  const recent = posts.slice(0, 3).map((post) => postCard(post, config)).join('');
  const hero = config.birthDate ? heroBirth(config) : heroPregnancy(config);
  let guideParts = '';
  if (!config.birthDate) {
    const guides = await loadGuides();
    guideParts = reminderCards(findMissingTests(guides, items, config)) + guideSummary(guides, config);
  }
  app().innerHTML = `
    ${hero}
    ${nextScheduleCard(items)}
    ${guideParts}
    <h2 class="section-title">최근 기록</h2>
    ${missingNotice(missing, 'content/posts')}
    ${recent || '<p class="empty">아직 기록이 없습니다.</p>'}
    ${posts.length ? '<a href="records.html">기록 전체 보기</a>' : ''}`;
}

// ---------- 가이드 ----------

function sourceList(sources) {
  const items = asList(sources).map((source) => {
    if (typeof source === 'string') return `<li>${esc(source)}</li>`;
    const label = `${esc(source.org)} — ${esc(source.title)}`;
    return `<li>${source.url ? `<a href="${esc(source.url)}" target="_blank" rel="noopener">${label}</a>` : label}</li>`;
  });
  return `<ul>${items.join('')}</ul>`;
}

function guideCard(guide, currentWeek) {
  const isCurrent = guide.week === currentWeek;
  const sections = GUIDE_SECTIONS.map((title) => {
    const content = guide.sections[title];
    return `<section class="guide-section"><h3>${esc(title)}</h3>${content ? `<div class="prose">${md(content)}</div>` : '<p class="empty">아직 비어 있습니다.</p>'}</section>`;
  }).join('');
  return `<details class="card guide-card${isCurrent ? ' current' : ''}" id="week-${guide.week}"${isCurrent ? ' open' : ''}>
    <summary><span class="guide-week">${guide.week}주${isCurrent ? ' <span class="badge">이번 주</span>' : ''}</span>${guide.meta.size ? `<span class="muted">${esc(guide.meta.size)}</span>` : ''}</summary>
    ${sections}
    <section class="guide-section"><h3>출처</h3>${sourceList(guide.meta.sources)}</section>
    <p class="muted">마지막 검토일 ${esc(guide.meta.reviewed ?? '-')}</p>
  </details>`;
}

async function renderGuide(config) {
  const guides = await loadGuides();
  const currentWeek = config.birthDate ? null : pregnancyAge(today(), config.lmp).week;
  app().innerHTML = `<p class="guide-notice">${esc(GUIDE_NOTICE)}</p>
    ${guides.length ? guides.map((g) => guideCard(g, currentWeek)).join('') : '<p class="empty">아직 가이드가 없습니다.</p>'}`;
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
      <h3>${title}</h3>
      <p class="muted">${esc(dateText)}</p>
      <p class="lock-label">잠김 · ${esc(access.condition)}</p>
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
    (letters.length ? letters.map((l) => letterCard(l, config)).join('') : '<p class="empty">아직 편지가 없습니다.</p>');
}

// ---------- 마크다운 한 파일 페이지 ----------

async function renderMarkdownPage(path) {
  const text = await loadText(path);
  if (text === null) {
    app().innerHTML = '<p class="empty">아직 내용이 없습니다.</p>';
    return;
  }
  app().innerHTML = `<article class="card prose">${md(parseFrontmatter(text).body)}</article>`;
}

async function renderChecklist() {
  await renderMarkdownPage('content/checklist.md');
  app().insertAdjacentHTML(
    'afterbegin',
    '<p class="notice">여기서는 체크할 수 없습니다. 체크 상태를 바꾸려면 content/checklist.md 파일을 수정하세요.</p>',
  );
}

async function renderBirth(config) {
  if (!config.birthDate) {
    app().innerHTML = '<p class="empty waiting">아직 기다리는 중</p>';
    return;
  }
  await renderMarkdownPage('content/birth.md');
  app().insertAdjacentHTML(
    'afterbegin',
    `<section class="card hero"><p class="hero-sub">${esc(formatKoreanDate(config.birthDate))}</p><p class="muted">생후 ${daysBetween(config.birthDate, today())}일</p></section>`,
  );
}

// ---------- 시작 ----------

const PAGES = {
  index: { title: '메인', render: renderHome },
  records: { title: '기록', render: renderRecords },
  guide: { title: '가이드', render: renderGuide },
  schedule: { title: '일정', render: renderSchedule },
  letters: { title: '편지', render: renderLetters },
  names: { title: '이름', render: () => renderMarkdownPage('content/names.md') },
  capsule: { title: '타임캡슐', render: () => renderMarkdownPage('content/capsule.md') },
  checklist: { title: '준비', render: renderChecklist },
  birth: { title: '탄생', render: renderBirth },
};

async function start() {
  const page = PAGES[document.body.dataset.page];
  let config = null;
  try {
    config = await loadConfig();
    renderLayout(config, page.title);
    setupLightbox();
    if (!window.marked) throw new Error('마크다운 라이브러리를 불러오지 못했습니다. 네트워크를 확인하세요.');
    app().innerHTML = '<p class="empty">불러오는 중…</p>';
    await page.render(config);
  } catch (error) {
    console.error(error);
    if (!config) renderLayout(null, page.title);
    app().innerHTML = `<p class="notice warn">페이지를 불러오지 못했습니다. ${esc(error.message)}</p>`;
  }
}

start();
