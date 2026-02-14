// ==========================================
// 🎬 Finale Sequence — 3D Globe zoom out
// ==========================================

const finaleSequence = (() => {
    let isPlaying = false;

    /**
     * Trigger the cinematic finale:
     *   1. Fade out UI
     *   2. Quick map zoom-out (city → region)
     *   3. Crossfade to 3D globe
     *   4. Show final text + button
     */
    function trigger(map) {
        if (isPlaying) return;
        isPlaying = true;

        // Remove bounds so we can zoom out
        map.setMaxBounds(null);
        map.setMinZoom(1);

        const overlay = document.getElementById("finale-overlay");
        const globeCanvas = document.getElementById("globe-canvas");
        const hud = document.querySelector(".hud");
        const dpad = document.getElementById("dpad");
        const progressBar = document.querySelector(".game-progress");
        const distBadge = document.getElementById("distance-badge");
        const hintPill = document.getElementById("hint-pill");
        const fogCanvas = document.getElementById("fog-canvas");
        const settingsBtn = document.getElementById("settings-btn");

        // 1) Fade out UI controls
        [hud, dpad, progressBar, distBadge, hintPill, settingsBtn].forEach((el) => {
            if (el) {
                el.style.transition = "opacity 0.8s ease";
                el.style.opacity = "0";
                el.style.pointerEvents = "none";
            }
        });

        // Fade out fog
        if (fogCanvas) {
            fogCanvas.style.transition = "opacity 1s ease";
            fogCanvas.style.opacity = "0";
        }

        // Disable map interaction
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();

        // 2) Quick zoom-out on real map (just 2 stages)
        const center = map.getCenter();
        setTimeout(() => {
            map.flyTo(center, 8, { duration: 2, easeLinearity: 0.2 });
        }, 400);

        setTimeout(() => {
            map.flyTo(center, 5, { duration: 2, easeLinearity: 0.15 });
        }, 2600);

        // 3) Start globe and crossfade
        setTimeout(() => {
            // Initialize and start globe renderer
            if (globeCanvas) {
                globeRenderer.init(globeCanvas);
                globeRenderer.start();
            }

            // Show the finale overlay (dark bg + globe)
            overlay.classList.add("show");

            // Show skip button
            setTimeout(() => {
                const skip = overlay.querySelector(".finale-skip");
                if (skip) skip.classList.add("show");
            }, 400);

            // Show final text after globe is established
            setTimeout(() => {
                const text = overlay.querySelector(".finale-text");
                if (text) text.classList.add("show");
            }, 2000);

            // Show button
            setTimeout(() => {
                const btn = overlay.querySelector(".finale-btn");
                if (btn) btn.classList.add("show");
            }, 3500);
        }, 5000);
    }

    /** Skip to the end of the animation */
    function skip() {
        const overlay = document.getElementById("finale-overlay");
        const globeCanvas = document.getElementById("globe-canvas");
        if (!overlay) return;

        // Start globe if not already
        if (globeCanvas && !globeRenderer) {
            globeRenderer.init(globeCanvas);
            globeRenderer.start();
        }

        overlay.classList.add("show");
        const text = overlay.querySelector(".finale-text");
        const btn = overlay.querySelector(".finale-btn");
        const skipBtn = overlay.querySelector(".finale-skip");
        if (text) text.classList.add("show");
        if (btn) btn.classList.add("show");
        if (skipBtn) skipBtn.style.display = "none";

        // Start globe anyway
        try { globeRenderer.start(); } catch (e) { }
    }

    /** Show the sweet note area after button click */
    function revealNote() {
        const noteArea = document.getElementById("finale-note-area");
        const noteText = document.getElementById("finale-note-text");
        const btn = document.querySelector(".finale-btn");
        if (noteArea) noteArea.classList.add("show");
        if (btn) btn.style.display = "none";

        // Fill in the final message with typewriter effect
        if (noteText && typeof finalMesaj !== "undefined") {
            noteText.textContent = "";
            let i = 0;
            const iv = setInterval(() => {
                if (i < finalMesaj.length) {
                    noteText.textContent += finalMesaj[i];
                    i++;
                } else {
                    clearInterval(iv);
                }
            }, 30);
        }

        // Spawn heart particles
        spawnHearts();
    }

    /** Cute heart particle animation */
    function spawnHearts() {
        const container = document.getElementById("finale-overlay");
        if (!container) return;
        const hearts = ["💖", "💕", "💗", "💝", "❤️", "🩷"];
        for (let i = 0; i < 25; i++) {
            const el = document.createElement("div");
            el.className = "finale-heart-particle";
            el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            el.style.left = Math.random() * 100 + "%";
            el.style.animationDelay = Math.random() * 2.5 + "s";
            el.style.animationDuration = 3 + Math.random() * 2.5 + "s";
            el.style.fontSize = 0.8 + Math.random() * 1.4 + "rem";
            container.appendChild(el);
            setTimeout(() => el.remove(), 6000);
        }
    }

    return { trigger, skip, revealNote };
})();
