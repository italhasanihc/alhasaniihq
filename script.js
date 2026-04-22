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
      /* Whitelist: only allow simple #id patterns — block CSS selector injection */
      if (!/^#[A-Za-z][\w\-]*$/.test(h)) return;
      e.preventDefault();
      var t = document.getElementById(h.slice(1));
      if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 110, behavior: 'smooth' });
      var nm = document.getElementById('navMenu');
      if (nm) nm.classList.remove('open');
    });
  });

  /* ── Mobile menu ── */
  var hamburgerBtn = document.getElementById('hamburger');
  function toggleMenu() {
    document.getElementById('navMenu').classList.toggle('open');
    hamburgerBtn.classList.toggle('active');
  }
  if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleMenu);
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
  function goToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  var backTopBtn = document.getElementById('backTop');
  if (backTopBtn) backTopBtn.addEventListener('click', goToTop);

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

  /* ── Contact form (FormSubmit — native POST, no fetch) ── */
  function vf(id, eid, lbl) {
    var f = document.getElementById(id), e = document.getElementById(eid);
    if (!f || !e) return true;
    var v = f.value.trim(); f.classList.remove('error'); e.textContent = '';
    if (!v) { f.classList.add('error'); e.textContent = lbl + ' is required.'; return false; }
    if (id==='cEmail' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { f.classList.add('error'); e.textContent='Valid email required.'; return false; }
    if (id==='cMsg' && v.length<10) { f.classList.add('error'); e.textContent='Message too short.'; return false; }
    return true;
  }

  /* Validate on native submit — block submission if invalid, otherwise let FormSubmit handle it */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      var validName  = vf('cName',  'errName',  'Name');
      var validEmail = vf('cEmail', 'errEmail', 'Email');
      var validMsg   = vf('cMsg',   'errMsg',   'Message');
      if (!validName || !validEmail || !validMsg) {
        e.preventDefault();
        return;
      }
      /* Lock the button to prevent double-submit while FormSubmit processes */
      var btn = document.getElementById('submitBtn');
      var bt  = document.getElementById('btnText');
      if (bt)  bt.textContent = 'Sending…';
      if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
    });
  }

  /* Inline blur/input validation (unchanged UX) */
  ['cName','cEmail','cMsg'].forEach(function(id){
    var f=document.getElementById(id); if(!f) return;
    var em={cName:'errName',cEmail:'errEmail',cMsg:'errMsg'}, lm={cName:'Name',cEmail:'Email',cMsg:'Message'};
    f.addEventListener('blur',function(){vf(id,em[id],lm[id]);});
    f.addEventListener('input',function(){if(f.classList.contains('error'))vf(id,em[id],lm[id]);});
  });

  /* Show success banner if returning from FormSubmit with ?sent=1 */
  if (window.location.search.indexOf('sent=1') !== -1) {
    var sc = document.getElementById('formSuccess');
    if (sc) { sc.style.display = 'block'; setTimeout(function(){ sc.style.display = 'none'; }, 8000); }
  }




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

    /* Trigger vertical line */
    var vline = section.querySelector('.about-left-vline');
    if (vline) setTimeout(function () { vline.classList.add('ab-visible-line'); }, 100);

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

/* ═══════════════════════════════════════════════════════
   VISION — COMPACT SCROLL REVEAL
═══════════════════════════════════════════════════════ */
(function () {
  var section = document.getElementById('vision');
  if (!section) return;

  var left  = section.querySelector('.vn-left');
  var right = section.querySelector('.vn-right');
  var triggered = false;

  /* Left is always visible — add class immediately for dash/rule animations */
  if (left) left.classList.add('vn-visible');

  function trigger() {
    if (triggered) return;
    var rect = section.getBoundingClientRect();
    if (rect.top > window.innerHeight * 0.9) return;
    triggered = true;
    if (right) right.classList.add('vn-visible');
  }

  trigger();
  window.addEventListener('scroll', trigger, { passive: true });
  setTimeout(function () {
    if (!triggered) {
      triggered = true;
      if (right) right.classList.add('vn-visible');
    }
  }, 3000);
})();


