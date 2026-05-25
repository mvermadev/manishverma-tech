/* ─────────────────────────────────────────
   Manish Verma — Portfolio JavaScript
   ───────────────────────────────────────── */

(function () {
    'use strict';

    // ── Config ────────────────────────────────────────────────────────
    // On the VERY FIRST Formsubmit submission, it will email mverma.builds@gmail.com
    // asking you to click a confirmation link. After that, every submission lands
    // directly in your inbox. Nothing else to configure.
    var FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/mverma.builds@gmail.com';

    // ── Footer year ───────────────────────────────────────────────────
    var yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ── Custom cursor ─────────────────────────────────────────────────
    var cursor = document.getElementById('cursor');
    var ring   = document.getElementById('cursorRing');
    var mx = 0, my = 0, rx = 0, ry = 0;

    if (cursor) {
        document.addEventListener('mousemove', function (e) {
            mx = e.clientX;
            my = e.clientY;
            cursor.style.transform = 'translate(' + (mx - 5) + 'px, ' + (my - 5) + 'px)';
        });

        (function animRing() {
            rx += (mx - rx) * 0.12;
            ry += (my - ry) * 0.12;
            ring.style.transform = 'translate(' + (rx - 18) + 'px, ' + (ry - 18) + 'px)';
            requestAnimationFrame(animRing);
        })();
    }

    // ── Nav scroll ────────────────────────────────────────────────────
    var nav = document.getElementById('nav');
    window.addEventListener('scroll', function () {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    });

    // ── Mobile nav drawer ─────────────────────────────────────────────
    var navDrawer = document.getElementById('navDrawer');
    var hamburger = document.getElementById('hamburger');
    navDrawer.style.display = 'none';

    window.toggleDrawer = function () {
        var isOpen = navDrawer.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        navDrawer.style.display = isOpen ? 'flex' : 'none';
        document.body.style.overflow = isOpen ? 'hidden' : '';
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        hamburger.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    };

    // ── Modal ─────────────────────────────────────────────────────────
    var hireModal = document.getElementById('hireModal');
    hireModal.style.display = 'none';

    window.openModal = function () {
        hireModal.style.display = 'flex';
        requestAnimationFrame(function () { hireModal.classList.add('open'); });
        document.body.style.overflow = 'hidden';
        setTimeout(function () {
            var nameField = document.getElementById('modalName');
            if (nameField) nameField.focus();
        }, 100);
    };

    window.closeModal = function () {
        hireModal.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(function () { hireModal.style.display = 'none'; }, 300);
        var statusEl = document.getElementById('modalStatus');
        statusEl.textContent = '';
        statusEl.className = 'modal-status';
    };

    hireModal.addEventListener('click', function (e) {
        if (e.target === this) window.closeModal();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') window.closeModal();
    });

    // ── Form submission ───────────────────────────────────────────────
    document.getElementById('hireForm').addEventListener('submit', function (e) {
        e.preventDefault();

        var name    = document.getElementById('modalName').value.trim();
        var email   = document.getElementById('modalEmail').value.trim();
        var message = document.getElementById('modalMessage').value.trim();
        var status  = document.getElementById('modalStatus');
        var btn     = document.getElementById('modalSubmit');

        if (!name || !email || !message) {
            status.textContent = 'Please fill in all required fields.';
            status.className = 'modal-status error';
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            status.textContent = 'Please enter a valid email address.';
            status.className = 'modal-status error';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Sending\u2026';
        status.textContent = '';
        status.className = 'modal-status';

        function openMailClient() {
            var sub  = encodeURIComponent('Hire Me \u2014 Inquiry from ' + name);
            var body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\n' + message);
            var a = document.createElement('a');
            a.href = 'mailto:mverma.builds@gmail.com?subject=' + sub + '&body=' + body;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        // Local file: fetch() blocked by CORS — go straight to mail client
        if (window.location.protocol === 'file:' || !navigator.onLine) {
            openMailClient();
            status.textContent = navigator.onLine
                ? '\u2713 Opening your mail app with everything pre-filled!'
                : '\u26a1 You\'re offline \u2014 opening your mail app instead.';
            status.className = 'modal-status success';
            btn.disabled = false;
            btn.textContent = 'Send Message';
            return;
        }

        // Hosted: try Formsubmit first, fall back to mail client
        fetch(FORMSUBMIT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                name:     name,
                email:    email,
                message:  message,
                _subject: 'Hire Me \u2014 Inquiry from ' + name,
                _captcha: 'false',
                _template: 'table'
            })
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.success === 'true' || data.success === true) {
                status.textContent = '\u2713 Message sent! I\u2019ll be in touch within 24 hours.';
                status.className = 'modal-status success';
                document.getElementById('hireForm').reset();
                setTimeout(window.closeModal, 3000);
            } else {
                throw new Error('Formsubmit rejected');
            }
        })
        .catch(function () {
            openMailClient();
            status.textContent = '\u2713 Opening your mail app with everything pre-filled!';
            status.className = 'modal-status success';
        })
        .finally(function () {
            btn.disabled = false;
            btn.textContent = 'Send Message';
        });
    });

    // ── Experience accordion ──────────────────────────────────────────
    window.toggleExp = function (header) {
        var item   = header.closest('.exp-item');
        var toggle = header.querySelector('.exp-toggle');
        var isOpen = item.classList.contains('open');
        document.querySelectorAll('.exp-item').forEach(function (i) {
            i.classList.remove('open');
            i.querySelector('.exp-toggle').textContent = '+';
            i.querySelector('.exp-header').setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
            item.classList.add('open');
            toggle.textContent = '\u2212';
            header.setAttribute('aria-expanded', 'true');
        }
    };

    // ── Scroll reveal ─────────────────────────────────────────────────
    var revealObs = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObs.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.08, rootMargin: '0px 0px -48px 0px' }
    );

    document.querySelectorAll('.reveal').forEach(function (el) { revealObs.observe(el); });

    // Contact section staggered reveals
    document.querySelectorAll('.contact-eyebrow, .contact-title, .contact-sub, .contact-links').forEach(function (el, i) {
        var obs = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
                setTimeout(function () {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, i * 120);
                obs.unobserve(el);
            }
        }, { threshold: 0.15 });
        el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        el.style.transform = 'translateY(24px)';
        obs.observe(el);
    });

    // ── PWA Service Worker registration ──────────────────────────────
    // SW requires a secure context: https://, or http://localhost / 127.0.0.1
    var canUseSW = 'serviceWorker' in navigator && (
        window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
    );

    if (canUseSW) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js')
                .then(function (reg) {
                    console.info('[SW] Registered. Scope:', reg.scope);
                    // Detect when a new SW has finished installing (app updated)
                    reg.addEventListener('updatefound', function () {
                        var newWorker = reg.installing;
                        if (!newWorker) return;
                        newWorker.addEventListener('statechange', function () {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.info('[SW] New version cached. Refresh to update.');
                            }
                        });
                    });
                })
                .catch(function (err) {
                    console.warn('[SW] Registration failed:', err);
                });
        });
    }

    // ── Offline / Online status banner ────────────────────────────────
    (function () {
        var banner = null;

        function showOfflineBanner() {
            if (banner) return;
            banner = document.createElement('div');
            banner.id = 'offline-banner';
            banner.setAttribute('role', 'status');
            banner.setAttribute('aria-live', 'polite');
            banner.textContent = '\u26a1 You\'re offline \u2014 the page is served from cache.';
            Object.assign(banner.style, {
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#111',
                color: '#e8b86d',
                border: '1px solid rgba(232,184,109,0.35)',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                padding: '10px 22px',
                zIndex: '99999',
                pointerEvents: 'none',
                opacity: '0',
                transition: 'opacity 0.4s'
            });
            document.body.appendChild(banner);
            requestAnimationFrame(function () { banner.style.opacity = '1'; });
        }

        function hideOfflineBanner() {
            if (!banner) return;
            banner.style.opacity = '0';
            setTimeout(function () {
                if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
                banner = null;
            }, 400);
        }

        if (!navigator.onLine) showOfflineBanner();
        window.addEventListener('offline', showOfflineBanner);
        window.addEventListener('online',  hideOfflineBanner);
    })();

    // ── Scroll progress bar ───────────────────────────────────────────
    var progressBar = document.getElementById('scroll-progress');
    if (progressBar) {
        window.addEventListener('scroll', function () {
            var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            var scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            progressBar.style.width = scrollHeight > 0 ? ((scrollTop / scrollHeight) * 100) + '%' : '0%';
        }, { passive: true });
    }

    // ── Back to top ───────────────────────────────────────────────────
    var backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.addEventListener('scroll', function () {
            backToTopBtn.classList.toggle('visible', window.scrollY > 400);
        }, { passive: true });
        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ── Active nav section tracking ───────────────────────────────────
    (function () {
        var sections = document.querySelectorAll('section[id]');
        var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
        if (!sections.length || !navLinks.length) return;

        var sectionObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var id = entry.target.id;
                    navLinks.forEach(function (link) {
                        if (link.getAttribute('href') === '#' + id) {
                            link.setAttribute('aria-current', 'page');
                        } else {
                            link.removeAttribute('aria-current');
                        }
                    });
                }
            });
        }, { rootMargin: '-35% 0px -55% 0px' });

        sections.forEach(function (s) { sectionObs.observe(s); });
    })();

    // ── Stats count-up animation ──────────────────────────────────────
    (function () {
        var statsEl = document.querySelector('.hero-stats');
        if (!statsEl) return;
        var animated = false;

        function countUp(el, target, suffix) {
            var start = performance.now();
            var duration = 1200;
            (function tick(now) {
                var progress = Math.min((now - start) / duration, 1);
                var ease = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.floor(ease * target) + suffix;
                if (progress < 1) requestAnimationFrame(tick);
            })(start);
        }

        var statsObs = new IntersectionObserver(function (entries) {
            if (animated || !entries[0].isIntersecting) return;
            animated = true;
            statsObs.disconnect();
            document.querySelectorAll('.stat-num').forEach(function (el) {
                var raw = el.textContent.trim();
                if (raw === '\u221e') return;
                var suffix = raw.replace(/[0-9]/g, '');
                var num = parseInt(raw, 10);
                if (!isNaN(num)) countUp(el, num, suffix);
            });
        }, { threshold: 0.5 });

        statsObs.observe(statsEl);
    })();

    // ── Accordion keyboard and ARIA setup ────────────────────────────
    document.querySelectorAll('.exp-header').forEach(function (header) {
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', 'button');
        var isOpen = header.closest('.exp-item').classList.contains('open');
        header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        header.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.toggleExp(header);
            }
        });
    });

})();
