/* ═══════════════════════════════════
   AL-HASNA GROUP  —  script.js
═══════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── Navbar scroll ── */
  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    var b = document.getElementById('backTop');
    if (b) b.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  /* ── Smooth scroll nav links ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var h = this.getAttribute('href');
      if (h === '#') return;
      e.preventDefault();
      var t = document.querySelector(h);
      if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 110, behavior: 'smooth' });
      var nm = document.getElementById('navMenu');
      if (nm) nm.classList.remove('open');
    });
  });

  /* ── Mobile menu ── */
  window.toggleMenu = function () {
    document.getElementById('navMenu').classList.toggle('open');
    document.getElementById('hamburger').classList.toggle('active');
  };
  document.addEventListener('click', function (e) {
    var nm = document.getElementById('navMenu'), hb = document.getElementById('hamburger');
    if (nm && nm.classList.contains('open') && !nm.contains(e.target) && !hb.contains(e.target)) {
      nm.classList.remove('open'); hb.classList.remove('active');
    }
  });
  var hs = document.createElement('style');
  hs.textContent = '.nav-hamburger.active span:nth-child(1){transform:translateY(6.5px) rotate(45deg)}.nav-hamburger.active span:nth-child(2){opacity:0}.nav-hamburger.active span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}.nav-hamburger span{transition:transform .3s,opacity .3s;transform-origin:center}';
  document.head.appendChild(hs);

  /* ── Back to top ── */
  window.goToTop = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };

  /* Back-to-top: show after 400px scroll, fade in/out */
  var backBtn = document.getElementById('backTop');
  if (backBtn) {
    window.addEventListener('scroll', function () {
      if (window.pageYOffset > 400) {
        backBtn.classList.add('btt-visible');
      } else {
        backBtn.classList.remove('btt-visible');
      }
    }, { passive: true });
  }

  /* ── Marquee ── */
  var tape = document.querySelector('.intro-tape');
  if (tape) tape.textContent = (tape.textContent + ' ').repeat(8);

  /* ── Parallax ── */
  window.addEventListener('scroll', function () {
    var h = document.querySelector('#intro .intro-headline');
    if (h && window.pageYOffset < window.innerHeight)
      h.style.transform = 'translateY(' + (window.pageYOffset * 0.08) + 'px)';
  }, { passive: true });


  /* ── Scroll reveal (services only now — brands handled separately) ── */
  [{ p: '.services-grid', c: '.service-card' }]
    .forEach(function (x) {
      var par = document.querySelector(x.p);
      if (!par) return;
      par.querySelectorAll(x.c).forEach(function (el, i) {
        el.classList.add('reveal');
        el.style.transitionDelay = (i * 0.07) + 's';
      });
    });
  var allR = Array.from(document.querySelectorAll('.reveal')).filter(function (el) {
    return !el.closest('#team');
  });
  function showEl(el) { el.classList.add('in-view'); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ens) {
      ens.forEach(function (en) { if (en.isIntersecting) { showEl(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    allR.forEach(function (el) {
      var r = el.getBoundingClientRect();
      (r.top < window.innerHeight && r.bottom > 0) ? showEl(el) : io.observe(el);
    });
  } else { allR.forEach(showEl); }
  setTimeout(function () { document.querySelectorAll('.reveal:not(.in-view)').forEach(showEl); }, 2500);
  setTimeout(function () {
    document.querySelectorAll('#intro .reveal').forEach(function (el, i) {
      setTimeout(function () { showEl(el); }, i * 140);
    });
  }, 80);

  /* ── Contact form ── */
  function vf(id, eid, lbl) {
    var f = document.getElementById(id), e = document.getElementById(eid);
    if (!f || !e) return true;
    var v = f.value.trim(); f.classList.remove('error'); e.textContent = '';
    if (!v) { f.classList.add('error'); e.textContent = lbl + ' is required.'; return false; }
    if (id==='cEmail' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { f.classList.add('error'); e.textContent='Valid email required.'; return false; }
    if (id==='cMsg' && v.length<10) { f.classList.add('error'); e.textContent='Message too short.'; return false; }
    return true;
  }
  window.submitForm = function () {
    if (!vf('cName','errName','Name') | !vf('cEmail','errEmail','Email') | !vf('cMsg','errMsg','Message')) return;
    var btn=document.getElementById('submitBtn'), bt=document.getElementById('btnText'), sc=document.getElementById('formSuccess');
    if (bt) bt.textContent='Sending…';
    if (btn){btn.style.pointerEvents='none';btn.style.opacity='0.6';}
    setTimeout(function(){
      ['cName','cEmail','cMsg'].forEach(function(id){var f=document.getElementById(id);if(f)f.value='';});
      if(bt)bt.textContent='Send Message';
      if(btn){btn.style.pointerEvents='';btn.style.opacity='';}
      if(sc){sc.style.display='block';setTimeout(function(){sc.style.display='none';},5000);}
    },1400);
  };
  ['cName','cEmail','cMsg'].forEach(function(id){
    var f=document.getElementById(id); if(!f) return;
    var em={cName:'errName',cEmail:'errEmail',cMsg:'errMsg'}, lm={cName:'Name',cEmail:'Email',cMsg:'Message'};
    f.addEventListener('blur',function(){vf(id,em[id],lm[id]);});
    f.addEventListener('input',function(){if(f.classList.contains('error'))vf(id,em[id],lm[id]);});
  });



  /* ════════════════════════════════════════
     TEAM — FOUNDER + LEADERSHIP SLIDER
  ════════════════════════════════════════ */
  (function () {
    var track   = document.getElementById('ldrTrack');
    var btnNext = document.getElementById('ldrNext');
    var btnPrev = document.getElementById('ldrPrev');
    if (!track) return;

    /* Dynamic scroll step = first card width + gap */
    function getStep() {
      var first = track.querySelector('.ldr-slide');
      if (!first) return 240;
      return first.offsetWidth + 20;
    }

    function updateBtns() {
      if (!btnPrev || !btnNext) return;
      var sl  = track.scrollLeft;
      var max = track.scrollWidth - track.clientWidth;
      btnPrev.classList.toggle('is-off', sl <= 2);
      btnNext.classList.toggle('is-off', sl >= max - 2);
    }

    if (btnNext) btnNext.addEventListener('click', function () {
      track.scrollBy({ left: getStep(), behavior: 'smooth' });
    });
    if (btnPrev) btnPrev.addEventListener('click', function () {
      track.scrollBy({ left: -getStep(), behavior: 'smooth' });
    });

    track.addEventListener('scroll', updateBtns, { passive: true });
    updateBtns();

    /* Mouse drag */
    var dragging = false, startX = 0, startScroll = 0;
    track.addEventListener('mousedown', function (e) {
      dragging = true;
      startX = e.pageX;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      track.scrollLeft = startScroll - (e.pageX - startX);
    });
    window.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
    });

    /* Auto-scroll every 2s — pauses on hover or drag */
    var autoTimer = null;
    var userActive = false;

    function autoNext() {
      if (userActive) return;
      var sl  = track.scrollLeft;
      var max = track.scrollWidth - track.clientWidth;
      if (sl >= max - 2) {
        /* reached end — loop back to start */
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: getStep(), behavior: 'smooth' });
      }
    }

    function startAuto() {
      if (autoTimer) return;
      autoTimer = setInterval(autoNext, 2000);
    }

    function pauseAuto() {
      userActive = true;
      clearInterval(autoTimer);
      autoTimer = null;
      /* resume after 4s of inactivity */
      clearTimeout(window._ldrResume);
      window._ldrResume = setTimeout(function () {
        userActive = false;
        startAuto();
      }, 4000);
    }

    /* Pause on hover */
    var wrap = document.getElementById('ldrSliderWrap');
    if (wrap) {
      wrap.addEventListener('mouseenter', pauseAuto);
      wrap.addEventListener('mouseleave', function () {
        userActive = false;
        startAuto();
      });
    }

    /* Pause on manual button click */
    if (btnNext) btnNext.addEventListener('click', pauseAuto);
    if (btnPrev) btnPrev.addEventListener('click', pauseAuto);

    /* Pause on drag */
    track.addEventListener('mousedown', pauseAuto);
    track.addEventListener('touchstart', pauseAuto, { passive: true });

    /* Start auto after section reveal */
    setTimeout(startAuto, 1200);

    /* Touch drag */
    var touchStartX = 0, touchScrollStart = 0;
    track.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      touchScrollStart = track.scrollLeft;
    }, { passive: true });
    track.addEventListener('touchmove', function (e) {
      track.scrollLeft = touchScrollStart - (e.touches[0].clientX - touchStartX);
    }, { passive: true });

    /* Scroll reveal for slides */
    var slides = Array.prototype.slice.call(track.querySelectorAll('.ldr-slide'));
    var teamRevealed = false;
    function revealTeam() {
      if (teamRevealed) return;
      var section = document.getElementById('team');
      if (!section) return;
      if (section.getBoundingClientRect().top > window.innerHeight * 0.92) return;
      teamRevealed = true;
      slides.forEach(function (sl, i) {
        setTimeout(function () { sl.classList.add('in-view'); }, i * 80 + 200);
      });
    }
    revealTeam();
    window.addEventListener('scroll', revealTeam, { passive: true });
    setTimeout(function () {
      if (!teamRevealed) { teamRevealed = true; slides.forEach(function (s) { s.classList.add('in-view'); }); }
    }, 3000);
  })();

}); /* end DOMContentLoaded */

