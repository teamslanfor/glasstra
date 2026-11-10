/* Glasstra Group — site interactions (no dependencies) */
(function () {
  'use strict';
  const doc = document.documentElement;
  doc.classList.add('js');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Preloader (first visit in a session only) ---------- */
  let seen = false;
  try { seen = sessionStorage.getItem('jc-loaded') === '1'; sessionStorage.setItem('jc-loaded', '1'); } catch (e) { seen = true; }
  if (false && !seen && !reduced) { // preloader disabled for the professional template
    const pl = document.createElement('div');
    pl.className = 'preloader';
    pl.setAttribute('aria-hidden', 'true');
    pl.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.5c.6 4.9 2.6 7.9 9 10.5-6.4 2.6-8.4 5.6-9 10.5-.6-4.9-2.6-7.9-9-10.5 6.4-2.6 8.4-5.6 9-10.5z"/></svg>';
    document.body.prepend(pl);
    const done = () => { pl.classList.add('done'); setTimeout(() => pl.remove(), 600); };
    if (document.readyState === 'complete') setTimeout(done, 350);
    else window.addEventListener('load', () => setTimeout(done, 250));
    setTimeout(done, 2500); // never block longer than this
  }

  /* ---------- Sticky header ---------- */
  const onScroll = () => document.body.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  const toggle = $('.nav-toggle');
  if (toggle) {
    const setOpen = (open) => {
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('nav-open')));
    $$('.nav-links a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 960) setOpen(false); });
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else revealEls.forEach((el) => el.classList.add('in'));

  /* ---------- Animated counters ---------- */
  const counters = $$('[data-count]');
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (reduced) { el.innerHTML = target + (suffix ? `<sup>${suffix}</sup>` : ''); return; }
    const dur = 1800; const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = Math.round(target * eased) + (suffix ? `<sup>${suffix}</sup>` : '');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { runCounter(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.5 });
    counters.forEach((c) => co.observe(c));
  } else counters.forEach(runCounter);

  /* ---------- Testimonial slider ---------- */
  $$('.testi-wrap').forEach((wrap) => {
    const track = $('.testi-track', wrap);
    const step = () => { const card = $('.testi', track); return card ? card.getBoundingClientRect().width + 24 : 300; };
    $('.prev', wrap)?.addEventListener('click', () => track.scrollBy({ left: -step() }));
    $('.next', wrap)?.addEventListener('click', () => {
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 8) track.scrollTo({ left: 0 });
      else track.scrollBy({ left: step() });
    });
  });

  /* ---------- Services: Learn more toggles + chip active state ---------- */
  $$('[data-toggle-details]').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('open', open);
      $('.lbl', btn).textContent = open ? 'Show less' : 'Learn more';
    });
  });
  // Open details automatically when arriving at /services/#id
  if (location.hash) {
    const row = document.getElementById(location.hash.slice(1));
    const btn = row && $('[data-toggle-details]', row);
    if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click();
  }

  /* ---------- Portfolio filters ---------- */
  const filterBtns = $$('[data-filter]');
  filterBtns.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    filterBtns.forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    $$('.g-item').forEach((it) => {
      it.classList.toggle('is-hidden', f !== 'all' && it.dataset.cat !== f);
      // replay the tile entrance animation on each filter change
      it.classList.toggle('is-filtering', false); void it.offsetWidth; it.classList.toggle('is-filtering', true);
    });
  }));

  /* ---------- Button click ripple ---------- */
  if (!reduced) {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const dot = document.createElement('span');
      dot.className = 'ripple';
      dot.style.width = dot.style.height = size + 'px';
      dot.style.left = (e.clientX ? e.clientX - r.left : r.width / 2) - size / 2 + 'px';
      dot.style.top = (e.clientY ? e.clientY - r.top : r.height / 2) - size / 2 + 'px';
      btn.appendChild(dot);
      setTimeout(() => { if (dot.parentNode) dot.parentNode.removeChild(dot); }, 650);
    });
  }

  /* ---------- Service quick-link tabs: highlight the section in view ---------- */
  const jumpLinks = $$('.svc-jump a');
  if (jumpLinks.length && 'IntersectionObserver' in window) {
    const setActive = (id) => jumpLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    const so = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    jumpLinks.forEach((a) => { const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) so.observe(t); });
  }

  /* ---------- Lightbox ---------- */
  const items = $$('.g-item');
  if (items.length) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = `<button class="lb-close" aria-label="Close"><svg class="i"><use href="#i-close"/></svg></button>
      <button class="lb-prev" aria-label="Previous image"><svg class="i"><use href="#i-arrow"/></svg></button>
      <figure><img alt=""><figcaption></figcaption></figure>
      <button class="lb-next" aria-label="Next image"><svg class="i"><use href="#i-arrow"/></svg></button>`;
    document.body.appendChild(lb);
    const img = $('img', lb); const cap = $('figcaption', lb);
    let idx = 0; let lastFocus = null;
    const visible = () => items.filter((i) => !i.classList.contains('is-hidden'));
    const show = (i) => {
      const list = visible(); idx = (i + list.length) % list.length;
      const src = $('img', list[idx]);
      img.src = src.currentSrc || src.src; img.alt = src.alt; cap.textContent = list[idx].dataset.caption || src.alt;
    };
    const open = (el) => { lastFocus = document.activeElement; show(visible().indexOf(el)); lb.classList.add('open'); $('.lb-close', lb).focus(); };
    const close = () => { lb.classList.remove('open'); lastFocus && lastFocus.focus(); };
    items.forEach((it) => it.addEventListener('click', () => open(it)));
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', () => show(idx - 1));
    $('.lb-next', lb).addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---------- Before / after slider ---------- */
  $$('.before-after').forEach((ba) => {
    const r = $('input', ba);
    const set = () => ba.style.setProperty('--pos', r.value + '%');
    r.addEventListener('input', set); set();
  });

  /* ---------- Open-now badge ---------- */
  const openBadge = $('[data-open-now]');
  if (openBadge && window.SITE.openTo == null) openBadge.remove();
  else if (openBadge) {
    // Hours in UK time, from site config (open every day)
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
    const day = parts.find((p) => p.type === 'weekday').value;
    const hour = parseInt(parts.find((p) => p.type === 'hour').value, 10);
    const isOpen = Boolean(day) && hour >= window.SITE.openFrom && hour < window.SITE.openTo;
    openBadge.textContent = isOpen ? (window.SITE.openTo - window.SITE.openFrom >= 24 ? 'Open 24 hours – get in touch any time' : 'Open now – give us a phone') : `Closed now – back at ${window.SITE.openFromLabel}`;
    openBadge.classList.toggle('is-open', isOpen);
  }

  /* ---------- Prefill service on contact form via ?service= ---------- */
  const params = new URLSearchParams(location.search);
  const svcSelect = $('#service');
  if (svcSelect && params.get('service')) {
    const opt = $$('option', svcSelect).find((o) => o.value === params.get('service'));
    if (opt) svcSelect.value = opt.value;
  }

  /* ---------- Contact form: validation + submission ---------- */
  const form = $('#quote-form');
  if (form) {
    const status = $('.form-status', form);
    const btn = $('button[type="submit"]', form);
    if (!window.SITE.formEndpoint) {
      const note = $('[data-form-note]', form);
      if (note) note.textContent = 'When you press send, WhatsApp opens with your request filled in, ready to send to us. We only use your details to reply.';
      $('span:not(.spinner):not(.btn-label-icon)', btn).textContent = 'Send via WhatsApp';
    }
    const rules = {
      name: (v) => v.trim().length >= 2 || 'Please enter your name.',
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
      // US numbers: 10 digits, optionally with a leading 1 / +1, in any common format: (512) 555-0123, 512-555-0123, +1 512 555 0123
      phone: (v) => { const d = v.replace(/\D/g, ''); return (/^[\d\s().+-]+$/.test(v.trim()) && (d.length === 10 || (d.length === 11 && d[0] === '1'))) || 'Please enter a valid US phone number, e.g. (512) 555-0123.'; },
      message: (v) => v.trim().length >= 10 || 'Please tell us a little more (at least 10 characters).',
    };
    const check = (input) => {
      const rule = rules[input.name]; if (!rule) return true;
      const res = rule(input.value); const field = input.closest('.field');
      field.classList.toggle('invalid', res !== true);
      $('.err', field).textContent = res === true ? '' : res;
      input.setAttribute('aria-invalid', String(res !== true));
      return res === true;
    };
    Object.keys(rules).forEach((n) => {
      const input = form.elements[n];
      input.addEventListener('blur', () => check(input));
      input.addEventListener('input', () => { if (input.closest('.field').classList.contains('invalid')) check(input); });
    });
    const showStatus = (ok, html) => { status.className = 'form-status show ' + (ok ? 'ok' : 'bad'); status.innerHTML = html; };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const results = Object.keys(rules).map((n) => check(form.elements[n]));
      if (results.includes(false)) {
        const first = $('.field.invalid input, .field.invalid textarea', form); first && first.focus();
        showStatus(false, 'Please fix the highlighted fields and try again.');
        return;
      }
      if (form.elements._honey.value) return; // bot
      btn.disabled = true; form.classList.add('is-loading');
      const data = Object.fromEntries(new FormData(form).entries());
      delete data._honey;
      try {
        const svcName = data.service ? ($(`#service option[value="${data.service}"]`) || {}).textContent : '';
        const result = await window.SiteSubmit(Object.assign({ _subject: `New quote request from ${data.name} – website`, source: `Quote form on the ${location.pathname === '/' ? 'Home' : location.pathname.replace(/\//g, '')} page` }, data, { service: svcName || 'Not sure yet' }));
        const first = escapeHtml(data.name.split(' ')[0]);
        if (result.via === 'whatsapp') {
          showStatus(true, `<strong>Nearly done, ${first}!</strong>&nbsp;WhatsApp has opened with your request filled in. Just tap <strong>Send</strong>. Didn’t open? <a href="${result.url}" target="_blank" rel="noopener">Open WhatsApp</a>, <a href="${result.sms}">send it as a text</a> or call <a href="${window.SITE.phoneHref}">${window.SITE.phone}</a>.`);
        } else {
          form.reset();
          showStatus(true, `<strong>Thank you, ${first}!</strong>&nbsp;Your request has been sent. We’ll be in touch shortly. For anything urgent, call <a href="${window.SITE.phoneHref}">${window.SITE.phone}</a>.`);
        }
      } catch (err) {
        console.warn('Form submission failed:', err);
        const body = encodeURIComponent(`Name: ${data.name}\nPhone: ${data.phone}\nService: ${data.service || '-'}\n\n${data.message}`);
        const mail = window.SITE.email ? `<a href="mailto:${window.SITE.email}?subject=Quote%20request&body=${body}">email us directly</a>, ` : '';
        const wa = window.SITE.whatsappNumber ? `<a href="https://wa.me/${window.SITE.whatsappNumber}?text=${body}" target="_blank" rel="noopener">WhatsApp us</a>, ` : '';
        showStatus(false, `Sorry, we couldn’t send your message just now. Please ${mail}${wa}or call <a href="${window.SITE.phoneHref}">${window.SITE.phone}</a>.`);
      } finally {
        btn.disabled = false; form.classList.remove('is-loading');
      }
    });
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  window.escapeHtml = escapeHtml;
})();

