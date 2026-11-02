(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------------- Loader ---------------- */
  window.addEventListener("load", () => {
    setTimeout(() => $("#loader").classList.add("is-done"), 900);
  });

  /* ---------------- Particles ---------------- */
  (function particles() {
    const canvas = $("#particles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, dots = [];
    const COLORS = ["#ffc700", "#ff8a00", "#ffe066"];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const count = Math.min(90, Math.floor((w * h) / 22000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.8 + 0.6,
        c: COLORS[(Math.random() * COLORS.length) | 0],
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.c;
        ctx.globalAlpha = 0.6;
        ctx.fill();

        for (let j = i + 1; j < dots.length; j++) {
          const o = dots[j];
          const dx = d.x - o.x, dy = d.y - o.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120) {
            ctx.globalAlpha = (1 - dist / 120) * 0.16;
            ctx.strokeStyle = d.c;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(o.x, o.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }

    window.addEventListener("resize", resize);
    resize();
    tick();
  })();

  /* ---------------- Nav ---------------- */
  const nav = $("#nav");
  const navLinks = $$(".nav__link");
  const sections = $$("section[id]");

  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);

    let current = "home";
    sections.forEach((sec) => {
      if (window.scrollY >= sec.offsetTop - 140) current = sec.id;
    });
    navLinks.forEach((l) =>
      l.classList.toggle("is-active", l.getAttribute("href") === "#" + current)
    );
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const burger = $("#burger");
  const linkWrap = $(".nav__links");
  burger.addEventListener("click", () => {
    burger.classList.toggle("is-open");
    linkWrap.classList.toggle("is-open");
  });
  navLinks.forEach((l) =>
    l.addEventListener("click", () => {
      burger.classList.remove("is-open");
      linkWrap.classList.remove("is-open");
    })
  );

  /* ---------------- Reveal on scroll ---------------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add("is-in"), delay);
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );
  function observeReveals() {
    $$(".reveal:not(.is-in)").forEach((el) => revealObserver.observe(el));
  }
  observeReveals();

  /* ---------------- Counters ---------------- */
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || "";
        const start = performance.now();
        const dur = 1600;
        function step(now) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  $$(".stat__num").forEach((el) => counterObserver.observe(el));

  /* ---------------- Toast ---------------- */
  let toastTimer;
  function toast(message, type) {
    const el = $("#toast");
    el.textContent = message;
    el.className = "toast is-show" + (type ? " is-" + type : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-show"), 3200);
  }

  /* ---------------- Data render ---------------- */
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  async function loadRoster() {
    try {
      const res = await fetch("/api/roster");
      const data = await res.json();
      if (!data.ok) return;
      $("#rosterGrid").innerHTML = data.players
        .map(
          (p, i) => `
        <article class="player reveal" data-delay="${i * 60}">
          ${
            p.photo
              ? `<img class="player__photo" src="${esc(p.photo)}" alt="${esc(p.tag)}" loading="lazy" />`
              : `<div class="player__emoji">${p.img}</div>`
          }
          <div class="player__tag">${esc(p.tag)}</div>
          <div class="player__role">${esc(p.role)}</div>
          <div class="player__game">${esc(p.game)}</div>
          <div class="player__wins"><b>${p.wins}</b> career wins</div>
        </article>`
        )
        .join("");
      observeReveals();
    } catch (e) {
      console.error(e);
    }
  }

  function renderNews(announcements) {
    const d = new Date();
    $("#newsGrid").innerHTML = announcements
      .map(
        (msg, i) => `
      <article class="news-card reveal" data-delay="${i * 70}">
        <div class="news-card__date">${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
        <p>${msg}</p>
        <span class="news-card__tag">Organization Update</span>
      </article>`
      )
      .join("");
    observeReveals();
  }

  async function loadNews() {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (data.ok) renderNews(data.stats.announcements);
    } catch (e) {
      console.error(e);
    }
  }

  /* ---------------- Realtime updates ---------------- */
  let liveSource = null;
  let refreshTimer = null;

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      loadRoster();
      loadNews();
    }, 300);
  }

  function startLive() {
    if (liveSource || !window.EventSource) return;
    liveSource = new EventSource("/api/events");
    liveSource.addEventListener("change", scheduleRefresh);
  }

  function stopLive() {
    if (!liveSource) return;
    liveSource.close();
    liveSource = null;
  }

  // Tipid sa resources kapag nakatago ang tab; refresh pagbalik ng focus.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLive();
    else {
      startLive();
      scheduleRefresh();
    }
  });

  /* ---------------- Modal ---------------- */
  const modal = $("#modal");
  const signInBtn = $("#signInBtn");
  const modalTitle = $("#modalTitle");

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#username").focus(), 320);
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    $("#loginError").classList.remove("is-show");
  }

  signInBtn.addEventListener("click", openModal);
  $("#ctaSignIn").addEventListener("click", openModal);
  $$("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  /* ---------------- Password toggle ---------------- */
  const passInput = $("#password");
  const togglePass = $("#togglePass");
  togglePass.addEventListener("click", () => {
    const showing = passInput.type === "text";
    passInput.type = showing ? "password" : "text";
    togglePass.textContent = showing ? "SHOW" : "HIDE";
  });

  /* ---------------- Session / auth ---------------- */

  const loginForm = $("#loginForm");
  const loginBtn = $("#loginSubmit");
  const loginError = $("#loginError");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.classList.remove("is-show");

    const username = $("#username").value.trim();
    const password = $("#password").value;

    if (!username || !password) {
      loginError.textContent = "Please fill in both fields.";
      loginError.classList.add("is-show");
      return;
    }

    loginBtn.classList.add("is-loading");
    loginBtn.disabled = true;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!data.ok) {
        loginError.textContent = data.error || "Login failed.";
        loginError.classList.add("is-show");
        return;
      }

      closeModal();
      loginForm.reset();
      toast("Welcome back, " + (data.user.displayName || data.user.username) + "! Opening console…", "success");
      setTimeout(() => { window.location.href = "/dashboard"; }, 900);
    } catch (err) {
      loginError.textContent = "Network error. Is the server running?";
      loginError.classList.add("is-show");
    } finally {
      loginBtn.classList.remove("is-loading");
      loginBtn.disabled = false;
    }
  });

  /* ---------------- Misc ---------------- */
  $("#year").textContent = new Date().getFullYear();

  loadRoster();
  loadNews();
  startLive();
})();
