/**
 * PowerSense — Premium Landing Page JavaScript
 * Version: 1.0.0
 * Features:
 *   - Particle canvas animation (hero)
 *   - Scroll-triggered reveal animations
 *   - Animated stat counters
 *   - Sticky navbar + active section tracking
 *   - Mobile menu toggle
 *   - Interactive ROI chart (Canvas)
 *   - Flow step auto-cycle animation
 *   - Contact form validation + submission
 *   - Smooth scroll
 *   - Back-to-top button
 *   - Parallax effects
 */

'use strict';

/* ============================================
   1. UTILITY HELPERS
   ============================================ */

/**
 * Query selector shorthand
 * @param {string} selector
 * @param {Document|Element} ctx
 */
const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/**
 * Clamp a value between min and max
 */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/**
 * Ease-out cubic
 */
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

/**
 * Debounce function
 */
const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

/* ============================================
   2. PARTICLE CANVAS (Hero Background)
   ============================================ */

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 60;
        this.animFrame = null;
        this.mouse = { x: -1000, y: -1000 };

        this.resize();
        this.initParticles();
        this.bindEvents();
        this.animate();
    }

    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    /** Create a single particle with randomised properties */
    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 2.5 + 0.5,
            speedX: (Math.random() - 0.5) * 0.4,
            speedY: (Math.random() - 0.5) * 0.4,
            opacity: Math.random() * 0.5 + 0.1,
            // colour cycles between cyan and green
            hue: Math.random() > 0.5 ? 186 : 160,   // cyan ≈ 186°, green ≈ 160°
            pulse: Math.random() * Math.PI * 2,       // phase offset for pulsing
            pulseSpeed: 0.02 + Math.random() * 0.02,
        };
    }

    initParticles() {
        this.particles = Array.from({ length: this.particleCount }, () => this.createParticle());
    }

    /** Draw connecting lines between nearby particles */
    drawLines() {
        const { ctx, particles } = this;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    const alpha = (1 - dist / 120) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(34,211,238,${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    animate() {
        const { ctx, canvas, particles, mouse } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.drawLines();

        for (const p of particles) {
            // Pulse opacity
            p.pulse += p.pulseSpeed;
            const opacityMod = Math.sin(p.pulse) * 0.15;

            // Mouse repulsion
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                const force = (100 - dist) / 100 * 0.6;
                p.x += (dx / dist) * force;
                p.y += (dy / dist) * force;
            }

            // Move
            p.x += p.speedX;
            p.y += p.speedY;

            // Wrap around edges
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            const finalAlpha = clamp(p.opacity + opacityMod, 0.05, 0.7);
            ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${finalAlpha})`;
            ctx.fill();
        }

        this.animFrame = requestAnimationFrame(() => this.animate());
    }

    bindEvents() {
        window.addEventListener('resize', debounce(() => {
            this.resize();
            this.initParticles();
        }, 300));

        this.canvas.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.x = -1000;
            this.mouse.y = -1000;
        });
    }

    destroy() {
        cancelAnimationFrame(this.animFrame);
        window.removeEventListener('resize', this.resize);
    }
}

/* ============================================
   3. SCROLL REVEAL
   ============================================ */

class ScrollReveal {
    constructor() {
        this.elements = $$('[data-reveal]');
        this.observer = new IntersectionObserver(
            entries => entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    this.observer.unobserve(entry.target);
                }
            }),
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );
        this.elements.forEach(el => this.observer.observe(el));
    }
}

/* ============================================
   4. ANIMATED COUNTERS
   ============================================ */

class CounterAnimation {
    constructor() {
        this.counters = $$('.stat-number');
        this.started = new Set();
        this.observer = new IntersectionObserver(
            entries => entries.forEach(entry => {
                if (entry.isIntersecting && !this.started.has(entry.target)) {
                    this.started.add(entry.target);
                    this.animateCounter(entry.target);
                }
            }),
            { threshold: 0.5 }
        );
        this.counters.forEach(el => this.observer.observe(el));
    }

    animateCounter(el) {
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const duration = 2000; // ms
        const start = performance.now();

        const tick = (now) => {
            const elapsed = now - start;
            const progress = clamp(elapsed / duration, 0, 1);
            const eased = easeOutCubic(progress);
            const current = target * eased;

            // Format nicely
            let display;
            if (target >= 100) {
                display = Math.round(current).toLocaleString();
            } else if (target >= 10) {
                display = Math.round(current * 10) / 10;
            } else {
                display = Math.round(current * 10) / 10;
            }

            el.textContent = prefix + display + suffix;

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                // Ensure final exact value
                el.textContent = prefix + target + suffix;
            }
        };

        requestAnimationFrame(tick);
    }
}

/* ============================================
   5. NAVBAR — Scroll + Active Section
   ============================================ */

class Navbar {
    constructor() {
        this.navbar = $('#navbar');
        this.links = $$('.nav-link');
        this.hamburger = $('#hamburger');
        this.mobileMenu = $('#mobile-menu');
        this.mobileLinks = $$('.mobile-link');
        this.backToTop = $('#backToTop');
        this.sections = $$('section[id], .hero[id]');

        this.bindEvents();
        this.onScroll();
    }

    bindEvents() {
        window.addEventListener('scroll', () => this.onScroll(), { passive: true });

        this.hamburger.addEventListener('click', () => this.toggleMobile());

        this.mobileLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMobile());
        });

        // Also close on any mobile menu btn-primary click
        $$('.mobile-menu .btn-primary').forEach(btn => {
            btn.addEventListener('click', () => this.closeMobile());
        });

        this.backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Smooth scroll for all anchor links
        $$('a[href^="#"]').forEach(link => {
            link.addEventListener('click', e => {
                const target = $(link.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    const offset = 80; // navbar height
                    const top = target.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
            });
        });
    }

    onScroll() {
        const scrollY = window.scrollY;

        // Sticky bg
        this.navbar.classList.toggle('scrolled', scrollY > 50);

        // Back-to-top button
        this.backToTop.classList.toggle('visible', scrollY > 400);

        // Active nav link
        let current = '';
        this.sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (scrollY >= sectionTop) {
                current = section.id;
            }
        });
        this.links.forEach(link => {
            link.classList.toggle('active', link.dataset.section === current);
        });
    }

    toggleMobile() {
        const isOpen = this.mobileMenu.classList.toggle('open');
        this.hamburger.classList.toggle('open', isOpen);
        this.hamburger.setAttribute('aria-expanded', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    closeMobile() {
        this.mobileMenu.classList.remove('open');
        this.hamburger.classList.remove('open');
        this.hamburger.setAttribute('aria-expanded', false);
        document.body.style.overflow = '';
    }
}

/* ============================================
   6. ROI CHART (Canvas-based)
   ============================================ */

class ROIChart {
    constructor() {
        this.canvas = $('#roiChart');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.animated = false;
        this.animProgress = 0;
        this.animFrame = null;

        // ROI data — 36 months
        this.investment = 6000;
        this.monthlyGain = 600;
        this.months = Array.from({ length: 37 }, (_, i) => i); // 0..36

        this.observer = new IntersectionObserver(
            entries => entries.forEach(entry => {
                if (entry.isIntersecting && !this.animated) {
                    this.animated = true;
                    this.startAnimation();
                }
            }),
            { threshold: 0.3 }
        );
        this.observer.observe(this.canvas.parentElement);

        window.addEventListener('resize', debounce(() => this.drawChart(1), 200));
    }

    /** Net balance each month: savings - investment */
    getBalance(month) {
        return this.monthlyGain * month - this.investment;
    }

    startAnimation() {
        const duration = 1800;
        const start = performance.now();
        const tick = (now) => {
            const progress = clamp((now - start) / duration, 0, 1);
            this.drawChart(easeOutCubic(progress));
            if (progress < 1) {
                this.animFrame = requestAnimationFrame(tick);
            }
        };
        requestAnimationFrame(tick);
    }

    drawChart(progress) {
        const canvas = this.canvas;
        const ctx = this.ctx;

        // Resize canvas to actual CSS size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width || 600;
        canvas.height = rect.height || 280;

        const W = canvas.width;
        const H = canvas.height;
        const pad = { top: 24, right: 24, bottom: 40, left: 60 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        const maxMonths = Math.floor(this.months.length * progress);
        const balances = this.months.slice(0, maxMonths + 1).map(m => this.getBalance(m));
        const minY = Math.min(...balances, -this.investment * 1.1);
        const maxY = Math.max(...balances, this.monthlyGain * 36 * 0.3);

        const mapX = m => pad.left + (m / 36) * chartW;
        const mapY = v => pad.top + chartH - ((v - minY) / (maxY - minY)) * chartH;

        // -- Zero line --
        const zeroY = mapY(0);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pad.left, zeroY);
        ctx.lineTo(W - pad.right, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);

        // -- Horizontal grid lines --
        const gridCount = 4;
        for (let i = 0; i <= gridCount; i++) {
            const v = minY + (maxY - minY) * (i / gridCount);
            const y = mapY(v);
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();

            // Y axis label
            const label = v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${Math.round(v)}`;
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(label, pad.left - 8, y + 4);
        }

        // -- X axis labels --
        const xLabels = [0, 6, 10, 12, 18, 24, 30, 36];
        xLabels.forEach(m => {
            if (m <= maxMonths) {
                ctx.fillStyle = m === 10 ? 'rgba(16,185,129,0.8)' : 'rgba(255,255,255,0.25)';
                ctx.font = m === 10 ? 'bold 10px Inter, sans-serif' : '10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`M${m}`, mapX(m), H - pad.bottom + 18);
            }
        });

        // -- Filled area below savings line --
        if (maxMonths > 0) {
            ctx.beginPath();
            ctx.moveTo(mapX(0), mapY(this.getBalance(0)));
            for (let i = 1; i <= maxMonths; i++) {
                ctx.lineTo(mapX(i), mapY(this.getBalance(i)));
            }
            ctx.lineTo(mapX(maxMonths), H - pad.bottom);
            ctx.lineTo(mapX(0), H - pad.bottom);
            ctx.closePath();

            // gradient fill
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, 'rgba(16,185,129,0.3)');
            grad.addColorStop(0.5, 'rgba(34,211,238,0.1)');
            grad.addColorStop(1, 'rgba(16,185,129,0)');
            ctx.fillStyle = grad;
            ctx.fill();
        }

        // -- Investment horizontal line (static) --
        ctx.strokeStyle = 'rgba(239,68,68,0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pad.left, mapY(-this.investment));
        ctx.lineTo(W - pad.right, mapY(-this.investment));
        ctx.stroke();
        ctx.setLineDash([]);

        // Investment label
        ctx.fillStyle = 'rgba(239,68,68,0.7)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Investment ₹6,000', W - pad.right - 4, mapY(-this.investment) - 6);

        // -- Savings line (animated) --
        if (maxMonths > 0) {
            ctx.beginPath();
            ctx.moveTo(mapX(0), mapY(this.getBalance(0)));
            for (let i = 1; i <= maxMonths; i++) {
                ctx.lineTo(mapX(i), mapY(this.getBalance(i)));
            }
            const lineGrad = ctx.createLinearGradient(pad.left, 0, W - pad.right, 0);
            lineGrad.addColorStop(0, '#22d3ee');
            lineGrad.addColorStop(1, '#10b981');
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.stroke();
        }

        // -- Break-even marker (month 10) --
        const breakEvenMonth = 10;
        if (maxMonths >= breakEvenMonth) {
            const bx = mapX(breakEvenMonth);
            const by = mapY(0);

            // Dashed vertical line
            ctx.strokeStyle = 'rgba(16,185,129,0.6)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(bx, pad.top);
            ctx.lineTo(bx, by);
            ctx.stroke();
            ctx.setLineDash([]);

            // Point circle
            ctx.beginPath();
            ctx.arc(bx, by, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            ctx.strokeStyle = 'rgba(16,185,129,0.4)';
            ctx.lineWidth = 8;
            ctx.stroke();
            ctx.lineWidth = 1;

            // Label
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Break-even!', bx, pad.top + 14);
        }

        // -- Current end point dot --
        if (maxMonths > 0) {
            const ex = mapX(maxMonths);
            const ey = mapY(this.getBalance(maxMonths));
            ctx.beginPath();
            ctx.arc(ex, ey, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#22d3ee';
            ctx.fill();
        }

        // -- Axes --
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top);
        ctx.lineTo(pad.left, H - pad.bottom);
        ctx.lineTo(W - pad.right, H - pad.bottom);
        ctx.stroke();
    }
}

