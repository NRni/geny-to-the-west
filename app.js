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
  if ("IntersectionObserver" in window && sectionLinks.length) {
    var sections = sectionLinks
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          sectionLinks.forEach(function (link) {
            var on = link.getAttribute("href") === "#" + entry.target.id;
            if (on) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0.01 }
    );

    sections.forEach(function (section) {
      spy.observe(section);
    });
  }

  if (!reduceMotion && finePointer && hero && arch) {
    hero.addEventListener("pointermove", function (event) {
      var box = hero.getBoundingClientRect();
      var x = (event.clientX - box.left) / box.width - 0.5;
      var y = (event.clientY - box.top) / box.height - 0.5;
      arch.style.setProperty("--shift-x", (x * 16).toFixed(2) + "px");
      arch.style.setProperty("--shift-y", (y * 10).toFixed(2) + "px");
    });
    hero.addEventListener("pointerleave", function () {
      arch.style.setProperty("--shift-x", "0px");
      arch.style.setProperty("--shift-y", "0px");
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
      { threshold: 0.12 }
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

  if (arch && window.CSS && CSS.supports && !CSS.supports("width", "calc(sin(0deg) * 1px)")) {
    var count = Number(getComputedStyle(arch).getPropertyValue("--n")) || 52;
    document.querySelectorAll(".arch-step").forEach(function (step) {
      var i = Number(step.style.getPropertyValue("--i"));
      var a = (i / (count - 1)) * Math.PI;
      var rx = Math.min(window.innerWidth * 0.46, 640);
      var ry = Math.min(window.innerHeight * 0.26, 280);
      step.style.left = "50%";
      step.style.top = "80%";
      step.style.width = (42 + (1 - Math.sin(a)) * 170) + "px";
      step.style.transform =
        "translate(" + (Math.cos(a) * rx) + "px, " + (Math.sin(a) * ry * -1) + "px) translate(-50%, -50%) rotate(" + (a * 180 / Math.PI - 90) + "deg) rotateX(58deg)";
      step.style.zIndex = String(Math.round(Math.abs(i - (count - 1) / 2)));
    });
  }
})();
