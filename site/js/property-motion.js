(() => {
  'use strict';

  const start = () => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const SplitText = window.SplitText;
    const detail = document.getElementById('property-detail');
    const state = document.getElementById('property-state');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

    if (!gsap) return;
    if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (SplitText) gsap.registerPlugin(SplitText);

    const splitLines = (element) => {
      if (!element) return [];
      if (SplitText) return new SplitText(element, { type: 'lines', mask: 'lines' }).lines;
      return [element];
    };

    if (!detail || detail.hidden) {
      if (state && !reduceMotion) {
        gsap.from(state.children, { y: 26, opacity: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out' });
      }
      return;
    }

    /* ---------- Smooth scroll ---------- */
    let lenis = null;
    if (!reduceMotion && window.Lenis && ScrollTrigger) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const hash = link.getAttribute('href');
        if (!hash || hash === '#') return;
        const target = document.querySelector(hash);
        if (!target) return;
        event.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, {
            offset: -88,
            duration: reduceMotion ? 0 : 1.6,
            immediate: reduceMotion,
            easing: (t) => 1 - Math.pow(1 - t, 4)
          });
        } else {
          target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }
        if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
        history.replaceState(null, '', hash);
      });
    });

    if (ScrollTrigger) {
      const progress = $('.property-progress span');
      if (progress) {
        gsap.to(progress, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
      }

      const nav = $('.property-nav');
      if (nav) {
        ScrollTrigger.create({
          start: 0,
          end: 'max',
          onUpdate: (self) => {
            nav.classList.toggle('is-scrolled', self.scroll() > 10);
            nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 480);
          }
        });
      }
    }

    /* ---------- Hero entrance ---------- */
    const heroLines = splitLines($('#property-title'));
    const heroCopy = [
      '.property-hero__topline',
      '.property-location',
      '.property-price',
      '.property-description',
      '.property-specs > div',
      '.property-hero__cta',
      '.property-disclaimer',
      '.property-hero__media figcaption'
    ];
    const image = $('#property-image');

    if (!reduceMotion) {
      gsap.set(heroLines, { yPercent: 112 });
      gsap.set(heroCopy, { y: 24, opacity: 0 });
      gsap.set('.property-hero__frame', { clipPath: 'inset(0 0 100% 0)' });
      gsap.set('.property-hero__frame img', { scale: 1.14 });
      gsap.set('.property-hero__corner', { opacity: 0, y: 10 });

      const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
      intro
        .to('.property-hero__frame', { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'power4.inOut' })
        .to('.property-hero__frame img', { scale: 1, duration: 1.6, ease: 'power3.out' }, 0)
        .to('.property-hero__topline', { y: 0, opacity: 1, duration: 0.8 }, 0.4)
        .to(heroLines, { yPercent: 0, duration: 1.15, stagger: 0.09 }, 0.5)
        .to(['.property-location', '.property-price'], { y: 0, opacity: 1, duration: 0.9, stagger: 0.08 }, 0.8)
        .to('.property-description', { y: 0, opacity: 1, duration: 0.9 }, 0.95)
        .to('.property-specs > div', { y: 0, opacity: 1, duration: 0.8, stagger: 0.09 }, 1.05)
        .to('.property-hero__cta', { y: 0, opacity: 1, duration: 0.8 }, 1.25)
        .to(['.property-disclaimer', '.property-hero__media figcaption'], { y: 0, opacity: 1, duration: 0.7 }, 1.3)
        .to('.property-hero__corner', { opacity: 1, y: 0, duration: 0.6 }, 1.15);

      const playIntro = () => intro.play();
      if (image && !image.complete) {
        image.addEventListener('load', playIntro, { once: true });
        image.addEventListener('error', playIntro, { once: true });
        setTimeout(playIntro, 900);
      } else {
        requestAnimationFrame(playIntro);
      }

      if (ScrollTrigger) {
        gsap.fromTo('.property-hero__frame img', { yPercent: -1 }, {
          yPercent: 3.5,
          ease: 'none',
          scrollTrigger: { trigger: '.property-hero', start: 'top top', end: 'bottom top', scrub: true }
        });
      }
    }

    if (reduceMotion || !ScrollTrigger) return;

    /* ---------- Section titles ---------- */
    $$('.property-section-title').forEach((title) => {
      const lines = splitLines(title);
      if (!lines.length) return;
      gsap.from(lines, {
        yPercent: 112,
        duration: 1.1,
        stagger: 0.09,
        ease: 'power3.out',
        scrollTrigger: { trigger: title, start: 'top 90%', once: true }
      });
    });

    gsap.from('.property-overview .eyebrow', {
      y: 16, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: '.property-overview', start: 'top 85%', once: true }
    });

    /* ---------- Overview word scrub ---------- */
    const prose = $('#property-overview');
    if (prose && SplitText) {
      const words = new SplitText(prose, { type: 'words', wordsClass: 'word' }).words;
      gsap.set(words, { opacity: 0.14 });
      gsap.to(words, {
        opacity: 1,
        stagger: 0.08,
        ease: 'none',
        scrollTrigger: { trigger: prose, start: 'top 82%', end: 'bottom 58%', scrub: true }
      });
    }

    /* ---------- Cinematic interlude ---------- */
    const immersion = $('.property-immersion');
    if (immersion) {
      gsap.fromTo('.property-immersion__stage img', { scale: 1.18, clipPath: 'inset(6% 8% 6% 8%)' }, {
        scale: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'none',
        scrollTrigger: { trigger: immersion, start: 'top bottom', end: 'top top', scrub: true }
      });
      gsap.fromTo('.property-immersion__copy', { yPercent: 10, opacity: 0.35 }, {
        yPercent: -8,
        opacity: 1,
        ease: 'none',
        scrollTrigger: { trigger: immersion, start: 'top 90%', end: 'bottom bottom', scrub: true }
      });
      gsap.from('.property-immersion__caption', {
        opacity: 0, y: 14, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: immersion, start: 'top 55%', once: true }
      });
    }

    /* ---------- Amenities ---------- */
    const amenities = $('#property-amenities');
    if (amenities) {
      gsap.from(amenities.children, {
        y: 28, opacity: 0, duration: 0.85, stagger: 0.075, ease: 'power3.out',
        scrollTrigger: { trigger: amenities, start: 'top 88%', once: true }
      });
    }
    gsap.from('.property-amenities .property-section-note', {
      y: 18, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: '.property-amenities', start: 'top 84%', once: true }
    });

    /* ---------- Enquiry ---------- */
    const enquiry = $('#property-enquiry');
    if (enquiry) {
      const titleLines = splitLines($('#enquiry-title'));
      gsap.from(titleLines, {
        yPercent: 112, duration: 1.15, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: enquiry, start: 'top 78%', once: true }
      });
      gsap.from('.property-enquiry__lede', {
        y: 24, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: enquiry, start: 'top 74%', once: true }
      });
      gsap.from(['.property-demo-note', '.property-enquiry__assurances li'], {
        y: 24, opacity: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out',
        scrollTrigger: { trigger: '.property-demo-note', start: 'top 90%', once: true }
      });
      gsap.from('.property-form', {
        y: 54, opacity: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.property-form', start: 'top 86%', once: true }
      });
      gsap.from('.property-form__head, .property-field, .property-submit, .property-form__privacy', {
        y: 18, opacity: 0, duration: 0.7, stagger: 0.055, ease: 'power2.out',
        scrollTrigger: { trigger: '.property-form', start: 'top 80%', once: true }
      });
    }

    /* ---------- Related ---------- */
    $$('.property-related__card').forEach((card, index) => {
      const media = $('.property-related__image', card);
      const trigger = { trigger: card, start: 'top 92%', once: true };
      gsap.from(card, { y: 42, opacity: 0, duration: 1, delay: index * 0.06, ease: 'power3.out', scrollTrigger: trigger });
      if (media) {
        gsap.fromTo(media, { clipPath: 'inset(0 0 100% 0)' }, {
          clipPath: 'inset(0 0 0% 0)', duration: 1.2, delay: index * 0.06, ease: 'power3.inOut', scrollTrigger: trigger
        });
      }
    });

    gsap.from('.property-related__head > *, .property-text-link', {
      y: 22, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.property-related', start: 'top 88%', once: true }
    });

    /* ---------- Footer ---------- */
    gsap.from('.property-footer > *', {
      y: 18, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power2.out',
      scrollTrigger: { trigger: '.property-footer', start: 'top 96%', once: true }
    });

    ScrollTrigger.refresh();
  };

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
})();