/* ============================================
   7. FLOW STEP AUTO-CYCLE
   ============================================ */

class FlowAnimator {
    constructor() {
        this.steps = $$('.flow-step');
        this.current = 0;
        this.interval = null;

        if (this.steps.length === 0) return;

        // Start when solution section is visible
        const observer = new IntersectionObserver(
            entries => entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.start();
                } else {
                    this.stop();
                }
            }),
            { threshold: 0.3 }
        );

        const solutionSection = $('#solution');
        if (solutionSection) observer.observe(solutionSection);
    }

    start() {
        this.interval = setInterval(() => {
            this.steps[this.current].classList.remove('active');
            this.current = (this.current + 1) % this.steps.length;
            this.steps[this.current].classList.add('active');
        }, 1800);
    }

    stop() {
        clearInterval(this.interval);
    }
}

/* ============================================
   8. CONTACT FORM
   ============================================ */

class ContactForm {
    constructor() {
        this.form = $('#contactForm');
        this.submitBtn = $('#submit-btn');
        this.successMsg = $('#form-success');
        if (!this.form) return;
        this.bindEvents();
    }

    validate() {
        let valid = true;

        const fields = [
            { id: 'name', label: 'Name', minLen: 2 },
            { id: 'email', label: 'Email', type: 'email' },
            { id: 'school', label: 'School', minLen: 3 },
        ];

        fields.forEach(({ id, label, type, minLen }) => {
            const input = $(`#${id}`, this.form);
            const error = $(`#${id}-error`, this.form);
            if (!input || !error) return;

            input.classList.remove('error');
            error.textContent = '';

            const val = input.value.trim();
            if (!val) {
                error.textContent = `${label} is required.`;
                input.classList.add('error');
                valid = false;
            } else if (type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(val)) {
                    error.textContent = 'Please enter a valid email address.';
                    input.classList.add('error');
                    valid = false;
                }
            } else if (minLen && val.length < minLen) {
                error.textContent = `${label} must be at least ${minLen} characters.`;
                input.classList.add('error');
                valid = false;
            }
        });

