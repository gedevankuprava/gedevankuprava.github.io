(function(){
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- showreel: autoplay muted + a real, visible unmute ---- */
  var reel = document.getElementById('reel'), snd = document.getElementById('snd');
  if (reel) {
    var p = reel.play();
    if (p && p.catch) { p.catch(function(){ reel.setAttribute('controls',''); }); }
    reel.addEventListener('click', function(){
      if (reel.paused) { reel.play().catch(function(){}); } else { reel.pause(); }
    });
  }
  if (reel && snd) {
    var label = snd.querySelector('.sndt');
    snd.addEventListener('click', function(){
      reel.muted = !reel.muted;
      snd.setAttribute('aria-pressed', String(!reel.muted));
      label.textContent = reel.muted ? 'Sound off' : 'Sound on';
      if (!reel.muted) { reel.play().catch(function(){}); }
    });
  }

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

  /* ---- entrance: staggered, eased, and skipped entirely under reduced-motion ---- */
  var items = document.querySelectorAll('.rv');
  if (reduce || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(items, function(el){ el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en, i){
      if (!en.isIntersecting) return;
      var el = en.target;
      setTimeout(function(){ el.classList.add('in'); }, i * 70);
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  Array.prototype.forEach.call(items, function(el){ io.observe(el); });
})();
