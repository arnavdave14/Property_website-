// Fonts must be ready before SplitText measures lines.
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const cfg = window.FILM_CONFIG;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isSmall = matchMedia("(max-width: 960px)").matches;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.toggle("is-reduced-motion", reduceMotion);

  document.body.classList.add("is-loading");
  history.scrollRestoration = "manual";
  scrollTo(0, 0);

  /* ---------- Smooth scroll ---------- */
  const lenis = new Lenis({ lerp: reduceMotion ? 1 : 0.085, wheelMultiplier: 0.9, smoothWheel: !reduceMotion });
  lenis.stop();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const target = $(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: reduceMotion ? 0 : 2, immediate: reduceMotion, offset: -90, easing: (x) => 1 - Math.pow(1 - x, 4) });
    })
  );

  const nav = $(".nav");
  let lastY = 0;
  lenis.on("scroll", ({ scroll }) => {
    nav.classList.toggle("is-hidden", scroll > lastY && scroll > 200);
    lastY = scroll;
  });

  ScrollTrigger.create({
    trigger: ".manifesto",
    start: "top 80px",
    onToggle: (self) => nav.classList.toggle("is-solid", self.isActive),
    endTrigger: "html",
    end: "bottom bottom",
  });

  /* ---------- Film: image sequence on canvas ---------- */
  const canvas = $(".film__canvas");
  const ctx = canvas.getContext("2d");
  const frameDir = isSmall ? cfg.mobilePath : cfg.path;
  const frames = new Array(cfg.count);
  const state = { frame: 0, zoom: 1.06, px: 0, py: 0 };
  let drawn = -1;

  const src = (i) => `${frameDir}${String(i + 1).padStart(4, "0")}.jpg`;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    drawn = -1;
    render();
  }

  function nearestLoaded(i) {
    for (let d = 0; d < cfg.count; d++) {
      if (frames[i - d]?.complete && frames[i - d].naturalWidth) return frames[i - d];
      if (frames[i + d]?.complete && frames[i + d].naturalWidth) return frames[i + d];
    }
    return null;
  }

  function render() {
    const i = Math.round(state.frame);
    const img = nearestLoaded(i);
    if (!img) return;
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight) * state.zoom;
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    const x = (cw - w) / 2 + state.px * (w - cw) * 0.5;
    const y = (ch - h) / 2 + state.py * (h - ch) * 0.5;
    ctx.drawImage(img, x, y, w, h);
    drawn = i;
  }

  function loadFrames(onProgress) {
    return new Promise((resolve) => {
      const order = [];
      for (let step = 16; step >= 1; step /= 2) {
        for (let i = 0; i < cfg.count; i += step) if (!order.includes(i)) order.push(i);
      }
      if (reduceMotion) order.splice(1);
      const essentials = Math.min(order.length, Math.ceil(cfg.count / 16));
      let next = 0;
      let loaded = 0;
      let ready = 0;
      const launch = () => {
        if (next >= order.length) return;
        const position = next++;
        const i = order[position];
        const img = new Image();
        img.decoding = "async";
        img.onload = img.onerror = () => {
          loaded++;
          onProgress(loaded / order.length, loaded);
          if (position < essentials && ++ready === essentials) resolve();
          render();
          launch();
        };
        frames[i] = img;
        img.src = src(i);
      };
      for (let worker = 0; worker < Math.min(6, order.length); worker++) launch();
    });
  }

  addEventListener("resize", () => {
    resize();
    ScrollTrigger.refresh();
  });
  resize();

  /* ---------- Preloader ---------- */
  const loaderNum = $(".loader__num");
  const loaderBar = $(".loader__bar span");
  const loaderFrames = $(".loader__frames");
  const counter = { v: 0 };
  let target = 0;
  const pad3 = (n) => String(n).padStart(3, "0");

  gsap.ticker.add(() => {
    counter.v += (target - counter.v) * 0.12;
    const v = Math.min(100, Math.round(counter.v));
    loaderNum.textContent = v;
    loaderBar.style.transform = `scaleX(${counter.v / 100})`;
  });

  const loading = loadFrames((p, n) => {
    target = Math.max(target, p * 100);
    loaderFrames.textContent = `${pad3(n)} / ${pad3(cfg.count)} frames`;
  });
  const timeout = new Promise((r) => setTimeout(r, 9000));

  Promise.race([loading, timeout]).then(() => {
    target = 100;
    gsap.delayedCall(0.55, intro);
  });

  /* ---------- Intro ---------- */
  const heroSplit = new SplitText(".hero__title .line", { type: "chars" });
  gsap.set(heroSplit.chars, { yPercent: 115, rotate: 6 });
  gsap.set([".chapter--hero .eyebrow", ".scroll-cue", ".film__hud", ".nav"], { autoAlpha: 0 });

  function followEntryLink() {
    const destination = document.getElementById(location.hash.slice(1));
    if (destination) lenis.scrollTo(destination, { immediate: true, offset: -90 });
  }

  function intro() {
    if (reduceMotion) {
      gsap.set(".loader", { display: "none" });
      gsap.set(heroSplit.chars, { clearProps: "all" });
      gsap.set([".chapter--hero .eyebrow", ".nav", ".film__hud", ".scroll-cue"], { autoAlpha: 1 });
      document.body.classList.remove("is-loading");
      lenis.start();
      followEntryLink();
      return;
    }
    const tl = gsap.timeline({
      onComplete: () => {
        document.body.classList.remove("is-loading");
        lenis.start();
        followEntryLink();
      },
    });
    tl.to(".loader__count, .loader__top, .loader__bottom, .loader__bar", { autoAlpha: 0, y: -40, duration: 0.6, ease: "power3.in", stagger: 0.04 })
      .to(".loader", { clipPath: "inset(0 0 100% 0)", duration: 1.2, ease: "expo.inOut" }, "-=0.1")
      .from(canvas, { scale: 1.25, duration: 2.2, ease: "expo.out" }, "<0.3")
      .to(heroSplit.chars, { yPercent: 0, rotate: 0, duration: 1.4, ease: "expo.out", stagger: 0.025 }, "<0.35")
      .to([".chapter--hero .eyebrow", ".nav", ".film__hud", ".scroll-cue"], { autoAlpha: 1, duration: 1, stagger: 0.12 }, "<0.5")
      .set(".loader", { display: "none" });
  }

  const motion = gsap.context(() => {

  /* ---------- Film scroll timeline ---------- */
  const hudFrame = $(".hud__frame");
  const hudTc = $(".hud__tc");
  const hudBar = $(".hud__progress i");

  const ch1 = new SplitText(".chapter--left .chapter__title", { type: "lines", mask: "lines" });
  const endSplit = new SplitText(".end__title", { type: "chars" });
  gsap.set(["[data-chapter='1']", "[data-chapter='2']", "[data-chapter='3']"], { autoAlpha: 0 });

  const film = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".film",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.8,
      onUpdate: (self) => $(".film__stage").classList.toggle("is-scrubbing", self.progress > 0.02),
    },
  });

  film
    .to(state, {
      frame: cfg.count - 1,
      duration: 1,
      onUpdate: () => {
        const f = Math.round(state.frame);
        if (f !== drawn) render();
        const secs = f / cfg.fps;
        hudFrame.textContent = `F ${pad3(f + 1)}`;
        hudTc.textContent = `00:${String(Math.floor(secs)).padStart(2, "0")}:${String(Math.floor((secs % 1) * 24)).padStart(2, "0")}`;
        hudBar.style.transform = `scaleX(${f / (cfg.count - 1)})`;
      },
    }, 0)
    .to(".film__letterbox--top", { yPercent: -100, duration: 0.1 }, 0)
    .to(".film__letterbox--bottom", { yPercent: 100, duration: 0.1 }, 0)
    // hero out
    .to(".chapter--hero", { autoAlpha: 0, scale: 0.92, filter: "blur(10px)", duration: 0.1 }, 0.04)
    // chapter I
    .to("[data-chapter='1']", { autoAlpha: 1, duration: 0.02 }, 0.2)
    .from(ch1.lines, { yPercent: 110, stagger: 0.02, duration: 0.07, ease: "power2.out" }, 0.2)
    .from(".chapter--left .eyebrow, .chapter--left .chapter__text", { autoAlpha: 0, y: 30, stagger: 0.02, duration: 0.06 }, 0.23)
    .to("[data-chapter='1']", { autoAlpha: 0, x: -80, duration: 0.07 }, 0.42)
    // glass card
    .fromTo("[data-chapter='2']", { autoAlpha: 0, y: 80, rotateX: -20, transformPerspective: 900 }, { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.08, ease: "power2.out" }, 0.52)
    .from(".glass__specs li", { autoAlpha: 0, y: 14, stagger: 0.012, duration: 0.04 }, 0.56)
    .to("[data-chapter='2']", { autoAlpha: 0, y: -60, duration: 0.06 }, 0.72)
    // step inside
    .to("[data-chapter='3']", { autoAlpha: 1, duration: 0.01 }, 0.8)
    .from(endSplit.chars, { yPercent: 60, autoAlpha: 0, filter: "blur(12px)", stagger: 0.01, duration: 0.08, ease: "power2.out" }, 0.8)
    .to(".end__title", { scale: 1.6, autoAlpha: 0, duration: 0.08, ease: "power2.in" }, 0.93)
    .to(".film__hud", { autoAlpha: 0, duration: 0.05 }, 0.92)
    .to(canvas, { opacity: 0.25, duration: 0.07 }, 0.93);

  /* ---------- Mouse-driven camera drift ---------- */
  if (finePointer && !reduceMotion) {
    const toX = gsap.quickTo(state, "px", { duration: 1.4, ease: "power3.out", onUpdate: render });
    const toY = gsap.quickTo(state, "py", { duration: 1.4, ease: "power3.out", onUpdate: render });
    $(".film").addEventListener("mousemove", (e) => {
      toX(-(e.clientX / innerWidth - 0.5) * 0.9);
      toY(-(e.clientY / innerHeight - 0.5) * 0.9);
    });
    const glass = $(".glass");
    gsap.set(glass, { transformPerspective: 900, rotateY: 0, rotateX: 0 });
    const gx = gsap.quickTo(glass, "rotateY", { duration: 0.8, ease: "power3.out" });
    const gy = gsap.quickTo(glass, "rotateX", { duration: 0.8, ease: "power3.out" });
    addEventListener("mousemove", (e) => {
      gx((e.clientX / innerWidth - 0.5) * 14);
      gy(-(e.clientY / innerHeight - 0.5) * 10);
    });
  }

  /* ---------- Manifesto word highlight ---------- */
  const manifesto = new SplitText("[data-highlight]", { type: "words", wordsClass: "word" });
  gsap.to(manifesto.words, {
    opacity: 1,
    stagger: 0.1,
    ease: "none",
    scrollTrigger: { trigger: ".manifesto__text", start: "top 80%", end: "bottom 45%", scrub: true },
  });

  $$(".stat__num").forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || 0, 10);
    const pre = el.dataset.prefix || "";
    const suf = el.dataset.suffix || "";
    const o = { v: 0 };
    el.textContent = `${pre}${(0).toFixed(dec)}${suf}`;
    gsap.to(o, {
      v: end, duration: 2.4, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
      onUpdate: () => (el.textContent = `${pre}${o.v.toFixed(dec)}${suf}`),
    });
  });
  gsap.from(".stat", {
    y: 60, autoAlpha: 0, stagger: 0.1, duration: 1.2, ease: "expo.out",
    scrollTrigger: { trigger: ".stats", start: "top 85%" },
  });

  /* ---------- Velocity marquee ---------- */
  const track = $(".marquee__track");
  track.innerHTML += track.innerHTML;
  const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
  const skewTo = gsap.quickTo(track, "skewX", { duration: 0.6, ease: "power3.out" });
  let dir = 1;
  ScrollTrigger.create({
    trigger: ".marquee",
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      const v = self.getVelocity();
      if (Math.abs(v) > 10) dir = v > 0 ? 1 : -1;
      gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v) / 180, 7)), duration: 0.2, overwrite: true });
      gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25, ease: "power2.out" });
      skewTo(gsap.utils.clamp(-10, 10, -v / 220));
    },
  });

  /* ---------- Horizontal collection ---------- */
  const mm = gsap.matchMedia();
  const cTrack = $(".collection__track");
  const cards = $$(".estate");
  const idx = $(".collection__idx");

  mm.add("(min-width: 961px)", () => {
    const distance = () => cTrack.scrollWidth - innerWidth;
    const scroller = gsap.to(cTrack, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: ".collection",
        pin: ".collection__pin",
        start: "top top",
        end: () => `+=${distance()}`,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          gsap.set(".collection__progress i", { scaleX: self.progress });
          idx.textContent = String(Math.min(cards.length, Math.floor(self.progress * cards.length) + 1)).padStart(2, "0");
        },
      },
    });

    cards.forEach((card) => {
      gsap.fromTo($("img", card), { xPercent: -9 }, {
        xPercent: 9, ease: "none",
        scrollTrigger: { trigger: card, containerAnimation: scroller, start: "left right", end: "right left", scrub: true },
      });
      gsap.from($(".estate__meta", card), {
        y: 30, autoAlpha: 0, duration: 1, ease: "expo.out",
        scrollTrigger: { trigger: card, containerAnimation: scroller, start: "left 85%" },
      });
    });
  });

  gsap.fromTo(".estate__media", { clipPath: "inset(100% 0% 0% 0%)" }, {
    clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut", stagger: 0.12,
    scrollTrigger: { trigger: ".collection", start: isSmall ? "top 70%" : "top 40%" },
  });
  gsap.from(".collection__head .section-title", {
    yPercent: 40, autoAlpha: 0, duration: 1.4, ease: "expo.out",
    scrollTrigger: { trigger: ".collection", start: "top 70%" },
  });

  /* ---------- Clip-path reveal ---------- */
  const reveal = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: ".reveal", start: "top top", end: "+=140%", pin: true, scrub: 1 },
  });
  reveal
    .to(".reveal__frame", { clipPath: "inset(0% 0% 0% 0% round 0px)" }, 0)
    .to(".reveal__frame img", { scale: 1 }, 0)
    .fromTo(".reveal__title span", { xPercent: -40 }, { xPercent: 0 }, 0)
    .fromTo(".reveal__title em", { xPercent: 40 }, { xPercent: 0 }, 0);

  /* ---------- Stacking approach cards ---------- */
  const stack = $$(".stack__card");
  stack.forEach((card, i) => {
    if (i === stack.length - 1) return;
    gsap.to(card, {
      scale: 0.9 + i * 0.02,
      ease: "none",
      scrollTrigger: {
        trigger: stack[i + 1],
        start: "top bottom",
        end: `top ${130 + (i + 1) * 26}px`,
        scrub: true,
      },
    });
  });
  gsap.from(".approach__intro .section-title", {
    y: 80, autoAlpha: 0, duration: 1.4, ease: "expo.out",
    scrollTrigger: { trigger: ".approach", start: "top 75%" },
  });

  /* ---------- Quote ---------- */
  const quote = new SplitText(".quote__text", { type: "words" });
  gsap.from(quote.words, {
    yPercent: 60, autoAlpha: 0, filter: "blur(8px)", stagger: 0.04, duration: 1.2, ease: "expo.out",
    scrollTrigger: { trigger: ".quote", start: "top 70%" },
  });

  /* ---------- Contact ---------- */
  const contactLines = new SplitText(".contact__title .line", { type: "chars" });
  gsap.from(contactLines.chars, {
    yPercent: 115, stagger: 0.02, duration: 1.3, ease: "expo.out",
    scrollTrigger: { trigger: ".contact", start: "top 70%" },
  });
  gsap.from(".field, .btn--big", {
    y: 40, autoAlpha: 0, stagger: 0.08, duration: 1.1, ease: "expo.out",
    scrollTrigger: { trigger: ".contact__form", start: "top 85%" },
  });

  const form = $(".contact__form");
  const note = $(".form__note");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name;
    const email = form.elements.email;
    const okName = name.value.trim().length > 1;
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    name.classList.toggle("is-invalid", !okName);
    email.classList.toggle("is-invalid", !okEmail);
    if (!okName || !okEmail) {
      note.textContent = "Please share your name and a valid email.";
      if (!reduceMotion) gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
      return;
    }
    note.textContent = `Thank you, ${name.value.trim().split(" ")[0]}. Your preview enquiry is ready — no message has been sent.`;
  });

  /* ---------- Footer ---------- */
  const mark = new SplitText(".footer__mark", { type: "chars" });
  gsap.from(mark.chars, {
    yPercent: 100, autoAlpha: 0, stagger: 0.03, ease: "power2.out",
    scrollTrigger: { trigger: ".footer", start: "top 90%", end: "bottom bottom", scrub: 1 },
  });

  });
  if (reduceMotion) {
    motion.revert();
    $$(".stat__num").forEach((el) => {
      const decimals = parseInt(el.dataset.decimals || 0, 10);
      el.textContent = `${el.dataset.prefix || ""}${Number(el.dataset.count).toFixed(decimals)}${el.dataset.suffix || ""}`;
    });
  }

  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach((el) => {
      const inner = $(".btn__inner", el);
      const mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
      const my = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
      const ix = gsap.quickTo(inner, "x", { duration: 0.6, ease: "power3" });
      const iy = gsap.quickTo(inner, "y", { duration: 0.6, ease: "power3" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        mx(x * 0.35); my(y * 0.35); ix(x * 0.15); iy(y * 0.15);
      });
      el.addEventListener("mouseleave", () => {
        gsap.to([el, inner], { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.35)" });
      });
    });
  }

  ScrollTrigger.refresh();
});