        return valid;
    }

    bindEvents() {
        this.form.addEventListener('submit', async e => {
            e.preventDefault();
            if (!this.validate()) return;

            // Simulate async submission
            this.submitBtn.classList.add('loading');
            this.submitBtn.disabled = true;

            await new Promise(resolve => setTimeout(resolve, 1800));

            this.submitBtn.classList.remove('loading');
            this.submitBtn.disabled = false;
            this.successMsg.classList.add('visible');
            this.form.reset();

            // Hide after 6s
            setTimeout(() => this.successMsg.classList.remove('visible'), 6000);
        });

        // Live input error clearing
        $$('.form-input', this.form).forEach(input => {
            input.addEventListener('input', () => {
                input.classList.remove('error');
                const error = $(`#${input.id}-error`, this.form);
                if (error) error.textContent = '';
            });
        });
    }
}

/* ============================================
   9. PARALLAX (hero orbs)
   ============================================ */

class ParallaxEffect {
    constructor() {
        this.orbs = $$('.orb');
        this.hero = $('.hero');
        if (!this.hero || !this.orbs.length) return;

        window.addEventListener('mousemove', e => this.onMouseMove(e), { passive: true });
    }

    onMouseMove(e) {
        const { innerWidth: W, innerHeight: H } = window;
        const cx = (e.clientX / W - 0.5) * 2;  // -1 to 1
        const cy = (e.clientY / H - 0.5) * 2;

        this.orbs.forEach((orb, i) => {
            const intensity = (i + 1) * 12;
            const tx = cx * intensity;
            const ty = cy * intensity;
            orb.style.transform = `translate(${tx}px, ${ty}px)`;
        });
    }
}