/* ═══════════════════════════════════════════════════════
   HERO CANVAS — CINEMATIC GOLD PARTICLES
   ═══════════════════════════════════════════════════════ */
(function () {
  var canvas = document.getElementById('introCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var particles = [];
  var W, H, CX, CY;

  function resize() {
    W  = canvas.width  = canvas.offsetWidth;
    H  = canvas.height = canvas.offsetHeight;
    CX = W / 2;
    CY = H / 2;
  }

  /* Two particle types: orbital dust + rising embers */
  function Particle(type) {
    this.type = type || (Math.random() > 0.4 ? 'orbit' : 'ember');
    this.reset();
  }

  Particle.prototype.reset = function () {
    if (this.type === 'orbit') {
      /* Spawn in a ring around center — gold orbital dust */
      var angle  = Math.random() * Math.PI * 2;
      var radius = 120 + Math.random() * 200;
      this.x  = CX + Math.cos(angle) * radius;
      this.y  = CY + Math.sin(angle) * radius;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = -(Math.random() * 0.4 + 0.1);
      this.r  = Math.random() * 1.8 + 0.4;
      this.gold = true;
      this.maxLife = Math.random() * 200 + 160;
    } else {
      /* Embers — spawn anywhere, drift slowly */
      this.x  = Math.random() * W;
      this.y  = H + Math.random() * 50;
      this.vx = (Math.random() - 0.5) * 0.15;
      this.vy = -(Math.random() * 0.35 + 0.12);
      this.r  = Math.random() * 1.1 + 0.2;
      this.gold = Math.random() > 0.5;
      this.maxLife = Math.random() * 320 + 200;
    }
    this.life = 0;
    /* Wobble */
    this.wobbleFreq  = Math.random() * 0.04 + 0.01;
    this.wobbleAmp   = Math.random() * 0.8 + 0.2;
    this.wobblePhase = Math.random() * Math.PI * 2;
  };

  Particle.prototype.update = function () {
    this.x  += this.vx + Math.sin(this.life * this.wobbleFreq + this.wobblePhase) * this.wobbleAmp * 0.04;
    this.y  += this.vy;
    this.life++;
    if (this.life > this.maxLife || this.y < -20) this.reset();
  };

  Particle.prototype.draw = function () {
    var p = this.life / this.maxLife;
    var alpha = p < 0.12 ? p / 0.12 : p > 0.72 ? 1 - (p - 0.72) / 0.28 : 1;
    alpha *= this.gold ? 0.65 : 0.22;

    if (this.gold && this.r > 1.2) {
      /* Soft glow for larger gold particles */
      var grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 3);
      grd.addColorStop(0, 'rgba(200,169,110,' + alpha + ')');
      grd.addColorStop(1, 'rgba(200,169,110,0)');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.gold
      ? 'rgba(220,185,120,' + alpha + ')'
      : 'rgba(245,240,232,' + (alpha * 0.7) + ')';
    ctx.fill();
  };

  function init() {
    resize();
    /* Pre-seed particles at various life stages so screen isn't empty */
    for (var i = 0; i < 160; i++) {
      var p = new Particle(i < 90 ? 'orbit' : 'ember');
      p.life = Math.floor(Math.random() * p.maxLife);
      /* Scatter pre-seeded ones across full canvas */
      if (p.type === 'ember') { p.y = Math.random() * H; }
      particles.push(p);
    }
    loop();
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', function () {
    resize();
    particles = [];
    for (var i = 0; i < 160; i++) {
      var p = new Particle(i < 90 ? 'orbit' : 'ember');
      p.life = Math.floor(Math.random() * p.maxLife);
      if (p.type === 'ember') p.y = Math.random() * H;
      particles.push(p);
    }
  });

  if (document.readyState === 'complete') { init(); }
  else { window.addEventListener('load', init); }
})();