/* ═══════════════════════════════════════════════════════
   BRAND DETAIL OVERLAY
═══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {

  var BRANDS = {

    homecenter: {
      num: '01', cat: 'Home & Living',
      name: 'Home Center',
      tagline: 'Premium Home Furnishings · Baghdad',
      logo: 'homecenter.png',
      coverBg: 'linear-gradient(135deg, #ede8df 0%, #e6ddd0 60%, #dfd5c4 100%)',
      statement: 'The home is not a backdrop for life — it is life itself. Every piece we carry has been chosen to honour that belief with the same rigour we bring to every other decision.',
      story: 'Home Center was founded on a simple but enduring conviction: that quality in the home is not a luxury, it is a standard. Since its founding in Baghdad, the brand has grown into Iraq\'s most trusted destination for premium home furnishings — a place where every collection is curated with the understanding that the spaces we inhabit shape who we become.\n\nWe do not follow seasonal trends. We curate with permanence in mind. From living rooms to dining tables, from bedroom sanctuaries to the spaces in between, every Home Center piece is chosen to be lived with, improved with time, and passed forward.',
      tags: ['Premium Furnishings', 'Family Living', 'Considered Comfort'],
      pillars: [
        { title: 'Curated Excellence', text: 'Every product passes through a rigorous selection process that considers quality, proportion, durability, and the way it will age over years of daily living.' },
        { title: 'Lifestyle Thinking', text: 'We think beyond individual pieces — in complete rooms, in morning light, in family gatherings. Every item must earn its place within a whole.' },
        { title: 'Enduring Craft', text: 'We partner exclusively with makers who believe that materials should improve with age — who understand the difference between what looks good and what lasts.' },
        { title: 'Personal Guidance', text: 'Our team works with each client to translate ambition into environment — a fully realised living space that feels genuinely, personally right.' }
      ],
      stripeVals: [
        { n: 'Est.', word: '1998' },
        { n: 'Based', word: 'Baghdad' },
        { n: 'Standard', word: 'Premium' },
        { n: 'Focus', word: 'The Home' }
      ],
      followName: 'Home Center',
      followHandle: '@alhasanihomecenter',
      igUrl: 'https://www.instagram.com/alhasanihomecenter'
    },

    inhouse: {
      num: '02', cat: 'Interior Design',
      name: 'In House',
      tagline: 'Space. Structure. Silence.',
      logo: 'inhouse.png',
      coverBg: '#1a1a1a',
      statement: 'Interior design is not decoration — it is architecture. The discipline of space, applied with rigour, restraint, and an understanding that what is left out defines what remains.',
      story: 'In House was founded on a single proposition: that the interior of a space should be as considered as its structure. Not adorned — designed. With a precise understanding of volume, proportion, light, and the exact relationship between objects and the voids that surround them.\n\nEvery In House commission begins with analysis, not aesthetics. We read the space architecturally — its load-bearing logic, its orientation to light, its natural circulation patterns. Only then do we begin. The result is always an interior that feels structurally inevitable: as though the room could not have been resolved any other way.',
      tags: ['Architecture', 'Spatial Design', 'Material Logic'],
      pillars: [
        { title: 'Spatial Analysis', text: 'Every project opens with a forensic reading of the space. Structure, volume, and movement are mapped before a single material decision is made.' },
        { title: 'Material Logic', text: 'Stone. Concrete. Raw timber. Brushed steel. We select materials for their structural honesty — how they read under light, how they age, and what they communicate.' },
        { title: 'Light Engineering', text: 'Light is not an accessory. We design natural and artificial light with the same rigour we apply to structure — it defines the spatial experience entirely.' },
        { title: 'Enduring Resolution', text: 'Our ambition is not currency — it is permanence. Spaces designed to be as precisely correct in thirty years as they are on the day of completion.' }
      ],
      stripeVals: [
        { n: 'Discipline', word: 'Architecture' },
        { n: 'Method', word: 'Analytical' },
        { n: 'Material', word: 'Structural' },
        { n: 'Duration', word: 'Permanent' }
      ],
      followName: 'In House',
      followHandle: '@inhouseiraq',
      igUrl: 'https://www.instagram.com/inhouseiraq'
    },

    veranda: {
      num: '03', cat: 'Outdoor Living',
      name: 'Veranda',
      tagline: 'Outdoor Collections · Garden & Terrace',
      logo: 'veranda.png',
      coverBg: 'linear-gradient(135deg, #e5eae0 0%, #dde5d6 60%, #d4deca 100%)',
      statement: 'The space beyond the walls deserves the same quality of thought as any room. Outdoor living, composed with intention, is its own form of quiet, enduring luxury.',
      story: 'Veranda was created for those who understand that the boundary between inside and outside is a design choice, not a given. The brand draws on the great tradition of the garden as sanctuary — a place of calm, considered beauty where the quality of thought is equal to anything found indoors.\n\nEvery Veranda piece is engineered for the open air while carrying the same refinement and intention as any premium interior collection. We believe that terraces, courtyards, and gardens deserve the same level of design intelligence as living rooms — and that the finest outdoor spaces are not furnished, they are composed.',
      tags: ['Outdoor Furniture', 'Garden Sanctuary', 'Natural Materials'],
      pillars: [
        { title: 'Seasonal Integrity', text: 'Every Veranda piece is engineered to hold its character and quality through every season — without ever compromising on form or refinement.' },
        { title: 'Honest Materials', text: 'We work with teak, rattan, brushed aluminium, and stone — materials that age beautifully and belong naturally in the open environment.' },
        { title: 'Dining as Ceremony', text: 'From intimate tables to generous arrangements for twelve — we believe outdoor dining should feel as considered as any formal interior occasion.' },
        { title: 'Sanctuary Thinking', text: 'We help create outdoor environments that genuinely restore — private, beautifully composed spaces that feel like a true retreat from the world.' }
      ],
      stripeVals: [
        { n: 'Setting', word: 'Outdoors' },
        { n: 'Spirit', word: 'Natural' },
        { n: 'Quality', word: 'Enduring' },
        { n: 'Purpose', word: 'Sanctuary' }
      ],
      followName: 'Veranda',
      followHandle: '@veranda.iq',
      igUrl: 'https://www.instagram.com/veranda.iq'
    },

    clidor: {
      num: '04', cat: 'Fashion',
      name: 'Clidor',
      tagline: 'Contemporary Fashion · Refined Accessories',
      logo: 'clidor.png',
      coverBg: 'linear-gradient(135deg, #eae5dd 0%, #e2dbd1 60%, #d9d1c5 100%)',
      statement: 'Clothing is not performance — it is precision. A quiet, certain expression of discernment. Clidor exists for those who understand the difference between dressing and being dressed.',
      story: 'Clidor stands at the intersection of contemporary fashion and enduring style, built on the belief that the finest garments are those that feel more right with each wearing. Not because they follow trends, but because they were made correctly from the beginning — with the right fabric, the right weight, the right proportion.\n\nEvery Clidor piece begins with a single question: will this still feel exactly right in ten years? That question drives every decision — from the sourcing of materials to the geometry of a silhouette, from the precision of a seam to the considered weight of a closure. We dress those who do not need to announce themselves. Who understand that the finest things speak softly — but are always noticed.',
      tags: ['Contemporary Fashion', 'Premium Accessories', 'Refined Tailoring'],
      pillars: [
        { title: 'Fabric Intelligence', text: 'We source exclusively from mills where natural fibres, precise weights, and honest finishing are treated as non-negotiable standards.' },
        { title: 'Considered Proportion', text: 'Every silhouette is developed to flatter and move well — to feel as precise at the close of a long day as it did at the beginning.' },
        { title: 'Refined Accessories', text: 'Our accessories are designed with the same rigour as our ready-to-wear: minimal, precisely made, and built to become the ones you always reach for.' },
        { title: 'Wardrobe Logic', text: 'We design pieces that work within a coherent language — a complete wardrobe sensibility rather than isolated items competing for attention.' }
      ],
      stripeVals: [
        { n: 'Category', word: 'Fashion' },
        { n: 'Standard', word: 'Premium' },
        { n: 'Tone', word: 'Restrained' },
        { n: 'Duration', word: 'Lasting' }
      ],
      followName: 'Clidor',
      followHandle: '@clidor.iq',
      igUrl: 'https://www.instagram.com/clidor.iq'
    }
  };

  /* ── Security: sanitize user input ── */
  function sanitize(str) {
    return String(str).replace(/[<>"'&]/g, function(c) {
      return { '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":"&#39;", '&':'&amp;' }[c];
    });
  }

  /* ── Security: brand key whitelist ── */
  var BRAND_WHITELIST = { homecenter: 1, inhouse: 1, veranda: 1, clidor: 1 };

  /* ── DOM ── */
  var overlay  = document.getElementById('brandOverlay');
  var veil     = document.getElementById('bovVeil');
  var closeBtn = document.getElementById('bovClose');
  var scroll   = document.getElementById('bovScroll');
  if (!overlay || !scroll) return;

  /* ── Populate ── */
  function populate(key) {
    var d = BRANDS[key];
    if (!d) return;

    function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
    function setStyle(id, p, v) { var el = document.getElementById(id); if (el) el.style[p] = v; }

    /* Nav */
    setText('bovNavBrand', d.name);

    /* Cover */
    setStyle('bovCover', 'background', d.coverBg);
    setText('bovCoverNum',     d.num);
    setText('bovCoverCat',     d.cat);
    setText('bovCoverName',    d.name);
    setText('bovCoverTagline', d.tagline);
    var cl = document.getElementById('bovCoverLogo');
    if (cl) { cl.src = d.logo; cl.alt = d.name; }

    /* Statement */
    setText('bovStatement', d.statement);

    /* Helper: empty a container safely */
    function clearEl(el) { while (el.firstChild) el.removeChild(el.firstChild); }

    /* Story */
    var prose = document.getElementById('bovChapterProse');
    if (prose) {
      clearEl(prose);
      d.story.split('\n\n').forEach(function(p) {
        var el = document.createElement('p');
        el.textContent = p.trim();
        prose.appendChild(el);
      });
    }
    var al = document.getElementById('bovAsideLogo');
    if (al) { al.src = d.logo; al.alt = d.name; }
    var atags = document.getElementById('bovAsideTags');
    if (atags) {
      clearEl(atags);
      d.tags.forEach(function(t) {
        var s = document.createElement('span');
        s.className = 'bov-atag';
        s.textContent = t;
        atags.appendChild(s);
      });
    }

    /* Pillars — built with safe DOM, no innerHTML */
    var pl = document.getElementById('bovPillarsList');
    if (pl) {
      clearEl(pl);
      d.pillars.forEach(function(p, i) {
        var item  = document.createElement('div');
        item.className = 'bov-pillar-item';

        var num   = document.createElement('div');
        num.className = 'bov-pillar-item-n';
        num.textContent = '0' + (i + 1);

        var body  = document.createElement('div');
        body.className = 'bov-pillar-item-body';

        var title = document.createElement('div');
        title.className = 'bov-pillar-item-title';
        title.textContent = p.title;

        var text  = document.createElement('div');
        text.className = 'bov-pillar-item-text';
        text.textContent = p.text;

        body.appendChild(title);
        body.appendChild(text);
        item.appendChild(num);
        item.appendChild(body);
        pl.appendChild(item);
      });
    }

    /* Stripe — safe DOM */
    var stripe = document.getElementById('bovStripe');
    if (stripe) {
      clearEl(stripe);
      d.stripeVals.forEach(function(v) {
        var val  = document.createElement('div');
        val.className = 'bov-stripe-val';

        var n    = document.createElement('div');
        n.className = 'bov-stripe-val-n';
        n.textContent = v.n;

        var word = document.createElement('div');
        word.className = 'bov-stripe-val-word';
        word.textContent = v.word;

        val.appendChild(n);
        val.appendChild(word);
        stripe.appendChild(val);
      });
    }

    /* Follow CTA */
    setText('bovFollowName',   d.followName);
    setText('bovFollowHandle', d.followHandle);

    /* Instagram button — stored URL comes from static BRANDS object, safe */
    var igBtn = document.getElementById('bovIgBtn');
    if (igBtn) {
      /* Remove old listener each time by cloning */
      var newBtn = igBtn.cloneNode(true);
      igBtn.parentNode.replaceChild(newBtn, igBtn);
      newBtn.setAttribute('href', d.igUrl);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.open(d.igUrl, '_blank', 'noopener,noreferrer');
      });
    }

    /* Colophon */
    setText('bovColophonName', d.name);
  }

  /* ── Open / Close ── */
  function openOverlay(key) {
    /* Strict whitelist — reject any key not in BRANDS */
    if (!BRAND_WHITELIST[key]) return;
    populate(key);
    scroll.scrollTop = 0;
    /* Set brand theme on drawer */
    var drawer = document.getElementById('bovDrawer');
    if (drawer) {
      drawer.removeAttribute('data-brand');
      drawer.setAttribute('data-brand', key);
    }
    overlay.classList.add('bov--open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeOverlay() {
    overlay.classList.remove('bov--open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (closeBtn)  closeBtn.addEventListener('click', closeOverlay);
  if (veil)      veil.addEventListener('click', closeOverlay);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('bov--open')) closeOverlay();
  });

  /* ── Card click ── */
  document.querySelectorAll('.brand-card[data-brand]').forEach(function(card) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() {
      /* Only allow whitelisted keys — no DOM injection possible */
      var key = card.getAttribute('data-brand');
      if (key && BRAND_WHITELIST[key]) openOverlay(key);
    });
  });

});