/* ============================================
   10. DEVICE 3D TILT (hero device)
   ============================================ */

class DeviceTilt {
    constructor() {
        this.device = $('#device3d');
        if (!this.device) return;
        this.bindEvents();
    }

    bindEvents() {
        const heroVisual = $('.hero-visual');
        if (!heroVisual) return;

        heroVisual.addEventListener('mousemove', e => {
            const rect = heroVisual.getBoundingClientRect();
            const cx = (e.clientX - rect.left) / rect.width - 0.5;
            const cy = (e.clientY - rect.top) / rect.height - 0.5;
            const rotX = cy * 10;
            const rotY = -cx * 10;
            this.device.style.transform =
                `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px)`;
        });

        heroVisual.addEventListener('mouseleave', () => {
            this.device.style.transform = '';
        });
    }
}

/* ============================================
   11. FEATURE CARD RIPPLE
   ============================================ */

class FeatureRipple {
    constructor() {
        $$('.feature-card').forEach(card => {
            card.addEventListener('click', e => this.createRipple(e, card));
        });
    }

    createRipple(e, card) {
        const existing = card.querySelector('.ripple');
        if (existing) existing.remove();

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 2;

        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        Object.assign(ripple.style, {
            position: 'absolute',
            left: `${x - size / 2}px`,
            top: `${y - size / 2}px`,
            width: `${size}px`,
            height: `${size}px`,
            background: 'rgba(34,211,238,0.08)',
            borderRadius: '50%',
            transform: 'scale(0)',
            animation: 'rippleAnim 0.6s ease-out forwards',
            pointerEvents: 'none',
            zIndex: 0,
        });
        card.style.position = 'relative';
        card.style.overflow = 'hidden';
        card.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
    }
}

