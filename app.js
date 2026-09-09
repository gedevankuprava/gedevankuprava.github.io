(function(){
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- nav: transparent over the ground, solid once anything scrolls under it ---- */
  var top = document.querySelector('.top');
  if (top) {
    var solid = function(){ top.classList.toggle('solid', (window.pageYOffset || 0) > 40); };
    solid();
    addEventListener('scroll', solid, { passive: true });
  }

  /* ---- showreel: the file has no audio track, so there is nothing to unmute ---- */
  var reel = document.getElementById('reel');
  if (reel) {
    var p = reel.play();
    if (p && p.catch) { p.catch(function(){ reel.setAttribute('controls',''); }); }
    reel.addEventListener('click', function(){
      if (reel.paused) { reel.play().catch(function(){}); } else { reel.pause(); }
    });
  }


  /* ---- e-mail: one click copies it. His note 2026-09-04 — a mailto: opens whatever the
         machine thinks is a mail client, which on most recruiters' machines is nothing at
         all. The href stays a real mailto so middle-click, right-click and keyboard-open
         still work; the click handler just gets there first. ---- */
  Array.prototype.forEach.call(document.querySelectorAll('a[href^="mailto:"]'), function(a){
    var original = a.textContent, revert = null;
    a.addEventListener('click', function(ev){
      var addr = a.getAttribute('href').replace(/^mailto:/, '');
      var done = function(){
        clearTimeout(revert);
        a.textContent = 'Copied';
        a.classList.add('copied');
        revert = setTimeout(function(){
          a.textContent = original;
          a.classList.remove('copied');
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        ev.preventDefault();
        navigator.clipboard.writeText(addr).then(done).catch(function(){
          location.href = a.getAttribute('href');       /* clipboard refused — fall back */
        });
        return;
      }
      var t = document.createElement('textarea');       /* older browsers */
      t.value = addr; t.setAttribute('readonly', '');
      t.style.position = 'absolute'; t.style.left = '-9999px';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); ev.preventDefault(); done(); } catch (e) {}
      document.body.removeChild(t);
    });
  });

  /* ---- double-click a film: a copy of it opens centred at 80% of the viewport.
         Rewritten 2026-09-08 — the first version physically moved the <video> out of its row
         and put a comment placeholder in its place. The row is a flex layout, so pulling one
         child out re-flowed everything beside it and the page jumped. Nothing moves now: the
         original stays where it is and merely pauses; the lightbox builds its own element on
         the same file and starts at the same timestamp. ---- */
  (function(){
    var back = null, live = null, src = null;

    var close = function(){
      if (!back) return;
      back.classList.remove('on');
      if (live) { live.pause(); live.remove(); live = null; }
      document.documentElement.style.overflow = '';
      src = null;
    };

    var open = function(v){
      if (back && back.classList.contains('on')) { close(); return; }
      if (!back) {
        back = document.createElement('div');
        back.className = 'lb';
        back.innerHTML = '<div class="lbin"></div>';
        // Anything that is not the film itself closes it — the dark ground, and the strip of
        // box either side of the picture. His note 2026-09-08: clicking beside the video should
        // shut it, and the 80% box leaves a visible margin there that used to swallow the click.
        back.addEventListener('click', function(e){
          if (e.target.tagName !== 'VIDEO') close();
        });
        document.body.appendChild(back);
      }
      v.pause();
      src = v;
      live = document.createElement('video');
      live.src = v.currentSrc || v.src;
      live.controls = true;
      live.playsInline = true;
      live.loop = v.loop;
      // muted like the one on the page: an unmuted video started from script is blocked by
      // autoplay policy and just sits there paused. controls are on, so sound is one click away.
      live.muted = true;
      live.addEventListener('loadedmetadata', function(){
        try { live.currentTime = v.currentTime || 0; } catch (e) {}
        live.play().catch(function(){});
      });
      var box = back.firstChild;
      box.style.aspectRatio = (v.videoWidth || 16) + '/' + (v.videoHeight || 9);
      box.innerHTML = '';
      box.appendChild(live);
      back.classList.add('on');
      document.documentElement.style.overflow = 'hidden';
      live.play().catch(function(){});      // fires too if metadata was already cached
    };

    addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
    Array.prototype.forEach.call(document.querySelectorAll('video'), function(v){
      v.addEventListener('dblclick', function(e){ e.preventDefault(); open(v); });
    });
  })();

  /* ---- grid videos: mouse, keyboard and touch all reach them ---- */
  Array.prototype.forEach.call(document.querySelectorAll('.it.vid video'), function(v){
    var on = function(){
      var q = v.play();
      if (q && q.then) { q.then(function(){ v.parentElement.classList.add('playing'); })
                          .catch(function(){}); }
    };
    var off = function(){ v.pause(); v.currentTime = 0;
                          v.parentElement.classList.remove('playing'); };
    v.addEventListener('mouseenter', on);
    v.addEventListener('mouseleave', off);
    v.addEventListener('focus', on);
    v.addEventListener('blur', off);
    v.addEventListener('click', function(){ v.paused ? on() : off(); });
    v.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); v.paused ? on() : off(); }
    });
  });

  /* ---- entrance: staggered, eased, skipped under reduced-motion ---- */
  var items = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  var show = function(el){ el.classList.add('in'); };
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(show);
    return;
  }
  /* Anything already on screen is shown at once, and a cheap poll backs the observer up.
     Observer callbacks and scroll events are both throttled or dropped in a backgrounded or
     embedded tab, and work must never be left invisible because of it. Stops on its own. */
  /* "has this element's top ever reached the fold", not "is it on screen right now".
     A fast flick on a phone, a jump to an anchor and a restored scroll position can all carry
     an element from below the fold to above it between two frames. An IntersectionObserver
     samples at delivery time, so it never sees that element intersect, and a sweep that only
     looks at what is currently on screen will not rescue it either — it is already past. The
     element then stays at opacity 0 for the life of the page. top < innerHeight is true both
     for what is on screen and for everything already scrolled by, and still false for anything
     below the fold, so nothing is revealed early. */
  var reached = function(el){ return el.getBoundingClientRect().top < innerHeight; };
  var sweep = function(){
    items.forEach(function(el){
      if (!el.classList.contains('in') && reached(el)) show(el);
    });
  };
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en, i){
      if (!en.isIntersecting) return;
      var el = en.target;
      setTimeout(function(){ show(el); }, i * 70);
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
  items.forEach(function(el){ io.observe(el); });
  sweep();
  addEventListener('load', sweep);
  var poll = setInterval(function(){
    sweep();
    if (items.every(function(el){ return el.classList.contains('in'); })) clearInterval(poll);
  }, 250);
})();
