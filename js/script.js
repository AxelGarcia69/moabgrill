/* ==========================================================================
   MOAB GRILL — interactions
   Header state · mobile nav · infinite card-fan carousel · scroll reveal ·
   GSAP featured showcase (clip-path masks) · GSAP scroll animations
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined";

  /* ---------- Header: solid after scrolling past the hero ---------- */
  const header = document.querySelector(".site-header");
  if (header && header.classList.contains("on-hero")) {
    const setState = () => header.classList.toggle("solid", window.scrollY > 40);
    setState();
    window.addEventListener("scroll", setState, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  const toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".site-nav a").forEach((link) =>
      link.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------- Gallery: infinite card fan carousel (GSAP) ---------- */
  const gallery = document.querySelector(".gallery");
  const fan = document.querySelector(".fan-layout");
  if (fan && hasGsap) {
    const cards = Array.from(fan.querySelectorAll(".fan-card"));
    const total = cards.length;
    const center = total >> 1;

    let offset = 0;              /* carousel rotation steps */
    let entered = false;
    let cycling = false;
    let activeSlot = null;
    let leaveTimer = null;
    let autoTimer = null;

    const slotOf = (i) => (((i - offset) % total) + total) % total;

    const slotConfig = (slot) => {
      const distance = total > 1 ? (slot - center) / center : 0;
      const a = Math.abs(distance);
      return {
        rot: distance * 21,
        scale: 1 - 0.2244 * a * a,
        x: distance * 30,
        y: a * a * 7.3,
        zIndex: 10 - Math.abs(slot - center),
      };
    };

    /* Recenter the whole composition when the fan is uneven (e.g. 4 cards) */
    const xOffset = (() => {
      let sum = 0;
      for (let i = 0; i < total; i++) sum += slotConfig(i).x;
      return -sum / total;
    })();

    const mult = () => {
      /* Spread scales with the fan's own column width, not the viewport */
      const w = fan.clientWidth || window.innerWidth;
      return Math.min(1, Math.max(0.26, w / 1250));
    };
    const hMult = () => {
      const w = window.innerWidth;
      const ideal = (w < 480 ? 22 : w < 640 ? 26 : w < 768 ? 28 : w < 1024 ? 34 : 38) * 16;
      const avail = window.innerHeight * 0.7;
      return avail >= ideal ? 1 : avail / ideal;
    };

    cards.forEach((el, i) => {
      gsap.set(el, { xPercent: -50, yPercent: -50, opacity: 0, zIndex: slotConfig(slotOf(i)).zIndex });
    });

    /* Dots — highlight the card currently sitting front & center */
    const dotsWrap = document.querySelector(".fan-dots");
    const dots = dotsWrap
      ? cards.map(() => {
          const d = document.createElement("span");
          d.className = "fan-dot";
          dotsWrap.appendChild(d);
          return d;
        })
      : [];
    function updateDots() {
      const frontCard = (offset + center) % total;
      dots.forEach((d, i) => d.classList.toggle("active", i === frontCard));
    }
    updateDots();

    function applyLayout(hoveredSlot) {
      const m = mult();
      const h = hMult();
      cards.forEach((el, i) => {
        const slot = slotOf(i);
        const base = slotConfig(slot);
        let x = (base.x + xOffset) * m;
        let y = base.y * h;
        let rot = base.rot;
        let scale = base.scale;
        let delay = 0;

        if (hoveredSlot !== null) {
          const distance = Math.abs(slot - hoveredSlot);
          delay = distance * 0.02;
          if (slot === hoveredSlot) {
            y -= 2.5 * h;
            scale *= 1.08;
          } else {
            const normalized = center > 0 ? (slot - center) / center : 0;
            const push = 8 * (1 - Math.abs(normalized)) * (1 + 0.2 * Math.max(0, 3 - distance));
            if (slot < hoveredSlot) { x -= push * m; rot -= 3 / (distance + 1); }
            else { x += push * m; rot += 3 / (distance + 1); }
            if (slot === total - 1 && hoveredSlot < center) y -= 1 * h;
            if (slot === 0 && hoveredSlot > center) y -= 1 * h;
          }
        } else {
          delay = Math.abs(slot - center) * 0.02;
        }

        gsap.to(el, {
          x: x + "rem", y: y + "rem", rotation: rot, scale: scale, opacity: 1,
          duration: 0.5, delay: delay, ease: "elastic.out(1,.75)", overwrite: "auto",
        });
        gsap.set(el, { zIndex: base.zIndex });
      });
    }

    /* Infinite carousel step — the wrapping card exits one side, re-enters the other */
    function cycle(direction) {
      if (!entered || cycling) return;
      cycling = true;
      activeSlot = null;
      offset = direction === "right" ? (offset + 1) % total : (offset - 1 + total) % total;
      updateDots();

      /* Start from a clean slate so no stale hover/enter tween survives */
      cards.forEach((el) => gsap.killTweensOf(el));

      const m = mult();
      const h = hMult();
      let done = 0;
      const onDone = () => { if (++done >= total) cycling = false; };
      /* Safety net: never leave the carousel locked if a tween gets overwritten */
      gsap.delayedCall(1.3, () => { cycling = false; });

      cards.forEach((el, i) => {
        const slot = slotOf(i);
        const c = slotConfig(slot);
        const target = {
          x: ((c.x + xOffset) * m) + "rem", y: (c.y * h) + "rem",
          rotation: c.rot, scale: c.scale, opacity: 1,
        };
        const wrapped = direction === "right" ? slot === total - 1 : slot === 0;

        if (wrapped) {
          const exitX = (direction === "right" ? -40 : 40) * m;
          const enterX = (direction === "right" ? 40 : -40) * m;
          gsap.to(el, {
            x: exitX + "rem", opacity: 0, scale: 0.5,
            rotation: direction === "right" ? -30 : 30,
            duration: 0.4, ease: "power2.in", zIndex: 0,
            onComplete: () => {
              gsap.set(el, {
                x: enterX + "rem", y: (c.y * h) + "rem",
                rotation: direction === "right" ? 30 : -30,
                scale: 0.5, zIndex: c.zIndex,
              });
              gsap.to(el, Object.assign({}, target, { duration: 0.6, ease: "power2.out", overwrite: true, onComplete: onDone }));
            },
          });
        } else {
          gsap.set(el, { zIndex: c.zIndex });
          gsap.to(el, Object.assign({}, target, { duration: 0.5, ease: "power2.out", overwrite: "auto", onComplete: onDone }));
        }
      });
    }

    /* Auto-advance, paused while the visitor interacts with the fan */
    function startAuto() {
      if (reducedMotion) return;
      clearInterval(autoTimer);
      autoTimer = setInterval(() => cycle("right"), 4500);
    }
    function stopAuto() { clearInterval(autoTimer); }

    function enter() {
      if (entered) return;
      entered = true;
      const m = mult();
      const h = hMult();
      cards.forEach((el, i) => {
        const slot = slotOf(i);
        const c = slotConfig(slot);
        gsap.set(el, { x: 0, y: (12 * h) + "rem", rotation: 0, scale: 0.5, opacity: 0 });
        gsap.to(el, {
          x: ((c.x + xOffset) * m) + "rem", y: (c.y * h) + "rem", rotation: c.rot, scale: c.scale,
          opacity: 1, duration: 1.2, ease: "elastic.out(1.05,.78)", delay: 0.2 + slot * 0.06,
        });
      });
      startAuto();
    }

    if (reducedMotion) {
      entered = true;
      const m = mult();
      const h = hMult();
      cards.forEach((el, i) => {
        const c = slotConfig(slotOf(i));
        gsap.set(el, { x: ((c.x + xOffset) * m) + "rem", y: (c.y * h) + "rem", rotation: c.rot, scale: c.scale, opacity: 1 });
      });
    } else if ("IntersectionObserver" in window) {
      const fanIo = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { enter(); fanIo.disconnect(); }
        });
      }, { threshold: 0.3 });
      fanIo.observe(fan);
    } else {
      enter();
    }

    /* Manual controls */
    const prevBtn = document.querySelector(".fan-prev");
    const nextBtn = document.querySelector(".fan-next");
    if (prevBtn) prevBtn.addEventListener("click", () => { cycle("left"); startAuto(); });
    if (nextBtn) nextBtn.addEventListener("click", () => { cycle("right"); startAuto(); });

    /* Swipe on touch devices */
    let touchX = null;
    fan.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    fan.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) { cycle(dx < 0 ? "right" : "left"); startAuto(); }
      touchX = null;
    }, { passive: true });

    /* Hover interactions (pause the carousel while exploring) */
    cards.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        if (!entered || cycling) return;
        stopAuto();
        if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
        const slot = slotOf(cards.indexOf(el));
        if (activeSlot !== slot) { activeSlot = slot; applyLayout(slot); }
      });
    });
    fan.addEventListener("mouseleave", () => {
      if (!entered) return;
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        activeSlot = null;
        if (!cycling) applyLayout(null);
        startAuto();
      }, 50);
    });
    window.addEventListener("resize", () => { if (entered && !cycling) applyLayout(activeSlot); });
  } else if (fan) {
    /* No GSAP: just show the cards stacked */
    fan.querySelectorAll(".fan-card").forEach((el) => { el.style.opacity = "1"; });
  }

  /* ---------- Scroll reveal (menu cards are auto-tagged) ---------- */
  document.querySelectorAll(".menu-item, .custom-column").forEach((el) => el.classList.add("reveal"));

  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window && !reducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- Featured showcase: GSAP clip-path mask loops ---------- */
  const featured = document.querySelector(".featured");
  if (featured) {
    const items = Array.from(featured.querySelectorAll(".featured-item"));
    const image = featured.querySelector(".featured-image");
    const group = featured.querySelector(".featured-group");
    let active = 0;
    let masterTl = null;

    /* data-images="a.jpg, b.jpg, c.jpg" → mini carrusel: en cada vuelta del mosaico
       (cuando las piezas están cerradas) se cambia a la siguiente foto */
    function slidesOf(item) {
      return (item.dataset.images || item.dataset.image).split(",").map((s) => s.trim()).filter(Boolean);
    }
    /* data-zooms="1.3, 1.5" (paralelo a data-images): acerca la foto para que un platillo
       centrado sobre fondo negro llene las piezas del mosaico */
    function zoomsOf(item) {
      return (item.dataset.zooms || "").split(",").map((s) => parseFloat(s)).filter((n) => n > 0);
    }
    /* data-focus="50 60, 50 50" (paralelo, en %): punto de la foto que queda al centro al hacer zoom;
       se acota para que nunca asome un borde vacío */
    function focusOf(item) {
      return (item.dataset.focus || "").split(",").map((s) => s.trim()).filter(Boolean)
        .map((s) => s.split(/\s+/).map(parseFloat));
    }
    function showSlide(item, i) {
      const zooms = zoomsOf(item);
      const zoom = zooms[i] || zooms[0] || 1;
      const f = focusOf(item)[i] || focusOf(item)[0] || [50, 50];
      image.setAttribute("href", slidesOf(item)[i]);
      if (zoom === 1) { image.removeAttribute("transform"); return; }
      const min = 250 / zoom, max = 500 - min; // viewBox 500×500
      const fx = Math.min(max, Math.max(min, f[0] * 5));
      const fy = Math.min(max, Math.max(min, (isNaN(f[1]) ? 50 : f[1]) * 5));
      image.setAttribute("transform", "translate(250 250) scale(" + zoom + ") translate(" + -fx + " " + -fy + ")");
    }

    function applyStatic(item) {
      showSlide(item, 0);
      group.setAttribute("clip-path", "url(#" + item.dataset.clip + ")");
    }

    function createLoop(index) {
      const item = items[index];
      applyStatic(item);

      if (!hasGsap || reducedMotion) return;
      if (masterTl) masterTl.kill();

      const slides = slidesOf(item);
      let slide = 0;
      slides.slice(1).forEach((src) => { const im = new Image(); im.src = src; }); // precarga

      const selector = "#" + item.dataset.clip + " .path";
      gsap.set(selector, { scale: 0, transformOrigin: "50% 50%" });

      masterTl = gsap.timeline({
        repeat: -1,
        repeatDelay: 1,
        onRepeat: () => {
          if (slides.length < 2) return;
          slide = (slide + 1) % slides.length;
          showSlide(item, slide); // las piezas están en scale 0: el cambio no se ve
        },
      })
        // 1. IN (Expo Out)
        .to(selector, {
          scale: 1,
          duration: 0.8,
          stagger: { amount: 0.4, from: "random" },
          ease: "expo.out",
        })
        // 2. IDLE (Sine breath)
        .to(selector, {
          scale: 1.05,
          duration: 1.5,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
          stagger: { amount: 0.2, from: "center" },
        })
        // 3. OUT (Expo In)
        .to(selector, {
          scale: 0,
          duration: 0.6,
          stagger: { amount: 0.3, from: "edges" },
          ease: "expo.in",
        });
    }

    /* Móvil/tablet (≤1000px): el mosaico se mete DENTRO del item activo, debajo de su texto,
       para que título + descripción + foto se vean juntos sin bajar al final de la lista.
       En escritorio vuelve a su columna (sticky). */
    const visual = featured.querySelector(".featured-visual");
    const grid = featured.querySelector(".featured-grid");
    const mqStack = window.matchMedia("(max-width: 1000px)");
    function placeVisual() {
      const target = mqStack.matches ? items[active] : grid;
      if (visual.parentNode !== target) target.appendChild(visual);
    }
    if (mqStack.addEventListener) mqStack.addEventListener("change", placeVisual);
    else if (mqStack.addListener) mqStack.addListener(placeVisual);

    function activate(index, fromTap) {
      if (index !== active) {
        active = index;
        items.forEach((el, i) => el.classList.toggle("active", i === index));
        placeVisual();
        createLoop(index);
      }
      // al tocar en móvil, alinear el título del item bajo el header (lo de arriba se pliega)
      if (fromTap && mqStack.matches) {
        setTimeout(() => items[index].scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }), 340);
      }
    }

    items.forEach((el, i) => {
      el.addEventListener("mouseenter", () => activate(i, false));
      el.addEventListener("click", () => activate(i, true));
      el.addEventListener("focus", () => activate(i, false));
    });

    placeVisual();
    createLoop(0);
  }

  /* ---------- GSAP scroll animations ---------- */
  if (hasGsap && !reducedMotion) {
    /* Hero entrance */
    const heroContent = document.querySelector(".hero-content");
    if (heroContent) {
      gsap.from(heroContent.children, {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.25,
      });
    }
    const heroLogo = document.querySelector(".hero-logo img");
    if (heroLogo) {
      gsap.from(heroLogo, {
        scale: 0.7,
        opacity: 0,
        rotation: -8,
        duration: 1.3,
        ease: "elastic.out(1,.6)",
        delay: 0.5,
      });
    }

    if (typeof window.ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);

      /* --- Hero exit: shrinks into a rounded card while its copy parallaxes away --- */
      const hero = document.querySelector(".hero");
      if (hero) {
        gsap.to(hero, {
          scale: 0.92,
          borderRadius: 28,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom 35%", scrub: true },
        });
        const heroCopy = hero.querySelector(".hero-content");
        if (heroCopy) {
          gsap.to(heroCopy, {
            y: -120,
            opacity: 0,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "70% top", scrub: true },
          });
        }
        const heroLogoWrap = hero.querySelector(".hero-logo");
        if (heroLogoWrap) {
          gsap.to(heroLogoWrap, {
            y: -60,
            opacity: 0,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "70% top", scrub: true },
          });
        }
      }

      /* --- Gentle scroll drift so sections never feel static --- */
      [[".about-fan", 40], [".featured-visual", 50], [".map-frame", 26]].forEach(([sel, amt]) => {
        const el = document.querySelector(sel);
        if (!el) return;
        gsap.fromTo(el, { y: amt }, {
          y: -amt,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });

      /* Category cards: no parallax (the client wants them perfectly aligned) */

      /* Menu-page banner copy parallaxes out as you scroll into the menu */
      const pageHeroCopy = document.querySelector(".page-hero-content");
      if (pageHeroCopy) {
        gsap.to(pageHeroCopy, {
          y: -70,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: ".page-hero", start: "35% top", end: "bottom top", scrub: true },
        });
      }

      /* Section titles slide up as they enter */
      gsap.utils.toArray(".section-title").forEach((title) => {
        gsap.from(title, {
          y: 46,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: title, start: "top 88%" },
        });
      });

      /* Menu section headings (menu pages) */
      gsap.utils.toArray(".menu-content h2").forEach((h) => {
        gsap.from(h, {
          x: -40,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: h, start: "top 90%" },
        });
      });

      /* Live the experience: el reel crece y se aclara al entrar en pantalla */
      if (document.querySelector(".reel")) {
        gsap.from(".reel", {
          scale: 0.94,
          opacity: 0.55,
          ease: "none",
          scrollTrigger: { trigger: ".reel", start: "top 95%", end: "top 45%", scrub: true },
        });
      }

      /* Parallax on page-hero banners */
      gsap.utils.toArray(".page-hero-bg").forEach((bg) => {
        gsap.fromTo(bg,
          { yPercent: -6, scale: 1.1 },
          {
            yPercent: 6,
            scale: 1.1,
            ease: "none",
            scrollTrigger: {
              trigger: bg.parentElement,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      /* Featured list items cascade in */
      const fItems = gsap.utils.toArray(".featured-item");
      if (fItems.length) {
        gsap.from(fItems, {
          x: -60,
          opacity: 0,
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: ".featured-grid", start: "top 80%" },
        });
        gsap.from(".featured-visual", {
          scale: 0.9,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".featured-grid", start: "top 80%" },
        });
      }
    }
  }
  /* ---------- Social links: el nombre se despliega + pulso al tocar/clic ---------- */
  document.querySelectorAll(".social-links a").forEach((link) => {
    let timer;
    link.addEventListener("pointerdown", () => {
      link.classList.remove("is-pulse");
      void link.offsetWidth; // reinicia la animación del anillo si se toca de nuevo
      link.classList.add("is-open", "is-pulse");
      clearTimeout(timer);
      timer = setTimeout(() => link.classList.remove("is-open"), 1400);
    });
    link.addEventListener("animationend", (e) => {
      if (e.animationName === "socialRing") link.classList.remove("is-pulse");
    });
  });
  /* ---------- Live the experience: reel en bucle (columna izquierda) + sonido opcional ---------- */
  const reel = document.querySelector(".reel");
  if (reel) {
    const video = reel.querySelector(".reel-video");
    const soundBtn = reel.querySelector(".reel-sound");
    const soundLabel = soundBtn.querySelector("span");
    const playBtn = reel.querySelector(".reel-play");
    const bar = reel.querySelector(".reel-progress span");

    let inView = false;
    // iOS solo permite autoplay si el video está realmente silenciado: fijarlo por JS, no solo
    // con el atributo (WebKit a veces ignora el atributo muted del HTML)
    video.muted = true;
    video.defaultMuted = true;

    const setSound = (on) => {
      video.muted = !on;
      soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
      soundLabel.textContent = on ? "Sound on" : "Sound off";
    };
    const tryPlay = () => {
      const p = video.play();
      if (p && p.then) {
        p.then(() => reel.classList.remove("needs-play")).catch((err) => {
          // Solo "NotAllowedError" = autoplay bloqueado (p. ej. ahorro de batería): mostrar el play.
          // Un "AbortError" (pause() mientras arrancaba) es normal y se ignora.
          if (err && err.name === "NotAllowedError") reel.classList.add("needs-play");
        });
      }
    };

    if (reducedMotion) {
      video.removeAttribute("autoplay");
      reel.classList.add("needs-play"); // el usuario decide cuándo se mueve
    } else if (!("IntersectionObserver" in window)) {
      tryPlay(); // sin observador, reproducir directo
    }

    playBtn.addEventListener("click", () => { setSound(true); tryPlay(); });
    soundBtn.addEventListener("click", () => {
      setSound(video.muted);
      if (video.paused) tryPlay();
    });
    video.addEventListener("playing", () => reel.classList.add("is-playing"));
    video.addEventListener("timeupdate", () => {
      if (video.currentTime > 0.1) reel.classList.add("is-playing"); // por si Safari no dispara "playing"
      if (video.duration) bar.style.width = (video.currentTime / video.duration) * 100 + "%";
    });

    /* iPhone en "Modo de bajo consumo" bloquea el autoplay aunque esté silenciado: el primer
       toque o clic en la página cuenta como gesto del usuario y desbloquea la reproducción */
    const unlock = () => { if (inView && video.paused && !reducedMotion) tryPlay(); };
    document.addEventListener("touchend", unlock, { passive: true });
    document.addEventListener("click", unlock);

    /* fuera de pantalla se pausa (batería y datos en celular); al volver, sigue */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          inView = en.isIntersecting;
          if (!en.isIntersecting) { video.pause(); return; }
          // en pantalla: reproducir (con reduced-motion solo si el usuario ya le dio play antes)
          if (!reducedMotion || reel.classList.contains("is-playing")) tryPlay();
        });
      }, { threshold: 0.2 }).observe(reel);
    }

  }

  /* ---------- Anclas en la misma página: scroll suave SIN cambiar la URL ----------
     Si "#contact" quedara en la URL, al recargar o volver a entrar el navegador saltaría ahí solo. */
  document.querySelectorAll('a[href*="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      let url;
      try { url = new URL(a.getAttribute("href"), location.href); } catch (err) { return; }
      if (!url.hash || url.hash.length < 2 || url.pathname !== location.pathname) return;
      let target = null;
      try { target = document.querySelector(url.hash); } catch (err) { return; }
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
  });

  /* ---------- Anclas entre páginas (p. ej. menu.html -> index.html#contact) ----------
     El hero pineado por ScrollTrigger cambia la altura del documento DESPUÉS del salto
     inicial del navegador, así que re-posicionamos al ancla una vez cargado todo. */
  if (location.hash && location.hash.length > 1) {
    let target = null;
    try { target = document.querySelector(location.hash); } catch (e) { target = null; }
    if (target) {
      const goToAnchor = () => {
        if (hasGsap && window.ScrollTrigger) window.ScrollTrigger.refresh();
        const html = document.documentElement;
        const prev = html.style.scrollBehavior;
        html.style.scrollBehavior = "auto"; // salto directo: quien llega de otra página quiere ver la sección ya
        target.scrollIntoView({ block: "start" });
        setTimeout(() => { // re-ajuste por si el layout cambió (imágenes, hero pineado)
          target.scrollIntoView({ block: "start" });
          html.style.scrollBehavior = prev;
          // quitar "#contact" de la URL: una recarga o una nueva visita deben empezar arriba
          history.replaceState(null, "", location.pathname + location.search);
        }, 450);
      };
      if (document.readyState === "complete") goToAnchor();
      else window.addEventListener("load", goToAnchor);
    }
  }
});
