const nav = document.querySelector('.nav');
const btn = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');

function setMenu(open) {
  menu.classList.toggle('open', open);
  nav.classList.toggle('menu-open', open);
  btn.setAttribute('aria-expanded', open);
}
btn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
menu.addEventListener('click', e => {
  if (e.target.tagName === 'A') setMenu(false);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menu.classList.contains('open')) {
    setMenu(false);
    btn.focus();
  }
});

if (!nav.classList.contains('solid')) {
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:48px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle('scrolled', !e.isIntersecting)).observe(sentinel);
}

const videos = [...document.querySelectorAll('video')];
if (videos.length) {
  const toggle = document.createElement('button');
  toggle.className = 'motion-toggle';
  toggle.type = 'button';
  const setPlaying = playing => {
    videos.forEach(v => (playing ? v.play().catch(() => {}) : v.pause()));
    toggle.textContent = playing ? 'Pause video' : 'Play video';
    toggle.setAttribute('aria-pressed', !playing);
  };
  toggle.addEventListener('click', () => setPlaying(toggle.textContent === 'Play video'));
  document.body.append(toggle);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  videos.forEach(v => reduce && v.removeAttribute('autoplay'));
  setPlaying(!reduce);
}

const tabItems = [...document.querySelectorAll('.tab-item')];
const tabImgs = [...document.querySelectorAll('.tab-view video')];
const setTab = i => {
  tabItems.forEach((el, n) => el.classList.toggle('on', n === i));
  tabImgs.forEach((el, n) => el.classList.toggle('on', n === i));
};
tabItems.forEach((el, i) => {
  el.addEventListener('mouseenter', () => setTab(i));
  el.addEventListener('focus', () => setTab(i));
});

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
