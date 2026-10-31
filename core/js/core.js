/* ==========================================================================
   Bavarsa Portfolio  core/js/core.js
   Shared behaviour for every demo. Vanilla JS, zero dependencies, ~9 KB.

   ARCHITECTURE RULES
   1. No demo-specific code, ever. Demos hook in with data-attributes.
   2. Every module is opt-in: if its hook is absent from the page it is a
      silent no-op, so a demo only pays for what it uses.
   3. Nothing here writes global CSS or mutates another module's state.
   4. Load with `defer`. A demo's own js/demo.js loads after this file and
      can rely on RP.* being available.

   HOOKS
   [data-rp-theme-toggle]   button   toggles + persists light/dark
   [data-rp-nav-toggle]     button   opens the mobile drawer (aria-controls)
   [data-rp-header]         element  gets .is-stuck after scrolling
   [data-rp-reveal]         any      fades/slides in when scrolled into view
   [data-rp-scrollspy]      nav      highlights the link of the visible section
   [data-rp-counter]        element  animates a number up to data-rp-counter
   [data-rp-skill]          element  fills a .rp-skill-fill to data-rp-skill
   [data-rp-filter]         wrapper  portfolio category filtering
   [data-rp-slider]         wrapper  scroll-snap slider dots + arrows
   [data-rp-accordion]      wrapper  single/multi open accordion
   [data-rp-form]           form     client-side validation + status message
   [data-rp-to-top]         button   smooth scroll to top, auto show/hide
   [data-rp-year]           element  writes the current year (Persian digits)
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Small helpers
     ------------------------------------------------------------------ */

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /** True when the visitor asked the OS to reduce motion. */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Convert Latin digits in a string to Persian digits (۰-۹). */
  function toFa(value) {
    var fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(value).replace(/\d/g, function (d) { return fa[d]; });
  }

  /** Run fn on the next frame, throttled to one call per frame. */
  function rafThrottle(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        fn();
      });
    };
  }

  /* ==================================================================
     1. Theme (light / dark)
     The initial value is applied by an inline <head> script in each demo
     so the page never flashes the wrong theme. This module only handles
     the toggle button and keeps the OS preference in sync.
     ================================================================== */

  var THEME_KEY = 'rp-theme';

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    $$('[data-rp-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
      btn.setAttribute('aria-label', theme === 'dark' ? 'حالت روشن' : 'حالت تاریک');
    });
  }

  function initTheme() {
    var toggles = $$('[data-rp-theme-toggle]');
    applyTheme(currentTheme());

    toggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode */ }
      });
    });

    // Follow the OS only while the visitor has not made an explicit choice.
    // A dark-first demo declares <html data-theme-default="dark"> so switching
    // the OS back to light does not fight the design the demo ships with.
    var fallback = document.documentElement.getAttribute('data-theme-default') || 'light';
    var media = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) {
      var stored = null;
      try { stored = localStorage.getItem(THEME_KEY); } catch (err) { /* ignore */ }
      if (!stored) applyTheme(e.matches ? 'dark' : fallback);
    };
    if (media.addEventListener) media.addEventListener('change', onChange);
  }

  /* ==================================================================
     2. Sticky header shadow
     ================================================================== */

  function initHeader() {
    var header = $('[data-rp-header]');
    if (!header) return;

    var update = rafThrottle(function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    });

    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ==================================================================
     3. Mobile navigation drawer
     Adds a backdrop, locks body scroll, traps Tab inside the drawer and
     closes on Escape, backdrop click or link click.
     ================================================================== */

  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function initNav() {
    var toggle = $('[data-rp-nav-toggle]');
    if (!toggle) return;

    var nav = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!nav) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'rp-drawer-backdrop';
    document.body.appendChild(backdrop);

    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      nav.classList.add('is-open');
      backdrop.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      var first = $(FOCUSABLE, nav);
      if (first) first.focus();
    }

    function close() {
      nav.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    function isOpen() {
      return nav.classList.contains('is-open');
    }

    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', function () { isOpen() ? close() : open(); });
    backdrop.addEventListener('click', close);

    // Any in-page link should close the drawer before scrolling.
    $$('a[href^="#"]', nav).forEach(function (link) {
      link.addEventListener('click', function () { if (isOpen()) close(); });
    });

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;

      if (e.key === 'Escape') {
        close();
        return;
      }

      // Focus trap: keep Tab cycling inside the open drawer.
      if (e.key === 'Tab') {
        var items = $$(FOCUSABLE, nav).filter(function (el) { return el.offsetParent !== null; });
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Returning to desktop width must never leave the page scroll-locked.
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (e) {
      if (e.matches && isOpen()) close();
    });
  }

  /* ==================================================================
     4. Scroll reveal
     ================================================================== */

  function initReveal() {
    var items = $$('[data-rp-reveal]');
    if (!items.length) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // data-rp-reveal="150" staggers this element by 150ms.
        var delay = parseInt(entry.target.getAttribute('data-rp-reveal'), 10);
        if (delay) entry.target.style.setProperty('--rp-reveal-delay', delay + 'ms');
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ==================================================================
     5. Scrollspy  highlights the nav link of the section in view
     ================================================================== */

  function initScrollspy() {
    var nav = $('[data-rp-scrollspy]');
    if (!nav || !('IntersectionObserver' in window)) return;

    var links = $$('a[href^="#"]', nav);
    var map = {};
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = id && document.getElementById(id);
      if (!section) return;
      map[id] = link;
      sections.push(section);
    });

    if (!sections.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-active'); });
        var active = map[entry.target.id];
        if (active) active.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ==================================================================
     6. Counters  animate a number when it scrolls into view
     ================================================================== */

  function initCounters() {
    var items = $$('[data-rp-counter]');
    if (!items.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-rp-counter')) || 0;
      var faDigits = el.getAttribute('data-rp-counter-latin') !== 'true';

      if (prefersReducedMotion()) {
        el.textContent = faDigits ? toFa(target) : String(target);
        return;
      }

      var duration = 1400;
      var start = performance.now();

      function frame(now) {
        var p = Math.min((now - start) / duration, 1);
        // easeOutExpo  fast then settles.
        var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        var value = Math.round(target * eased);
        el.textContent = faDigits ? toFa(value) : String(value);
        if (p < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) {
      items.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ==================================================================
     7. Skill bars
     ================================================================== */

  function initSkills() {
    var bars = $$('[data-rp-skill]');
    if (!bars.length) return;

    function fill(el) {
      el.style.setProperty('--rp-skill-value', el.getAttribute('data-rp-skill') + '%');
      el.classList.add('is-filled');
    }

    if (!('IntersectionObserver' in window)) {
      bars.forEach(fill);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        fill(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    bars.forEach(function (el) { io.observe(el); });
  }

  /* ==================================================================
     8. Portfolio filter
     Markup: [data-rp-filter] wraps .rp-filter buttons (data-filter="web")
     and items carrying data-category="web design".
     ================================================================== */

  function initFilters() {
    $$('[data-rp-filter]').forEach(function (root) {
      var buttons = $$('.rp-filter', root);
      var items = $$('[data-category]', root);
      if (!buttons.length || !items.length) return;

      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var value = btn.getAttribute('data-filter') || 'all';

          buttons.forEach(function (b) {
            var on = b === btn;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-pressed', String(on));
          });

          items.forEach(function (item) {
            var cats = (item.getAttribute('data-category') || '').split(/\s+/);
            var show = value === 'all' || cats.indexOf(value) !== -1;
            item.classList.toggle('is-hidden', !show);
          });
        });
      });
    });
  }

  /* ==================================================================
     9. Slider  dots + arrows over a CSS scroll-snap track
     ================================================================== */

  function initSliders() {
    $$('[data-rp-slider]').forEach(function (root) {
      var track = $('.rp-slider-track', root);
      if (!track) return;

      var slides = Array.prototype.slice.call(track.children);
      var dotsWrap = $('.rp-slider-dots', root);
      var prev = $('[data-rp-slider-prev]', root);
      var next = $('[data-rp-slider-next]', root);
      if (!slides.length) return;

      var dots = [];

      if (dotsWrap) {
        slides.forEach(function (slide, i) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'rp-dot';
          dot.setAttribute('aria-label', 'اسلاید ' + toFa(i + 1));
          dot.addEventListener('click', function () { goTo(i); });
          dotsWrap.appendChild(dot);
          dots.push(dot);
        });
      }

      /* Offsets are measured from live rects rather than offsetLeft: RTL
         scroll coordinates differ between engines, but rect deltas do not. */
      function offsetOf(slide) {
        return slide.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
      }

      function goTo(index) {
        var slide = slides[Math.max(0, Math.min(index, slides.length - 1))];
        if (slide) track.scrollTo({ left: offsetOf(slide), behavior: 'smooth' });
      }

      /** Index of the slide currently closest to the track's start edge. */
      function activeIndex() {
        var best = 0;
        var min = Infinity;
        slides.forEach(function (slide, i) {
          var delta = Math.abs(offsetOf(slide) - track.scrollLeft);
          if (delta < min) { min = delta; best = i; }
        });
        return best;
      }

      var sync = rafThrottle(function () {
        var i = activeIndex();
        dots.forEach(function (d, di) { d.classList.toggle('is-active', di === i); });
        if (prev) prev.disabled = i === 0;
        if (next) next.disabled = i === slides.length - 1;
      });

      if (prev) prev.addEventListener('click', function () { goTo(activeIndex() - 1); });
      if (next) next.addEventListener('click', function () { goTo(activeIndex() + 1); });
      track.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', sync);
      sync();
    });
  }

  /* ==================================================================
     10. Accordion
     data-rp-accordion="multi" allows several panels open at once.
     ================================================================== */

  function initAccordions() {
    $$('[data-rp-accordion]').forEach(function (root) {
      var multi = root.getAttribute('data-rp-accordion') === 'multi';
      var triggers = $$('.rp-accordion-trigger', root);

      triggers.forEach(function (trigger) {
        var item = trigger.closest('.rp-accordion-item');
        var panel = $('.rp-accordion-panel', item);
        var open = item.classList.contains('is-open');

        trigger.setAttribute('aria-expanded', String(open));
        if (panel && panel.id) trigger.setAttribute('aria-controls', panel.id);

        trigger.addEventListener('click', function () {
          var willOpen = !item.classList.contains('is-open');

          if (!multi) {
            $$('.rp-accordion-item', root).forEach(function (other) {
              if (other === item) return;
              other.classList.remove('is-open');
              var t = $('.rp-accordion-trigger', other);
              if (t) t.setAttribute('aria-expanded', 'false');
            });
          }

          item.classList.toggle('is-open', willOpen);
          trigger.setAttribute('aria-expanded', String(willOpen));
        });
      });
    });
  }

  /* ==================================================================
     11. Contact form validation
     Front-end only  there is no backend in a static template. Replace
     the fake submit below with your own fetch() call. See README.
     ================================================================== */

  var MESSAGES = {
    required: 'این فیلد الزامی است.',
    email: 'ایمیل معتبر نیست.',
    tel: 'شماره تماس معتبر نیست.',
    minlength: 'متن واردشده کوتاه است.'
  };

  function validateField(field) {
    var wrap = field.closest('.rp-field');
    var errorEl = wrap ? $('.rp-field-error', wrap) : null;
    var value = field.value.trim();
    var error = '';

    if (field.required && !value) {
      error = MESSAGES.required;
    } else if (value && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      error = MESSAGES.email;
    } else if (value && field.type === 'tel' && !/^[۰-۹0-9+\-\s()]{8,}$/.test(value)) {
      error = MESSAGES.tel;
    } else if (value && field.minLength > 0 && value.length < field.minLength) {
      error = MESSAGES.minlength;
    }

    if (wrap) wrap.classList.toggle('is-invalid', Boolean(error));
    if (errorEl) errorEl.textContent = error;
    field.setAttribute('aria-invalid', String(Boolean(error)));

    return !error;
  }

  function initForms() {
    $$('[data-rp-form]').forEach(function (form) {
      var fields = $$('input, textarea, select', form).filter(function (f) {
        return f.type !== 'submit' && f.type !== 'hidden';
      });
      var status = $('.rp-form-status', form);

      // Validate on blur, then live-correct once the field has been touched.
      fields.forEach(function (field) {
        field.addEventListener('blur', function () { validateField(field); });
        field.addEventListener('input', function () {
          var wrap = field.closest('.rp-field');
          if (wrap && wrap.classList.contains('is-invalid')) validateField(field);
        });
      });

      form.addEventListener('submit', function (e) {
      //  e.preventDefault();

        var valid = true;
        fields.forEach(function (field) {
          if (!validateField(field)) valid = false;
        });

        if (!valid) {
          if (status) {
            status.className = 'rp-form-status rp-form-status--error';
            status.textContent = 'لطفاً خطاهای فرم را برطرف کنید.';
          }
          var firstInvalid = $('.rp-field.is-invalid input, .rp-field.is-invalid textarea', form);
          if (firstInvalid) firstInvalid.focus();
          return;
        }

        // --- Replace this block with a real submit ---------------------
        var submitBtn = $('[type="submit"]', form);
        if (submitBtn) submitBtn.disabled = true;

        if (status) {
          status.className = 'rp-form-status';
          status.textContent = 'در حال ارسال…';
}

form.submit();
        // ---------------------------------------------------------------
      });
    });
  }

  /* ==================================================================
     12. Back to top
     ================================================================== */

  function initToTop() {
    var btn = $('[data-rp-to-top]');
    if (!btn) return;

    var update = rafThrottle(function () {
      btn.classList.toggle('is-visible', window.scrollY > 600);
    });

    update();
    window.addEventListener('scroll', update, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
  }

  /* ==================================================================
     13. Current year (Persian calendar-agnostic  Gregorian year in FA digits)
     Set data-rp-year="jalali" to print the Jalali year instead.
     ================================================================== */

  function initYear() {
    $$('[data-rp-year]').forEach(function (el) {
      var mode = el.getAttribute('data-rp-year');
      var year;

      if (mode === 'jalali') {
        // Intl gives the Jalali year without shipping a date library.
        year = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(new Date());
        el.textContent = year;
      } else {
        el.textContent = toFa(new Date().getFullYear());
      }
    });
  }

  /* ==================================================================
     Boot
     ================================================================== */

  function init() {
    initTheme();
    initHeader();
    initNav();
    initReveal();
    initScrollspy();
    initCounters();
    initSkills();
    initFilters();
    initSliders();
    initAccordions();
    initForms();
    initToTop();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Public surface  a demo's js/demo.js may reuse these helpers. */
  window.RP = {
    $: $,
    $$: $$,
    toFa: toFa,
    rafThrottle: rafThrottle,
    prefersReducedMotion: prefersReducedMotion,
    applyTheme: applyTheme
  };
})();
