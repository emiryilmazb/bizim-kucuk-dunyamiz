// ==========================================
// 🎬 Finale Sequence — cinematic world view
// ==========================================

const finaleSequence = (() => {
    let isPlaying = false;

    /**
     * Trigger the full cinematic finale sequence
     * @param {L.Map} map - Leaflet map instance
     */
    function trigger(map) {
        if (isPlaying) return;
        isPlaying = true;

        const overlay = document.getElementById("finale-overlay");
        const hud = document.querySelector(".hud");
        const dpad = document.getElementById("dpad");
        const progressBar = document.querySelector(".game-progress");
        const distBadge = document.getElementById("distance-badge");
        const hintPill = document.getElementById("hint-pill");
        const fogCanvas = document.getElementById("fog-canvas");
        const settingsBtn = document.getElementById("settings-btn");

        // 1) Fade out UI
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

        // 2) Zoom out smoothly
        setTimeout(() => {
            map.flyTo(map.getCenter(), 11, { duration: 2, easeLinearity: 0.25 });
        }, 600);

        // 3) Crossfade to world view
        setTimeout(() => {
            overlay.classList.add("show");

            // 4) Show final text after a beat
            setTimeout(() => {
                const text = overlay.querySelector(".finale-text");
                if (text) text.classList.add("show");
            }, 1200);

            // 5) Show button
            setTimeout(() => {
                const btn = overlay.querySelector(".finale-btn");
                if (btn) btn.classList.add("show");
            }, 2500);

            // 6) Show skip
            setTimeout(() => {
                const skip = overlay.querySelector(".finale-skip");
                if (skip) skip.classList.add("show");
            }, 800);
        }, 2800);
    }

    /** Skip to the end of the animation */
    function skip() {
        const overlay = document.getElementById("finale-overlay");
        if (!overlay) return;
        overlay.classList.add("show");
        const text = overlay.querySelector(".finale-text");
        const btn = overlay.querySelector(".finale-btn");
        const skip = overlay.querySelector(".finale-skip");
        if (text) text.classList.add("show");
        if (btn) btn.classList.add("show");
        if (skip) skip.style.display = "none";
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
        for (let i = 0; i < 20; i++) {
            const el = document.createElement("div");
            el.className = "finale-heart-particle";
            el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            el.style.left = Math.random() * 100 + "%";
            el.style.animationDelay = Math.random() * 2 + "s";
            el.style.animationDuration = 2.5 + Math.random() * 2 + "s";
            el.style.fontSize = 0.8 + Math.random() * 1.2 + "rem";
            container.appendChild(el);
            setTimeout(() => el.remove(), 5000);
        }
    }

    return { trigger, skip, revealNote };
})();
