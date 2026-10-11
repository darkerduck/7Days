const total = 30;
const $ = (id) => document.getElementById(id);
const language = new URL(location.href).searchParams.get('lang') === 'en' ? 'en' : 'zh';
const ui = {
  zh: { brand: '成神七日', subtitle: 'SEVEN DAYS TO GODHOOD', skip: '跳至漫畫', navigation: '閱讀選項', languages: '語言', jump: '跳至', pageJump: '選擇頁碼', progress: '閱讀進度', dialogue: '畫格中的對話', original: '原尺寸（含字）', fit: '適應螢幕', pan: '左右滑動查看原尺寸畫面與對話。', raw: '無字原圖', transcript: '展開本頁文字稿', transcriptArea: '本頁文字稿', pager: '翻頁', previous: '上一頁', next: '下一頁', imageMissing: '本頁畫面尚未完成，請稍後再閱讀。', loadFailed: '暫時無法載入漫畫', retry: '請稍後重試。', credit: '原作《成神七日》｜三十頁漫畫改編', help: '方向鍵可翻頁；可切換原尺寸含字版。' },
  en: { brand: 'Seven Days to Godhood', subtitle: 'A COMIC IN THIRTY PAGES', skip: 'Skip to comic', navigation: 'Reading options', languages: 'Languages', jump: 'Go to', pageJump: 'Choose a page', progress: 'Reading progress', dialogue: 'Dialogue in the comic panels', original: 'Full size with dialogue', fit: 'Fit to screen', pan: 'Pan horizontally to read the full-size page and dialogue.', raw: 'Art without text', transcript: 'Open page transcript', transcriptArea: 'Page transcript', pager: 'Turn pages', previous: 'Previous', next: 'Next', imageMissing: 'This page is still being illustrated.', loadFailed: 'Unable to load the comic', retry: 'Please try again later.', credit: 'Based on Seven Days to Godhood · 30-page comic adaptation', help: 'Use arrow keys to turn pages. Full-size view includes dialogue.' }
}[language];
let pages = [];
let layouts = [];
let current = 1;

function pageFromURL() {
  const value = Number(new URL(location.href).searchParams.get('page'));
  return Number.isInteger(value) && value >= 1 && value <= total ? value : 1;
}

function render(pageNumber, moveFocus = false) {
  current = Math.max(1, Math.min(total, pageNumber));
  const page = pages[current - 1];
  const layout = layouts[current - 1];
  if (!page) return;
  $('chapter').textContent = page.chapter;
  $('title').textContent = `${String(current).padStart(2, '0')} · ${page.title}`;
  document.title = `${page.title}｜${ui.brand} ${current}/${total}`;
  $('counter').textContent = `${current} / ${total}`;
  $('bottom-counter').textContent = `${current} / ${total}`;
  $('page-jump').value = String(current);
  $('previous').disabled = current === 1;
  $('next').disabled = current === total;
  const progress = document.querySelector('.progress');
  progress.setAttribute('aria-valuenow', String(current));
  $('progress-fill').style.width = `${(current / total) * 100}%`;

  const image = $('page-image');
  const src = `pages/${String(current).padStart(2, '0')}.png`;
  const frame = $('art-frame');
  frame.classList.remove('missing');
  $('image-status').textContent = '';
  image.alt = language === 'en'
    ? `Page ${current}: ${page.title}. ${page.scene}`
    : `第 ${current} 頁：${page.title}。${page.scene}`;
  image.onload = () => {
    $('image-status').textContent = '';
    frame.style.setProperty('--natural-width', `${image.naturalWidth}px`);
  };
  image.onerror = () => {
    frame.classList.add('missing');
    $('image-status').textContent = ui.imageMissing;
  };
  image.src = src;
  const sizeUrl = new URL(location.href);
  sizeUrl.searchParams.set('page', String(current));
  const original = sizeUrl.searchParams.get('view') === 'original';
  document.body.classList.toggle('original-size', original);
  if (original) sizeUrl.searchParams.delete('view');
  else sizeUrl.searchParams.set('view', 'original');
  $('full-size').href = sizeUrl;
  $('full-size').textContent = original ? ui.fit : ui.original;
  $('fit-top').href = sizeUrl;
  $('raw-image').href = src;
  for (const code of ['zh', 'en']) {
    const url = new URL(location.href);
    url.searchParams.set('page', String(current));
    url.searchParams.set('lang', code);
    const link = $(`lang-${code}`);
    link.href = url;
    link.setAttribute('aria-current', language === code ? 'page' : 'false');
  }

  const layer = $('balloon-layer');
  layer.replaceChildren();
  for (let i = 0; i < page.lines.length; i++) {
    const line = page.lines[i];
    const place = layout.balloons[i];
    const card = document.createElement('div');
    card.className = `balloon ${line.speaker === '旁白' ? 'caption' : 'speech'}`;
    card.style.left = `${place.x}%`;
    card.style.top = `${place.y}%`;
    card.style.width = `${place.w}%`;
    card.dataset.panel = String(place.panel);
    const speaker = document.createElement('span');
    speaker.className = 'speaker';
    speaker.textContent = line.speaker;
    const text = document.createElement('span');
    text.className = 'balloon-text';
    text.textContent = line.text;
    card.append(speaker, text);
    layer.append(card);
  }

  const script = $('script');
  script.replaceChildren();
  for (const line of page.lines) {
    const card = document.createElement('div');
    card.className = 'line';
    card.dataset.speaker = line.speaker;
    const speaker = document.createElement('span');
    speaker.className = 'speaker';
    speaker.textContent = line.speaker;
    const text = document.createElement('p');
    text.textContent = line.text;
    card.append(speaker, text);
    script.append(card);
  }
  if (moveFocus) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('comic').focus({ preventScroll: true });
  }
}

