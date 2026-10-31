/* ==========================================================================
   Demo 01  Web Developer  ·  demos/01-web-developer/js/demo.js

   Behaviour unique to this demo. Loads AFTER core/js/core.js, so window.RP
   is available. Nothing here touches the core or any other demo.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Contribution grid
     Builds 53 weeks x 7 days of activity cells. Values are deterministic
     (seeded), so the graph looks the same on every load and in every
     screenshot  no random flicker between captures.
     ------------------------------------------------------------------ */

  function buildContributionGrid() {
    var grid = document.getElementById('contrib-grid');
    if (!grid) return;

    var WEEKS = 53;
    var DAYS = 7;
    var seed = 20240419; // fixed seed = reproducible graph

    function next() {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    }

    var frag = document.createDocumentFragment();

    for (var w = 0; w < WEEKS; w++) {
      for (var d = 0; d < DAYS; d++) {
        var v = next();

        // Fridays are the Iranian weekend  noticeably quieter.
        if (d === 6) v *= 0.35;

        var level = v > 0.86 ? 4 : v > 0.66 ? 3 : v > 0.42 ? 2 : v > 0.2 ? 1 : 0;

        var cell = document.createElement('i');
        cell.setAttribute('data-level', String(level));
        frag.appendChild(cell);
      }
    }

    grid.appendChild(frag);

    // Start the graph at the most recent week (the inline-end edge in RTL).
    grid.scrollLeft = grid.scrollWidth;
  }

  /* ------------------------------------------------------------------
     Hero code panel  cycle the endpoint in the last line.
     Only the argument is retyped, never the whole line, so the panel is
     never caught looking empty (including in marketing screenshots).
     Purely decorative; skipped entirely for reduced-motion visitors.
     ------------------------------------------------------------------ */

  function animateCodeCaret() {
    if (!window.RP || window.RP.prefersReducedMotion()) return;

    /* Only this one span is rewritten, so the surrounding syntax
       highlighting in the markup stays intact. */
    var slot = document.querySelector('.wd-endpoint');
    if (!slot) return;

    var words = ['posts', 'orders', 'invoices', 'users'];
    var w = 0;                    // which word
    var chars = words[0].length;  // how much of it is typed
    var erasing = false;
    var typing = false;

    function render() {
      slot.textContent = words[w].slice(0, chars);
    }

    function tick() {
      if (!typing) return;

      if (erasing) {
        chars--;
        if (chars === 0) {
          erasing = false;
          w = (w + 1) % words.length;
        }
      } else {
        chars++;
        if (chars === words[w].length) erasing = true;
      }

      render();
      // Pause on the complete word; type quickly, erase quicker.
      setTimeout(tick, erasing && chars === words[w].length ? 2200 : erasing ? 45 : 90);
    }

    // Only animate while the panel is actually on screen.
    if (!('IntersectionObserver' in window)) return;

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !typing) {
          typing = true;
          tick();
        } else if (!entry.isIntersecting) {
          typing = false;
        }
      });
    }, { threshold: 0.35 }).observe(slot.closest('.wd-code'));
  }

  function init() {
    buildContributionGrid();
    animateCodeCaret();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
