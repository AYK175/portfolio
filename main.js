/* ═══════════════════════════════════════════════════════════════
   Portfolio main.js — Abdullah Yousaf Khan
   Animated counters · Scroll reveal · Nav · Canvas particles
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── 1. Nav scroll solidify ──────────────────────────────────── */
const navHeader = document.getElementById('navHeader');
window.addEventListener('scroll', () => {
  navHeader.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── 2. Hamburger / mobile menu ──────────────────────────────── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(isOpen));
});
document.querySelectorAll('.mobile-link').forEach(l =>
  l.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  })
);

/* ── 3. Active nav link on scroll ────────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const link = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (link) link.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => sectionObserver.observe(s));

/* ── 4. Scroll-reveal animation ──────────────────────────────── */
const revealEls = document.querySelectorAll('.reveal, .tl-item, .proj-card, .other-card, .contact-card, .skill-card, .section-title, .section-label, .about-text, .edu-item');

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger siblings slightly
      const delay = (entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('visible'), Number(delay));
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach((el, i) => {
  if (!el.classList.contains('reveal')) el.classList.add('reveal');
  // Stagger cards in grids
  const parent = el.parentElement;
  if (parent) {
    const siblings = [...parent.children].filter(c => c.classList.contains(el.classList[0]));
    const idx = siblings.indexOf(el);
    if (idx > 0) el.dataset.delay = idx * 80;
  }
  revealObserver.observe(el);
});

/* ── 5. Animated number counters ─────────────────────────────── */
function animateCounter(el) {
  const target    = parseFloat(el.dataset.target);
  const prefix    = el.dataset.prefix || '';
  const suffix    = el.dataset.suffix || '';
  const isDecimal = !Number.isInteger(target);
  const duration  = 1600; // ms
  const startTime = performance.now();

  function update(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = target * eased;

    el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.round(current)) + suffix;

    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = prefix + (isDecimal ? target.toFixed(1) : target) + suffix;
  }
  requestAnimationFrame(update);
}

const counterEls = document.querySelectorAll('[data-target]');
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
counterEls.forEach(el => counterObserver.observe(el));

/* ── 6. Hero canvas — particle field ─────────────────────────── */
(function initCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');

  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeParticles() {
    const count = Math.min(Math.floor((W * H) / 18000), 80);
    particles = Array.from({ length: count }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
      r:  Math.random() * 1.5 + .4,
      a:  Math.random(),
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(34,211,238,${p.a * .55})`;
      ctx.fill();
    });

    // Draw lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(34,211,238,${(1 - dist / 130) * .12})`;
          ctx.lineWidth = .6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  resize();
  makeParticles();
  draw();
  window.addEventListener('resize', () => { resize(); makeParticles(); }, { passive: true });
})();

/* ── 7. Smooth hover glow on project cards ───────────────────── */
document.querySelectorAll('.proj-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect   = card.getBoundingClientRect();
    const x      = ((e.clientX - rect.left) / rect.width)  * 100;
    const y      = ((e.clientY - rect.top)  / rect.height) * 100;
    const glow   = card.querySelector('.proj-card-glow');
    if (glow) {
      glow.style.background = `radial-gradient(ellipse at ${x}% ${y}%, rgba(34,211,238,.1) 0%, transparent 65%)`;
    }
  });
});