// Inject ripple keyframes
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes rippleAnim {
    from { transform: scale(0); opacity: 1; }
    to   { transform: scale(1); opacity: 0; }
  }
  .form-input.error {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 4px rgba(239,68,68,0.08) !important;
  }
`;
document.head.appendChild(rippleStyle);

/* ============================================
   12. SECTION TRANSITION GRADIENTS
   ============================================ */

class SectionObserver {
    constructor() {
        // Add subtle entrance transitions to market + testimonial cards
        const cards = $$('.market-card, .testimonial-card');
        const obs = new IntersectionObserver(
            entries => entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    entry.target.style.transitionDelay = `${i * 60}ms`;
                    entry.target.classList.add('revealed');
                    obs.unobserve(entry.target);
                }
            }),
            { threshold: 0.1 }
        );
        cards.forEach(card => obs.observe(card));
    }
}

/* ============================================
   13. INITIALISATION
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // Particles
    const canvas = $('#particleCanvas');
    if (canvas) {
        new ParticleSystem(canvas);
    }

    // Core systems
    new ScrollReveal();
    new CounterAnimation();
    new Navbar();
    new ROIChart();
    new FlowAnimator();
    new ContactForm();
    new ParallaxEffect();
    new DeviceTilt();
    new FeatureRipple();
    new SectionObserver();

    // Add data-reveal to market & testimonial cards
    $$('.market-card, .testimonial-card, .impact-stat-card').forEach((card, i) => {
        card.setAttribute('data-reveal', 'fade-up');
        card.setAttribute('data-delay', String((i % 4) * 100));
    });

    // Animate stat items
    $$('.stat-item').forEach((el, i) => {
        el.setAttribute('data-reveal', 'fade-up');
        el.setAttribute('data-delay', String(i * 100));
    });

    // Flow steps initial active
    const firstStep = $('#flow-step-1');
    if (firstStep) firstStep.classList.add('active');

    // Console easter egg
    console.log(
        '%cPowerSense ⚡',
        'font-size:24px;font-weight:900;background:linear-gradient(135deg,#22d3ee,#10b981);-webkit-background-clip:text;-webkit-text-fill-color:transparent;'
    );
    console.log('%cEvery Classroom. Zero Energy Waste.', 'color:#64748b;font-size:13px;');

});

/* ============================================
   14. PERFORMANCE — Pause animations on
       tab visibility change
   ============================================ */
document.addEventListener('visibilitychange', () => {
    // Reduce CPU when tab is hidden
    const canvas = $('#particleCanvas');
    if (canvas) {
        canvas.style.opacity = document.hidden ? '0' : '1';
    }
});