/**
 * Shared submit helper used by the contact form and the chatbot lead capture.
 *  - If a business email is configured (site.config.js → email), posts to FormSubmit (formsubmit.co),
 *    which emails the submission to that inbox. Returns { via: 'email' }.
 *  - Otherwise opens WhatsApp to the business number with the inquiry pre-filled (the visitor taps Send).
 *    Returns { via: 'whatsapp', url, sms }.
 */
window.SiteWhatsAppLink = function (payload) {
    const lines = [`New cleaning quote request (${payload.source || 'website'})`, `Name: ${payload.name}`];
    if (payload.email) lines.push(`Email: ${payload.email}`);
    if (payload.phone) lines.push(`Phone: ${payload.phone}`);
    if (payload.service) lines.push(`Service: ${payload.service}`);
    lines.push('', payload.message || '');
    const text = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${window.SITE.whatsappNumber}?text=${text}`;
    const sms = `sms:${window.SITE.phoneHref.replace('tel:', '')}?&body=${text}`;
    return { url, sms };
};
window.SiteSubmit = async function (payload) {
  if (!window.SITE.formEndpoint) {
    const link = window.SiteWhatsAppLink(payload);
    window.open(link.url, '_blank', 'noopener');
    return Object.assign({ via: 'whatsapp' }, link);
  }
  const res = await fetch(window.SITE.formEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(Object.assign({ _template: 'table', _captcha: 'false' }, payload)),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || String(json.success) === 'false') throw new Error(json.message || 'Form service error ' + res.status);
  return Object.assign({ via: 'email' }, json);
};
