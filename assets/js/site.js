(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  var COLORS = ["#669288", "#D7DECC", "#374254"];
  var last = 0;
  var THROTTLE_MS = 45;

  function spawnPixel(x, y) {
    var now = performance.now();
    if (now - last < THROTTLE_MS) return;
    last = now;

    var dot = document.createElement("span");
    dot.className = "pixel-trail-dot";
    dot.style.left = x + "px";
    dot.style.top = y + "px";
    dot.style.background = COLORS[(Math.random() * COLORS.length) | 0];
    document.body.appendChild(dot);

    requestAnimationFrame(function () {
      dot.style.opacity = "0";
      dot.style.transform = "translate(-50%, -50%) scale(0.2)";
    });
    setTimeout(function () {
      dot.remove();
    }, 500);
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
