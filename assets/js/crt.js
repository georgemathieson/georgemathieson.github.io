/*
 * Homepage wordmark: a CRT powering on.
 *
 * A scanline strikes across, the name opens out from the centre line,
 * the tube settles with a flicker, and everything returns to normal.
 *
 * Three things this deliberately does not do:
 *
 *  - It never touches the text's colour or opacity. The reveal is a
 *    clip-path and the glow lives on a separate decorative element, so
 *    the wordmark is always at full contrast even mid-animation.
 *  - It never hides anything before it knows it can animate. Both this
 *    file and GSAP are deferred and run in order, so if either fails to
 *    load nothing has been hidden and the name simply sits there.
 *  - It never plays twice in a session, and never at all for a reader
 *    who has asked for reduced motion.
 *
 * The animation briefly hides the wordmark, so the failure mode matters
 * more than the effect does. Animation frames do not fire in a
 * backgrounded tab, and a stalled timeline would otherwise leave the
 * site's own name invisible, so a timer that does not depend on the
 * frame loop guarantees the name is shown whatever happens.
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
    if (!text || !beam) {
        return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    // Greet once per session, so browsing several posts and coming back
    // to the homepage doesn't replay it every time. Storage can throw in
    // private windows; the animation is decorative, so just play on.
    try {
        if (window.sessionStorage.getItem("gm-crt-played")) {
            return;
        }
        window.sessionStorage.setItem("gm-crt-played", "1");
    } catch (error) {
        // No storage available. Carry on.
    }

    var gsap = window.gsap;
    var timeline = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: settle
    });

    timeline
        // Collapse the name to the centre line and arm the beam.
        .set(text, { scaleY: 0 })
        .set(beam, { opacity: 1, scaleX: 0 })
        // The scanline strikes across the tube.
        .to(beam, { scaleX: 1, duration: 0.16 })
        // The picture opens out from that line, overshooting slightly
        // the way a tube does before it finds its height.
        .to(text, { scaleY: 1.06, duration: 0.2 }, "+=0.04")
        .to(beam, { opacity: 0, duration: 0.22 }, "<")
        // Then it settles, with one small wobble left in it.
        .to(text, { scaleY: 0.96, duration: 0.06 })
        .to(text, { scaleY: 1, duration: 0.09 });

    // Whichever happens first: the animation finishing, or the deadline.
    var deadline = window.setTimeout(settle, 1500);

    function settle() {
        window.clearTimeout(deadline);
        // Killing the timeline first stops a stalled animation resuming
        // later (on tab focus, say) and hiding the name again.
        timeline.kill();
        gsap.set([text, beam], { clearProps: "all" });
    }
})();
