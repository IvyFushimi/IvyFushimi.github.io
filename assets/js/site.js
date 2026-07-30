(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 拖尾颜色跟随当前人格的 CSS 变量（--sage / --mist / --ink），
     切换人格时刷新一次，避免和另一套色系写死两份 ---- */
  var trailColors = [];
  var refreshTrailColors = function () {
    var styles = getComputedStyle(document.documentElement);
    trailColors = ["--sage", "--mist", "--ink"].map(function (name) {
      return styles.getPropertyValue(name).trim();
    });
  };
  refreshTrailColors();

  /* ---- Ivy Fushimi / Transparent Midnight 人格切换 ---- */
  var toggleButtons = document.querySelectorAll(".persona-toggle-btn");
  if (toggleButtons.length) {
    var root = document.documentElement;
    var flash = document.querySelector(".persona-flash");
    var switching = false;
    var FLASH_IN_MS = 140;
    var FLASH_OUT_MS = 100;

    // 链接里带 #virtual 时直接以 Virtual 页开场，方便分享指向某一侧的入口
    var initialPersona =
      window.location.hash.replace("#", "").toLowerCase() === "virtual"
        ? "midnight"
        : "ivy";

    var setPersona = function (persona, updateHash) {
      root.setAttribute("data-persona", persona);
      toggleButtons.forEach(function (btn) {
        var isActive = btn.getAttribute("data-persona") === persona;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      if (updateHash) {
        var newHash = persona === "midnight" ? "#virtual" : "#reality";
        history.replaceState(null, "", newHash);
      }
      refreshTrailColors();
    };

    setPersona(initialPersona, false);

    toggleButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-persona");
        if (switching || target === root.getAttribute("data-persona")) return;

        // 每次切换都回到主页面顶部，避免另一侧内容在滚动到一半的位置突兀出现
        window.scrollTo(0, 0);

        if (!flash || reduceMotion) {
          setPersona(target, true);
          return;
        }

        switching = true;
        flash.classList.add("is-active");
        setTimeout(function () {
          setPersona(target, true);
          setTimeout(function () {
            flash.classList.remove("is-active");
            switching = false;
          }, FLASH_OUT_MS);
        }, FLASH_IN_MS);
      });
    });
  }

  /* ---- 卡片滚动淡入：进入视口时才出现，呼应"下滑才展开内容"的节奏 ---- */
  var cards = document.querySelectorAll(".work-card");
  if (cards.length) {
    if (!reduceMotion && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      cards.forEach(function (c) {
        io.observe(c);
      });
    } else {
      cards.forEach(function (c) {
        c.classList.add("is-visible");
      });
    }
  }

  /* ---- 光标像素拖尾：仅在支持精确指针（鼠标/触控板）且未启用"减少动效"时触发 ---- */
  var canHover =
    window.matchMedia("(pointer: fine)").matches && !reduceMotion;
  if (!canHover) return;

  var last = 0;
  var THROTTLE_MS = 20;
  var LIFETIME_MS = 750;

  function spawnPixel(x, y) {
    var now = performance.now();
    if (now - last < THROTTLE_MS) return;
    last = now;

    // 尺寸随机 + 轻微散布位移，制造"像素颗粒飞溅"而非单排小圆点的观感
    var size = 8 + Math.round(Math.random() * 8); // 8–16px
    var jitterX = (Math.random() - 0.5) * 10;
    var jitterY = (Math.random() - 0.5) * 10;

    var dot = document.createElement("span");
    dot.className = "pixel-trail-dot";
    dot.style.left = x + jitterX + "px";
    dot.style.top = y + jitterY + "px";
    dot.style.width = size + "px";
    dot.style.height = size + "px";
    dot.style.background = trailColors[(Math.random() * trailColors.length) | 0];
    document.body.appendChild(dot);

    requestAnimationFrame(function () {
      dot.style.opacity = "0";
      dot.style.transform =
        "translate(-50%, -50%) scale(0.15) rotate(" +
        (Math.random() > 0.5 ? 25 : -25) +
        "deg)";
    });
    setTimeout(function () {
      dot.remove();
    }, LIFETIME_MS);
  }

  window.addEventListener(
    "pointermove",
    function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      spawnPixel(e.clientX, e.clientY);
    },
    { passive: true }
  );
})();
