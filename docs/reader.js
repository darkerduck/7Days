const total = 30;
const $ = (id) => document.getElementById(id);
let pages = [];
let current = 1;

function pageFromURL() {
  const value = Number(new URL(location.href).searchParams.get('page'));
  return Number.isInteger(value) && value >= 1 && value <= total ? value : 1;
}

function render(pageNumber, moveFocus = false) {
  current = Math.max(1, Math.min(total, pageNumber));
  const page = pages[current - 1];
  if (!page) return;
  $('chapter').textContent = page.chapter;
  $('title').textContent = `${String(current).padStart(2, '0')} · ${page.title}`;
  document.title = `${page.title}｜成神七日 ${current}/${total}`;
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
  $('image-status').textContent = '';
  image.alt = `第 ${current} 頁：${page.title}。${page.scene}`;
  image.onload = () => { $('image-status').textContent = ''; };
  image.onerror = () => { $('image-status').textContent = '本頁畫面尚未完成，請稍後再閱讀。'; };
  image.src = src;
  $('full-size').href = src;

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
    const response = await fetch('storyboard.json');
    if (!response.ok) throw new Error('storyboard.json unavailable');
    pages = await response.json();
    if (!Array.isArray(pages) || pages.length !== total || pages.some((p, i) => p.page !== i + 1)) throw new Error('storyboard incomplete');
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
    $('title').textContent = '暫時無法載入漫畫';
    $('image-status').textContent = '請稍後重試。';
    console.error(error);
  }
}

initialize();
