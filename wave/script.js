const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Automation demo: engineer / partner view (the page's live thing)
const demo = document.querySelector('.demo');
const tabs = demo.querySelectorAll('[data-set]');
const code = demo.querySelector('.log code');
const full = code.textContent;
function replay() {
  demo.querySelectorAll('.f i').forEach(b => { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; });
  clearInterval(demo._t);
  if (reduce) { code.textContent = full; return; }
  const lines = full.split('\n'); let i = 0;
  demo._t = setInterval(() => { code.textContent = lines.slice(0, ++i).join('\n'); if (i >= lines.length) clearInterval(demo._t); }, 150);
}
tabs.forEach(t => t.addEventListener('click', () => {
  demo.dataset.view = t.dataset.set;
  tabs.forEach(x => x.setAttribute('aria-selected', String(x === t)));
  replay();
}));
demo.querySelector('.replay').addEventListener('click', replay);

// Poster versions: one frame, contents change (scrub or tap)
const V = [
  ['sl-v007', 'v007. First composition on the base the collective chose.'],
  ['sl-v022', 'v022. Lab rescaled in one clean edit instead of a chain that lost detail. Approved as master.'],
  ['sl-v033', 'v033. White lettering with a soft blue shadow, legible at phone size.'],
  ['sl-v111', 'v111. New brief: a retro-futurist corridor, with the logo placed as supplied.'],
  ['sl-v128', 'v128. Print master, full-bleed A3 and A5 at 600 dpi.'],
];
V.forEach(v => { new Image().src = `assets/${v[0]}.webp`; });
const range = document.getElementById('v-range'), vImg = document.getElementById('v-img'), vCap = document.getElementById('v-cap');
function setV(i) {
  range.value = i;
  vImg.style.opacity = .3;
  vImg.onload = () => { vImg.style.opacity = 1; };
  vImg.src = `assets/${V[i][0]}.webp`;
  vImg.alt = `Secret Lab III poster, ${V[i][0].slice(3)}`;
  vCap.textContent = V[i][1];
}
range.addEventListener('input', () => setV(+range.value));
document.querySelector('.ver-btn').addEventListener('click', () => setV((+range.value + 1) % V.length));

// What else: active list swaps the held picture
const mImg = document.getElementById('m-img');
document.querySelectorAll('.more-list li').forEach(li => {
  const act = () => {
    document.querySelectorAll('.more-list li').forEach(x => x.classList.toggle('on', x === li));
    mImg.style.opacity = .3;
    mImg.onload = () => { mImg.style.opacity = 1; };
    mImg.src = `assets/${li.dataset.img}.webp`;
  };
  li.querySelector('button').addEventListener('click', act);
  li.querySelector('button').addEventListener('mouseenter', act);
  li.querySelector('button').addEventListener('focus', act);
});

// Video cards travel across the held picture as the section scrolls
const reel = document.querySelector('.reel'), track = reel.querySelector('.track');
function moveTrack() {
  if (innerWidth <= 640) return;
  const r = reel.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
  const dist = track.scrollWidth - innerWidth * 0.5;
  track.style.setProperty('--x', `${-p * dist}px`);
}
addEventListener('scroll', moveTrack, { passive: true }); moveTrack();

// Play videos only while visible
const vio = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting && !reduce) v.play().catch(() => {}); else if (!v.controls) v.pause();
}), { threshold: .35 });
document.querySelectorAll('video[loop]').forEach(v => vio.observe(v));

// Entrances: heading, then text, then picture, staggered; content stays visible without script
const rio = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
}), { threshold: .15 });
document.querySelectorAll('section').forEach(sec => {
  sec.querySelectorAll(':scope h2:not(.sr), :scope .auto-head p, .ver-text p, .more-list li, .about-lead, .about dl div, .flow, .auto-video, .ver-frame, .hero-copy, .hero-links, .contact h2')
    .forEach((el, i) => { el.classList.add('rise'); el.style.setProperty('--d', `${Math.min(i, 6) * 80}ms`); rio.observe(el); });
});
// demo replays when it first comes into view
new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { replay(); o.disconnect(); } }, { threshold: .4 }).observe(demo);
