/*
 * Homepage wordmark: a CRT.
 *
 * On arrival the tube powers on: a scanline strikes across, the name
 * opens out from the centre line with a slight overshoot, and it
 * settles. That runs once per session, in three quarters of a second.
 *
 * On hover (or keyboard focus) the tracking goes: a scanline rolls
 * down the name on a loop, tearing the picture as it passes, with a
 * burst of static. It stops the moment the pointer leaves, so the
 * motion is always something the reader asked for rather than
 * something the page does at them. That is deliberate: WCAG 2.2.2
 * requires a way to stop motion that starts on its own and runs for
 * more than five seconds, and the cheapest way to satisfy it is to
 * never start on its own at all.
 *
 * Two rules hold throughout:
 *
 *  - The text's colour and opacity are never animated. The reveal is a
 *    vertical scale, the tearing is a skew, and the static lives on a
 *    separate decorative layer, so the wordmark holds its contrast
 *    even mid-animation when a checker might be looking.
 *  - Nothing is hidden that the animation is not guaranteed to bring
 *    back. Animation frames do not fire in a backgrounded tab, so a
 *    timer independent of the frame loop always reveals the name.
 */
(function () {
    "use strict";

    if (typeof window.gsap === "undefined") {
        return;
    }

    var mark = document.querySelector("[data-crt]");
    if (!mark) {
        return;
    }

    var text = mark.querySelector(".site-header__name-text");
    var beam = mark.querySelector(".site-header__name-beam");
    var fizz = mark.querySelector(".site-header__name-fizz");
    if (!text || !beam || !fizz) {
        return;
    }

    // Someone who has asked for reduced motion gets a still wordmark,
    // on arrival and on hover alike.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    var gsap = window.gsap;
    var powerOn = null;
    var tracking = null;

    // --- Tracking: the loop, but only while it is being asked for ---

    function buildTracking() {
        var height = mark.offsetHeight || 20;
        var travel = height * 0.75;

        // Every tween states where it starts as well as where it ends.
        // A plain .to() would read the element's current value, which
        // on a repeat or a re-hover is whatever the last pass left
        // behind, and the glitch would drift.
        return gsap.timeline({ paused: true, repeat: -1, defaults: { ease: "none" } })
            .set(beam, { scaleX: 1, opacity: 0.7 })
            .set(text, { skewX: 0, x: 0 })
            // The line rolls down the name, over and over.
            .fromTo(beam, { y: -travel }, { y: travel, duration: 1.4 }, 0)
            // As it passes, the picture tears and fizzes.
            .fromTo(text, { skewX: 0, x: 0 }, { skewX: -9, x: 2, duration: 0.06 }, 0.52)
            .to(text, { skewX: 5, x: -1, duration: 0.05 }, 0.58)
            .to(text, { skewX: 0, x: 0, duration: 0.12 }, 0.63)
            .fromTo(fizz, { opacity: 0 }, { opacity: 0.2, duration: 0.05 }, 0.52)
            .to(fizz, { opacity: 0, duration: 0.28 }, 0.6)
            // A second, smaller wobble further down the pass.
            .fromTo(text, { skewX: 0 }, { skewX: 3, duration: 0.05 }, 1.04)
            .to(text, { skewX: 0, duration: 0.09 }, 1.09)
            .fromTo(fizz, { opacity: 0 }, { opacity: 0.1, duration: 0.04 }, 1.04)
            .to(fizz, { opacity: 0, duration: 0.2 }, 1.09);
    }

    function startTracking() {
        if (powerOn && powerOn.isActive()) {
            return;
        }
        if (!tracking) {
            tracking = buildTracking();
        }
        tracking.play(0);
    }

    function stopTracking() {
        if (!tracking) {
            return;
        }
        tracking.pause(0);
        gsap.set([text, beam, fizz], { clearProps: "transform,opacity" });
    }

    mark.addEventListener("pointerenter", startTracking);
    mark.addEventListener("pointerleave", stopTracking);
    mark.addEventListener("focus", startTracking);
    mark.addEventListener("blur", stopTracking);

    // --- Power on: once per session, on arrival ---

    // Storage can throw in private windows; the animation is
    // decorative, so just play on.
    try {
        if (window.sessionStorage.getItem("gm-crt-played")) {
            return;
        }
        window.sessionStorage.setItem("gm-crt-played", "1");
    } catch (error) {
        // No storage available. Carry on.
    }

    powerOn = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: settle
    });

    powerOn
        // Collapse the name to the centre line and arm the beam.
        .set(text, { scaleY: 0 })
        .set(beam, { opacity: 1, scaleX: 0 })
        // The scanline strikes across the tube.
        .to(beam, { scaleX: 1, duration: 0.2 })
        // The picture opens out from that line, overshooting slightly
        // the way a tube does before it finds its height.
        .to(text, { scaleY: 1.06, duration: 0.28 }, "+=0.05")
        .to(beam, { opacity: 0, duration: 0.28 }, "<")
        // Then it settles, with one small wobble left in it.
        .to(text, { scaleY: 0.96, duration: 0.09 })
        .to(text, { scaleY: 1, duration: 0.13 });

    // Whichever happens first: the animation finishing, or the deadline.
    var deadline = window.setTimeout(settle, 1800);

    function settle() {
        window.clearTimeout(deadline);
        // Killing the timeline first stops a stalled animation resuming
        // later (on tab focus, say) and hiding the name again.
        powerOn.kill();
        gsap.set([text, beam], { clearProps: "all" });
    }
})();