/* ═══════════════════════════════════════════════════════
   STATS COUNTER ANIMATION
═══════════════════════════════════════════════════════ */
(function () {
  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'));
    var duration = 1800;
    var start = null;

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var value = Math.floor(easeOutExpo(progress) * target);
      el.textContent = value;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }

    requestAnimationFrame(step);
  }

  /* Trigger when hero-stats becomes visible */
  var stats = document.getElementById('heroStats');
  if (!stats) return;

  var triggered = false;
  function tryTrigger() {
    if (triggered) return;
    var rect = stats.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      triggered = true;
      /* Delay matches the CSS animation delay (2s) */
      setTimeout(function () {
        stats.querySelectorAll('.hst-count').forEach(function (el, i) {
          setTimeout(function () { animateCounter(el); }, i * 150);
        });
      }, 2000);
    }
  }

  window.addEventListener('scroll', tryTrigger, { passive: true });
  tryTrigger();
})();


/* ═══════════════════════════════════════════════════════
   ABOUT SECTION — STAGGERED ENTRANCE + COUNTER
═══════════════════════════════════════════════════════ */
(function () {
  var section = document.getElementById('about');
  if (!section) return;

  var items     = Array.prototype.slice.call(section.querySelectorAll('.ab-anim'));
  var triggered = false;

  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function runCounter(el) {
    var target   = parseInt(el.getAttribute('data-target') || 0);
    var duration = 1600;
    var start    = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      el.textContent = Math.floor(easeOutExpo(p) * target);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  function trigger() {
    if (triggered) return;
    triggered = true;

    items.forEach(function (el) {
      var delay = parseInt(el.getAttribute('data-ab-delay') || 0);
      setTimeout(function () {
        el.classList.add('ab-visible');
        var counter = el.querySelector('[data-target]');
        if (counter) setTimeout(function () { runCounter(counter); }, 200);
      }, delay);
    });
  }

  function checkVisible() {
    var rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) trigger();
  }

  /* Check immediately in case section is already in view */
  checkVisible();

  /* Also listen to scroll */
  window.addEventListener('scroll', checkVisible, { passive: true });

  /* Hard fallback: show everything after 3s no matter what */
  setTimeout(function () {
    if (!triggered) {
      triggered = true;
      items.forEach(function (el) { el.classList.add('ab-visible', 'ab-done'); });
    }
  }, 3000);
})();

/* ═══════════════════════════════════════════════════════
   BRANDS — STAGGERED CARD REVEAL
═══════════════════════════════════════════════════════ */
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.brand-card'));
  if (!cards.length) return;
  var triggered = false;

  function trigger() {
    if (triggered) return;
    var section = document.getElementById('brands');
    if (!section) return;
    var rect = section.getBoundingClientRect();
    if (rect.top > window.innerHeight * 0.88) return;
    triggered = true;

    cards.forEach(function (card, i) {
      var delay = parseInt(card.getAttribute('data-brand-delay') || 0);
      setTimeout(function () {
        card.classList.add('bc-visible');
      }, delay);
    });
  }

  /* Check immediately + on scroll */
  trigger();
  window.addEventListener('scroll', trigger, { passive: true });

  /* Hard fallback */
  setTimeout(function () {
    if (!triggered) {
      triggered = true;
      cards.forEach(function (c) { c.classList.add('bc-visible'); });
    }
  }, 3000);
})();