function navigate(pageNumber) {
  const next = Math.max(1, Math.min(total, pageNumber));
  if (next === current) return;
  const url = new URL(location.href);
  url.searchParams.set('page', String(next));
  history.pushState({ page: next }, '', url);
  render(next, true);
}

async function initialize() {
  try {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-Hant';
    $('brand-title').textContent = ui.brand;
    $('brand-subtitle').textContent = ui.subtitle;
    $('skip-link').textContent = ui.skip;
    document.querySelector('.top-nav').setAttribute('aria-label', ui.navigation);
    document.querySelector('.language-switch').setAttribute('aria-label', ui.languages);
    $('jump-label').textContent = ui.jump;
    $('fit-top').textContent = ui.fit;
    $('zoom-hint').textContent = ui.pan;
    $('page-jump').setAttribute('aria-label', ui.pageJump);
    document.querySelector('.progress').setAttribute('aria-label', ui.progress);
    $('balloon-layer').setAttribute('aria-label', ui.dialogue);
    $('transcript-label').textContent = ui.transcript;
    $('script').setAttribute('aria-label', ui.transcriptArea);
    document.querySelector('.pager').setAttribute('aria-label', ui.pager);
    $('raw-image').textContent = ui.raw;
    $('previous').querySelector('span').textContent = ui.previous;
    $('previous').setAttribute('aria-label', ui.previous);
    $('next').querySelector('span').textContent = ui.next;
    $('next').setAttribute('aria-label', ui.next);
    $('footer-credit').textContent = ui.credit;
    $('footer-help').textContent = ui.help;
    const [response, layoutResponse] = await Promise.all([
      fetch(language === 'en' ? 'storyboard.en.json' : 'storyboard.json'),
      fetch(language === 'en' ? 'layout.en.json' : 'layout.json')
    ]);
    if (!response.ok || !layoutResponse.ok) throw new Error('storyboard or layout unavailable');
    pages = await response.json();
    layouts = await layoutResponse.json();
    if (!Array.isArray(pages) || pages.length !== total || pages.some((p, i) => p.page !== i + 1)) throw new Error('storyboard incomplete');
    if (!Array.isArray(layouts) || layouts.length !== total || layouts.some((p, i) => p.page !== i + 1 || p.balloons.length !== pages[i].lines.length)) throw new Error('layout incomplete');
    const jump = $('page-jump');
    for (const page of pages) {
      const option = document.createElement('option');
      option.value = String(page.page);
      option.textContent = `${String(page.page).padStart(2, '0')} · ${page.title}`;
      jump.append(option);
    }
    $('previous').addEventListener('click', () => navigate(current - 1));
    $('next').addEventListener('click', () => navigate(current + 1));
    jump.addEventListener('change', () => navigate(Number(jump.value)));
    window.addEventListener('popstate', () => render(pageFromURL()));
    window.addEventListener('keydown', (event) => {
      if (event.target instanceof HTMLSelectElement || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft') navigate(current - 1);
      if (event.key === 'ArrowRight') navigate(current + 1);
    });
    render(pageFromURL());
  } catch (error) {
    $('title').textContent = ui.loadFailed;
    $('image-status').textContent = ui.retry;
    console.error(error);
  }
}

initialize();
