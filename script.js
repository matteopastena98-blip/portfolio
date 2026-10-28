// Demo: replays the real run (counts and timing from 1 Sept 2026) and simulates failures.
document.documentElement.classList.add('js');

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
const stages = [...document.querySelectorAll('#stages li')];
const log = $('log'), kpi = $('kpi'), kpiL = $('kpi-l'), status = $('status');
const recName = $('rec-name'), recFields = [...document.querySelectorAll('#rec-fields li')], verdict = $('verdict');
const playBtn = $('play'), breakBtn = $('break');

let token = 0;
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

function line(text, cls) {
  const li = document.createElement('li');
  if (cls) li.className = cls;
  const t = document.createElement('time');
  t.textContent = text[0];
  li.append(t, text[1]);
  log.append(li);
  while (log.children.length > 7) log.firstElementChild.remove();
}
function setStatus(text, cls) { status.textContent = text; status.className = 'status' + (cls ? ' ' + cls : ''); }
function count(to) {
  const from = +kpi.textContent || 0;
  if (reduce) { kpi.textContent = to; return; }
  const t0 = performance.now();
  const tick = now => {
    const k = Math.min(1, (now - t0) / 500);
    kpi.textContent = Math.round(from + (to - from) * (1 - (1 - k) ** 3));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function record(name, states, v, vcls) {
  recName.textContent = name;
  recFields.forEach((f, i) => { f.className = states[i] || ''; });
  verdict.textContent = v;
  verdict.className = 'verdict' + (vcls ? ' ' + vcls : '');
}
function lock(on) { playBtn.disabled = on; breakBtn.disabled = on; }

async function play() {
  const my = ++token; lock(true);
  log.replaceChildren(); kpi.textContent = '0'; kpiL.textContent = 'companies still in the run';
  stages.forEach(s => (s.className = 'pending'));
  record('studio-esempio.it', [], 'Waiting', '');
  setStatus('Running', 'running');
  for (let i = 0; i < stages.length; i++) {
    if (my !== token) return;
    stages[i].className = 'active';
    await wait(650);
    stages[i].className = 'done';
    count(+stages[i].dataset.n);
    line([`${i + 1}/8`, stages[i].dataset.log]);
    // the example record moves through its checks with the run
    const passed = Math.min(6, Math.max(0, i - 1));
    record('studio-esempio.it', Array(passed).fill('ok'), i < 7 ? 'In progress' : 'Delivered', i < 7 ? '' : 'ok');
  }
  await wait(500);
  if (my !== token) return;
  record('officina-esempio.it', ['ok', 'ok', 'bad'], 'Dropped: no VAT number in the snapshot. Not guessed.', 'bad');
  line(['gate', 'officina-esempio.it dropped at the VAT gate (reason logged)'], 'warn');
  setStatus('Finished · 48 delivered');
  line(['done', 'First run of this pipeline: about 27 machine minutes']);
  lock(false);
}

async function fail() {
  const my = ++token; lock(true);
  setStatus('Running', 'running');
  stages.forEach((s, i) => (s.className = i < 3 ? 'done' : i === 3 ? 'active' : 'pending'));
  kpi.textContent = '127';
  record('negozio-esempio.it', ['ok', 'ok'], 'Waiting for the site', '');
  line(['4/8', 'Snapshot: 429 Too Many Requests'], 'warn');
  await wait(900); if (my !== token) return;
  line(['4/8', 'Backoff 30 s, then retry'], 'warn');
  await wait(900); if (my !== token) return;
  line(['4/8', 'Retry OK · snapshot saved · row flushed to disk']);
  await wait(900); if (my !== token) return;
  line(['4/8', '15 blocks in a row, no data returned'], 'err');
  await wait(800); if (my !== token) return;
  stages[3].className = 'failed';
  setStatus('Stopped by circuit breaker', 'error');
  line(['stop', 'Circuit breaker: run stopped, nothing invented'], 'err');
  await wait(900); if (my !== token) return;
  line(['next', 'Resume later from the last saved row']);
  record('negozio-esempio.it', ['ok', 'ok'], 'Paused, resumes from last saved row', '');
  lock(false);
}

playBtn.addEventListener('click', play);
breakBtn.addEventListener('click', fail);
document.querySelectorAll('[data-break]').forEach(a => a.addEventListener('click', () => setTimeout(fail, reduce ? 0 : 500)));
document.querySelectorAll('[data-play]').forEach(a => a.addEventListener('click', () => setTimeout(play, reduce ? 0 : 500)));

// play once when the demo first comes into view
let seen = false;
new IntersectionObserver(([e], o) => {
  if (e.isIntersecting && !seen) { seen = true; o.disconnect(); if (!reduce) play(); }
}, { threshold: 0.4 }).observe($('demo'));

// staggered entrances, once per element
const riseIo = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const sibs = [...e.target.parentElement.querySelectorAll(':scope > [data-rise]')];
    e.target.style.transitionDelay = `${Math.max(0, sibs.indexOf(e.target)) * 70}ms`;
    e.target.classList.add('is-in');
    riseIo.unobserve(e.target);
  });
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('[data-rise]').forEach(el => riseIo.observe(el));
