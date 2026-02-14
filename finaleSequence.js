// ==========================================
// 🎬 Finale Sequence — Google Earth-style zoom out
// ==========================================

const finaleSequence = (() => {
    let isPlaying = false;

    /**
     * Trigger the full cinematic finale sequence.
     * Stages:
     *   1. Fade out UI
     *   2. Google Earth-style zoom: current → 11 → 6 → 3 (staged flyTo)
     *   3. Once fully zoomed out, crossfade to finale overlay
     *   4. Show final text + button
     */
    function trigger(map) {
        if (isPlaying) return;
        isPlaying = true;

        // Remove map bounds so we can zoom out freely
        map.setMaxBounds(null);
        map.setMinZoom(1);

        const overlay = document.getElementById("finale-overlay");
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

        // Disable map interaction during cinematic
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();

        // 2) Google Earth-style staged zoom
        const center = map.getCenter();

        // Stage 1: zoom to 11 (neighbourhood → city)
        setTimeout(() => {
            map.flyTo(center, 11, { duration: 2, easeLinearity: 0.2 });
        }, 400);

        // Stage 2: zoom to 6 (city → country)
        setTimeout(() => {
            map.flyTo(center, 6, { duration: 2.5, easeLinearity: 0.15 });
        }, 2800);

        // Stage 3: zoom to 3 (country → continent)
        setTimeout(() => {
            map.flyTo(center, 3, { duration: 3, easeLinearity: 0.1 });
        }, 5800);

        // Stage 4: zoom to 2 (full world view)
        setTimeout(() => {
            map.flyTo([30, 30], 2, { duration: 2.5, easeLinearity: 0.1 });
        }, 9200);

        // 3) Crossfade overlay once zoom completes
        setTimeout(() => {
            overlay.classList.add("show");

            // Show skip immediately
            setTimeout(() => {
                const skip = overlay.querySelector(".finale-skip");
                if (skip) skip.classList.add("show");
            }, 300);

            // Show final text
            setTimeout(() => {
                const text = overlay.querySelector(".finale-text");
                if (text) text.classList.add("show");
            }, 1500);

            // Show button
            setTimeout(() => {
                const btn = overlay.querySelector(".finale-btn");
                if (btn) btn.classList.add("show");
            }, 3000);
        }, 12000);
    }

    /** Skip to the end of the animation */
    function skip() {
        const overlay = document.getElementById("finale-overlay");
        if (!overlay) return;
        overlay.classList.add("show");
        const text = overlay.querySelector(".finale-text");
        const btn = overlay.querySelector(".finale-btn");
        const skipBtn = overlay.querySelector(".finale-skip");
        if (text) text.classList.add("show");
        if (btn) btn.classList.add("show");
        if (skipBtn) skipBtn.style.display = "none";
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
