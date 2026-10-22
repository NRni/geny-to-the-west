(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  var hero = document.querySelector(".hero");
  var arch = document.querySelector(".arch");
  var kit = document.getElementById("question-kit");
  var status = document.getElementById("kit-status");
  var clearBtn = document.getElementById("kit-clear");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var storageKey = "geny-to-the-west-kit";

  document.documentElement.classList.add("js");

  function closeNav() {
    if (!nav || !toggle) return;
    var wasOpen = nav.classList.contains("is-open");
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    if (wasOpen) toggle.focus();
  }

  function openNav() {
    if (!nav || !toggle) return;
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    var first = nav.querySelector("a");
    if (first) first.focus();
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) closeNav();
      else openNav();
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 767px)").matches) {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.setAttribute("aria-label", "Open menu");
        }
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav();
    });
  }

  if (header && hero && "IntersectionObserver" in window) {
    var heroWatch = new IntersectionObserver(
      function (entries) {
        var onHero = entries[0].isIntersecting;
        header.classList.toggle("on-hero", onHero);
        header.classList.toggle("on-light", !onHero);
      },
      { rootMargin: "-72px 0px 0px 0px", threshold: 0 }
    );
    heroWatch.observe(hero);
  }

  var sectionLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']")) : [];
  var spyTargets = sectionLinks
    .map(function (link) {
      return { link: link, target: document.querySelector(link.getAttribute("href")) };
    })
    .filter(function (item) { return item.target; });

  var navPill = null;
  if (nav) {
    navPill = document.createElement("span");
    navPill.className = "nav-pill no-anim";
    navPill.setAttribute("aria-hidden", "true");
    nav.insertBefore(navPill, nav.firstChild);
  }

  function movePill(link) {
    if (!navPill) return;
    if (!link || link.classList.contains("nav-cta")) {
      navPill.classList.remove("is-on");
      return;
    }
    navPill.style.width = link.offsetWidth + "px";
    navPill.style.height = link.offsetHeight + "px";
    navPill.style.transform = "translate(" + link.offsetLeft + "px, " + link.offsetTop + "px)";
    navPill.classList.add("is-on");
  }

  function spy() {
    var line = window.innerHeight * 0.35;
    var current = null;
    spyTargets.forEach(function (item) {
      if (item.target.getBoundingClientRect().top <= line) current = item;
    });
    spyTargets.forEach(function (item) {
      if (item === current) item.link.setAttribute("aria-current", "true");
      else item.link.removeAttribute("aria-current");
    });
    movePill(current ? current.link : null);
  }

  if (spyTargets.length) {
    var spyTicking = false;
    window.addEventListener("scroll", function () {
      if (spyTicking) return;
      spyTicking = true;
      window.requestAnimationFrame(function () { spyTicking = false; spy(); });
    }, { passive: true });
    window.addEventListener("resize", function () {
      if (navPill) navPill.classList.add("no-anim");
      spy();
      window.requestAnimationFrame(function () { if (navPill) navPill.classList.remove("no-anim"); });
    });
    spy();
    // First placement without sliding in from the left edge; fonts can shift widths, so place again once they load
    window.requestAnimationFrame(function () { if (navPill) navPill.classList.remove("no-anim"); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
      if (navPill) navPill.classList.add("no-anim");
      spy();
      window.requestAnimationFrame(function () { if (navPill) navPill.classList.remove("no-anim"); });
    });
  }

  if (!reduceMotion && "IntersectionObserver" in window) {
    var reveals = document.querySelectorAll(".reveal");
    var revealWatch = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealWatch.unobserve(entry.target);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );
    reveals.forEach(function (node) {
      revealWatch.observe(node);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (node) {
      node.classList.add("is-in");
    });
  }

  function boxes() {
    if (!kit) return [];
    return Array.prototype.slice.call(kit.querySelectorAll("input[type='checkbox']"));
  }

  function paintStatus() {
    if (!status) return;
    var all = boxes();
    var marked = all.filter(function (box) { return box.checked; }).length;
    status.textContent = marked + " of " + all.length + " questions marked";
  }

  function readStore() {
    try {
      var raw = window.localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function writeStore() {
    var data = {};
    boxes().forEach(function (box) {
      data[box.name] = box.checked;
    });
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      /* Private mode can refuse storage. The checks still work for this visit. */
    }
  }

  if (kit) {
    var saved = readStore();
    boxes().forEach(function (box) {
      if (Object.prototype.hasOwnProperty.call(saved, box.name)) {
        box.checked = Boolean(saved[box.name]);
      }
      box.addEventListener("change", function () {
        writeStore();
        paintStatus();
      });
    });
    paintStatus();
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      boxes().forEach(function (box) {
        box.checked = false;
      });
      writeStore();
      paintStatus();
    });
  }

  var toTop = document.querySelector(".to-top");
  var dock = document.querySelector(".to-top-dock");
  if (toTop) {
    var docked = false;
    var ticking = false;

    function place() {
      ticking = false;
      var w = window.innerWidth;
      var vh = window.innerHeight;
      var gap = w < 768 ? 16 : 24;
      var atBottom = window.scrollY + vh >= document.documentElement.scrollHeight - 4;
      var box = dock ? dock.getBoundingClientRect() : null;
      docked = Boolean(atBottom && box && box.top < vh && box.bottom > 0);
      toTop.classList.toggle("is-docked", docked);
      toTop.classList.toggle("is-shown", docked || window.scrollY > vh * 0.6);
      if (docked) {
        toTop.style.setProperty("--tx", Math.round(box.left + box.width / 2 - 92) + "px");
        toTop.style.setProperty("--ty", Math.round(box.top + (box.height - 52) / 2) + "px");
      } else {
        toTop.style.setProperty("--tx", Math.round(w - 48 - gap) + "px");
        toTop.style.setProperty("--ty", Math.round(vh - 48 - gap) + "px");
      }
    }

    function request() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(place);
      }
    }

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    document.addEventListener("transitionend", function (event) {
      if (event.target !== toTop) request();
    });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      var first = document.querySelector("#top a, #main");
      if (first && first.focus) first.focus({ preventScroll: true });
    });
    place();
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest ? event.target.closest("a[href^='#']") : null;
    if (!link) return;
    var target = document.querySelector(link.getAttribute("href"));
    var section = target && target.closest ? target.closest(".reveal") : null;
    if (!section || section.classList.contains("is-in")) return;
    section.style.transition = "none";
    section.classList.add("is-in");
    void section.offsetHeight;
    section.style.transition = "";
  });

  var contents = document.querySelector(".contents");
  if (contents && window.matchMedia("(hover: hover)").matches) {
    var contentCards = Array.prototype.slice.call(contents.querySelectorAll(".port-card"));
    var panes = Array.prototype.slice.call(contents.querySelectorAll(".port-pane"));
    var closeTimer = null;

    function activate(part) {
      if (Date.now() < quietUntil) return;
      window.clearTimeout(closeTimer);
      contents.classList.add("is-open");
      contentCards.forEach(function (card) { card.classList.toggle("is-active", card.getAttribute("data-part") === part); });
      panes.forEach(function (pane) { pane.classList.toggle("is-active", pane.getAttribute("data-part") === part); });
    }

    function close() {
      contents.classList.remove("is-open");
      contentCards.forEach(function (card) { card.classList.remove("is-active"); });
    }

    contentCards.forEach(function (card) {
      card.addEventListener("mouseenter", function () { activate(card.getAttribute("data-part")); });
      card.addEventListener("focus", function () { activate(card.getAttribute("data-part")); });
    });
    contents.addEventListener("mouseenter", function () { window.clearTimeout(closeTimer); });
    contents.addEventListener("mouseleave", function () { closeTimer = window.setTimeout(close, 160); });
    contents.addEventListener("focusout", function (event) {
      // Only close when focus actually moves somewhere else, not when a hidden link drops it
      if (event.relatedTarget && !contents.contains(event.relatedTarget)) close();
    });
    var panel = contents.querySelector(".port-panel");
    var quietUntil = 0;

    function closeNow() {
      panel.classList.add("no-anim");
      close();
      void panel.offsetHeight;
      window.requestAnimationFrame(function () { panel.classList.remove("no-anim"); });
    }

    // A link in the contents: close the row first (no animation), so the page stops moving,
    // then scroll. While the page scrolls under the pointer, the row stays shut.
    contents.addEventListener("click", function (event) {
      var link = event.target.closest ? event.target.closest("a[href^='#']") : null;
      if (!link) return;
      var target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      quietUntil = Date.now() + 1600;
      if (link.blur) link.blur();
      closeNow();
      var section = target.closest ? target.closest(".reveal") : null;
      if (section && !section.classList.contains("is-in")) {
        section.style.transition = "none";
        section.classList.add("is-in");
        void section.offsetHeight;
        section.style.transition = "";
      }
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      if (window.history && window.history.pushState) window.history.pushState(null, "", link.getAttribute("href"));
    });
    window.addEventListener("scrollend", function () { quietUntil = Math.min(quietUntil, Date.now() + 150); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
  }

  var kitCard = document.querySelector(".kit-card");
  if (kitCard && kit) {
    var kitBoxes = Array.prototype.slice.call(kit.querySelectorAll("input[type='checkbox']"));
    function paintMeter() {
      var done = kitBoxes.filter(function (box) { return box.checked; }).length;
      kitCard.style.setProperty("--done", String(done / kitBoxes.length));
      kitCard.classList.toggle("is-complete", done === kitBoxes.length);
    }
    kitBoxes.forEach(function (box) { box.addEventListener("change", paintMeter); });
    if (clearBtn) clearBtn.addEventListener("click", paintMeter);
    paintMeter();
  }

  var qrHint = document.getElementById("qr-hint");
  var logoLink = document.querySelector(".logo");
  if (qrHint) {
    var hideHint = function () { qrHint.classList.add("is-closed"); };
    var hintClose = qrHint.querySelector(".qr-hint-close");
    if (hintClose) hintClose.addEventListener("click", hideHint);
    if (logoLink) {
      logoLink.addEventListener("mouseenter", hideHint);
      logoLink.addEventListener("focus", hideHint);
    }
  }

  // Links to the top (the logo): the header is sticky, so "#top" never moves the page. Scroll to the very top instead.
  document.addEventListener("click", function (event) {
    var link = event.target.closest ? event.target.closest("a[href='#top']") : null;
    if (!link) return;
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    if (window.history && window.history.replaceState) window.history.replaceState(null, "", window.location.pathname + window.location.search);
  });

  // Keep the arch's peak just behind the bottom of the title, whatever the screen size
  var heroTitle = document.getElementById("hero-title");
  if (arch && hero && heroTitle) {
    var placeArch = function () {
      var bottom = heroTitle.getBoundingClientRect().bottom - hero.getBoundingClientRect().top;
      arch.style.setProperty("--apex", Math.round(bottom - 18) + "px");
    };
    placeArch();
    window.addEventListener("resize", placeArch);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeArch);
  }

  if (arch && window.CSS && CSS.supports && !CSS.supports("width", "calc(sin(0deg) * 1px)")) {
    var count = Number(getComputedStyle(arch).getPropertyValue("--n")) || 52;
    document.querySelectorAll(".arch-step").forEach(function (step) {
      var i = Number(step.style.getPropertyValue("--i"));
      var a = (i / (count - 1)) * Math.PI;
      var rx = Math.min(window.innerWidth * 0.46, 640);
      var ry = Math.min(window.innerHeight * 0.26, 280);
      step.style.left = "50%";
      step.style.top = "calc(var(--apex, 390px) + " + ry + "px)";
      step.style.width = (42 + (1 - Math.sin(a)) * 170) + "px";
      step.style.transform =
        "translate(" + (Math.cos(a) * rx) + "px, " + (Math.sin(a) * ry * -1) + "px) translate(-50%, -50%) rotate(" + (a * 180 / Math.PI - 90) + "deg) rotateX(58deg)";
      step.style.zIndex = String(Math.round(Math.abs(i - (count - 1) / 2)));
    });
  }
})();
